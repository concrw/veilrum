import { useState, useCallback, useEffect } from 'react';
import { AmberBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/context/UserProfileContext';

const AC = '#A07850';

const Q_POOL = {
  repeat: [
    { label: '반복', text: '이 감정이 처음 느껴진 게 언제였어요?', keys: ['처음', '언제', '시작', '예전'] },
    { label: '반복', text: '비슷한 상황이 또 있었나요?', keys: ['또', '반복', '비슷', '다시'] },
    { label: '반복', text: '이 감정이 가장 강하게 느껴지는 게 언제예요?', keys: ['강하', '언제', '강도', '심할'] },
    { label: '반복', text: '이런 일이 얼마나 자주 일어나요?', keys: ['자주', '빈도', '얼마나', '항상'] },
  ],
  relation: [
    { label: '관계', text: '이 감정과 연결된 사람이 있어요?', keys: ['사람', '관계', '누구', '그사람'] },
    { label: '관계', text: '그 사람에게 뭘 원했던 것 같아요?', keys: ['원했', '바랐', '필요', '해줬으면'] },
    { label: '관계', text: '비슷한 감정을 다른 관계에서도 느껴봤어요?', keys: ['다른', '또다른', '다른사람', '전에도'] },
    { label: '관계', text: '그 사람이 어떻게 해줬으면 했어요?', keys: ['어떻게', '해줬', '원했', '바랐'] },
  ],
  emotion: [
    { label: '감정', text: '그때 몸에서는 어떤 느낌이 있었어요?', keys: ['몸', '느낌', '신체', '가슴'] },
    { label: '감정', text: '이 감정에 이름을 붙인다면 뭐라고 할 것 같아요?', keys: ['이름', '뭐라고', '표현', '말하면'] },
    { label: '감정', text: '이 감정 아래에 다른 감정이 있을 것 같아요?', keys: ['아래', '숨은', '다른감정', '사실'] },
    { label: '감정', text: '이 감정이 올라올 때 하고 싶은 게 뭐예요?', keys: ['하고싶', '하고 싶', '원해', '하면'] },
  ],
  situation: [
    { label: '상황', text: '그 상황에서 어떻게 행동했어요?', keys: ['행동', '했어요', '어떻게', '했어'] },
    { label: '상황', text: '그때 주변에 누가 있었어요?', keys: ['주변', '누가', '있었', '혼자'] },
    { label: '상황', text: '그 상황이 달랐다면 어떻게 됐을 것 같아요?', keys: ['달랐', '다르게', '만약', '됐을'] },
    { label: '상황', text: '지금 그 상황을 돌아보면 어떤 생각이 들어요?', keys: ['돌아보', '지금', '생각', '보면'] },
  ],
  narrow: [
    { label: '핵심', text: '지금까지 얘기한 것 중 가장 마음에 걸리는 게 뭐예요?', keys: ['가장', '핵심', '마음에', '걸려'] },
    { label: '핵심', text: '이게 왜 이렇게 힘든 것 같아요?', keys: ['왜', '힘든', '이유', '어려운'] },
    { label: '핵심', text: '이 감정이 사라지면 어떤 기분일 것 같아요?', keys: ['사라지', '없어지', '해결', '나으면'] },
    { label: '핵심', text: '지금 가장 필요한 게 뭔지 알 것 같아요?', keys: ['필요', '원하는', '뭐가', '있으면'] },
  ],
  root: [
    { label: '뿌리', text: '이 패턴이 처음 생긴 게 언제인 것 같아요?', keys: ['처음', '언제', '시작', '어릴'] },
    { label: '뿌리', text: '어릴 때 비슷한 느낌을 받은 적 있어요?', keys: ['어릴', '어렸을', '예전', '유년'] },
    { label: '뿌리', text: '이 패턴이 어떤 경험에서 왔을 것 같아요?', keys: ['경험', '기억', '그때', '사건'] },
    { label: '뿌리', text: '그때 나는 어떤 선택을 했어요?', keys: ['선택', '결정', '했어', '그래서'] },
  ],
};

// Amber — 공감형 (Dig탭: 패턴 탐색, 뿌리 찾기 맥락)
const AMBER_REPLIES = [
  '그 감정, 언제부터 있었던 것 같아요?',
  '그때 가장 필요했던 게 뭐였을까요?',
  '이 패턴이 다른 관계에서도 나타나요?',
  '그 상황에서 나는 어떻게 행동했어요?',
  '지금 가장 마음에 걸리는 게 뭐예요?',
  '그 감정 아래에 또 다른 감정이 있을 것 같아요?',
  '어릴 때도 비슷한 느낌을 받은 적 있어요?',
  '이 패턴이 처음 생긴 게 언제인 것 같아요?',
  '그 사람에게 뭘 원했던 것 같아요?',
  '그 감정에 이름을 붙인다면 뭐라고 할 것 같아요?',
  '이 감정이 사라지면 어떤 기분일 것 같아요?',
  '비슷한 상황이 반복된다고 느껴요?',
  '그 상황에서 혼자 안고 있었던 게 뭐예요?',
  '그때 내가 달리 행동할 수 있었을까요?',
  '지금 이 패턴을 보면서 어떤 감정이 들어요?',
];

const COMM_GROUPS = [
  { pattern: 'avoidance', name: '회피형 — 연결을 원하지만 피하는 사람들', desc: '가까워지고 싶은데 먼저 다가가지 못해요', count: 187, entries: ['연락하고 싶은데 먼저 보내는 게 너무 어려워요.', '다가갔다가 거절당할까봐 기다려요.'] },
  { pattern: 'anxiety', name: '불안형 — 관계에서 불안을 느끼는 사람들', desc: '잘 되고 있어도 불안해지는 패턴이에요', count: 143, entries: ['잘 지내다가도 갑자기 버려질 것 같은 느낌이 와요.'] },
  { pattern: 'lonely', name: '고립형 — 함께 있어도 혼자인 느낌', desc: '사람들과 있어도 연결되지 못하는 느낌', count: 98, entries: ['사람 많은 곳에서도 혼자인 것 같아요.'] },
  { pattern: 'overfit', name: '과몰입형 — 관계에 너무 많이 쏟는 사람들', desc: '상대방의 감정에 지나치게 영향을 받아요', count: 76, entries: ['상대가 기분 나쁘면 내 탓인 것 같아요.'] },
];

type Section = 'codetalk' | 'pattern' | 'community';

interface QCard { label: string; text: string; keys: string[]; }
interface ChatMsg { role: 'user' | 'ai'; text: string; }

function buildQueue(): QCard[] {
  const order: (keyof typeof Q_POOL)[] = ['repeat', 'emotion', 'situation', 'root', 'narrow'];
  const queue: QCard[] = [];
  order.forEach(cat => {
    const pool = [...Q_POOL[cat]].sort(() => Math.random() - 0.5);
    queue.push(pool[0]);
    if (pool.length > 1) queue.push(pool[1]);
  });
  return queue.slice(0, 9);
}

export default function DigPage() {
  const amberFlash = useAmberAttention();
  const { user } = useAuth();
  const { amberName, heldEmotion } = useUserProfile();
  const [section, setSection] = useState<Section>('codetalk');
  const [amberOpen, setAmberOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [heldOpen, setHeldOpen] = useState(false);

  // CodeTalk 3단계
  const [ctValues, setCtValues] = useState<string[]>(['', '', '']);
  const [ctSaved, setCtSaved] = useState<string[]>(['', '', '']);
  const [ctOpen, setCtOpen] = useState<boolean[]>([true, false, false]);

  // codetalk_entries에서 기존 저장 로드
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .schema('veilrum')
      .from('codetalk_entries')
      .select('stage, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }: { data: any[] | null }) => {
        if (!data || data.length === 0) return;
        const loaded = ['', '', ''];
        data.forEach((row: any) => {
          const idx = (row.stage as number) - 1;
          if (idx >= 0 && idx < 3 && !loaded[idx]) loaded[idx] = row.content;
        });
        setCtSaved(loaded);
      });
  }, [user]);

  // 탐색 카드
  const [questions] = useState<QCard[]>(() => buildQueue());
  const [qOpen, setQOpen] = useState<boolean[]>(() => Array(9).fill(false).map((_, i) => i === 0));
  const [qInputs, setQInputs] = useState<string[]>(() => Array(9).fill(''));
  const [qReplies, setQReplies] = useState<string[]>(() => Array(9).fill(''));

  // 커뮤니티
  const [commFilter, setCommFilter] = useState<string>('all');
  const [groupOpen, setGroupOpen] = useState<Record<number, boolean>>({});

  const sendAmber = useCallback(() => {
    const v = chatInput.trim();
    if (!v) return;
    setChatMsgs(prev => [...prev, { role: 'user', text: v }]);
    setChatInput('');
    const r = AMBER_REPLIES[Math.floor(Math.random() * AMBER_REPLIES.length)];
    setTimeout(() => {
      setChatMsgs(prev => [...prev, { role: 'ai', text: r }]);
    }, 700);
    // tab_conversations 저장
    if (user) {
      (supabase as any).schema('veilrum').from('tab_conversations').insert([
        { user_id: user.id, tab: 'dig', role: 'user', content: v },
        { user_id: user.id, tab: 'dig', role: 'ai',   content: r },
      ]);
    }
  }, [chatInput, user]);

  const sendQCard = useCallback((idx: number) => {
    const v = qInputs[idx].trim();
    if (!v) return;
    const r = AMBER_REPLIES[Math.floor(Math.random() * AMBER_REPLIES.length)];
    setQReplies(prev => { const next = [...prev]; next[idx] = r; return next; });
    // tab_conversations 저장
    if (user) {
      (supabase as any).schema('veilrum').from('tab_conversations').insert([
        { user_id: user.id, tab: 'dig', role: 'user', content: v },
        { user_id: user.id, tab: 'dig', role: 'ai',   content: r },
      ]);
    }
  }, [qInputs, user]);

  const ctStageLabels = ['정의', '각인', '뿌리'];
  const keyword = heldEmotion || '외로움';
  const ctQuestions = [`나에게 "${keyword}"이란?`, '왜 그렇게 정의하게 됐나요?', '그 경험은 어디서 왔나요?'];
  const ctPlaceholders = ['지금 떠오르는 것을 써요.', '그 기억이 있다면...', '떠오르는 게 있다면...'];
  const activeCtStep = ctSaved.filter(Boolean).length;

  const saveCtEntry = async (stage: number, content: string) => {
    if (!user) return;
    await (supabase as any).schema('veilrum').from('codetalk_entries').upsert({
      user_id: user.id,
      keyword,
      stage,
      content,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,keyword,stage' });
  };

  const filteredGroups = commFilter === 'all' ? COMM_GROUPS : COMM_GROUPS.filter(g => g.pattern === commFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#1C1917', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', gap: '8px', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: AC, fontFamily: "'Cormorant Garamond', serif" }}>Dig</div>
          <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E', marginTop: '1px' }}>패턴을 찾아요</div>
        </div>
        {keyword && (
          <button
            onClick={() => setHeldOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: `${AC}15`, border: `1px solid ${AC}33`, borderRadius: '20px', padding: '4px 10px', cursor: 'pointer' }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: AC }} />
            <span style={{ fontSize: '11px', fontWeight: 300, color: AC }}>{keyword}</span>
            <span style={{ fontSize: '10px', fontWeight: 300, color: '#57534E' }}>· Held</span>
          </button>
        )}
        <AmberBtn onClick={() => setAmberOpen(true)} flash={amberFlash} />
      </div>

      {/* Held 팝업 */}
      {heldOpen && (
        <div style={{ position: 'absolute', top: '60px', right: '16px', zIndex: 30, background: '#242120', border: '1px solid #3C3835', borderRadius: '12px', padding: '14px', width: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '6px' }}>Vent에서 가져온 것</div>
          <div style={{ fontSize: '16px', fontWeight: 300, color: AC, fontFamily: "'Cormorant Garamond', serif", marginBottom: '6px' }}>{keyword}</div>
          <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6, wordBreak: 'keep-all' }}>가까운 사람과 있을 때도 혼자인 느낌이 든다고 했어요.</div>
          <button onClick={() => setHeldOpen(false)} style={{ marginTop: '10px', background: 'none', border: 'none', fontSize: '11px', color: '#57534E', cursor: 'pointer', padding: 0 }}>닫기</button>
        </div>
      )}

      {/* 섹션 탭 */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 16px 10px', flexShrink: 0 }}>
        {(['codetalk', 'pattern', 'community'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)} style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${section === s ? AC + '44' : '#2A2624'}`, background: section === s ? `${AC}15` : 'transparent', color: section === s ? AC : '#57534E', fontSize: '12px', fontWeight: 300, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {s === 'codetalk' ? '코드토크' : s === 'pattern' ? '탐색' : '커뮤니티'}
          </button>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>

        {/* 코드토크 */}
        {section === 'codetalk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i < activeCtStep ? AC : '#2A2624', transition: 'background 0.3s' }} />)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {ctStageLabels.map((lbl, i) => <span key={i} style={{ fontSize: '10px', fontWeight: 300, color: i < activeCtStep ? AC : '#57534E' }}>{lbl}</span>)}
              </div>
            </div>
            <div style={{ padding: '14px 0 8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '4px' }}>오늘의 키워드 · Day 7</div>
              <div style={{ fontSize: '28px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.06em' }}>{keyword}</div>
              <div style={{ fontSize: '13px', fontWeight: 300, color: '#78716C', marginTop: '4px' }}>당신은 언제 가장 {keyword}을 느끼는가</div>
            </div>
            <div style={{ borderTop: '1px solid #2A2624' }} />
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: '#242120', border: `1px solid ${ctOpen[i] ? AC + '33' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div onClick={() => setCtOpen(prev => prev.map((v, j) => j === i ? !v : v))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: AC, marginBottom: '3px' }}>{i + 1}단계 — {ctStageLabels[i]}</div>
                    <div style={{ fontSize: '14px', fontWeight: 300, color: ctSaved[i] ? '#E7E5E4' : '#A8A29E', fontFamily: "'Cormorant Garamond', serif" }}>
                      {ctSaved[i] && ctSaved[i] !== '(건너뜀)' ? ctSaved[i] : ctQuestions[i]}
                    </div>
                  </div>
                  <span style={{ color: '#57534E', fontSize: '18px', transition: 'transform 0.2s', transform: ctOpen[i] ? 'rotate(90deg)' : 'none' }}>›</span>
                </div>
                {ctOpen[i] && !ctSaved[i] && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <textarea value={ctValues[i]} onChange={e => setCtValues(prev => prev.map((v, j) => j === i ? e.target.value : v))} placeholder={ctPlaceholders[i]} maxLength={300} style={{ width: '100%', minHeight: '80px', background: '#1C1917', border: '1px solid #3C3835', borderRadius: '8px', padding: '10px', color: '#E7E5E4', fontSize: '13px', fontWeight: 300, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#57534E' }}>{ctValues[i].length} / 300</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setCtSaved(prev => prev.map((v, j) => j === i ? '(건너뜀)' : v))} style={{ padding: '5px 12px', background: 'none', border: '1px solid #3C3835', borderRadius: '20px', color: '#57534E', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>건너뛰기</button>
                        <button onClick={() => { if (!ctValues[i].trim()) return; setCtSaved(prev => prev.map((v, j) => j === i ? ctValues[i] : v)); setCtOpen(prev => prev.map((v, j) => j === i ? false : (j === i + 1 ? true : v))); saveCtEntry(i + 1, ctValues[i]); }} disabled={!ctValues[i].trim()} style={{ padding: '5px 12px', background: ctValues[i].trim() ? AC : '#2A2624', border: 'none', borderRadius: '20px', color: ctValues[i].trim() ? '#1C1917' : '#57534E', fontSize: '11px', cursor: ctValues[i].trim() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>기록</button>
                      </div>
                    </div>
                  </div>
                )}
                {ctSaved[i] && ctSaved[i] !== '(건너뜀)' && ctOpen[i] && (
                  <div style={{ padding: '0 14px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 300, color: '#78716C', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6 }}>{ctSaved[i]}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 탐색 */}
        {section === 'pattern' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 300, color: '#57534E', marginBottom: '4px' }}>질문을 탭하고 답해봐요.</div>
            {questions.map((q, idx) => (
              <div key={idx} style={{ background: '#242120', border: `1px solid ${qOpen[idx] ? AC + '33' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div onClick={() => setQOpen(prev => prev.map((v, j) => j === idx ? !v : v))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: AC, marginBottom: '2px' }}>{q.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif" }}>{q.text}</div>
                  </div>
                  <span style={{ color: '#57534E', fontSize: '18px', transform: qOpen[idx] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                </div>
                {qReplies[idx] && (
                  <div style={{ padding: '0 14px 10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', lineHeight: 1.6 }}>{qInputs[idx]}</div>
                    <div style={{ marginTop: '8px', padding: '8px', background: `${AC}08`, border: `1px solid ${AC}22`, borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 400, color: AC, marginBottom: '3px' }}>Amber</div>
                      <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6 }}>{qReplies[idx]}</div>
                    </div>
                  </div>
                )}
                {qOpen[idx] && !qReplies[idx] && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <textarea value={qInputs[idx]} onChange={e => setQInputs(prev => prev.map((v, j) => j === idx ? e.target.value : v))} placeholder="자유롭게 써요..." maxLength={300} style={{ width: '100%', minHeight: '70px', background: '#1C1917', border: '1px solid #3C3835', borderRadius: '8px', padding: '9px', color: '#E7E5E4', fontSize: '13px', fontWeight: 300, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                      <span style={{ fontSize: '11px', color: '#57534E' }}>{qInputs[idx].length} / 300</span>
                      <button onClick={() => sendQCard(idx)} disabled={!qInputs[idx].trim()} style={{ padding: '5px 14px', background: qInputs[idx].trim() ? AC : '#2A2624', border: 'none', borderRadius: '20px', color: qInputs[idx].trim() ? '#1C1917' : '#57534E', fontSize: '11px', cursor: qInputs[idx].trim() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif" }}>Amber에게 보내기</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 커뮤니티 */}
        {section === 'community' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: AC, marginBottom: '4px' }}>Dig · 커뮤니티</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[['all', '전체'], ['avoidance', '회피형'], ['anxiety', '불안형'], ['lonely', '고립형'], ['overfit', '과몰입형']].map(([val, lbl]) => (
                <button key={val} onClick={() => setCommFilter(val)} style={{ padding: '4px 12px', borderRadius: '20px', border: `1px solid ${commFilter === val ? AC + '44' : '#2A2624'}`, background: commFilter === val ? `${AC}15` : 'transparent', color: commFilter === val ? AC : '#57534E', fontSize: '11px', fontWeight: 300, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{lbl}</button>
              ))}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E' }}>댓글이 아니에요. 카드를 탭하면 읽을 수 있어요.</div>
            {filteredGroups.map((g, i) => (
              <div key={i} onClick={() => setGroupOpen(prev => ({ ...prev, [i]: !prev[i] }))} style={{ background: '#242120', border: '1px solid #2A2624', borderRadius: '12px', padding: '14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 400, color: '#E7E5E4', flex: 1, marginRight: '8px' }}>{g.name}</div>
                  <div style={{ fontSize: '11px', color: '#57534E' }}>{g.count}명</div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', marginTop: '4px' }}>{g.desc}</div>
                {groupOpen[i] && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#3C3835', marginBottom: '2px' }}>읽는 공간이에요.</div>
                    {g.entries.map((entry, j) => <div key={j} style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif", padding: '8px', background: '#1C1917', borderRadius: '8px' }}>{entry}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amber 시트 */}
      {amberOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div onClick={() => setAmberOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#242120', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', maxHeight: '70dvh' }}>
            <div style={{ width: '36px', height: '4px', background: '#3C3835', borderRadius: '2px', margin: '10px auto 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #2A2624' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D4A57415', border: '1px solid #D4A57444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#D4A574' }} />
              </div>
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 400, color: '#E7E5E4' }}>엠버</div>
              <button onClick={() => setAmberOpen(false)} style={{ background: 'none', border: 'none', color: '#57534E', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>
              <div style={{ background: '#D4A5740A', border: '1px solid #D4A57422', borderRadius: '11px 11px 11px 3px', padding: '10px 13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.55 }}>질문 카드에 답하면 여기서 더 깊이 얘기할 수 있어요.</div>
                <div style={{ fontSize: '9px', fontWeight: 300, color: '#D4A57477', marginTop: '2px' }}>같이 파고들어요</div>
              </div>
              {chatMsgs.map((m, i) => m.role === 'user' ? (
                <div key={i} style={{ background: `${AC}09`, border: `1px solid ${AC}22`, borderRadius: '11px 11px 3px 11px', padding: '9px 13px', alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6 }}>{m.text}</div>
                </div>
              ) : (
                <div key={i} style={{ background: '#D4A5740A', border: '1px solid #D4A57422', borderRadius: '11px 11px 11px 3px', padding: '10px 13px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.55 }}>{m.text}</div>
                  <div style={{ fontSize: '9px', fontWeight: 300, color: '#D4A57477', marginTop: '2px' }}>같이 파고들어요</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '7px 13px 13px', borderTop: '1px solid #2A2624', display: 'flex', gap: '7px', alignItems: 'center' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAmber()} placeholder="Amber에게 말해요..." style={{ flex: 1, background: '#242120', border: '1px solid #3C3835', borderRadius: '20px', padding: '7px 12px', color: '#A8A29E', fontSize: '12px', fontWeight: 300, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={sendAmber} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D4A574', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 11V1M1 6l5-5 5 5" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
