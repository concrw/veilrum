// Vent — 지금 다 쏟아내도 돼요
// 감정 선택 → AI 대화 → 레이어 신호 수집 → 감정 요약 카드
// Amber 단독 (Frost 없음)

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AmberBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';

/* ── 색상 팔레트 ── */
const C = {
  bg: '#1C1917', bg2: '#292524', bg3: '#242120',
  border: '#3C3835', border2: '#2A2624',
  text: '#E7E5E4', text2: '#A8A29E', text3: '#78716C', text4: '#57534E', text5: '#3C3835',
  amber: '#D4A574', amberDim: '#A07850',
};

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

/* ── 이모지 SVG (간단 버전) ── */
function EmoIcon({ label, active }: { label: string; active: boolean }) {
  const stroke = active ? C.amber : C.text3;
  const icons: Record<string, JSX.Element> = {
    '불안해':    <><circle cx="12" cy="12" r="10"/><path d="M8 15s1-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M8.5 8.5c.5-1 1.5-1.5 2.5-1.5"/><path d="M15.5 8.5c-.5-1-1.5-1.5-2.5-1.5"/></>,
    '슬퍼':     <><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
    '화가 나':  <><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M8.5 8.5l2 1.5"/><path d="M15.5 8.5l-2 1.5"/></>,
    '혼란스러워':<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    '외로워':   <><circle cx="12" cy="12" r="10"/><path d="M8 15h.01M12 15h.01M16 15h.01"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
    '무감각해': <><circle cx="12" cy="12" r="10"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
    '지쳐':     <><circle cx="12" cy="12" r="10"/><path d="M8 13s1 2 4 2 4-2 4-2"/><path d="M8 9l2 1"/><path d="M16 9l-2 1"/></>,
    '상처받았어':<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="12" y1="10" x2="12" y2="14"/></>,
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {icons[label]}
    </svg>
  );
}

/* ── Amber 대화 시트 ── */
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
      setMsgs(m => [...m, {
        role: 'ai',
        text: '그 감정, 언제부터 있었던 것 같아요?',
        tone: '같이 파고들어요',
      }]);
    }, 700);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 z-30 rounded-[40px] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-31 flex flex-col"
        style={{
          background: C.bg,
          borderRadius: '20px 20px 40px 40px',
          border: `1px solid #44403C`,
          borderBottom: 'none',
          maxHeight: '78%',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
          zIndex: 31,
        }}
      >
        <div className="w-8 h-[3px] rounded-full mx-auto mt-2.5" style={{ background: C.border }} />
        {/* 헤더 */}
        <div className="flex items-center gap-[9px] px-5 py-2.5 flex-shrink-0" style={{ borderBottom: `1px solid ${C.border2}` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#D4A57415', border: '1px solid #D4A57433' }}>
            <div className="w-[17px] h-[17px] rounded-full" style={{ background: C.amber }} />
          </div>
          <span className="flex-1 text-[15px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{aiName}</span>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[13px]" style={{ border: `1px solid ${C.border}`, color: C.text4 }}>✕</button>
        </div>
        {/* 채팅 */}
        <div ref={chatRef} className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0" style={{ padding: '12px 18px', scrollbarWidth: 'none' }}>
          {msgs.map((m, i) => m.role === 'ai' ? (
            <div key={i} className="vr-fade-in flex-shrink-0" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '11px 11px 11px 3px', padding: '10px 13px' }}>
              <p className="text-[15px] font-light leading-[1.55]" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{m.text}</p>
              {m.tone && <p className="text-[9px] font-light mt-[2px]" style={{ color: '#D4A57477' }}>{m.tone}</p>}
            </div>
          ) : (
            <div key={i} className="vr-fade-in self-end max-w-[85%] flex-shrink-0" style={{ background: '#D4A5740D', border: '1px solid #D4A57422', borderRadius: '11px 11px 3px 11px', padding: '9px 13px' }}>
              <p className="text-[12px] font-light leading-[1.6]" style={{ color: C.text2 }}>{m.text}</p>
            </div>
          ))}
        </div>
        {/* 입력 */}
        <div className="flex-shrink-0 flex items-center gap-[7px]" style={{ padding: '8px 14px 14px', borderTop: `1px solid ${C.border2}` }}>
          <input
            className="flex-1 text-[12px] font-light rounded-full outline-none"
            style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '7px 13px', color: C.text2, fontFamily: "'DM Sans', sans-serif" }}
            placeholder={`${aiName}에게 말해요...`}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.amber, border: 'none' }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 11V1M1 6l5-5 5 5" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 메인 컴포넌트 ── */
export default function VentPage() {
  const { user } = useAuth();
  const [section, setSection] = useState<'vent' | 'layer' | 'community'>('vent');
  const [phase, setPhase] = useState<'select' | 'chat'>('select');
  const [curEmo, setCurEmo] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'ai' | 'user'; text: string; tone?: string }[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [msgVal, setMsgVal] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [amberOpen, setAmberOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [layerActive, setLayerActive] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const greeting = getTimeGreeting();

  // AI 이름 — 추후 user_profiles.ai_companion_name 에서 로드
  const aiName = '엠버';
  const amberFlash = useAmberAttention();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, showSummary]);

  function pickEmotion(emo: string) {
    setCurEmo(emo);
    const data = EMO_DATA[emo];
    setTimeout(() => {
      setPhase('chat');
      setMsgs([{ role: 'ai', text: data.questions[0][0], tone: data.questions[0][1] }]);
      setMsgCount(0);
      setQIdx(0);
      setShowSummary(false);
    }, 300);
  }

  function sendMsg() {
    if (!msgVal.trim() || !curEmo) return;
    const txt = msgVal.trim();
    setMsgVal('');
    const newCount = msgCount + 1;
    const data = EMO_DATA[curEmo];
    const nextQIdx = Math.min(qIdx + 1, data.questions.length - 1);
    setMsgs(m => [...m, { role: 'user', text: txt }]);
    setMsgCount(newCount);
    setQIdx(nextQIdx);
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'ai', text: data.questions[nextQIdx][0], tone: data.questions[nextQIdx][1] }]);
      if (newCount >= 4) {
        setTimeout(() => setShowSummary(true), 400);
      }
    }, 700);
  }

  function toggleGroup(id: string) {
    setExpandedGroups(g => ({ ...g, [id]: !g[id] }));
  }

  const COMM_GROUPS = [
    { title: '사람들 속에서 혼자인 사람들', count: 98, desc: '함께 있어도 연결이 안 되는 느낌' },
    { title: '지금 이유없이 불안한 사람들', count: 142, desc: '뚜렷한 이유 없이 올라오는 불안 패턴' },
    { title: '잘 지내야 한다고 느끼는 사람들', count: 67, desc: '감정을 숨기고 버티는 패턴' },
  ];

  return (
    <div className="flex flex-col" style={{ background: C.bg, minHeight: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── 글로벌 헤더 ── */}
      <div className="flex-shrink-0 flex items-center gap-[10px] px-5 py-2" style={{ borderBottom: `1px solid ${C.border2}` }}>
        <div className="flex flex-col gap-[2px] flex-shrink-0">
          <span className="text-[22px] leading-none tracking-[.01em]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: C.text }}>VENT</span>
          <span className="text-[10px] font-light tracking-[.02em]" style={{ color: C.text4 }}>지금 다 쏟아내도 돼요</span>
        </div>
        <div className="flex-1" />
        {/* Amber 아바타 버튼 */}
        <AmberBtn onClick={() => setAmberOpen(true)} flash={amberFlash} />
      </div>

      {/* ── 섹션 탭 ── */}
      <div className="flex-shrink-0 flex px-[22px]" style={{ borderBottom: `1px solid ${C.border2}` }}>
        {(['vent', 'layer', 'community'] as const).map((s, i) => {
          const labels = ['지금 기분', '나의 레이어', '커뮤니티'];
          const active = section === s;
          return (
            <button key={s} onClick={() => setSection(s)}
              className="text-[11px] font-light py-[9px] mr-[18px] border-none bg-transparent cursor-pointer transition-colors"
              style={{
                color: active ? C.amber : C.text4,
                fontWeight: active ? 400 : 300,
                borderBottom: active ? `2px solid ${C.amber}` : '2px solid transparent',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {labels[i]}
            </button>
          );
        })}
      </div>

      {/* ── VENT 섹션 ── */}
      {section === 'vent' && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0" style={{ position: 'relative' }}>
          {phase === 'select' ? (
            <div className="flex flex-col overflow-y-auto flex-1" style={{ padding: '18px 22px 12px', scrollbarWidth: 'none' }}>
              <h2 className="text-[26px] font-light leading-[1.2] mb-1 flex-shrink-0" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: C.text }}>{greeting.title}</h2>
              <p className="text-[11px] font-light mb-3 flex-shrink-0" style={{ color: C.text4 }}>지금 기분이 어때요?</p>

              {/* 감정 그리드 */}
              <div className="grid grid-cols-4 gap-2 flex-shrink-0 mb-3">
                {EMOTIONS.map(({ label }) => {
                  const active = curEmo === label;
                  return (
                    <button key={label} onClick={() => pickEmotion(label)}
                      className="flex flex-col items-center gap-[5px] rounded-[10px] cursor-pointer transition-all"
                      style={{
                        padding: '10px 6px',
                        background: active ? '#D4A5740F' : C.bg2,
                        border: `1px solid ${active ? '#D4A57466' : C.border}`,
                      }}>
                      <EmoIcon label={label} active={active} />
                      <span className="text-[10px] font-light text-center leading-[1.3] break-keep transition-colors"
                        style={{ color: active ? C.amber : C.text3 }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 일상 질문 카드 */}
              <div className="flex flex-col gap-[7px] flex-shrink-0">
                <p className="text-[10px] font-light mb-[2px]" style={{ color: C.text5, letterSpacing: '.08em', textTransform: 'uppercase' }}>아니면 이런 건 어때요?</p>
                {QUICK_CARDS.map(({ key, text, emo }) => (
                  <button key={key} onClick={() => pickEmotion(emo)}
                    className="rounded-[10px] flex items-center justify-between gap-2 cursor-pointer transition-all text-left"
                    style={{ padding: '11px 14px', background: C.bg2, border: `1px solid ${C.border}` }}>
                    <span className="text-[14px] font-light leading-[1.5] flex-1 break-keep" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text3 }}>{text}</span>
                    <span className="text-[12px] flex-shrink-0" style={{ color: C.text5 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 대화 화면 */
            <div className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-shrink-0 px-[22px] pt-3 pb-1">
                <h3 className="text-[26px] font-light" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: C.text }}>{curEmo}</h3>
                {/* 커뮤니티 배너 */}
                {curEmo && EMO_DATA[curEmo] && (
                  <div className="flex items-center gap-[9px] rounded-[10px] mt-2" style={{ padding: '10px 13px', background: C.bg2, border: `1px solid ${C.border}` }}>
                    <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: C.amber, animation: 'ai-pulse 2.5s ease-in-out infinite' }} />
                    <span className="text-[14px] font-light flex-1 break-keep" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text2 }}>
                      지금 비슷한 감정인 친구들이 {curEmo.toLowerCase()} 명 있어
                    </span>
                    <span className="text-[16px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.amber }}>{EMO_DATA[curEmo].count}</span>
                  </div>
                )}
              </div>

              <div ref={chatRef} className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0" style={{ padding: '8px 22px', scrollbarWidth: 'none' }}>
                {msgs.map((m, i) => m.role === 'ai' ? (
                  <div key={i} className="vr-fade-in flex-shrink-0" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: '12px 12px 12px 3px', padding: '12px 14px' }}>
                    <p className="text-[16px] font-light leading-[1.6] break-keep" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{m.text}</p>
                    {m.tone && <p className="text-[10px] font-light mt-[3px]" style={{ color: '#D4A57466' }}>{m.tone}</p>}
                  </div>
                ) : (
                  <div key={i} className="vr-fade-in self-end max-w-[84%] flex-shrink-0" style={{ background: '#D4A5740D', border: '1px solid #D4A57422', borderRadius: '12px 12px 3px 12px', padding: '10px 14px' }}>
                    <p className="text-[13px] font-light leading-[1.6] break-keep" style={{ color: C.text2 }}>{m.text}</p>
                  </div>
                ))}

                {/* 감정 요약 카드 */}
                {showSummary && curEmo && (
                  <div className="vr-fade-in flex-shrink-0 rounded-[11px] mt-2" style={{ background: C.bg2, border: `1px solid #D4A57422`, padding: '14px 15px' }}>
                    <p className="text-[10px] font-semibold tracking-[.08em] uppercase mb-[6px]" style={{ color: C.amber }}>지금 감정</p>
                    <div className="flex gap-[6px] flex-wrap mb-[10px]">
                      <span className="text-[11px] font-light px-[10px] py-[3px] rounded-full" style={{ border: `1px solid #D4A57433`, color: C.amber, background: '#D4A5740A' }}>{curEmo}</span>
                    </div>
                    <p className="text-[14px] font-light leading-[1.65] mb-[10px] break-keep" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text2 }}>{EMO_DATA[curEmo].suggestion}</p>
                    <div className="flex gap-[7px]">
                      <button onClick={() => { setShowSummary(false); setMsgs(m => [...m, { role: 'ai', text: '물론이죠. 또 어떤 게 마음에 있어요?', tone: '여기 있어요 · 천천히' }]); }}
                        className="flex-1 py-[9px] rounded-[9px] text-[11px] font-light cursor-pointer transition-all"
                        style={{ border: `1px solid #D4A57444`, background: '#D4A5740A', color: C.amber }}>
                        더 이야기할게요
                      </button>
                      <button onClick={() => {}}
                        className="flex-1 py-[9px] rounded-[9px] text-[11px] font-light cursor-pointer transition-all"
                        style={{ border: `1px solid ${C.border}`, background: 'transparent', color: C.text4 }}>
                        이걸 해볼게요 →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 입력창 */}
              {!showSummary && (
                <div className="flex-shrink-0 flex items-center gap-2" style={{ padding: '8px 16px 14px', borderTop: `1px solid ${C.border2}` }}>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${C.border}`, background: 'transparent' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5" y="1" width="6" height="9" rx="3" stroke="#78716C" strokeWidth="1.2"/><path d="M2 7.5C2 10.538 4.686 13 8 13s6-2.462 6-5.5" stroke="#78716C" strokeWidth="1.2" strokeLinecap="round" fill="none"/><line x1="8" y1="13" x2="8" y2="15" stroke="#78716C" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                  <input
                    className="flex-1 rounded-full text-[12px] font-light outline-none"
                    style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '8px 14px', color: C.text2, fontFamily: "'DM Sans', sans-serif" }}
                    placeholder={greeting.placeholder}
                    value={msgVal}
                    onChange={e => setMsgVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  />
                  <button onClick={sendMsg} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-[.92]" style={{ background: C.amber, border: 'none' }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 11V1M1 6l5-5 5 5" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 나의 레이어 ── */}
      {section === 'layer' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0" style={{ padding: '14px 22px', scrollbarWidth: 'none' }}>
          <p className="text-[11px] font-light mb-1 flex-shrink-0" style={{ color: C.text4 }}>어떤 상황에서의 나를 살펴볼까요?</p>

          {layerActive ? (
            /* 레이어 질문 영역 */
            <div className="flex flex-col gap-[7px]">
              <button onClick={() => setLayerActive('')} className="text-[11px] font-light text-left mb-1" style={{ color: C.text4, background: 'none', border: 'none', cursor: 'pointer' }}>← 돌아가기</button>
              <div className="inline-flex items-center px-[10px] py-[3px] rounded-full mb-2" style={{ border: `1px solid #D4A57433`, color: C.amber, background: '#D4A5740A', fontSize: 10, letterSpacing: '.07em', textTransform: 'uppercase' }}>레이어</div>
              <p className="text-[14px] font-light break-keep" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text2 }}>이 상황에서의 나는 어떤가요? 자유롭게 털어놔요.</p>
              <div className="rounded-[11px] mt-2" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
                <textarea className="w-full bg-transparent border-none outline-none resize-none text-[15px] font-light leading-[1.6] break-keep p-4"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text, minHeight: 100 }}
                  placeholder="떠오르는 것을 써요..." />
              </div>
            </div>
          ) : (
            LAYER_GROUPS.map(group => (
              <div key={group.id} className="flex flex-col gap-[5px] flex-shrink-0">
                <button onClick={() => toggleGroup(group.id)}
                  className="rounded-[11px] flex items-center justify-between gap-2 text-left cursor-pointer transition-all"
                  style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '13px 15px' }}>
                  <div>
                    <p className="text-[17px] font-light mb-[2px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{group.label}</p>
                    <p className="text-[10px] font-light" style={{ color: C.text4 }}>{group.sub}</p>
                  </div>
                  <span className="text-[11px] flex-shrink-0 transition-transform" style={{ color: C.text5, transform: expandedGroups[group.id] ? 'rotate(90deg)' : 'none' }}>›</span>
                </button>

                {expandedGroups[group.id] && (
                  <div className="flex flex-col gap-[5px] pl-2">
                    {group.items.map(item => (
                      <button key={item.id} onClick={() => !item.locked && setLayerActive(item.id)}
                        className="rounded-[9px] flex items-center justify-between gap-2 text-left"
                        style={{
                          background: C.bg,
                          border: `1px solid ${C.border}`,
                          padding: '10px 13px',
                          cursor: item.locked ? 'default' : 'pointer',
                          opacity: item.locked ? 0.5 : 1,
                        }}>
                        <span className="text-[15px] font-light" style={{ fontFamily: "'Cormorant Garamond', serif", color: item.locked ? C.text4 : C.text2 }}>{item.label}</span>
                        {item.locked ? (
                          <span className="text-[9px] px-2 py-[2px] rounded-full flex-shrink-0" style={{ border: `1px solid ${C.border}`, color: C.text5 }}>🔒 잠김</span>
                        ) : item.sensitive ? (
                          <span className="text-[9px] px-2 py-[2px] rounded-full flex-shrink-0" style={{ border: '1px solid #A0785033', color: '#A07850', background: '#A078500A' }}>민감</span>
                        ) : (
                          <span className="text-[9px] px-2 py-[2px] rounded-full flex-shrink-0" style={{ border: `1px solid ${C.border}`, color: C.text4 }}>일반</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── 커뮤니티 ── */}
      {section === 'community' && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0" style={{ padding: '14px 22px', scrollbarWidth: 'none' }}>
          <p className="text-[10px] font-light mb-2 flex-shrink-0" style={{ color: C.text5 }}>지금 비슷한 감정인 사람들이에요.</p>
          {COMM_GROUPS.map((g, i) => (
            <div key={i} className="rounded-[11px] flex-shrink-0" style={{ background: i === 0 ? '#D4A57408' : C.bg2, border: `1px solid ${i === 0 ? '#D4A57433' : C.border}`, padding: '12px 14px' }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[15px] font-light break-keep" style={{ fontFamily: "'Cormorant Garamond', serif", color: C.text }}>{g.title}</span>
                <span className="text-[10px] flex-shrink-0" style={{ color: C.text4 }}>{g.count}명</span>
              </div>
              <p className="text-[11px] font-light" style={{ color: C.text3 }}>{g.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Amber 대화 시트 ── */}
      <AmberSheet open={amberOpen} onClose={() => setAmberOpen(false)} aiName={aiName} />
    </div>
  );
}
