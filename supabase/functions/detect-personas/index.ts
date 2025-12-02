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

interface ClusterResult {
  cluster_id: number;
  jobs: JobEntry[];
  centroid: number[];
  silhouette_score: number;
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

    // 2. Call OpenAI to get embeddings for each job
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const embeddings = await Promise.all(
      happyJobs.map(async (job) => {
        const combinedText = `${job.definition || ""} ${job.reason || ""} ${
          job.first_memory || ""
        }`.trim();

        const response = await fetch(
          "https://api.openai.com/v1/embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: combinedText,
            }),
          }
        );

        const data = await response.json();
        return {
          job,
          embedding: data.data[0].embedding as number[],
        };
      })
    );

    console.log(`Generated ${embeddings.length} embeddings`);

    // 3. Simple K-means clustering
    const optimalK = Math.min(
      Math.max(Math.floor(happyJobs.length / 5), 2),
      5
    ); // 2-5 clusters
    console.log(`Clustering into ${optimalK} groups`);

    const clusters = kMeansClustering(embeddings, optimalK);

    // 4. Generate persona themes for each cluster using OpenAI
    const personas = await Promise.all(
      clusters.map(async (cluster, index) => {
        const clusterJobs = cluster.jobs;
        const jobDescriptions = clusterJobs
          .map(
            (j) =>
              `- ${j.job_name}: "${j.definition}"\n  이유: ${j.reason}\n  각인 순간: ${j.first_memory}`
          )
          .join("\n");

        const prompt = `다음은 사용자가 행복을 느낄 것 같다고 선택한 직업군입니다:

${jobDescriptions}

각 직업의 정의, 이유, 각인 순간을 분석하여 다음 정보를 JSON 형식으로 제공하세요:
1. theme: 이 클러스터의 핵심 테마를 한 문장으로 요약
2. persona_name: 페르소나 이름 제안 (예: "돕는 나", "창작하는 나")
3. keywords: 대표 키워드 5개 추출
4. archetype: 원형 분류 (Healer, Creator, Strategist, Analyst, Builder, Teacher, Explorer, Guardian 중 하나)

응답 형식:
{
  "theme": "...",
  "persona_name": "...",
  "keywords": ["...", "...", "...", "...", "..."],
  "archetype": "..."
}`;

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_object" },
              temperature: 0.7,
            }),
          }
        );

        const data = await response.json();
        const themeData = JSON.parse(
          data.choices[0].message.content
        ) as PersonaTheme;

        // Get archetype config
        const archetypeConfig =
          ARCHETYPE_CONFIG[themeData.archetype] ||
          ARCHETYPE_CONFIG.Explorer;

        return {
          cluster_id: index,
          jobs: clusterJobs,
          theme: themeData.theme,
          persona_name: themeData.persona_name,
          keywords: themeData.keywords,
          archetype: themeData.archetype,
          color_hex: archetypeConfig.color,
          icon_name: archetypeConfig.icon,
          strength_score: cluster.silhouette_score * 100,
          rank_order: index + 1,
        };
      })
    );

    console.log(`Generated ${personas.length} personas`);

    // 5. Save personas to database
    const { data: insertedPersonas, error: personaError } =
      await supabaseClient
        .from("persona_profiles")
        .insert(
          personas.map((p) => ({
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

    // 6. Create persona-job mappings
    const mappings = personas.flatMap((persona, index) =>
      persona.jobs.map((job) => ({
        persona_id: insertedPersonas![index].id,
        job_entry_id: job.id,
        cluster_confidence: 0.85, // Simplified - could calculate actual confidence
      }))
    );

    const { error: mappingError } = await supabaseClient
      .from("persona_job_mappings")
      .insert(mappings);

    if (mappingError) {
      console.error("Error inserting mappings:", mappingError);
      throw mappingError;
    }

    // 7. Insert keywords
    const keywordInserts = personas.flatMap((persona, index) =>
      persona.keywords.map((keyword) => ({
        persona_id: insertedPersonas![index].id,
        keyword,
        frequency: 1,
      }))
    );

    const { error: keywordError } = await supabaseClient
      .from("persona_keywords")
      .insert(keywordInserts);

    if (keywordError) {
      console.error("Error inserting keywords:", keywordError);
    }

    // 8. Update user profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        has_multiple_personas: personas.length > 1,
        active_persona_id: insertedPersonas![0].id, // Set first as active
      })
      .eq("id", targetUserId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // 9. Create default milestones for each persona
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
        // Don't throw - milestones are nice-to-have, not critical
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

// Simple K-means clustering implementation
function kMeansClustering(
  embeddings: Array<{ job: JobEntry; embedding: number[] }>,
  k: number
): ClusterResult[] {
  const vectors = embeddings.map((e) => e.embedding);
  const n = vectors.length;
  const dim = vectors[0].length;

  // Initialize centroids randomly
  const centroids: number[][] = [];
  const indices = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!indices.has(idx)) {
      indices.add(idx);
      centroids.push([...vectors[idx]]);
    }
  }

  // Iterate until convergence (max 50 iterations)
  let assignments = new Array(n).fill(0);
  for (let iter = 0; iter < 50; iter++) {
    // Assign points to nearest centroid
    const newAssignments = vectors.map((vec) => {
      let minDist = Infinity;
      let bestCluster = 0;
      centroids.forEach((centroid, cIdx) => {
        const dist = euclideanDistance(vec, centroid);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = cIdx;
        }
      });
      return bestCluster;
    });

    // Check convergence
    if (
      newAssignments.every((val, idx) => val === assignments[idx])
    ) {
      break;
    }
    assignments = newAssignments;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterVectors = vectors.filter(
        (_, idx) => assignments[idx] === c
      );
      if (clusterVectors.length > 0) {
        centroids[c] = clusterVectors[0].map((_, d) =>
          clusterVectors.reduce((sum, vec) => sum + vec[d], 0) /
          clusterVectors.length
        );
      }
    }
  }

  // Build cluster results
  const clusters: ClusterResult[] = [];
  for (let c = 0; c < k; c++) {
    const clusterIndices = assignments
      .map((a, idx) => (a === c ? idx : -1))
      .filter((idx) => idx >= 0);

    if (clusterIndices.length === 0) continue;

    const clusterJobs = clusterIndices.map((idx) => embeddings[idx].job);
    const clusterVectors = clusterIndices.map((idx) => vectors[idx]);

    // Calculate silhouette score (simplified)
    const silhouetteScore = calculateSilhouetteScore(
      clusterVectors,
      centroids[c],
      vectors,
      centroids
    );

    clusters.push({
      cluster_id: c,
      jobs: clusterJobs,
      centroid: centroids[c],
      silhouette_score: Math.max(0.3, Math.min(0.9, silhouetteScore)), // Clamp between 0.3-0.9
    });
  }

  return clusters;
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, idx) => sum + (val - b[idx]) ** 2, 0));
}

function calculateSilhouetteScore(
  clusterVectors: number[][],
  centroid: number[],
  allVectors: number[][],
  allCentroids: number[][]
): number {
  // Simplified silhouette score: intra-cluster distance vs nearest other cluster
  const intraDist =
    clusterVectors.reduce(
      (sum, vec) => sum + euclideanDistance(vec, centroid),
      0
    ) / clusterVectors.length;

  const otherCentroids = allCentroids.filter((c) => c !== centroid);
  const interDist = Math.min(
    ...otherCentroids.map((c) => euclideanDistance(centroid, c))
  );

  return (interDist - intraDist) / Math.max(intraDist, interDist);
}
