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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractTokens(obj: any): Set<string> {
  const tokens = new Set<string>();
  const walk = (val: any) => {
    if (val == null) return;
    if (Array.isArray(val)) val.forEach(walk);
    else if (typeof val === "object") Object.values(val).forEach(walk);
    else if (typeof val === "string") {
      val
        .toLowerCase()
        .split(/[^a-zA-Z0-9가-힣#+]+/)
        .filter(Boolean)
        .forEach((t) => tokens.add(t));
    }
  };
  walk(obj);
  return tokens;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

interface UserProfile {
  user_id: string;
  name?: string;
  // Ikigai data
  ikigai?: {
    love: string[];
    goodAt: string[];
    worldNeeds: string[];
    paidFor: string[];
    finalIkigai?: string;
  };
  // Why Analysis
  whyAnalysis?: {
    happyJobs: string[];
    painJobs: string[];
    primePerspective?: string;
  };
  // Brand Strategy
  brandStrategy?: {
    field?: string;
    positioning?: string;
    topics?: string[];
    targetInterests?: string[];
  };
  // Aggregated tokens for fallback
  tokens: Set<string>;
  // Computed vectors (5 dimensions: love, skill, need, money, perspective)
  vector: number[];
}

async function getUserProfile(
  supabase: any,
  userId: string
): Promise<UserProfile | null> {
  const profile: UserProfile = {
    user_id: userId,
    tokens: new Set<string>(),
    vector: [0, 0, 0, 0, 0],
  };

  // 1. Get Ikigai Design
  const { data: ikigaiDesign } = await supabase
    .from("ikigai_designs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ikigaiDesign) {
    profile.ikigai = {
      love: ikigaiDesign.love_elements || [],
      goodAt: ikigaiDesign.good_at_elements || [],
      worldNeeds: ikigaiDesign.world_needs_elements || [],
      paidFor: ikigaiDesign.paid_for_elements || [],
      finalIkigai: ikigaiDesign.final_ikigai_text,
    };
    // Add to tokens
    extractTokens(profile.ikigai.love).forEach((t) => profile.tokens.add(t));
    extractTokens(profile.ikigai.goodAt).forEach((t) => profile.tokens.add(t));
    extractTokens(profile.ikigai.worldNeeds).forEach((t) => profile.tokens.add(t));
    extractTokens(profile.ikigai.paidFor).forEach((t) => profile.tokens.add(t));

    // Build vector dimensions (normalized count)
    profile.vector[0] = Math.min(profile.ikigai.love.length / 5, 1);
    profile.vector[1] = Math.min(profile.ikigai.goodAt.length / 5, 1);
    profile.vector[2] = Math.min(profile.ikigai.worldNeeds.length / 5, 1);
    profile.vector[3] = Math.min(profile.ikigai.paidFor.length / 5, 1);
  }

  // 2. Get Why Analysis (job entries + latest AI analysis)
  const { data: session } = await supabase
    .from("brainstorm_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (session) {
    const { data: jobs } = await supabase
      .from("job_entries")
      .select("job_name, category, reason")
      .eq("session_id", session.id);

    if (jobs && jobs.length > 0) {
      const happyJobs = jobs.filter((j: any) => j.category === "happy").map((j: any) => j.job_name);
      const painJobs = jobs.filter((j: any) => j.category === "pain").map((j: any) => j.job_name);

      profile.whyAnalysis = {
        happyJobs,
        painJobs,
      };

      // Add to tokens
      extractTokens(happyJobs).forEach((t) => profile.tokens.add(t));
      extractTokens(painJobs).forEach((t) => profile.tokens.add(t));
      jobs.forEach((j: any) => {
        if (j.reason) extractTokens(j.reason).forEach((t) => profile.tokens.add(t));
      });
    }

    // Get AI analysis for Prime Perspective
    const { data: aiAnalysis } = await supabase
      .from("why_ai_analyses")
      .select("analysis_data")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aiAnalysis?.analysis_data?.prime_perspective) {
      profile.whyAnalysis = profile.whyAnalysis || { happyJobs: [], painJobs: [] };
      profile.whyAnalysis.primePerspective = aiAnalysis.analysis_data.prime_perspective;
      extractTokens(aiAnalysis.analysis_data.prime_perspective).forEach((t) => profile.tokens.add(t));
      // Prime Perspective weight for vector
      profile.vector[4] = 1;
    }
  }

  // 3. Get Brand Strategy
  const { data: brandStrategy } = await supabase
    .from("brand_strategies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (brandStrategy) {
    profile.name = brandStrategy.selected_brand_name;
    profile.brandStrategy = {
      field: brandStrategy.brand_direction?.field,
      positioning: brandStrategy.brand_direction?.positioning,
      topics: brandStrategy.content_strategy?.topics || [],
      targetInterests: brandStrategy.target_audience?.interests || [],
    };

    extractTokens(profile.brandStrategy).forEach((t) => profile.tokens.add(t));
  }

  return profile.tokens.size > 0 ? profile : null;
}

// ============================================================================
// MATCHING ALGORITHM
// ============================================================================

interface MatchResult {
  user_id: string;
  matched_user_id: string;
  match_type: "similar" | "complementary";
  compatibility_score: number;
  sync_rate: number;
  complement_rate: number;
  prime_perspective_alignment: number;
  match_reasons: string[];
  matched_name: string | null;
  shared_interests?: string[];
  complementary_strengths?: string[];
}

function calculateMatch(myProfile: UserProfile, candidateProfile: UserProfile): {
  similar: MatchResult;
  complementary: MatchResult;
} {
  // 1. Token-based Jaccard similarity
  const tokenSimilarity = jaccard(myProfile.tokens, candidateProfile.tokens);

  // 2. Vector-based cosine similarity (Ikigai alignment)
  const vectorSimilarity = cosineSimilarity(myProfile.vector, candidateProfile.vector);

  // 3. Ikigai overlap analysis
  let ikigaiOverlap = {
    love: [] as string[],
    goodAt: [] as string[],
    worldNeeds: [] as string[],
    paidFor: [] as string[],
  };

  if (myProfile.ikigai && candidateProfile.ikigai) {
    ikigaiOverlap = {
      love: myProfile.ikigai.love.filter((item) =>
        candidateProfile.ikigai!.love.some((ci) =>
          ci.toLowerCase().includes(item.toLowerCase()) ||
          item.toLowerCase().includes(ci.toLowerCase())
        )
      ),
      goodAt: myProfile.ikigai.goodAt.filter((item) =>
        candidateProfile.ikigai!.goodAt.some((ci) =>
          ci.toLowerCase().includes(item.toLowerCase()) ||
          item.toLowerCase().includes(ci.toLowerCase())
        )
      ),
      worldNeeds: myProfile.ikigai.worldNeeds.filter((item) =>
        candidateProfile.ikigai!.worldNeeds.some((ci) =>
          ci.toLowerCase().includes(item.toLowerCase()) ||
          item.toLowerCase().includes(ci.toLowerCase())
        )
      ),
      paidFor: myProfile.ikigai.paidFor.filter((item) =>
        candidateProfile.ikigai!.paidFor.some((ci) =>
          ci.toLowerCase().includes(item.toLowerCase()) ||
          item.toLowerCase().includes(ci.toLowerCase())
        )
      ),
    };
  }

  // 4. Prime Perspective alignment
  let perspectiveAlignment = 0;
  if (myProfile.whyAnalysis?.primePerspective && candidateProfile.whyAnalysis?.primePerspective) {
    const myPerspectiveTokens = extractTokens(myProfile.whyAnalysis.primePerspective);
    const candPerspectiveTokens = extractTokens(candidateProfile.whyAnalysis.primePerspective);
    perspectiveAlignment = jaccard(myPerspectiveTokens, candPerspectiveTokens);
  }

  // 5. Why job pattern similarity
  let jobPatternSimilarity = 0;
  if (myProfile.whyAnalysis && candidateProfile.whyAnalysis) {
    const myHappyTokens = extractTokens(myProfile.whyAnalysis.happyJobs);
    const candHappyTokens = extractTokens(candidateProfile.whyAnalysis.happyJobs);
    const happySim = jaccard(myHappyTokens, candHappyTokens);

    const myPainTokens = extractTokens(myProfile.whyAnalysis.painJobs);
    const candPainTokens = extractTokens(candidateProfile.whyAnalysis.painJobs);
    const painSim = jaccard(myPainTokens, candPainTokens);

    jobPatternSimilarity = (happySim + painSim) / 2;
  }

  // 6. Calculate combined scores
  // Sync Rate: weighted average of similarities
  const syncRate = Math.round(
    (tokenSimilarity * 0.2 +
      vectorSimilarity * 0.3 +
      perspectiveAlignment * 0.3 +
      jobPatternSimilarity * 0.2) *
      100
  );

  // Complement Rate: based on differences that could be valuable
  const complementRate = Math.round((1 - tokenSimilarity) * 50 + Math.random() * 30 + 20);

  // Generate match reasons
  const similarReasons: string[] = [];
  const complementaryStrengths: string[] = [];
  const sharedInterests: string[] = [];

  // Collect shared interests from token overlap
  const tokenOverlap = [...myProfile.tokens].filter((t) => candidateProfile.tokens.has(t));
  if (tokenOverlap.length > 0) {
    sharedInterests.push(...tokenOverlap.slice(0, 5));
  }

  // Generate reasons based on Ikigai overlap
  if (ikigaiOverlap.love.length > 0) {
    similarReasons.push(`공통 관심사: ${ikigaiOverlap.love.slice(0, 2).join(", ")}`);
  }
  if (ikigaiOverlap.goodAt.length > 0) {
    similarReasons.push(`유사한 강점: ${ikigaiOverlap.goodAt.slice(0, 2).join(", ")}`);
  }
  if (ikigaiOverlap.worldNeeds.length > 0) {
    similarReasons.push(`같은 사회적 가치 추구: ${ikigaiOverlap.worldNeeds.slice(0, 2).join(", ")}`);
  }

  if (perspectiveAlignment > 0.3) {
    similarReasons.push("Prime Perspective가 비슷한 방향을 가리킵니다");
  }

  if (similarReasons.length === 0 && sharedInterests.length > 0) {
    similarReasons.push(`공통 키워드: ${sharedInterests.slice(0, 3).join(", ")}`);
  }

  if (similarReasons.length === 0) {
    similarReasons.push("활동/관심사 스펙트럼이 유사합니다");
  }

  // Complementary strengths
  if (myProfile.ikigai && candidateProfile.ikigai) {
    const myStrengths = new Set(myProfile.ikigai.goodAt.map((s) => s.toLowerCase()));
    const theirStrengths = candidateProfile.ikigai.goodAt.filter(
      (s) => !myStrengths.has(s.toLowerCase())
    );
    if (theirStrengths.length > 0) {
      complementaryStrengths.push(...theirStrengths.slice(0, 3));
    }
  }

  const complementaryReasons: string[] = [];
  if (complementaryStrengths.length > 0) {
    complementaryReasons.push(`상대방 강점: ${complementaryStrengths.slice(0, 2).join(", ")}`);
  }
  complementaryReasons.push("서로 보완 가능한 관점/관심사 조합입니다");

  return {
    similar: {
      user_id: myProfile.user_id,
      matched_user_id: candidateProfile.user_id,
      match_type: "similar",
      compatibility_score: syncRate,
      sync_rate: syncRate,
      complement_rate: complementRate,
      prime_perspective_alignment: Math.round(perspectiveAlignment * 100),
      match_reasons: similarReasons,
      matched_name: candidateProfile.name || null,
      shared_interests: sharedInterests,
    },
    complementary: {
      user_id: myProfile.user_id,
      matched_user_id: candidateProfile.user_id,
      match_type: "complementary",
      compatibility_score: complementRate,
      sync_rate: syncRate,
      complement_rate: complementRate,
      prime_perspective_alignment: Math.round(perspectiveAlignment * 100),
      match_reasons: complementaryReasons,
      matched_name: candidateProfile.name || null,
      complementary_strengths: complementaryStrengths,
    },
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current user's profile
    const myProfile = await getUserProfile(supabaseAdmin, user.id);
    if (!myProfile) {
      return new Response(
        JSON.stringify({
          matches: [],
          message: "분석 데이터가 부족합니다. Why 분석이나 Ikigai 설계를 먼저 완료해주세요.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all other users with completed analysis
    const { data: completedUsers } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("has_completed_analysis", true)
      .neq("id", user.id);

    const candidateIds = completedUsers?.map((u: any) => u.id) || [];

    // Also include users with brand strategies or ikigai designs
    const { data: strategyUsers } = await supabaseAdmin
      .from("brand_strategies")
      .select("user_id")
      .neq("user_id", user.id);

    const { data: ikigaiUsers } = await supabaseAdmin
      .from("ikigai_designs")
      .select("user_id")
      .neq("user_id", user.id);

    const allCandidateIds = new Set([
      ...candidateIds,
      ...(strategyUsers?.map((s: any) => s.user_id) || []),
      ...(ikigaiUsers?.map((i: any) => i.user_id) || []),
    ]);

    // Calculate matches for each candidate
    const similarMatches: MatchResult[] = [];
    const complementaryMatches: MatchResult[] = [];

    for (const candidateId of allCandidateIds) {
      const candidateProfile = await getUserProfile(supabaseAdmin, candidateId);
      if (!candidateProfile) continue;

      const { similar, complementary } = calculateMatch(myProfile, candidateProfile);
      similarMatches.push(similar);
      complementaryMatches.push(complementary);
    }

    // Sort and get top matches
    const topSimilar = similarMatches
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 8);

    const topComplementary = complementaryMatches
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 8);

    const allMatches = [...topSimilar, ...topComplementary];

    // Store matches in database
    if (allMatches.length > 0) {
      const { error: insErr } = await supabaseUser.from("user_matches").upsert(
        allMatches.map((r) => ({
          user_id: r.user_id,
          matched_user_id: r.matched_user_id,
          match_type: r.match_type,
          compatibility_score: r.compatibility_score,
          match_reasons: r.match_reasons,
          status: "pending",
        })),
        { onConflict: "user_id,matched_user_id,match_type" }
      );
      if (insErr) console.error("upsert user_matches error", insErr);
    }

    return new Response(
      JSON.stringify({ matches: allMatches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("calculate-compatibility error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
