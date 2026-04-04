// Vent — 지금 다 쏟아내도 돼요
// 감정 선택 → AI 대화 → 레이어 신호 수집 → 감정 요약 카드
// Amber 단독 (Frost 없음)

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase, veilrumDb } from '@/integrations/supabase/client';
import { saveVentMessage, saveVentSummary, saveVentSessionSummary, saveVentPartialSession } from '@/hooks/useSignalPipeline';
import { AmberBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';
import { C, alpha } from '@/lib/colors';
import { CrisisBanner } from '@/components/CrisisBanner';
import type { CrisisSeverity } from '@/hooks/useSignalPipeline';
import { toast } from '@/hooks/use-toast';
import { detectCrisisLevel } from '@/lib/crisisDetect';
import EmotionSelector from '@/components/vent/EmotionSelector';
import ChatView from '@/components/vent/ChatView';
import VentLayerView from '@/components/vent/VentLayerView';

/* ── 감정 데이터 ── */
const EMOTIONS = [
  { label: '불안해',    svg: 'anxious'   },
  { label: '슬퍼',     svg: 'sad'       },
  { label: '화가 나',  svg: 'angry'     },
  { label: '혼란스러워', svg: 'confused' },
  { label: '외로워',   svg: 'lonely'    },
  { label: '무감각해', svg: 'numb'      },
  { label: '지쳐',     svg: 'tired'     },
  { label: '상처받았어', svg: 'hurt'    },
];

const EMO_DATA: Record<string, { count: number; questions: [string, string][]; suggestion: string }> = {
  '불안해':    { count: 142, questions: [["지금 불안함을 느끼는군요. 무슨 일이 있었나요?","부드럽게 · 여기 있어요"],["언제부터 그랬어요? 무슨 계기가 있었나요?","천천히 함께해요"],["불안이 몸 어디에서 느껴져요?","궁금해요 · 가까이 있을게요"],["혹시 두려운 게 있어요?","서두르지 않아도 돼요"]], suggestion: "많은 불안을 안고 계시네요. 두려운 것을 써보면 조금 느슨해질 수 있어요." },
  '슬퍼':     { count: 98, questions:  [["마음이 무거운 것 같아요. 무슨 일이에요?","조용히 · 듣고 있어요"],["얼마나 됐어요, 이 감정이?","함께예요 · 서두르지 않아도 돼요"],["중심에 있는 사람이나 상황이 있어요?","부드럽게 · 여기 있어요"],["이 슬픔이 말을 할 수 있다면 뭐라고 할 것 같아요?","궁금해요 · 여기 있어요"]], suggestion: "슬픔이 찾아왔네요. 가끔은 온전히 느끼는 것만으로도 조금씩 지나가요." },
  '화가 나':  { count: 76, questions:  [["화가 나는 게 당연해요. 무슨 일이에요?","함께예요 · 판단하지 않아요"],["누구 때문인지, 아니면 어떤 상황 때문인지요?","직접적으로 · 듣고 있어요"],["필요했는데 받지 못한 게 뭐였어요?","뿌리를 찾아가요"],["화 아래에 다른 감정이 있지 않을까요?","조심스럽게 · 가까이 있을게요"]], suggestion: "화가 있었네요. 화는 종종 충족되지 못한 욕구를 보호하는 방식이에요." },
  '혼란스러워':{ count: 54, questions: [["혼란스러울 때, 가장 크게 맴도는 질문이 뭐예요?","천천히 · 서두르지 않아도 돼요"],["상황 때문인지, 관계 때문인지, 아니면 나 때문인지요?","여기 있어요"],["기대했는데 일어나지 않은 게 뭐예요?","같이 명확해져가요"],["지금 덜 막힌 느낌이 들려면 뭐가 필요해요?","궁금해요 · 함께예요"]], suggestion: "혼란은 종종 변화 사이에 있다는 신호예요. 알던 나와 아직 만들어지는 나 사이에 있는 거예요." },
  '외로워':   { count: 218, questions: [["외로움이 참 무겁죠. 어떤 종류의 외로움이에요?","조용히 · 여기 있어요"],["특정 사람 때문인지, 아니면 전반적인 느낌인지요?","판단하지 않아요 · 여기 있어요"],["언제 가장 강하게 느껴요?","부드럽게 궁금해요"],["혼자가 아닌 상태는 어떤 모습일 것 같아요?","같이 상상해봐요"]], suggestion: "외로움이 많이 찾아왔네요. 이름을 붙이는 것만으로도 조금 가벼워질 수 있어요." },
  '무감각해': { count: 63, questions:  [["무감각함은 더 깊은 게 있을 때 오기도 해요. 언제부터였어요?","부드럽게 · 서두르지 않아도 돼요"],["밀어내고 있는 감정이 있어요?","조심스럽게 · 여기 있어요"],["예전엔 살아있었는데 지금은 평평한 게 뭐예요?","궁금해요 · 천천히 볼게요"],["다시 뭔가를 느끼려면 뭐가 필요할 것 같아요?","함께예요 · 가까이 있을게요"]], suggestion: "무감각함은 너무 많이 느낀 뒤 찾아오는 보호예요. 억지로 빠져나오려 하지 않아도 돼요." },
  '지쳐':     { count: 187, questions: [["지침에도 여러 종류가 있죠. 어떤 종류의 지침이에요?","따뜻하게 · 여기서 쉬어요"],["몸이 지친 건지, 마음이 지친 건지, 둘 다인지요?","궁금해요 · 부드럽게"],["요즘 가장 에너지를 빼앗아 가는 게 뭐예요?","뿌리를 찾아가요"],["진짜 쉬는 게 어떤 모습일 것 같아요?","같이 상상해봐요"]], suggestion: "많이 소진됐네요. 쉰다는 건 잠만이 아니에요 — 뭔가를 내려놓는 것이기도 해요." },
  '상처받았어':{ count: 89, questions: [["상처받은 게 느껴져요. 무슨 일이에요?","조심스럽게 · 듣고 있어요"],["어떤 사람과 있었던 일이에요?","서두르지 않아도 돼요"],["예상했던 건지, 갑자기 온 건지요?","함께예요 · 부드럽게"],["조금 더 안전하게 느끼려면 뭐가 필요해요?","궁금해요 · 여기 있어요"]], suggestion: "상처가 있었네요. 일어난 일에 이름을 붙이는 것이 혼자 안고 있지 않는 첫 걸음이에요." },
};

const QUICK_CARDS = [
  { key: 'relationship', text: '가까운 사람과 무슨 일이 있었어', emo: '상처받았어' },
  { key: 'work',         text: '해야 할 일이 자꾸 마음에 걸려', emo: '불안해' },
  { key: 'self',         text: '딱히 뭐라고 할 수 없는데 뭔가 이상해', emo: '무감각해' },
  { key: 'body',         text: '몸이 무겁고 피곤하고 어딘가 조여', emo: '지쳐' },
];

/* ── Zone 레이어 구조 (나의 레이어 탭) ── */
const LAYER_GROUPS = [
  { id: 'social', label: '사회적인 나', sub: '직장, 처음 만남, SNS, 공식적인 자리',
    items: [
      { id: 'social_work',    label: '직장 / 학교에서의 나', sensitive: false },
      { id: 'social_stranger',label: '처음 만나는 사람 앞',  sensitive: false },
      { id: 'social_sns',     label: 'SNS에서의 나',         sensitive: false },
      { id: 'social_formal',  label: '공식적인 자리에서',    sensitive: false },
    ],
  },
  { id: 'daily', label: '일반적인 나', sub: '가족, 친한 친구, 연인, 혼자',
    items: [
      { id: 'daily_family',  label: '가족 안에서의 나',      sensitive: false },
      { id: 'daily_friend',  label: '친한 친구 앞에서',      sensitive: false },
      { id: 'daily_partner', label: '연인 / 파트너 앞에서',  sensitive: true  },
      { id: 'daily_alone',   label: '혼자 있을 때의 나',     sensitive: false },
    ],
  },
  { id: 'secret', label: '비밀스러운 나', sub: '감정적 비밀, 관계적 비밀, 욕망, 수치심, 야망',
    items: [
      { id: 'secret_emotion',  label: '감정적 비밀',      sensitive: true,  locked: false },
      { id: 'secret_relation', label: '관계적 비밀',      sensitive: true,  locked: false },
      { id: 'secret_desire',   label: '욕망 / 성적 영역', sensitive: true,  locked: true  },
      { id: 'secret_shame',    label: '수치심 영역',      sensitive: true,  locked: true  },
      { id: 'secret_ambition', label: '야망 / 욕심 영역', sensitive: false, locked: false },
    ],
  },
];

/* ── 시간대 인사 ── */
function getTimeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)  return { title: '좋은 아침이에요.', placeholder: '지금 어떤 마음이에요?' };
  if (h >= 9 && h < 12) return { title: '오전이네요.',       placeholder: '지금 어떤 마음이에요?' };
  if (h >= 12 && h < 14)return { title: '점심 즈음이에요.',   placeholder: '지금 기분이 어떤가요?' };
  if (h >= 14 && h < 18)return { title: '오후예요.',          placeholder: '지금 무슨 생각하고 있어요?' };
  if (h >= 18 && h < 21)return { title: '저녁이에요.',         placeholder: '오늘 하루 어떠셨어요?' };
  if (h >= 21 && h < 24)return { title: '밤이 깊었네요.',      placeholder: '지금 어떤 마음이에요?' };
  return { title: '한밤중이에요.', placeholder: '지금 무슨 생각을 하고 있어요?' };
}

/* ── Amber 대화 시트 ── */
const SHEET_AI_MSG_STYLE = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '11px 11px 11px 3px', padding: '10px 13px' } as const;
const SHEET_USER_MSG_STYLE = { background: alpha(C.amber, 0.05), border: `1px solid ${alpha(C.amber, 0.13)}`, borderRadius: '11px 11px 3px 11px', padding: '9px 13px' } as const;

function AmberSheet({
  open, onClose, aiName,
}: { open: boolean; onClose: () => void; aiName: string }) {
  const [msgs, setMsgs] = useState<{ role: 'ai' | 'user'; text: string; tone?: string }[]>([
    { role: 'ai', text: '지금 어떤 감정인지 꺼내놔도 괜찮아요. 여기 있어요.', tone: '여기 있어요' },
  ]);
  const [val, setVal] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const send = () => {
    if (!val.trim()) return;
    const txt = val.trim();
    setMsgs(m => [...m, { role: 'user', text: txt }]);
    setVal('');
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'ai', text: '그 감정, 언제부터 있었던 것 같아요?', tone: '같이 파고들어요' }]);
    }, 700);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  return (
    <>
      <div onClick={onClose} className="absolute inset-0 z-30 rounded-[40px] transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,.5)', opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }} />
      <div className="absolute bottom-0 left-0 right-0 z-31 flex flex-col"
        style={{ background: C.bg, borderRadius: '20px 20px 40px 40px', border: `1px solid ${C.border}`, borderBottom: 'none', maxHeight: '78%', transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .35s cubic-bezier(.4,0,.2,1)', zIndex: 31 }}>
        <div className="w-8 h-[3px] rounded-full mx-auto mt-2.5" style={{ background: C.border }} />
        <div className="flex items-center gap-[9px] px-5 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border2}` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: alpha(C.amber, 0.08), border: `1px solid ${alpha(C.amber, 0.2)}` }}>
            <div className="w-[17px] h-[17px] rounded-full" style={{ background: C.amber }} />
          </div>
          <span className="flex-1 text-[15px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{aiName}</span>
          <button aria-label="닫기" onClick={onClose} className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px]" style={{ border: `1px solid ${C.border}`, color: C.text4 }}>✕</button>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0" style={{ padding: '12px 18px', scrollbarWidth: 'none' }}>
          {msgs.map((m, i) => m.role === 'ai' ? (
            <div key={i} className="vr-fade-in flex-shrink-0" style={SHEET_AI_MSG_STYLE}>
              <p className="text-[15px] font-light leading-[1.55]" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{m.text}</p>
              {m.tone && <p className="text-[9px] font-light mt-[2px]" style={{ color: alpha(C.amber, 0.47) }}>{m.tone}</p>}
            </div>
          ) : (
            <div key={i} className="vr-fade-in self-end max-w-[85%] flex-shrink-0" style={SHEET_USER_MSG_STYLE}>
              <p className="text-[12px] font-light leading-[1.6]" style={{ color: C.text2 }}>{m.text}</p>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 flex items-center gap-[7px]" style={{ padding: '8px 14px 14px', borderTop: `1px solid ${C.border2}` }}>
          <input aria-label="메시지 입력" className="flex-1 text-[12px] font-light rounded-full outline-none"
            style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '7px 13px', color: C.text2, fontFamily: "'DM Sans', sans-serif" }}
            placeholder={`${aiName}에게 말해요...`} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button aria-label="전송" onClick={send} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.amber, border: 'none' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 11V1M1 6l5-5 5 5" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 메인 컴포넌트 ── */
export default function VentPage() {
  const { user, axisScores, primaryMask } = useAuth();
  const qc = useQueryClient();
  const [section, setSection] = useState<'vent' | 'layer' | 'community'>('vent');
  const [phase, setPhase] = useState<'select' | 'chat'>('select');
  const [curEmo, setCurEmo] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'ai' | 'user'; text: string; tone?: string }[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [msgVal, setMsgVal] = useState('');
  const [crisisLevel, setCrisisLevel] = useState<'high' | 'critical' | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [amberOpen, setAmberOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [layerActive, setLayerActive] = useState('');

  // AI 설정 로드
  const aiSettingsRef = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    if (!user) return;
    veilrumDb.from('user_profiles').select('ai_settings').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.ai_settings) aiSettingsRef.current = data.ai_settings; });
  }, [user]);
  const sessionSavedRef = useRef(false);
  const timerRefs = useRef<number[]>([]);
  const greeting = getTimeGreeting();
  const aiName = '엠버';
  const amberFlash = useAmberAttention();

  const COMM_GROUPS = [
    { title: '사람들 속에서 혼자인 사람들', count: 98, desc: '함께 있어도 연결이 안 되는 느낌' },
    { title: '지금 이유없이 불안한 사람들', count: 142, desc: '뚜렷한 이유 없이 올라오는 불안 패턴' },
    { title: '잘 지내야 한다고 느끼는 사람들', count: 67, desc: '감정을 숨기고 버티는 패턴' },
  ];

  /* ── 세션 연속성: 마지막 미완료 세션 로드 ── */
  const { data: lastSession } = useQuery({
    queryKey: ['last-vent-session', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('dive_sessions')
        .select('id, emotion, messages, turn_count, created_at')
        .eq('user_id', user!.id).eq('mode', 'F').eq('session_completed', false)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user, staleTime: 1000 * 60,
  });

  const { data: recentEmotions } = useQuery({
    queryKey: ['recent-emotions', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb.from('dive_sessions')
        .select('emotion, created_at')
        .eq('user_id', user!.id).eq('mode', 'F').eq('session_completed', true)
        .order('created_at', { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  function resumeSession(session: NonNullable<typeof lastSession>) {
    setCurEmo(session.emotion);
    setMsgs(session.messages || []);
    setMsgCount(session.turn_count || 0);
    setPhase('chat');
  }

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && phase === 'chat' && msgCount > 0 && msgCount < 4 && !sessionSavedRef.current) {
        saveVentPartialSession(user.id, curEmo, msgs, msgCount);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 타이머 정리
      timerRefs.current.forEach(t => window.clearTimeout(t));
      timerRefs.current = [];
      if (user && phase === 'chat' && msgCount > 0 && msgCount < 4 && !sessionSavedRef.current) {
        saveVentPartialSession(user.id, curEmo, msgs, msgCount);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, phase, curEmo, msgs, msgCount]);

  function pickEmotion(emo: string) {
    setCurEmo(emo);
    sessionSavedRef.current = false;
    const data = EMO_DATA[emo];
    timerRefs.current.push(window.setTimeout(() => {
      setPhase('chat');
      setMsgs([
        { role: 'ai', text: '저는 엠버예요. AI 감정 수용 파트너이고, 전문 상담사는 아니에요. 판단 없이 들을게요.', tone: '함께예요' },
        { role: 'ai', text: data.questions[0][0], tone: data.questions[0][1] },
      ]);
      setMsgCount(0); setQIdx(0); setShowSummary(false);
    }, 300));
  }

  function finishSession() {
    if (!user || !curEmo || sessionSavedRef.current) return;
    const data = EMO_DATA[curEmo];
    sessionSavedRef.current = true;
    saveVentSummary(user.id, curEmo, data.suggestion);
    saveVentSessionSummary(user.id, curEmo, msgs, data.suggestion, msgCount);
    setShowSummary(true);
    // Me탭 + 히스토리 캐시 갱신
    qc.invalidateQueries({ queryKey: ['me-stats'] });
    qc.invalidateQueries({ queryKey: ['me-radar'] });
    qc.invalidateQueries({ queryKey: ['recent-emotions'] });
    qc.invalidateQueries({ queryKey: ['last-vent-session'] });
  }

  async function sendMsg() {
    if (!msgVal.trim() || !curEmo || aiThinking) return;
    const txt = msgVal.trim();
    setMsgVal('');
    const newCount = msgCount + 1;
    const data = EMO_DATA[curEmo];
    const nextQIdx = Math.min(qIdx + 1, data.questions.length - 1);
    setMsgs(m => [...m, { role: 'user', text: txt }]);
    setMsgCount(newCount); setQIdx(nextQIdx);

    // 위기 감지 3중 방어: 클라이언트 즉시 → RPC → AI 필터
    const clientCrisis = detectCrisisLevel(txt);
    if (clientCrisis === 'critical' || clientCrisis === 'high') {
      setCrisisLevel(clientCrisis);
    }

    if (user) {
      saveVentMessage(user.id, curEmo, txt, newCount).then(({ crisisSeverity }) => {
        if (crisisSeverity === 'critical' || crisisSeverity === 'high') setCrisisLevel(crisisSeverity);
      });
      supabase.functions.invoke('dm-message-filter', {
        body: { message: txt, userId: user.id },
      }).then(({ data: filterData }) => {
        if (filterData?.verdict === 'CRISIS' && !crisisLevel) setCrisisLevel('critical');
      }).catch(() => {});
    }

    setAiThinking(true);
    let aiText = data.questions[nextQIdx][0];
    let aiTone = data.questions[nextQIdx][1];

    try {
      const { data: aiData, error } = await supabase.functions.invoke('held-chat', {
        body: { emotion: curEmo, text: txt, userId: user?.id, axisScores: axisScores ?? null, mask: primaryMask ?? null, history: msgs.slice(-6), aiSettings: aiSettingsRef.current ?? null, tab: 'vent' },
      });
      if (!error && aiData?.response) { aiText = aiData.response; aiTone = '엠버가 듣고 있어요'; }
    } catch {
      toast({ title: 'AI 응답을 받지 못했어요', description: '기본 응답으로 대체합니다.', variant: 'destructive' });
    }

    setAiThinking(false);
    setMsgs(m => [...m, { role: 'ai', text: aiText, tone: aiTone }]);

    if (newCount >= 4 && newCount % 4 === 0 && !sessionSavedRef.current) {
      timerRefs.current.push(window.setTimeout(() => {
        setMsgs(m => [...m, { role: 'ai', text: `${newCount}번의 이야기를 나눴어요. 더 이야기하고 싶으면 계속해도 돼요. 마무리하고 싶으면 아래 버튼을 눌러주세요.`, tone: '당신의 속도로' }]);
      }, 500));
    }
  }

  return (
    <div className="flex flex-col" style={{ background: C.bg, minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      {crisisLevel && <CrisisBanner severity={crisisLevel} onDismiss={() => setCrisisLevel(null)} />}

      {/* 글로벌 헤더 */}
      <div className="flex-shrink-0 flex items-center gap-[10px] px-5 py-2" style={{ borderBottom: `1px solid ${C.border2}` }}>
        <div className="flex flex-col gap-[2px] flex-shrink-0">
          <span className="text-[22px] leading-none tracking-[.01em]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.text }}>VENT</span>
          <span className="text-[10px] font-light tracking-[.02em]" style={{ color: C.text4 }}>지금 다 쏟아내도 돼요</span>
        </div>
        <div className="flex-1" />
        <AmberBtn onClick={() => setAmberOpen(true)} flash={amberFlash} />
      </div>

      {/* 섹션 탭 */}
      <div className="flex-shrink-0 flex px-[22px]" style={{ borderBottom: `1px solid ${C.border2}` }}>
        {(['vent', 'layer', 'community'] as const).map((s, i) => {
          const labels = ['지금 기분', '나의 레이어', '커뮤니티'];
          const active = section === s;
          return (
            <button key={s} onClick={() => setSection(s)}
              className="text-[11px] font-light py-[9px] mr-[18px] border-none bg-transparent cursor-pointer transition-colors"
              style={{ color: active ? C.amber : C.text4, fontWeight: active ? 400 : 300, borderBottom: active ? `2px solid ${C.amber}` : '2px solid transparent', fontFamily: "'DM Sans', sans-serif" }}>
              {labels[i]}
            </button>
          );
        })}
      </div>

      {/* VENT 섹션 */}
      {section === 'vent' && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0" style={{ position: 'relative' }}>
          {phase === 'select' ? (
            <EmotionSelector
              greeting={greeting} curEmo={curEmo}
              lastSession={lastSession ? { emotion: lastSession.emotion, turn_count: lastSession.turn_count } : null}
              recentEmotions={recentEmotions ?? null}
              emotions={EMOTIONS} quickCards={QUICK_CARDS}
              onPickEmotion={pickEmotion}
              onResumeSession={() => lastSession && resumeSession(lastSession)}
            />
          ) : (
            <ChatView
              curEmo={curEmo} msgs={msgs} msgCount={msgCount} msgVal={msgVal}
              aiThinking={aiThinking} showSummary={showSummary}
              sessionSaved={sessionSavedRef.current}
              emoData={EMO_DATA[curEmo]} greeting={greeting}
              onMsgValChange={setMsgVal} onSendMsg={sendMsg}
              onFinishSession={finishSession}
              onContinueChat={() => { setShowSummary(false); setMsgs(m => [...m, { role: 'ai', text: '물론이죠. 또 어떤 게 마음에 있어요?', tone: '여기 있어요 · 천천히' }]); }}
            />
          )}
        </div>
      )}

      {/* 나의 레이어 / 커뮤니티 */}
      {(section === 'layer' || section === 'community') && (
        <VentLayerView
          section={section} layerGroups={LAYER_GROUPS} commGroups={COMM_GROUPS}
          expandedGroups={expandedGroups} layerActive={layerActive}
          onToggleGroup={(id) => setExpandedGroups(g => ({ ...g, [id]: !g[id] }))}
          onSetLayerActive={setLayerActive}
        />
      )}

      <AmberSheet open={amberOpen} onClose={() => setAmberOpen(false)} aiName={aiName} />
    </div>
  );
}
