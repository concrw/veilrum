import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { situation, text, matchedQuestion, matchedAnswer, researcher, domain, axisScores } = await req.json();

    // 축 점수 컨텍스트 구성
    const axisContext = axisScores
      ? `\n사용자 관계 역량 축 점수:\n- 자기인식(A): ${axisScores.A}/100\n- 감정조절(B): ${axisScores.B}/100\n- 욕구표현(C): ${axisScores.C}/100\n- 관계유지(D): ${axisScores.D}/100`
      : '';

    const userPrompt =
      `사용자가 입력한 관계 상황:\n관계 유형: ${situation || '미선택'}\n상황 내용: ${text}\n\n` +
      `M43 연구 매칭 결과:\n도메인: ${domain}\n연구자: ${researcher}\n매칭 질문: ${matchedQuestion}\n연구 답변: ${matchedAnswer}` +
      axisContext +
      `\n\n위 내용을 바탕으로 이 사용자의 반복 패턴을 해석해줘. ` +
      `연구 답변을 이 사람의 구체적인 상황과 연결지어 설명하고, 이 패턴이 왜 반복되는지 심리적 구조를 짚어줘. ` +
      `조언이나 해결책은 제시하지 않고, 오직 '왜 이런 패턴이 생겼는지'에 집중해서 3~4문장으로 설명해줘.`;

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: `너는 관계 패턴 해석 전문가야. M43 연구소의 연구 결과를 토대로, 사용자가 입력한 관계 상황의 반복 구조를 심리적으로 해석한다.

원칙:
- 판단하지 않고 구조를 설명한다
- "왜 이런 패턴이 반복되는가"에만 집중한다
- 조언, 해결책, 당위(~해야 한다) 금지
- M43 연구 결과를 이 사람의 상황에 구체적으로 연결한다
- 3~4문장, 한국어, 존댓말`,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!aiResp.ok) {
      const details = await aiResp.text();
      console.error('Anthropic error:', aiResp.status, details);
      return new Response(JSON.stringify({ error: 'Claude API 호출 실패', details }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const interpretation: string = data?.content?.[0]?.text?.trim() ?? '';

    return new Response(JSON.stringify({ interpretation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('dig-interpret error:', error);
    return new Response(JSON.stringify({ error: '요청 처리 중 오류' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
