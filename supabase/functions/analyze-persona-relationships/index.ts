import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PersonaProfile {
  id: string;
  persona_name: string;
  persona_archetype: string;
  theme_description: string;
  persona_keywords?: Array<{ keyword: string; frequency: number }>;
}

interface RelationshipAnalysis {
  persona1_id: string;
  persona2_id: string;
  relationship_type: "synergy" | "conflict" | "neutral";
  strength_score: number;
  description: string;
  common_keywords: string[];
  ai_insights: string;
}

serve(async (req) => {
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { userId } = await req.json();
    if (userId !== user.id) {
      throw new Error("Unauthorized");
    }

    // Get all personas for the user
    const { data: personas, error: personasError } = await supabaseClient
      .from("persona_profiles")
      .select("id, persona_name, persona_archetype, theme_description, persona_keywords(keyword, frequency)")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (personasError) throw personasError;
    if (!personas || personas.length < 2) {
      return new Response(
        JSON.stringify({
          message: "Need at least 2 personas to analyze relationships",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const relationships: RelationshipAnalysis[] = [];

    // Analyze each pair of personas
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const persona1 = personas[i] as PersonaProfile;
        const persona2 = personas[j] as PersonaProfile;

        // Ensure persona1_id < persona2_id for the constraint
        const [p1, p2] = persona1.id < persona2.id
          ? [persona1, persona2]
          : [persona2, persona1];

        const analysis = await analyzeRelationship(p1, p2);
        relationships.push({
          persona1_id: p1.id,
          persona2_id: p2.id,
          ...analysis,
        });
      }
    }

    // Store relationships in database
    await supabaseClient
      .from("persona_relationships")
      .delete()
      .eq("user_id", userId);

    const relationshipsToInsert = relationships.map((rel) => ({
      user_id: userId,
      ...rel,
      common_keywords: rel.common_keywords,
    }));

    const { error: insertError } = await supabaseClient
      .from("persona_relationships")
      .insert(relationshipsToInsert);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        message: "Relationships analyzed successfully",
        count: relationships.length,
        relationships,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing persona relationships:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function analyzeRelationship(
  persona1: PersonaProfile,
  persona2: PersonaProfile
): Promise<Omit<RelationshipAnalysis, "persona1_id" | "persona2_id">> {
  const keywords1 = persona1.persona_keywords?.map((kw) => kw.keyword.toLowerCase()) || [];
  const keywords2 = persona2.persona_keywords?.map((kw) => kw.keyword.toLowerCase()) || [];

  // Find common keywords
  const commonKeywords = keywords1.filter((kw) => keywords2.includes(kw));
  const commonCount = commonKeywords.length;

  // Calculate overlap ratio
  const totalUniqueKeywords = new Set([...keywords1, ...keywords2]).size;
  const overlapRatio = totalUniqueKeywords > 0 ? (commonCount * 2) / (keywords1.length + keywords2.length) : 0;

  // Use Claude for enhanced analysis
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  let aiInsights = "";
  let relationship_type: "synergy" | "conflict" | "neutral";
  let strength_score: number;
  let description: string;

  if (ANTHROPIC_API_KEY) {
    try {
      const prompt = `Analyze the relationship between two personas:

Persona 1: ${persona1.persona_name}
- Archetype: ${persona1.persona_archetype}
- Description: ${persona1.theme_description}
- Keywords: ${keywords1.join(", ")}

Persona 2: ${persona2.persona_name}
- Archetype: ${persona2.persona_archetype}
- Description: ${persona2.theme_description}
- Keywords: ${keywords2.join(", ")}

Common keywords: ${commonKeywords.join(", ") || "None"}

Determine:
1. Relationship type (synergy/conflict/neutral)
2. Strength score (0-100)
3. Brief description
4. Strategic insights

Respond in JSON format:
{
  "type": "synergy|conflict|neutral",
  "strength": 0-100,
  "description": "brief description in Korean",
  "insights": "strategic insights and recommendations in Korean"
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: "You are an expert in personal branding and multi-persona analysis. Provide concise, actionable insights in Korean. Always respond with valid JSON only.",
          messages: [
            { role: "user", content: prompt },
          ],
        }),
      });

      const aiData = await response.json();
      const content = aiData.content?.[0]?.text || "{}";
      const result = JSON.parse(content);

      relationship_type = result.type;
      strength_score = result.strength;
      description = result.description;
      aiInsights = result.insights;
    } catch (aiError) {
      console.error("AI analysis failed, using heuristic:", aiError);
      // Fallback to heuristic
      ({ relationship_type, strength_score, description } = getHeuristicAnalysis(
        persona1,
        persona2,
        overlapRatio,
        commonCount
      ));
    }
  } else {
    // No AI key, use heuristic
    ({ relationship_type, strength_score, description } = getHeuristicAnalysis(
      persona1,
      persona2,
      overlapRatio,
      commonCount
    ));
  }

  return {
    relationship_type,
    strength_score: Math.round(strength_score),
    description,
    common_keywords: commonKeywords,
    ai_insights: aiInsights,
  };
}

function getHeuristicAnalysis(
  persona1: PersonaProfile,
  persona2: PersonaProfile,
  overlapRatio: number,
  commonCount: number
): {
  relationship_type: "synergy" | "conflict" | "neutral";
  strength_score: number;
  description: string;
} {
  let type: "synergy" | "conflict" | "neutral";
  let strength: number;
  let desc: string;

  if (overlapRatio > 0.3) {
    type = "synergy";
    strength = Math.min(100, overlapRatio * 100 + 20);
    desc = `${persona1.persona_name}과 ${persona2.persona_name}은 ${commonCount}개의 공통 키워드를 공유하며 강한 시너지를 보입니다. 이 두 페르소나를 결합하면 독창적인 브랜드 정체성을 만들 수 있습니다.`;
  } else if (overlapRatio > 0.1) {
    type = "neutral";
    strength = Math.min(100, overlapRatio * 100);
    desc = `${persona1.persona_name}과 ${persona2.persona_name}은 일부 연결점이 있지만 독립적입니다. 각각의 고유성을 유지하면서 보완적인 관계로 발전시킬 수 있습니다.`;
  } else {
    type = "conflict";
    strength = Math.max(20, 50 - overlapRatio * 100);
    desc = `${persona1.persona_name}과 ${persona2.persona_name}은 매우 다른 방향성을 가지고 있습니다. 이는 다양한 타겟층을 커버할 수 있는 장점이 될 수 있지만, 브랜드 메시지가 분산될 위험이 있습니다.`;
  }

  return {
    relationship_type: type,
    strength_score: strength,
    description: desc,
  };
}
