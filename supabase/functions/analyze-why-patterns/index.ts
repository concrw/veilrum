// Edge Function: analyze-why-patterns
// Analyzes user's happy/pain jobs to extract patterns and generate Prime Perspective

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
  definition: string | null;
  first_memory: string | null;
  category: "happy" | "pain" | "neutral";
  reason: string | null;
  has_experience: boolean;
  experience_note: string | null;
}

interface AnalysisResult {
  happy_keywords: string[];
  pain_keywords: string[];
  happy_patterns: {
    keyword: string;
    frequency: number;
    jobs: string[];
  }[];
  pain_patterns: {
    keyword: string;
    frequency: number;
    jobs: string[];
  }[];
  prime_perspective: string;
  root_causes: {
    happy_root: string;
    pain_root: string;
    consistency_score: number;
  };
  analysis_data: {
    total_jobs: number;
    happy_count: number;
    pain_count: number;
    neutral_count: number;
    experience_ratio: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Parse request body
    const { userId, sessionId } = await req.json();
    const targetUserId = userId || user.id;

    console.log("Analyzing Why patterns for user:", targetUserId);

    // Fetch job entries
    let query = supabaseClient
      .from("job_entries")
      .select("*")
      .eq("user_id", targetUserId);

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No jobs found for analysis",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${jobs.length} jobs to analyze`);

    // Separate jobs by category
    const happyJobs = jobs.filter((j) => j.category === "happy");
    const painJobs = jobs.filter((j) => j.category === "pain");
    const neutralJobs = jobs.filter((j) => j.category === "neutral");

    // Extract keywords and patterns
    const happyAnalysis = await analyzeJobGroup(happyJobs, "happy");
    const painAnalysis = await analyzeJobGroup(painJobs, "pain");

    // Analyze root causes by connecting to memories
    const rootCauses = await analyzeRootCauses(happyJobs, painJobs);

    // Generate Prime Perspective using AI
    const primePerspective = await generatePrimePerspective(
      happyAnalysis,
      painAnalysis,
      rootCauses
    );

    // Build analysis result
    const analysisResult: AnalysisResult = {
      happy_keywords: happyAnalysis.keywords,
      pain_keywords: painAnalysis.keywords,
      happy_patterns: happyAnalysis.patterns,
      pain_patterns: painAnalysis.patterns,
      prime_perspective: primePerspective,
      root_causes: rootCauses,
      analysis_data: {
        total_jobs: jobs.length,
        happy_count: happyJobs.length,
        pain_count: painJobs.length,
        neutral_count: neutralJobs.length,
        experience_ratio:
          jobs.filter((j) => j.has_experience).length / jobs.length,
      },
    };

    // Save to analysis_results table
    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from("analysis_results")
      .insert({
        user_id: targetUserId,
        prime_perspective: primePerspective,
        happy_keywords: happyAnalysis.keywords,
        pain_keywords: painAnalysis.keywords,
        analysis_data: analysisResult,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving analysis:", saveError);
      throw saveError;
    }

    console.log("Analysis completed and saved");

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        analysisId: savedAnalysis.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-why-patterns:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Analyze a group of jobs (happy or pain) to extract keywords and patterns
 */
async function analyzeJobGroup(
  jobs: JobEntry[],
  type: "happy" | "pain"
): Promise<{
  keywords: string[];
  patterns: { keyword: string; frequency: number; jobs: string[] }[];
}> {
  if (jobs.length === 0) {
    return { keywords: [], patterns: [] };
  }

  // Extract all text from reasons, definitions, and memories
  const allText = jobs
    .map((j) =>
      [j.reason, j.definition, j.first_memory].filter(Boolean).join(" ")
    )
    .join(" ")
    .toLowerCase();

  // Korean and English keyword extraction patterns
  const koreanPattern = /[가-힣]{2,}/g;
  const englishPattern = /[a-z]{3,}/g;

  const koreanWords = allText.match(koreanPattern) || [];
  const englishWords = allText.match(englishPattern) || [];
  const allWords = [...koreanWords, ...englishWords];

  // Count frequencies
  const wordCounts: Record<string, { count: number; jobs: Set<string> }> = {};

  jobs.forEach((job) => {
    const jobText = [job.reason, job.definition, job.first_memory]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    allWords.forEach((word) => {
      if (jobText.includes(word)) {
        if (!wordCounts[word]) {
          wordCounts[word] = { count: 0, jobs: new Set() };
        }
        wordCounts[word].count++;
        wordCounts[word].jobs.add(job.job_name);
      }
    });
  });

  // Filter out common stop words and low-frequency words
  const stopWords = new Set([
    "있는",
    "하는",
    "되는",
    "같은",
    "것은",
    "것이",
    "수가",
    "때문",
    "이런",
    "저런",
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
  ]);

  const filtered = Object.entries(wordCounts)
    .filter(([word, data]) => !stopWords.has(word) && data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);

  const keywords = filtered.map(([word]) => word);
  const patterns = filtered.map(([word, data]) => ({
    keyword: word,
    frequency: data.count,
    jobs: Array.from(data.jobs),
  }));

  return { keywords, patterns };
}

/**
 * Analyze root causes by connecting patterns to first memories
 */
async function analyzeRootCauses(
  happyJobs: JobEntry[],
  painJobs: JobEntry[]
): Promise<{
  happy_root: string;
  pain_root: string;
  consistency_score: number;
}> {
  // Extract memories with emotions
  const happyMemories = happyJobs
    .filter((j) => j.first_memory)
    .map((j) => j.first_memory);
  const painMemories = painJobs
    .filter((j) => j.first_memory)
    .map((j) => j.first_memory);

  // Simple heuristic analysis (can be enhanced with AI)
  const happyRoot =
    happyMemories.length > 0
      ? `${happyMemories.length}개의 긍정적 경험에서 형성된 가치관`
      : "경험 데이터 부족";

  const painRoot =
    painMemories.length > 0
      ? `${painMemories.length}개의 부정적 경험에서 형성된 회피 패턴`
      : "경험 데이터 부족";

  // Calculate consistency (ratio of jobs with memories)
  const totalWithMemories =
    happyJobs.filter((j) => j.first_memory).length +
    painJobs.filter((j) => j.first_memory).length;
  const consistency_score =
    totalWithMemories / (happyJobs.length + painJobs.length);

  return {
    happy_root: happyRoot,
    pain_root: painRoot,
    consistency_score: Math.round(consistency_score * 100) / 100,
  };
}

/**
 * Generate Prime Perspective using Claude
 */
async function generatePrimePerspective(
  happyAnalysis: any,
  painAnalysis: any,
  rootCauses: any
): Promise<string> {
  const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicApiKey) {
    console.warn("Anthropic API key not found, using fallback");
    return generateFallbackPrimePerspective(
      happyAnalysis,
      painAnalysis,
      rootCauses
    );
  }

  try {
    const prompt = `당신은 심리 분석 전문가입니다. 사용자의 "행복한 직업"과 "고통스러운 직업" 패턴을 분석하여 그들의 Prime Perspective(핵심 관점)를 한 문장으로 요약해주세요.

행복 패턴 키워드: ${happyAnalysis.keywords.join(", ")}
고통 패턴 키워드: ${painAnalysis.keywords.join(", ")}
행복 패턴 빈도: ${JSON.stringify(happyAnalysis.patterns.slice(0, 5))}
고통 패턴 빈도: ${JSON.stringify(painAnalysis.patterns.slice(0, 5))}
근본 원인: ${JSON.stringify(rootCauses)}

Prime Perspective는 다음 형식으로 작성해주세요:
"[동사]를 통해 [가치/목적]을 실현하고자 하는 사람"

예시:
- "창의적 문제해결을 통해 사람들의 일상을 개선하고자 하는 사람"
- "지식 공유를 통해 타인의 성장을 돕고자 하는 사람"
- "협업과 소통을 통해 공동체의 가치를 만들어가는 사람"

한 문장으로 명확하고 구체적으로 작성해주세요.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 256,
        system: "당신은 개인의 행복과 고통 패턴을 분석하여 핵심 정체성을 도출하는 심리 분석 전문가입니다. 간결하게 한 문장으로 답변하세요.",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const primePerspective = data.content?.[0]?.text?.trim() ?? "";

    console.log("Generated Prime Perspective:", primePerspective);
    return primePerspective;
  } catch (error) {
    console.error("Error generating Prime Perspective with AI:", error);
    return generateFallbackPrimePerspective(
      happyAnalysis,
      painAnalysis,
      rootCauses
    );
  }
}

/**
 * Fallback Prime Perspective generation without AI
 */
function generateFallbackPrimePerspective(
  happyAnalysis: any,
  painAnalysis: any,
  rootCauses: any
): string {
  const topHappyKeywords = happyAnalysis.keywords.slice(0, 3);
  const topPainKeywords = painAnalysis.keywords.slice(0, 2);

  if (topHappyKeywords.length === 0) {
    return "자신만의 방식으로 의미 있는 가치를 만들어가는 사람";
  }

  // Simple template-based generation
  const mainValue = topHappyKeywords[0];
  const avoidance =
    topPainKeywords.length > 0 ? `${topPainKeywords[0]}을 피하며` : "";

  return `${mainValue}을 통해 ${avoidance ? avoidance + " " : ""}의미 있는 가치를 실현하고자 하는 사람`;
}
