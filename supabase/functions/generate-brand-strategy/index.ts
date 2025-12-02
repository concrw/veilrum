import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ikigai, whyAnalysis, user } = await req.json();

    // Build context from Ikigai data
    const ikigaiContext = ikigai ? `
Ikigai 분석 데이터:
- 좋아하는 것 (Love): ${ikigai.love_elements?.join(", ") || "없음"}
- 잘하는 것 (Good At): ${ikigai.good_at_elements?.join(", ") || "없음"}
- 세상이 필요한 것 (World Needs): ${ikigai.world_needs_elements?.join(", ") || "없음"}
- 돈 벌 수 있는 것 (Paid For): ${ikigai.paid_for_elements?.join(", ") || "없음"}
- 최종 Ikigai 문장: ${ikigai.final_ikigai_text || "미설정"}
` : "Ikigai 데이터 없음";

    // Build context from Why Analysis
    const whyContext = whyAnalysis ? `
Why 분석 데이터:
- 행복한 직업들: ${whyAnalysis.happy_jobs?.map((j: any) => j.name + (j.reason ? ` (이유: ${j.reason})` : "")).join(", ") || "없음"}
- 고통스러운 직업들: ${whyAnalysis.pain_jobs?.map((j: any) => j.name + (j.reason ? ` (이유: ${j.reason})` : "")).join(", ") || "없음"}
- Prime Perspective: ${whyAnalysis.prime_perspective || "미설정"}
` : "Why 분석 데이터 없음";

    const prompt = `당신은 개인 브랜드 전략 전문 컨설턴트입니다. 사용자의 Ikigai 분석과 Why 분석 데이터를 기반으로 맞춤형 브랜드 전략을 생성합니다.

중요: 모든 응답은 반드시 한국어로 작성하세요.

${ikigaiContext}

${whyContext}

사용자: ${user?.email || "Unknown"}

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이 순수 JSON만):
{
  "brand_direction": {
    "field": "전문 분야 (예: 퍼스널 브랜딩 코칭, 커리어 멘토링 등)",
    "positioning": "포지셔닝 문장 - 나는 [타겟]을 위한 [가치제안]을 제공하는 [정체성]이다",
    "core_message": "핵심 브랜드 메시지 (Prime Perspective 기반, 100자 이내)"
  },
  "content_strategy": {
    "topics": ["주제1", "주제2", "주제3", "주제4", "주제5"],
    "formats": ["형식1", "형식2", "형식3", "형식4"],
    "channels": ["채널1", "채널2", "채널3"],
    "cadence": "발행 주기"
  },
  "target_audience": {
    "age_range": "연령대",
    "interests": ["관심사1", "관심사2", "관심사3", "관심사4"],
    "pain_points": ["고충1", "고충2", "고충3"],
    "preferred_channels": ["선호채널1", "선호채널2"]
  },
  "brand_names": ["브랜드명1", "브랜드명2", "브랜드명3", "브랜드명4", "브랜드명5", "브랜드명6", "브랜드명7", "브랜드명8"],
  "revenue_model": {
    "primary_model": "주요 수익 모델",
    "price_points": ["가격대1 (서비스명: 가격)", "가격대2 (서비스명: 가격)", "가격대3 (서비스명: 가격)"],
    "monetization_channels": ["수익화 채널1", "수익화 채널2", "수익화 채널3"]
  }
}

전략 수립 가이드라인:
1. 브랜드 방향
   - Ikigai의 4가지 영역 교집합에서 핵심 전문 분야 도출
   - Prime Perspective를 핵심 메시지의 근간으로 활용
   - 차별화된 포지셔닝 문장 작성

2. 콘텐츠 전략
   - 좋아하는 것(Love)에서 열정 있게 다룰 수 있는 주제 선정
   - 잘하는 것(Good At)을 보여줄 수 있는 콘텐츠 형식 제안
   - 타겟 고객이 있는 채널 우선 선택

3. 타겟 고객
   - 세상이 필요한 것(World Needs)에서 타겟의 니즈 파악
   - Pain Jobs에서 타겟의 고충 도출
   - 구체적인 연령대와 관심사 설정

4. 브랜드명
   - 한국어, 영어, 한영 조합 다양하게 8-12개 제안
   - 발음하기 쉽고 기억에 남는 이름
   - 전문성과 친근함의 균형

5. 수익 모델
   - 돈 벌 수 있는 것(Paid For) 기반 현실적 모델
   - 단계별 가격 전략 (입문-중급-프리미엄)
   - 다양한 수익화 채널 제안`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "당신은 한국어로 응답하는 브랜드 전략 전문가입니다. 반드시 유효한 JSON 형식으로만 응답하세요. JSON 외의 다른 텍스트는 포함하지 마세요."
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // try to extract JSON block
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          parsed = {};
        }
      } else {
        parsed = {};
      }
    }

    // Build safe response with fallbacks
    const primePerspective = whyAnalysis?.prime_perspective || ikigai?.final_ikigai_text || "당신만의 관점";

    const safe = {
      brand_direction: {
        field: parsed?.brand_direction?.field || "퍼스널 브랜딩",
        positioning: parsed?.brand_direction?.positioning || "문제 해결 중심 전문가",
        core_message: parsed?.brand_direction?.core_message || primePerspective,
      },
      content_strategy: {
        topics: Array.isArray(parsed?.content_strategy?.topics) && parsed.content_strategy.topics.length > 0
          ? parsed.content_strategy.topics
          : ["브랜딩 인사이트", "경험담 공유", "업계 트렌드", "실용 팁", "케이스 스터디"],
        formats: Array.isArray(parsed?.content_strategy?.formats) && parsed.content_strategy.formats.length > 0
          ? parsed.content_strategy.formats
          : ["칼럼/블로그", "SNS 카드뉴스", "숏폼 영상", "팟캐스트"],
        channels: Array.isArray(parsed?.content_strategy?.channels) && parsed.content_strategy.channels.length > 0
          ? parsed.content_strategy.channels
          : ["블로그/브런치", "인스타그램", "유튜브"],
        cadence: parsed?.content_strategy?.cadence || "주 2~3회",
      },
      target_audience: {
        age_range: parsed?.target_audience?.age_range || "25-45세",
        interests: Array.isArray(parsed?.target_audience?.interests) && parsed.target_audience.interests.length > 0
          ? parsed.target_audience.interests
          : ["자기계발", "커리어 성장", "창업/부업", "라이프스타일 디자인"],
        pain_points: Array.isArray(parsed?.target_audience?.pain_points) && parsed.target_audience.pain_points.length > 0
          ? parsed.target_audience.pain_points
          : ["진로 불확실성", "브랜드 정체성 부족", "차별화 어려움"],
        preferred_channels: Array.isArray(parsed?.target_audience?.preferred_channels) && parsed.target_audience.preferred_channels.length > 0
          ? parsed.target_audience.preferred_channels
          : ["유튜브", "인스타그램", "네이버 블로그"],
      },
      brand_names: Array.isArray(parsed?.brand_names) && parsed.brand_names.length > 0
        ? parsed.brand_names
        : ["프라임 포커스", "브랜드 나침반", "인사이트 웨이", "그로우 마인드", "퍼스널 레버리지", "유니크 밸류"],
      revenue_model: {
        primary_model: parsed?.revenue_model?.primary_model || "온라인 강의 및 코칭",
        price_points: Array.isArray(parsed?.revenue_model?.price_points) && parsed.revenue_model.price_points.length > 0
          ? parsed.revenue_model.price_points
          : ["입문 클래스: 5-10만원", "심화 과정: 30-50만원", "1:1 코칭: 월 100만원+"],
        monetization_channels: Array.isArray(parsed?.revenue_model?.monetization_channels) && parsed.revenue_model.monetization_channels.length > 0
          ? parsed.revenue_model.monetization_channels
          : ["온라인 강의 플랫폼", "그룹 코칭", "전자책/템플릿 판매"],
      },
    };

    return new Response(JSON.stringify(safe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("generate-brand-strategy error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
