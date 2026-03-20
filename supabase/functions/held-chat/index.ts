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

    const { emotion, text, userId } = await req.json();

    const emotionContext = emotion ? `현재 감정: ${emotion}\n` : '';
    const userMessage = `${emotionContext}사용자가 말한 내용:\n${text}`;

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: `너는 비판단적이고 따뜻한 감정 수용 상담사야. 사용자가 자신의 감정과 경험을 털어놓을 때, 조언하거나 판단하거나 해결책을 제시하지 않는다. 오직 깊이 들어주고, 감정을 있는 그대로 인정하고, 사용자가 혼자가 아님을 느끼게 한다.

응답 원칙:
- 3~5문장 이내로 간결하게
- 감정에 이름을 붙여주되 과장하지 않는다
- "당연히 그럴 수 있어요", "그 감정 충분히 이해돼요" 같은 수용적 언어 사용
- 조언, 당위, 긍정적 재구성 금지
- 한국어로 답변, 존댓말 사용`,
        messages: [
          { role: 'user', content: userMessage },
        ],
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
    const response: string = data?.content?.[0]?.text?.trim() ?? '';

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('held-chat error:', error);
    return new Response(JSON.stringify({ error: '요청 처리 중 오류' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
