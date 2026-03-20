import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

function toTokens(input: any): string[] {
  const arr: string[] = [];
  const walk = (v: any) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v).forEach(walk);
    else if (typeof v === "string") arr.push(v);
  };
  walk(input);
  const text = arr.join(" ").toLowerCase();
  return text
    .split(/[^a-zA-Z0-9가-힣#+]+/)
    .filter((t) => t && t.length > 1);
}

function uniqueList(list: string[]): string[] {
  const s = new Set(list.map((v) => v.trim()).filter(Boolean));
  return Array.from(s);
}

function intersect(a: string[], b: string[]): string[] {
  const A = new Set(a);
  return uniqueList(b.filter((x) => A.has(x)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userRes } = await supabaseUser.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Load user data
    const { data: brand } = await supabaseAdmin
      .from("brand_strategies")
      .select("brand_direction, content_strategy, target_audience, brand_names, selected_brand_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: jobs } = await supabaseAdmin
      .from("job_entries")
      .select("job_name, category, reason, has_experience, experience_note")
      .eq("user_id", user.id);

    const { data: matches } = await supabaseAdmin
      .from("user_matches")
      .select("match_type, match_reasons, compatibility_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // 2) Extract four elements
    const loveFromJobs = (jobs || [])
      .filter((j: any) => j.category === "happy" || /좋|사랑|행복|흥미|재미/.test(j.reason || ""))
      .map((j: any) => j.job_name);
    const loveFromBrand = toTokens(brand?.brand_direction?.core_message || brand?.selected_brand_name || brand?.brand_names || []);
    const LOVE = uniqueList([...loveFromJobs, ...loveFromBrand]).slice(0, 20);

    const goodFromJobs = (jobs || [])
      .filter((j: any) => j.has_experience || (j.experience_note && j.experience_note.length > 0))
      .flatMap((j: any) => [j.job_name, j.experience_note])
      .filter(Boolean) as string[];
    const goodFromBrand = toTokens(brand?.brand_direction?.positioning || "");
    const GOOD_AT = uniqueList([...goodFromJobs, ...goodFromBrand]).slice(0, 20);

    const needsFromAudience = uniqueList([
      ...(Array.isArray(brand?.target_audience?.pain_points) ? brand!.target_audience.pain_points : []),
      ...(Array.isArray(brand?.target_audience?.interests) ? brand!.target_audience.interests : []),
    ].map(String));
    const needsFromMatches = uniqueList(
      (matches || [])
        .flatMap((m: any) => m.match_reasons || [])
        .map(String)
        .flatMap((s: string) => toTokens(s))
    );
    const WORLD_NEEDS = uniqueList([...needsFromAudience, ...needsFromMatches]).slice(0, 20);

    const paidFromJobs = uniqueList(
      (jobs || [])
        .filter((j: any) => /프리랜스|컨설팅|강의|수익|유료|판매|클라이언트|프로젝트/.test((j.reason || "") + " " + (j.experience_note || "")))
        .map((j: any) => j.job_name)
    );
    const paidFromBrand = uniqueList([
      ...(Array.isArray(brand?.content_strategy?.formats) ? brand!.content_strategy.formats : []),
      ...(Array.isArray(brand?.content_strategy?.channels) ? brand!.content_strategy.channels : []),
      brand?.brand_direction?.field,
    ].filter(Boolean).map(String));
    const PAID_FOR = uniqueList([...paidFromJobs, ...paidFromBrand]).slice(0, 20);

    // 3) Intersections
    const Passion = intersect(LOVE, GOOD_AT).slice(0, 10);
    const Mission = intersect(LOVE, WORLD_NEEDS).slice(0, 10);
    const Profession = intersect(GOOD_AT, PAID_FOR).slice(0, 10);
    const Vocation = intersect(WORLD_NEEDS, PAID_FOR).slice(0, 10);

    // 4) Completion scores (simple density-based)
    const completeness = {
      love: Math.min(100, Math.round((LOVE.length / 10) * 100)),
      good_at: Math.min(100, Math.round((GOOD_AT.length / 10) * 100)),
      world_needs: Math.min(100, Math.round((WORLD_NEEDS.length / 10) * 100)),
      paid_for: Math.min(100, Math.round((PAID_FOR.length / 10) * 100)),
    };

    // 5) Final IKIGAI sentence via Claude
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 256,
        system: "You are a concise Korean career coach. Output one short sentence only.",
        messages: [
          { role: "user", content: `아래 4원소와 교집합을 바탕으로 최종 IKIGAI(한 문장)를 한국어로 제시하세요. 간결하게, 200자 이내.\n\nLOVE:${LOVE.join(", ")}\nGOOD_AT:${GOOD_AT.join(", ")}\nWORLD_NEEDS:${WORLD_NEEDS.join(", ")}\nPAID_FOR:${PAID_FOR.join(", ")}\n\nPassion:${Passion.join(", ")}\nMission:${Mission.join(", ")}\nProfession:${Profession.join(", ")}\nVocation:${Vocation.join(", ")}` },
        ],
      }),
    });
    const aiJson = await aiRes.json();
    const finalSentence = aiJson?.content?.[0]?.text?.trim() || "당신의 강점과 열정, 시장의 필요와 수익 가능성이 만나는 지점을 실천으로 연결하세요.";

    const record = {
      user_id: user.id,
      love_elements: LOVE,
      good_at_elements: GOOD_AT,
      world_needs_elements: WORLD_NEEDS,
      paid_for_elements: PAID_FOR,
      ikigai_intersections: { Passion, Mission, Profession, Vocation, completeness },
      final_ikigai: finalSentence,
    };

    // 6) Store via user client (respect RLS)
    const { data: inserted, error: insErr } = await supabaseUser
      .from("ikigai_assessments")
      .insert(record)
      .select("*")
      .single();

    if (insErr) {
      // If duplicate or other issue, try update last
      const { data: latest } = await supabaseUser
        .from("ikigai_assessments")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.id) {
        const { data: updated } = await supabaseUser
          .from("ikigai_assessments")
          .update(record)
          .eq("id", latest.id)
          .select("*")
          .single();
        return new Response(JSON.stringify({ assessment: updated, upserted: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ assessment: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-ikigai error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
