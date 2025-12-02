import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobItem { name: string; reason?: string }

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { happyJobs = [], painJobs = [], firstMemories = [] } = await req.json();

    const formatJobs = (items: JobItem[]) =>
      (Array.isArray(items) ? items : []).map(j => `- ${j.name}${j.reason ? `: ${j.reason}` : ''}`).join('\n');

    const formatMems = (items: unknown[]) =>
      (Array.isArray(items) ? items : []).filter(Boolean).map(m => `- ${String(m)}`).join('\n');

    const happyText = formatJobs(happyJobs);
    const painText = formatJobs(painJobs);
    const memText = formatMems(firstMemories);

    const userPrompt = `다음 데이터를 분석해서 이 사람의 Prime Perspective를 도출해줘:\n\n` +
      `행복한 직업들:\n${happyText || '- (없음)'}\n\n` +
      `고통스러운 직업들:\n${painText || '- (없음)'}\n\n` +
      `각인 순간들:\n${memText || '- (없음)'}\n\n` +
      `이를 바탕으로:\n` +
      `1. 이 사람이 언제 가장 행복하고 번영하는지\n` +
      `2. 핵심 가치와 동기가 무엇인지\n` +
      `3. 회피하는 요소들은 무엇인지\n\n` +
      `2-3문장으로 Prime Perspective를 작성해줘. 한국어로 답변해줘.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '너는 커리어 분석가다. 입력 데이터를 간결히 통합하여 2-3문장으로 Prime Perspective를 한국어로 작성한다. 불필요한 서론, 헤더, 목록 없이 자연스러운 단락으로만 작성한다.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    };

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!aiResp.ok) {
      const details = await aiResp.text();
      console.error('OpenAI error:', aiResp.status, details);
      return new Response(JSON.stringify({ error: 'OpenAI API 호출 실패', details }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const content: string = data?.choices?.[0]?.message?.content?.trim() ?? '';

    return new Response(JSON.stringify({ primePerspective: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('analyze-perspective error:', error);
    return new Response(JSON.stringify({ error: '요청 처리 중 오류' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
