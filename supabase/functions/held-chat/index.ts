import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { MODELS, TEMPERATURES } from "../_shared/models.ts";
import { sanitizeUserInput } from "../_shared/sanitize.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const TONE_MAP: Record<string, string> = {
  friend: '친구처럼 편하게 반말로 이야기해. 가볍고 친근하게.',
  warm: '따뜻하고 부드럽게 존댓말로 이야기해. 수용적이고 편안한 느낌으로.',
  calm: '차분하고 안정적으로 존댓말로 이야기해. 침착하고 신뢰감 있게.',
  expert: '분석적이고 명확하게 존댓말로 이야기해. 전문가처럼 구조적으로.',
};

const PERSONALITY_MAP: Record<string, string> = {
  empathetic: '공감을 최우선으로. 감정을 있는 그대로 인정하고 받아들여.',
  direct: '솔직하게 핵심을 짚어줘. 돌려 말하지 말고 정직하게.',
  curious: '호기심을 갖고 질문을 많이 해. 사용자가 스스로 답을 찾도록 도와.',
  playful: '유쾌하고 가벼운 톤으로. 무거운 감정도 살짝 다른 각도로 볼 수 있게.',
};

const TAB_ROLE_MAP: Record<string, string> = {
  vent: '감정 수용 파트너. 사용자가 감정을 쏟아낼 때 깊이 들어주고 있는 그대로 인정해. 조언이나 긍정적 재구성은 하지 마.',
  dig: '패턴 탐색 가이드. 사용자의 관계 패턴과 반복되는 감정의 뿌리를 함께 찾아가. 질문 위주로 탐색을 도와.',
  get: '자기이해 안내자. V-File 결과를 바탕으로 사용자가 자신의 가면과 심리 구조를 이해하도록 도와. 지적이고 통찰적으로.',
  set: '변화 동반자. 사용자가 새로운 관계 패턴을 설정하고 실천할 수 있도록 격려해. 구체적이고 실행 가능한 방향으로.',
  me: '자기성찰 파트너. 사용자의 전체 여정을 되돌아보며 성장을 인식하도록 도와. 따뜻하지만 솔직하게.',
};

function buildSystemPrompt(name: string, tone: string, personality: string, tab?: string): string {
  const toneDesc = TONE_MAP[tone] ?? TONE_MAP.warm;
  const persDesc = PERSONALITY_MAP[personality] ?? PERSONALITY_MAP.empathetic;
  const roleDesc = TAB_ROLE_MAP[tab ?? 'vent'] ?? TAB_ROLE_MAP.vent;

  return `너는 '${name}'라는 이름의 AI야. 전문 상담사가 아니며, ${roleDesc}

말투: ${toneDesc}
성격: ${persDesc}

응답 원칙:
- 3~5문장 이내로 간결하게
- 감정에 이름을 붙여주되 과장하지 않는다
- 사용자의 관계 역량 축 점수가 제공되면, 그 패턴을 자연스럽게 반영하되 점수를 직접 언급하지 않는다
- 이전 대화 기억이 제공되면 자연스럽게 참조하되, "기록에 보면" 같은 직접적 표현은 쓰지 않는다
- 이전 기억을 억지로 끼워넣지 않는다. 현재 맥락과 관련 있을 때만 자연스럽게 참조한다
- 한국어로 답변
- 위기 상황(자해/자살 표현) 감지 시: 공감 후 "자살예방상담전화 1393"을 안내한다`;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
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

    const body = await req.json();

    // Rate limit: 유저당 분당 10회
    const rateLimitKey = body.userId ?? req.headers.get('x-forwarded-for') ?? 'anon';
    if (!checkRateLimit(rateLimitKey, 10, 60_000)) {
      return rateLimitResponse(corsHeaders);
    }

    const emotion = sanitizeUserInput(body.emotion ?? '', 50);
    const text = sanitizeUserInput(body.text ?? '', 2000);
    const mask = sanitizeUserInput(body.mask ?? '', 50);
    const axisScores = body.axisScores;
    const history = body.history;
    const userId = body.userId;
    const aiSettings = body.aiSettings ?? {};
    const aiName = sanitizeUserInput(aiSettings.name ?? '엠버', 20);
    const aiTone = aiSettings.tone ?? 'warm';
    const aiPersonality = aiSettings.personality ?? 'empathetic';
    const tab = sanitizeUserInput(body.tab ?? 'vent', 10);

    // ── 이전 세션 기억 조회 (최근 3개 완료 세션) ──
    let memoryContext = '';
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
          db: { schema: 'veilrum' },
        });
        const { data: sessions } = await sb
          .from('dive_sessions')
          .select('context_summary, emotion, held_keywords, created_at')
          .eq('user_id', userId)
          .eq('session_completed', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (sessions && sessions.length > 0) {
          memoryContext = '\n이전 대화 기억:\n';
          for (const s of sessions) {
            const date = new Date(s.created_at).toLocaleDateString('ko-KR');
            const keywords = Array.isArray(s.held_keywords) ? s.held_keywords.slice(0, 3).join(', ') : '';
            memoryContext += `- [${date}] ${s.emotion ?? ''}${s.context_summary ? ' — ' + s.context_summary.slice(0, 100) : ''}${keywords ? ` (키워드: ${keywords})` : ''}\n`;
          }
        }
      } catch (e) {
        console.warn('Memory fetch failed:', e);
      }
    }

    // 개인화 컨텍스트 구성
    let context = '';
    if (emotion) context += `현재 감정: ${emotion}\n`;
    if (mask) context += `관계 가면: ${mask}\n`;
    if (axisScores) {
      context += `관계 역량 축: 애착(A):${axisScores.A}/100, 소통(B):${axisScores.B}/100, 욕구표현(C):${axisScores.C}/100, 역할(D):${axisScores.D}/100\n`;
    }
    if (memoryContext) context += memoryContext;
    context += `\n사용자가 말한 내용:\n${text}`;

    // 대화 히스토리 → Claude messages 형식
    const messages: { role: string; content: string }[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-6)) { // 최근 6턴만
        if (h.role === 'user') messages.push({ role: 'user', content: h.text });
        else if (h.role === 'ai') messages.push({ role: 'assistant', content: h.text });
      }
    }
    messages.push({ role: 'user', content: context });

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELS.SONNET,
        max_tokens: 512,
        temperature: TEMPERATURES.CONVERSATION,
        system: buildSystemPrompt(aiName, aiTone, aiPersonality, tab),
        messages,
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
