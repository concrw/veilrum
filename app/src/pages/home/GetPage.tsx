import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmberBtn, FrostBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/context/UserProfileContext';

const AC = '#8C7060';

const CORRECTION_REPLIES: Record<string, string> = {
  yes:     '좋아요. 이 부분은 확정할게요.',
  partial: '어떤 부분이 다른지 더 얘기해줄 수 있어요?',
  no:      '그렇군요. 어떻게 다르게 느껴지는지 말해줘요. Amber와 대화해봐요.',
  more:    'Amber 대화창에서 더 얘기해봐요.',
  dig:     'Dig에서 더 파고들어봐요.',
  secret:  '비밀스러운 나의 레이어를 더 탐색해봐요. Dig로 가볼게요.',
};

const GET_GROUPS = [
  { name: '사회적 나와 비밀스러운 나가 다른 사람들', desc: '밖에선 괜찮아 보이지만 안에선 다른 패턴', count: 234, matched: true, tags: ['모순', '사회적', '비밀'], entries: ['회사에서는 갈등을 피하는데 혼자 있을 때 화가 많이 나요.', '겉으로는 독립적인 척하는데 사실 혼자인 게 너무 힘들어요.'] },
  { name: '연결을 원하지만 먼저 다가가지 못하는 사람들', desc: '관찰자형 — 거리를 두는 것이 안전하다고 학습한 패턴', count: 187, matched: true, tags: ['관찰자', '회피', '연결'], entries: ['연락하고 싶은데 먼저 보내는 게 너무 어려워요.', '다가갔다가 거절당할까봐 기다려요.'] },
  { name: '일반적 나와 비밀스러운 나가 다른 사람들', desc: '평소엔 괜찮은데 아무도 모르는 다른 면이 있는 패턴', count: 143, matched: false, tags: ['모순', '일반', '비밀'], entries: ['보통 때는 괜찮은데 아무도 모르는 두려움이 있어요.'] },
];

// Amber — 공감형 (Get탭: 결산 맥락, 자기 이해 지원)
const AMBER_REPLIES = [
  '그 부분이 다르게 느껴진 건 중요한 신호예요. 어떤 점이 다른가요?',
  '결과를 보면서 어떤 감정이 올라왔어요?',
  '이 가면이 언제 가장 강하게 나타나요?',
  '그게 당신 잘못이 아니에요. 살아남는 방법이었던 거예요.',
  '어떤 부분이 "맞다"는 느낌이 들었어요?',
  '이 패턴이 당신을 어떻게 보호해왔는지 생각해봤어요?',
  '그 상처가 언제부터 있었던 것 같아요?',
  '지금 가장 마음에 걸리는 게 뭐예요?',
  '진짜 나를 보는 게 어떤 기분이에요?',
  '이 결과 중에 새롭게 알게 된 게 있어요?',
  '그 두려움, 언제부터 가지고 있었어요?',
  '조금씩 바꾸고 싶은 부분이 있어요?',
];

// Frost — 분석형 (Get탭: 패턴 데이터 해석)
const FROST_REPLIES = [
  '4축 중 가장 극단적인 점수가 나온 축이 핵심이에요. 어떤 상황에서 그게 작동하는지 봐요.',
  '이 점수 패턴은 세 가지 행동 반복을 만들어요. 그 반복을 인식하는 것만으로도 변화가 시작돼요.',
  '가면은 원래 보호 기제예요. 지금 그 가면이 과잉 작동하고 있는지 확인해봐요.',
  '애착 점수가 높을수록 관계에서 에너지 소모가 커요. 그걸 인식했다는 것 자체가 데이터예요.',
  '패턴은 반복될수록 강화돼요. 지금 인식하는 게 가장 중요한 단계예요.',
  '이 결과에서 일관된 것이 뭔지 보이죠? 그게 핵심 패턴이에요.',
  '감정이 아니라 구조를 봐요. 왜 이런 반응이 나오는지 이유가 보여요.',
  '변화는 인식에서 시작해요. 지금 여기서 이미 시작됐어요.',
];

type Section = 'summary' | 'community';
interface ChatMsg { role: 'user' | 'ai'; text: string; }

// priper 결과에서 V프로필 축 매핑
function scoresToAxes(scores: Record<string, number> | null) {
  if (!scores) return null;
  return [
    { label: '애착', val: Math.round(scores.A ?? 72) },
    { label: '표현', val: Math.round(scores.C ?? 34) },
    { label: '직면', val: Math.round(scores.B ?? 28) },
    { label: '자율', val: Math.round(scores.D ?? 65) },
  ];
}

export default function GetPage() {
  const amberFlash = useAmberAttention();
  const { user } = useAuth();
  const { amberName, frostName } = useUserProfile();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('summary');

  // PRIPER 데이터
  const [priperMask, setPriperMask] = useState<string | null>(null);
  const [priperAxes, setPriperAxes] = useState<{ label: string; val: number }[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .schema('veilrum')
      .from('priper_sessions')
      .select('primary_mask, axis_scores')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }: { data: any }) => {
        if (!data) return;
        if (data.primary_mask) setPriperMask(data.primary_mask);
        const axes = scoresToAxes(data.axis_scores);
        if (axes) setPriperAxes(axes);
      });
  }, [user]);

  // 결산 카드
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({});
  const [corrections, setCorrections] = useState<Record<number, string>>({});
  const [correctionFeedback, setCorrectionFeedback] = useState<Record<number, string>>({});

  // 하단 교정 바
  const [barConfirmed, setBarConfirmed] = useState(false);
  const [barRejected, setBarRejected] = useState(false);

  // Amber/Frost 시트 분리
  const [amberOpen, setAmberOpen] = useState(false);
  const [amberMsgs, setAmberMsgs] = useState<ChatMsg[]>([]);
  const [frostMsgs, setFrostMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [sheetMode, setSheetMode] = useState<'amber' | 'frost'>('amber');
  // 하위 호환용
  const chatMsgs = sheetMode === 'amber' ? amberMsgs : frostMsgs;
  const setChatMsgs = sheetMode === 'amber' ? setAmberMsgs : setFrostMsgs;

  // 커뮤니티
  const [groupOpen, setGroupOpen] = useState<Record<number, boolean>>({});

  // V프로필 축 애니메이션
  const [axesAnimated, setAxesAnimated] = useState(false);

  const toggleCard = (idx: number) => {
    const isOpen = openCards[idx];
    setOpenCards(prev => {
      const next: Record<number, boolean> = {};
      Object.keys(prev).forEach(k => { next[+k] = false; });
      if (!isOpen) next[idx] = true;
      return next;
    });
    if (!isOpen && idx === 1) {
      setTimeout(() => setAxesAnimated(true), 100);
    } else if (isOpen) {
      setAxesAnimated(false);
    }
  };

  const selectCorrection = (cardIdx: number, type: string) => {
    setCorrections(prev => ({ ...prev, [cardIdx]: type }));
    setCorrectionFeedback(prev => ({ ...prev, [cardIdx]: CORRECTION_REPLIES[type] || '' }));
    if (type === 'more' || type === 'no') {
      setTimeout(() => { setSheetMode('amber'); setAmberOpen(true); }, 600);
    }
  };

  const sendAmber = useCallback(() => {
    const v = chatInput.trim();
    if (!v) return;
    setChatMsgs(prev => [...prev, { role: 'user', text: v }]);
    setChatInput('');
    const pool = sheetMode === 'frost' ? FROST_REPLIES : AMBER_REPLIES;
    const r = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      setChatMsgs(prev => [...prev, { role: 'ai', text: r }]);
    }, 700);
    if (user) {
      (supabase as any).schema('veilrum').from('tab_conversations').insert([
        { user_id: user.id, tab: 'get', role: 'user', content: v },
        { user_id: user.id, tab: 'get', role: 'ai',   content: r },
      ]);
    }
  }, [chatInput, user, setChatMsgs, sheetMode]);

  const axes = priperAxes ?? [
    { label: '애착', val: 72 },
    { label: '표현', val: 34 },
    { label: '직면', val: 28 },
    { label: '자율', val: 65 },
  ];
  const maskName = priperMask ?? '관찰자';

  const barHidden = Object.values(openCards).some(v => v);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#1C1917', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: AC, fontFamily: "'Cormorant Garamond', serif" }}>Get</div>
          <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E', marginTop: '1px' }}>지금까지 발견된 나예요</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <AmberBtn onClick={() => { setSheetMode('amber'); setAmberOpen(true); }} flash={amberFlash} />
          <FrostBtn onClick={() => { setSheetMode('frost'); setAmberOpen(true); }} />
        </div>
      </div>

      {/* 섹션 탭 */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 16px 10px', flexShrink: 0 }}>
        {(['summary', 'community'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)} style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${section === s ? AC + '44' : '#2A2624'}`, background: section === s ? `${AC}15` : 'transparent', color: section === s ? AC : '#57534E', fontSize: '12px', fontWeight: 300, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {s === 'summary' ? '결산' : '커뮤니티'}
          </button>
        ))}
      </div>

      {/* 메인 — 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none', paddingBottom: section === 'summary' && !barHidden ? '76px' : '16px' }}>

        {/* 결산 뷰 */}
        {section === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Amber 인트로 */}
            <div style={{ background: '#D4A5740A', border: '1px solid #D4A57422', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#D4A57415', border: '1px solid #D4A57444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#D4A574' }} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 400, color: '#D4A574' }}>Amber</div>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4A574', opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6, wordBreak: 'keep-all' }}>
                Vent와 Dig에서 나눈 것들을 보니 — 이런 모습이 보여요. 맞는지 같이 확인해봐요.
              </div>
              <div style={{ fontSize: '11px', fontWeight: 300, color: '#78716C', marginTop: '5px' }}>틀린 부분이 있으면 바로 말해줘요.</div>
            </div>

            {/* 가면 카드 */}
            <div style={{ background: '#242120', border: `1px solid ${openCards[0] ? AC + '33' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div onClick={() => toggleCard(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '3px' }}>쓰고 있는 것</div>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif" }}>{maskName} 가면을 쓰고 있는 것 같아요</div>
                </div>
                <span style={{ color: '#57534E', fontSize: '18px', transform: openCards[0] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
              </div>
              {openCards[0] && (
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ background: '#1C1917', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 400, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", marginBottom: '2px' }}>{maskName}</div>
                    <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E', letterSpacing: '0.06em', marginBottom: '8px' }}>The Watcher</div>
                    <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif", marginBottom: '10px' }}>연결을 원하면서도 먼저 다가가지 않고 바라보는 사람. 거리를 두는 것이 안전하다는 걸 일찍 배웠어요.</div>
                    {[['상처', '연결하려 했을 때 거절당한 경험'], ['두려움', '다가갔다가 또 혼자가 되는 것'], ['필요', '먼저 다가와 주는 사람']].map(([lbl, val]) => (
                      <div key={lbl} style={{ display: 'flex', gap: '10px', paddingTop: '6px', borderTop: '1px solid #2A2624' }}>
                        <div style={{ fontSize: '10px', fontWeight: 400, color: '#57534E', width: '38px', flexShrink: 0 }}>{lbl}</div>
                        <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.5 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <CorrectionPanel cardIdx={0} corrections={corrections} correctionFeedback={correctionFeedback} onSelect={selectCorrection} btns={['yes', 'partial', 'no']} />
                </div>
              )}
            </div>

            {/* V프로필 카드 */}
            <div style={{ background: '#242120', border: `1px solid ${openCards[1] ? AC + '33' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div onClick={() => toggleCard(1)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '3px' }}>나의 형태</div>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif" }}>{maskName}형</div>
                </div>
                <span style={{ color: '#57534E', fontSize: '18px', transform: openCards[1] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
              </div>
              {openCards[1] && (
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.4, marginBottom: '6px' }}>{maskName}형</div>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', lineHeight: 1.6, marginBottom: '14px' }}>연결을 원하지만 먼저 다가가지 못해요. 관계에서 안전한 거리를 유지하는 것이 익숙해요.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {axes.map(ax => (
                      <div key={ax.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', fontSize: '11px', fontWeight: 300, color: '#78716C', flexShrink: 0 }}>{ax.label}</div>
                        <div style={{ flex: 1, height: '4px', background: '#2A2624', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: AC, borderRadius: '2px', width: axesAnimated ? ax.val + '%' : '0%', transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ width: '22px', fontSize: '11px', fontWeight: 300, color: '#57534E', textAlign: 'right', flexShrink: 0 }}>{ax.val}</div>
                      </div>
                    ))}
                  </div>
                  <CorrectionPanel cardIdx={1} corrections={corrections} correctionFeedback={correctionFeedback} onSelect={selectCorrection} btns={['yes', 'partial', 'no', 'more']} />
                </div>
              )}
            </div>

            {/* 멀티페르소나 카드 */}
            <div style={{ background: '#242120', border: `1px solid ${openCards[2] ? AC + '33' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div onClick={() => toggleCard(2)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '3px' }}>나의 여러 면</div>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif" }}>3개의 나가 발견됐어요</div>
                </div>
                <span style={{ color: '#57534E', fontSize: '18px', transform: openCards[2] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
              </div>
              {openCards[2] && (
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: '사회적 나', hi: true, color: '#D4A574' },
                      { label: '일반적 나', hi: false, color: '#A07850' },
                      { label: '비밀스러운 나', hi: false, color: '#7BA8C4' },
                      { label: '+ 발견 중', hi: false, color: '#3C3835' },
                    ].map((p, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: p.color + '15', border: `1px solid ${p.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: p.color + (p.hi ? '' : '88') }} />
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: p.hi ? 400 : 300, color: p.hi ? '#E7E5E4' : '#57534E', textAlign: 'center', lineHeight: 1.3 }}>{p.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 400, color: '#57534E', marginBottom: '7px' }}>발견된 모순</div>
                    {[
                      ['갈등 상황에서의 반응이 달라요', '사회 vs 비밀'],
                      ['혼자일 때와 함께일 때 원하는 것이 달라요', '일반 vs 비밀'],
                    ].map(([text, tag]) => (
                      <div key={text} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid #2A2624' }}>
                        <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.5 }}>{text}</div>
                        <span style={{ fontSize: '10px', fontWeight: 300, color: '#57534E', background: '#2A2624', borderRadius: '4px', padding: '2px 7px', flexShrink: 0, marginLeft: '8px' }}>{tag}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 400, color: '#57534E', marginBottom: '7px' }}>더 발견하고 싶은 게 있어요?</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => selectCorrection(2, 'dig')} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${corrections[2] === 'dig' ? AC + '44' : '#3C3835'}`, background: corrections[2] === 'dig' ? `${AC}15` : 'transparent', color: corrections[2] === 'dig' ? AC : '#57534E', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Dig에서 더 파고들어요</button>
                      <button onClick={() => selectCorrection(2, 'secret')} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${corrections[2] === 'secret' ? AC + '44' : '#3C3835'}`, background: corrections[2] === 'secret' ? `${AC}15` : 'transparent', color: corrections[2] === 'secret' ? AC : '#57534E', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>비밀스러운 나 더 알고 싶어요</button>
                    </div>
                    {correctionFeedback[2] && <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 300, color: '#78716C' }}>{correctionFeedback[2]}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Amber 추가 질문 카드 */}
            <div style={{ background: '#242120', border: `1px solid ${openCards[3] ? AC + '33' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
              <div onClick={() => toggleCard(3)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '3px' }}>아직 불분명한 것</div>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif" }}>이 부분은 더 얘기해봐야 해요</div>
                </div>
                <span style={{ color: '#57534E', fontSize: '18px', transform: openCards[3] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
              </div>
              {openCards[3] && (
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6, marginBottom: '12px' }}>
                    연인/파트너 앞에서의 나에 대해서는 아직 잘 모르겠어요. 이 부분을 Dig에서 좀 더 얘기해볼 수 있어요.
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/home/dig')} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${AC}33`, background: 'transparent', color: AC, fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Dig로 가서 더 얘기할게요</button>
                    <button style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #3C3835', background: 'transparent', color: '#57534E', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>지금은 괜찮아요</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 커뮤니티 뷰 */}
        {section === 'community' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: AC, marginBottom: '4px' }}>Get · 커뮤니티</div>
            <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E' }}>같은 모순 패턴을 가진 사람들이에요. 댓글이 아니에요. 읽는 거예요.</div>
            {GET_GROUPS.map((g, i) => (
              <div key={i} onClick={() => setGroupOpen(prev => ({ ...prev, [i]: !prev[i] }))} style={{ background: '#242120', border: `1px solid ${g.matched ? AC + '33' : '#2A2624'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', fontWeight: 400, color: '#E7E5E4', flex: 1, marginRight: '8px', lineHeight: 1.4 }}>{g.name}</div>
                  <div style={{ fontSize: '11px', color: '#57534E', flexShrink: 0 }}>{g.count}명</div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', marginTop: '4px' }}>{g.desc}</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '7px' }}>
                  {g.matched && <span style={{ fontSize: '10px', fontWeight: 400, color: AC, background: `${AC}15`, border: `1px solid ${AC}33`, borderRadius: '4px', padding: '2px 7px' }}>내 패턴</span>}
                  {g.tags.map(t => <span key={t} style={{ fontSize: '10px', fontWeight: 300, color: '#57534E', background: '#2A2624', borderRadius: '4px', padding: '2px 7px' }}>{t}</span>)}
                </div>
                {groupOpen[i] && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '9px', color: '#3C3835', marginBottom: '2px' }}>댓글이 아니에요. 읽는 거예요.</div>
                    {g.entries.map((entry, j) => <div key={j} style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif", padding: '8px', background: '#1C1917', borderRadius: '8px' }}>{entry}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 교정 바 */}
      {section === 'summary' && !barHidden && (
        <div style={{ position: 'fixed', bottom: '64px', left: 0, right: 0, zIndex: 20, padding: '0 16px 8px' }}>
          <div style={{ background: '#242120', border: '1px solid #2A2624', borderRadius: '12px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif" }}>
              {barConfirmed ? '확인됐어요. Set으로 넘어가볼까요?' : barRejected ? '어떤 부분이 다른지 말해줘요.' : '이게 전반적으로 맞아요?'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {!barConfirmed && !barRejected && (
                <>
                  <button onClick={() => setBarConfirmed(true)} style={{ padding: '6px 14px', background: AC, border: 'none', borderRadius: '20px', color: '#1C1917', fontSize: '12px', fontWeight: 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>맞아요</button>
                  <button onClick={() => { setBarRejected(true); setSheetMode('amber'); setAmberOpen(true); }} style={{ padding: '6px 14px', background: 'none', border: `1px solid ${AC}44`, borderRadius: '20px', color: AC, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>달라요</button>
                </>
              )}
              {barConfirmed && (
                <button onClick={() => navigate('/home/set')} style={{ padding: '6px 14px', background: AC, border: 'none', borderRadius: '20px', color: '#1C1917', fontSize: '12px', fontWeight: 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Set으로</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI 시트 (Amber + Frost 공유) */}
      {amberOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div onClick={() => setAmberOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#242120', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', maxHeight: '70dvh' }}>
            <div style={{ width: '36px', height: '4px', background: '#3C3835', borderRadius: '2px', margin: '10px auto 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #2A2624' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: sheetMode === 'amber' ? '#D4A57415' : '#7BA8C415', border: `1px solid ${sheetMode === 'amber' ? '#D4A57444' : '#7BA8C444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: sheetMode === 'amber' ? '#D4A574' : '#7BA8C4' }} />
              </div>
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 400, color: '#E7E5E4' }}>{sheetMode === 'amber' ? amberName : frostName}</div>
              <button onClick={() => setAmberOpen(false)} style={{ background: 'none', border: 'none', color: '#57534E', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>
              <div style={{ background: sheetMode === 'amber' ? '#D4A5740A' : '#7BA8C408', border: `1px solid ${sheetMode === 'amber' ? '#D4A57422' : '#7BA8C422'}`, borderRadius: '11px 11px 11px 3px', padding: '10px 13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.55 }}>
                  {sheetMode === 'amber'
                    ? priperMask
                      ? `${priperMask}로 나왔네요. 이 결과를 보면서 어떤 느낌이 들었어요?`
                      : '지금까지 나눈 것들을 정리해봤어요. 같이 확인해봐요.'
                    : priperMask
                      ? `${priperMask} 패턴을 분석했어요. 어떤 부분이 가장 눈에 띄어요?`
                      : '패턴을 분석했어요. 어떤 부분이 궁금한가요?'}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 300, color: sheetMode === 'amber' ? '#D4A57477' : '#7BA8C477', marginTop: '2px' }}>
                  {sheetMode === 'amber' ? '발견하는 중이에요' : '냉철하게 분석해요'}
                </div>
              </div>
              {chatMsgs.map((m, i) => m.role === 'user' ? (
                <div key={i} style={{ background: `${AC}09`, border: `1px solid ${AC}22`, borderRadius: '11px 11px 3px 11px', padding: '9px 13px', alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6 }}>{m.text}</div>
                </div>
              ) : (
                <div key={i} style={{ background: sheetMode === 'amber' ? '#D4A5740A' : '#7BA8C408', border: `1px solid ${sheetMode === 'amber' ? '#D4A57422' : '#7BA8C422'}`, borderRadius: '11px 11px 11px 3px', padding: '10px 13px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.55 }}>{m.text}</div>
                  <div style={{ fontSize: '9px', fontWeight: 300, color: sheetMode === 'amber' ? '#D4A57477' : '#7BA8C477', marginTop: '2px' }}>같이 확인해요</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '7px 13px 13px', borderTop: '1px solid #2A2624', display: 'flex', gap: '7px', alignItems: 'center' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAmber()} placeholder={sheetMode === 'amber' ? `${amberName}에게 말해요...` : `${frostName}에게 말해요...`} style={{ flex: 1, background: '#242120', border: '1px solid #3C3835', borderRadius: '20px', padding: '7px 12px', color: '#A8A29E', fontSize: '12px', fontWeight: 300, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={sendAmber} style={{ width: '28px', height: '28px', borderRadius: '50%', background: sheetMode === 'amber' ? '#D4A574' : '#7BA8C4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 11V1M1 6l5-5 5 5" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 교정 패널 컴포넌트
function CorrectionPanel({ cardIdx, corrections, correctionFeedback, onSelect, btns }: {
  cardIdx: number;
  corrections: Record<number, string>;
  correctionFeedback: Record<number, string>;
  onSelect: (cardIdx: number, type: string) => void;
  btns: string[];
}) {
  const labels: Record<string, string> = { yes: '맞아요', partial: '일부만 맞아요', no: '달라요', more: '더 얘기하고 싶어요' };
  const AC = '#8C7060';
  return (
    <div style={{ background: '#1C1917', borderRadius: '10px', padding: '10px' }}>
      <div style={{ fontSize: '11px', fontWeight: 400, color: '#57534E', marginBottom: '8px' }}>이게 맞아요?</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: correctionFeedback[cardIdx] ? '8px' : 0 }}>
        {btns.map(type => (
          <button key={type} onClick={() => onSelect(cardIdx, type)} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${corrections[cardIdx] === type ? AC + '44' : '#3C3835'}`, background: corrections[cardIdx] === type ? `${AC}15` : 'transparent', color: corrections[cardIdx] === type ? AC : '#57534E', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{labels[type] || type}</button>
        ))}
      </div>
      {correctionFeedback[cardIdx] && <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', lineHeight: 1.5 }}>{correctionFeedback[cardIdx]}</div>}
    </div>
  );
}
