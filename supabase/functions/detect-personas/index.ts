// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JobEntry {
  id: string;
  job_name: string;
  definition: string;
  reason: string;
  first_memory: string;
  category: string;
}

interface PersonaTheme {
  theme: string;
  persona_name: string;
  keywords: string[];
  archetype: string;
}

// Predefined archetype colors and icons
const ARCHETYPE_CONFIG: Record<string, { color: string; icon: string }> = {
  Healer: { color: "#10b981", icon: "Heart" },
  Creator: { color: "#8b5cf6", icon: "Palette" },
  Strategist: { color: "#3b82f6", icon: "Target" },
  Analyst: { color: "#06b6d4", icon: "BarChart3" },
  Builder: { color: "#f59e0b", icon: "Wrench" },
  Teacher: { color: "#ec4899", icon: "GraduationCap" },
  Explorer: { color: "#14b8a6", icon: "Compass" },
  Guardian: { color: "#6366f1", icon: "Shield" },
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user from auth token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { userId } = await req.json();
    const targetUserId = userId || user.id;

    console.log(`Detecting personas for user: ${targetUserId}`);

    // 1. Fetch all happy jobs for the user
    const { data: sessions, error: sessionError } = await supabaseClient
      .from("brainstorm_sessions")
      .select("id, status")
      .eq("user_id", targetUserId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      throw new Error("No completed brainstorm session found");
    }

    const sessionId = sessions[0].id;

    const { data: happyJobs, error: jobsError } = await supabaseClient
      .from("job_entries")
      .select("id, job_name, definition, reason, first_memory, category")
      .eq("session_id", sessionId)
      .eq("category", "happy");

    if (jobsError || !happyJobs || happyJobs.length === 0) {
      throw new Error("No happy jobs found");
    }

    console.log(`Found ${happyJobs.length} happy jobs`);

    // 2. Use Claude to analyze and cluster jobs
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key not configured");
    }

    // Prepare job descriptions for clustering
    const jobDescriptions = happyJobs
      .map(
        (j) =>
          `- ${j.job_name}: "${j.definition || ''}"\n  이유: ${j.reason || ''}\n  각인 순간: ${j.first_memory || ''}`
      )
      .join("\n");

    // Use Claude to cluster and generate personas
    const clusterPrompt = `다음은 사용자가 행복을 느낄 것 같다고 선택한 직업들입니다:

${jobDescriptions}

이 직업들을 분석하여 2~5개의 페르소나 클러스터로 그룹화해주세요.
각 클러스터에 대해 다음 정보를 JSON 배열로 제공하세요:

[
  {
    "cluster_id": 0,
    "job_indices": [0, 2, 5],  // 해당 클러스터에 속하는 직업 인덱스 (0부터 시작)
    "theme": "이 클러스터의 핵심 테마를 한 문장으로 요약",
    "persona_name": "페르소나 이름 (예: '돕는 나', '창작하는 나')",
    "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
    "archetype": "Healer|Creator|Strategist|Analyst|Builder|Teacher|Explorer|Guardian 중 하나",
    "strength_score": 75  // 0-100 사이의 강도 점수
  }
]

응답은 반드시 유효한 JSON 배열만 반환하세요.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: "당신은 커리어 분석 전문가입니다. 직업들의 공통 테마를 분석하여 페르소나를 도출합니다. 반드시 유효한 JSON 배열만 응답하세요.",
        messages: [
          { role: "user", content: clusterPrompt },
        ],
      }),
    });

    const aiData = await response.json();
    const content = aiData.content?.[0]?.text || "[]";

    let clusters;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      clusters = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      clusters = [];
    }

    if (clusters.length === 0) {
      throw new Error("Failed to generate persona clusters");
    }

    console.log(`Generated ${clusters.length} persona clusters`);

    // 3. Build personas from clusters
    const personas = clusters.map((cluster: any, index: number) => {
      const archetypeConfig =
        ARCHETYPE_CONFIG[cluster.archetype] || ARCHETYPE_CONFIG.Explorer;

      // Get jobs for this cluster
      const clusterJobs = (cluster.job_indices || [])
        .filter((i: number) => i >= 0 && i < happyJobs.length)
        .map((i: number) => happyJobs[i]);

      return {
        cluster_id: index,
        jobs: clusterJobs,
        theme: cluster.theme,
        persona_name: cluster.persona_name,
        keywords: cluster.keywords || [],
        archetype: cluster.archetype,
        color_hex: archetypeConfig.color,
        icon_name: archetypeConfig.icon,
        strength_score: cluster.strength_score || 70,
        rank_order: index + 1,
      };
    });

    // 4. Save personas to database
    const { data: insertedPersonas, error: personaError } =
      await supabaseClient
        .from("persona_profiles")
        .insert(
          personas.map((p: any) => ({
            user_id: targetUserId,
            persona_name: p.persona_name,
            persona_archetype: p.archetype,
            theme_description: p.theme,
            color_hex: p.color_hex,
            icon_name: p.icon_name,
            strength_score: p.strength_score,
            rank_order: p.rank_order,
            is_user_verified: false,
            is_active: true,
          }))
        )
        .select();

    if (personaError) {
      console.error("Error inserting personas:", personaError);
      throw personaError;
    }

    // 5. Create persona-job mappings
    const mappings = personas.flatMap((persona: any, index: number) =>
      persona.jobs.map((job: JobEntry) => ({
        persona_id: insertedPersonas![index].id,
        job_entry_id: job.id,
        cluster_confidence: 0.85,
      }))
    );

    if (mappings.length > 0) {
      const { error: mappingError } = await supabaseClient
        .from("persona_job_mappings")
        .insert(mappings);

      if (mappingError) {
        console.error("Error inserting mappings:", mappingError);
        throw mappingError;
      }
    }

    // 6. Insert keywords
    const keywordInserts = personas.flatMap((persona: any, index: number) =>
      persona.keywords.map((keyword: string) => ({
        persona_id: insertedPersonas![index].id,
        keyword,
        frequency: 1,
      }))
    );

    if (keywordInserts.length > 0) {
      const { error: keywordError } = await supabaseClient
        .from("persona_keywords")
        .insert(keywordInserts);

      if (keywordError) {
        console.error("Error inserting keywords:", keywordError);
      }
    }

    // 7. Update user profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        has_multiple_personas: personas.length > 1,
        active_persona_id: insertedPersonas![0].id,
      })
      .eq("id", targetUserId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // 8. Create default milestones for each persona
    for (const persona of insertedPersonas!) {
      const { error: milestonesError } = await supabaseClient.rpc(
        "create_default_milestones",
        {
          input_user_id: targetUserId,
          input_persona_id: persona.id,
          input_persona_name: persona.persona_name,
        }
      );

      if (milestonesError) {
        console.error(
          `Error creating milestones for persona ${persona.id}:`,
          milestonesError
        );
      } else {
        console.log(`Created default milestones for persona: ${persona.persona_name}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        personas: insertedPersonas,
        count: personas.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
