import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmberBtn, FrostBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';
import { useUserProfile } from '@/context/UserProfileContext';

const AC = '#C4A355';

const PATTERNS = [
  { id: 'p1', zone: '일상적인 나 > 연인/파트너', zc: '#C2956C', title: '먼저 다가가지 못하는 패턴', desc: '연결을 원하지만 거절이 두려워 항상 기다려요.', from: 'Get', intensity: 4, frostTxt: '"회피-갈망 사이클. 4개 대화에서 반복됐어요. 어떻게 할지 정하는 게 먼저예요."' },
  { id: 'p2', zone: '사회적인 나 > 직장/학교', zc: '#7BA8C4', title: '감정을 숨기는 직장에서의 나', desc: '직장에서는 항상 괜찮은 척해요. 지쳐있어도.', from: 'Dig', intensity: 3, frostTxt: '"사회적 가면이 두텁게 작동하고 있어요. 에너지 비용이 크게 쌓이고 있어요."' },
  { id: 'p3', zone: '비밀스러운 나 > 감정적 비밀', zc: '#A07850', title: '혼자 삭이는 슬픔', desc: '슬플 때 아무에게도 말하지 못하고 혼자 버텨요.', from: 'Get', intensity: 5, frostTxt: '"고립 패턴. Vent 기록에서 5번 이상 등장했어요. 가장 오래된 패턴이에요."' },
];

type ChoiceType = 'accept' | 'change' | 'leave';

const CD: Record<ChoiceType, { title: string; desc: string; badge: string; ptitle: string; psub: string; stages: { lbl: string; title: string; text: string; note: boolean; ai: 'amber' | 'frost'; aiTxt: string }[] }> = {
  accept: {
    title: '받아들일게요', desc: '이런 나를 인정하고, 이대로도 괜찮다는 걸 알아가고 싶어요.',
    badge: '받아들이기', ptitle: '있는 그대로의 나를 알아가는 3단계', psub: 'Amber가 함께해요.',
    stages: [
      { lbl: '인식', title: '이 패턴에 이름 붙이기', text: '이 패턴을 한 문장으로 표현해보세요.', note: true, ai: 'amber', aiTxt: '어떤 이름이든 괜찮아요. 이름을 붙이는 것만으로도 이미 달라진 거예요.' },
      { lbl: '이해', title: '이 패턴이 나를 어떻게 지켜왔는지', text: '모든 패턴은 한때 나를 보호하기 위해 생겼어요. 무엇을 지켜온 걸까요?', note: false, ai: 'frost', aiTxt: '방어 기제는 약점이 아니에요. 과거의 해결책이 현재에 맞지 않는 것뿐이에요.' },
      { lbl: '통합', title: '이런 나와 함께 살아가는 방식', text: '받아들인다는 건 포기가 아니에요. 이 나와 함께 어떻게 살아갈 건가요?', note: true, ai: 'amber', aiTxt: '여기까지 온 것만으로도 충분해요. 정말로요.' },
    ],
  },
  change: {
    title: '바꿀게요', desc: '이 패턴을 알았으니, 이제 다르게 반응하고 싶어요.',
    badge: '바꿀게요', ptitle: '패턴을 바꾸는 3단계', psub: 'Frost가 트래킹해요.',
    stages: [
      { lbl: '관찰', title: '패턴이 언제 나타나는지 포착하기', text: '다음번에 이 패턴이 작동할 때 그 순간을 알아채보세요.', note: false, ai: 'amber', aiTxt: '알아채는 것만으로도 달라진 거예요.' },
      { lbl: '실험', title: '한 가지 작은 것만 다르게 해보기', text: '딱 한 가지만 다르게 해볼 것을 정해보세요.', note: true, ai: 'frost', aiTxt: '작은 실험이 데이터가 돼요. 3주면 패턴이 바뀌기 시작해요.' },
      { lbl: '정착', title: '새로운 반응 패턴 만들기', text: '실험이 쌓이면 새로운 나의 방식이 돼요.', note: false, ai: 'amber', aiTxt: 'Frost가 함께 트래킹할 거예요. 혼자가 아니에요.' },
    ],
  },
  leave: {
    title: '떠날게요', desc: '이 관계나 상황에서 벗어나는 것이 나에게 맞는 방향이에요.',
    badge: '떠날게요', ptitle: '새로운 시작을 위한 3단계', psub: 'Amber와 Frost가 함께해요.',
    stages: [
      { lbl: '명확화', title: '왜 떠나는지 나에게 솔직하게', text: '두려움 때문인지, 진짜 선택인지. 솔직하게 물어보세요.', note: false, ai: 'amber', aiTxt: '어떤 이유든 괜찮아요. 솔직한 것이 먼저예요.' },
      { lbl: '작별', title: '이 관계가 준 것 인정하기', text: '떠난다고 과거가 의미 없어지는 게 아니에요. 무엇을 배웠나요?', note: true, ai: 'frost', aiTxt: '떠남의 이유를 명확히 알수록 후회가 줄어요.' },
      { lbl: '시작', title: '다음 나를 위한 첫 걸음 정하기', text: '떠남은 끝이 아니에요. 그 첫 걸음은 무엇인가요?', note: true, ai: 'amber', aiTxt: '슬픔은 의미가 있었다는 증거예요.' },
    ],
  },
};

const FROST_SUGGESTS: Record<ChoiceType, string> = {
  accept: '"받아들이는 것도 용기예요. 이 패턴이 왜 생겼는지 같이 봐요."',
  change: '"변화하기로 했군요. 어디서 시작할지 같이 잡아볼게요."',
  leave: '"떠나는 것도 선택이에요. 이유를 명확히 하면 후회가 줄어요."',
};

const AI_DATA = {
  amber: {
    name: '엠버', role: '비서 Amber',
    init: { text: '어떤 선택을 하든 — 그 선택을 하는 사람으로 같이 걸어갈게요.', tone: '따뜻하게 지지해요' },
    replies: [
      { text: '그 감정, 충분히 느껴도 돼요. 서두르지 않아도 돼요.', tone: '공감해요' },
      { text: '작은 것부터 시작해요. 작은 게 더 오래가요.', tone: '격려해요' },
      { text: '오늘 어땠어요? 어떤 상황이 있었나요?', tone: '함께 있어요' },
      { text: '바꾸기로 한 게 쉽지 않죠. 그 용기 자체가 이미 시작이에요.', tone: '지지해요' },
      { text: '그 패턴이 언제 가장 강하게 나와요?', tone: '궁금해요' },
      { text: '받아들인다는 게 포기가 아니에요. 더 정확하게 보는 거예요.', tone: '부드럽게' },
      { text: '오늘 실천 중에 어떤 게 제일 어려웠어요?', tone: '같이 보고 있어요' },
      { text: '그 선택이 당신에게 어떤 의미인지 말해줘요.', tone: '듣고 있어요' },
      { text: '완벽하게 안 해도 괜찮아요. 오늘 한 것만으로 충분해요.', tone: '따뜻하게' },
      { text: '어떤 부분이 달라지고 있는 것 같아요?', tone: '함께 확인해요' },
    ],
  },
  frost: {
    name: '프로스트', role: '닥터 Frost',
    init: { text: '패턴을 선택했군요. 이제 어떻게 작동하는지 같이 봐요.', tone: '냉철하게 분석해요' },
    replies: [
      { text: '이 반응이 몇 번이나 반복됐어요? 빈도를 알면 변화 속도를 예측할 수 있어요.', tone: '정확하게 짚어요' },
      { text: '변화는 알아채는 것에서 시작해요. 지금 이미 첫 단계예요.', tone: '패턴을 추적해요' },
      { text: '21일이 지나면 뇌가 새 경로를 만들기 시작해요. 오늘이 며칠째예요?', tone: '냉철하게 지지해요' },
      { text: '이 패턴을 유지하게 만드는 보상이 뭔지 알면 더 빨리 바꿀 수 있어요.', tone: '분석해요' },
      { text: '어떤 상황에서 이 패턴이 가장 강하게 작동해요?', tone: '정확하게 봐요' },
      { text: '감정이 아니라 행동을 관찰해요. 어떤 행동이 달라졌어요?', tone: '추적해요' },
      { text: '바꾸기로 한 선택 — 그 이유가 명확할수록 변화가 지속돼요. 왜 바꾸려고 해요?', tone: '직접적으로' },
      { text: '오늘 실천에서 무엇이 효과적이었어요?', tone: '데이터를 봐요' },
    ],
  },
};

const GROUPS = [
  { name: '바꾸기로 한 사람들 — 관찰자형', desc: '먼저 다가가지 못하는 패턴을 바꾸려는', count: 143, choice: 'change', tags: ['변화', '관찰자'], entries: ['오늘 처음으로 먼저 연락했어요. 떨렸지만 했어요.', '작은 것부터 시작 중이에요.'] },
  { name: '받아들이기로 한 사람들', desc: '있는 그대로의 나를 알아가는 과정', count: 98, choice: 'accept', tags: ['수용', '자기이해'], entries: ['이런 나도 괜찮다는 걸 조금씩 믿고 있어요.'] },
  { name: '떠나기로 한 사람들', desc: '새로운 시작을 선택한 사람들', count: 67, choice: 'leave', tags: ['이별', '새출발'], entries: ['두렵지만 홀가분해요.'] },
];

type Section = 'pattern' | 'practice' | 'community';
type View = 'list' | 'choice';
interface ChatMsg { role: 'user' | 'ai'; text: string; tone?: string; }

export default function SetPage() {
  const amberFlash = useAmberAttention();
  const { amberName, frostName } = useUserProfile();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('pattern');
  const [view, setView] = useState<View>('list');
  const [selPat, setSelPat] = useState<typeof PATTERNS[0] | null>(null);
  const [selChoice, setSelChoice] = useState<ChoiceType | null>(null);
  const [choiceExpanded, setChoiceExpanded] = useState<Record<ChoiceType, boolean>>({ accept: false, change: false, leave: false });
  const [stageOpen, setStageOpen] = useState<Record<string, boolean>>({});
  const [stageNotes, setStageNotes] = useState<Record<string, string>>({});
  const [stageDone, setStageDone] = useState<boolean[]>([false, false, false]);
  const [groupOpen, setGroupOpen] = useState<Record<number, boolean>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<'amber' | 'frost'>('amber');
  const [chatHist, setChatHist] = useState<Record<'amber' | 'frost', ChatMsg[]>>({ amber: [], frost: [] });
  const [chatInput, setChatInput] = useState('');

  const openSheet = (type: 'amber' | 'frost') => {
    setSheetType(type);
    if (chatHist[type].length === 0) {
      const d = AI_DATA[type];
      setChatHist(prev => ({ ...prev, [type]: [{ role: 'ai', text: d.init.text, tone: d.init.tone }] }));
    }
    setSheetOpen(true);
  };

  const sendMsg = useCallback(() => {
    const v = chatInput.trim();
    if (!v) return;
    const type = sheetType;
    setChatHist(prev => ({ ...prev, [type]: [...prev[type], { role: 'user', text: v }] }));
    setChatInput('');
    setTimeout(() => {
      const replies = AI_DATA[type].replies;
      const r = replies[Math.floor(Math.random() * replies.length)];
      setChatHist(prev => ({ ...prev, [type]: [...prev[type], { role: 'ai', text: r.text, tone: r.tone }] }));
    }, 700);
  }, [chatInput, sheetType]);

  const frostBarText = selChoice ? FROST_SUGGESTS[selChoice] : '"이 패턴은 반복되고 있어요."';
  const currentCD = selChoice ? CD[selChoice] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#1C1917', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: AC, fontFamily: "'Cormorant Garamond', serif" }}>Set</div>
          <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E', marginTop: '1px' }}>이제 뭔가 달라지고 싶어요</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <AmberBtn onClick={() => openSheet('amber')} flash={amberFlash} />
          <FrostBtn onClick={() => openSheet('frost')} />
        </div>
      </div>

      {/* 섹션 탭 */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 16px 10px', flexShrink: 0 }}>
        {(['pattern', 'practice', 'community'] as Section[]).map(s => (
          <button key={s} onClick={() => { setSection(s); if (s === 'pattern') setView('list'); }} style={{ padding: '5px 14px', borderRadius: '20px', border: `1px solid ${section === s ? AC + '44' : '#2A2624'}`, background: section === s ? `${AC}15` : 'transparent', color: section === s ? AC : '#57534E', fontSize: '12px', fontWeight: 300, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {s === 'pattern' ? '선택' : s === 'practice' ? '실천' : '커뮤니티'}
          </button>
        ))}
      </div>

      {/* 메인 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>

        {/* 선택 — 패턴 목록 */}
        {section === 'pattern' && view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: AC, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: AC }} />Set
              </div>
              <div style={{ fontSize: '16px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.4 }}>어떤 고민과 먼저 마주할 건가요?</div>
              <div style={{ fontSize: '12px', fontWeight: 300, color: '#57534E', marginTop: '4px' }}>Dig와 Get에서 발견한 패턴들이에요.</div>
            </div>
            <div style={{ background: '#7BA8C408', border: '1px solid #7BA8C422', borderRadius: '10px', padding: '10px 13px', display: 'flex', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 400, color: '#7BA8C4', flexShrink: 0 }}>Frost</div>
              <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>"3개 패턴이 반복되고 있어요. 첫 번째가 가장 자주 등장했어요."</div>
            </div>
            {PATTERNS.map(p => (
              <div key={p.id} onClick={() => { setSelPat(p); setSelChoice(null); setView('choice'); setSection('pattern'); }} style={{ background: '#242120', border: '1px solid #2A2624', borderRadius: '12px', padding: '14px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.zc }} />
                  <div style={{ fontSize: '11px', fontWeight: 300, color: '#78716C' }}>{p.zone}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#E7E5E4', marginBottom: '4px' }}>{p.title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', lineHeight: 1.5, marginBottom: '10px' }}>{p.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 400, color: '#57534E', background: '#2A2624', borderRadius: '4px', padding: '2px 7px' }}>{p.from}</span>
                  <div style={{ display: 'flex', gap: '3px' }}>{[0,1,2,3,4].map(j => <div key={j} style={{ width: '6px', height: '6px', borderRadius: '50%', background: j < p.intensity ? AC : '#2A2624' }} />)}</div>
                  <span style={{ fontSize: '9px', color: '#3C3835' }}>반복 빈도</span>
                  <div style={{ marginLeft: 'auto', color: '#57534E' }}>→</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 선택 — 선택 뷰 */}
        {section === 'pattern' && view === 'choice' && selPat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: '#57534E', fontSize: '16px', cursor: 'pointer', padding: 0 }}>←</button>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selPat.zc }} />
              <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selPat.title}</div>
              <span style={{ fontSize: '10px', fontWeight: 400, color: '#57534E', background: '#2A2624', borderRadius: '4px', padding: '2px 6px' }}>{selPat.from}</span>
            </div>
            <div style={{ background: '#7BA8C408', border: '1px solid #7BA8C422', borderRadius: '10px', padding: '10px 13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#7BA8C415', border: '1px solid #7BA8C444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#7BA8C4' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>{frostBarText}</div>
                <div style={{ fontSize: '9px', color: '#7BA8C477', marginTop: '2px' }}>Frost</div>
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif" }}>이 패턴과 어떻게 지낼 건가요?</div>

            {(['accept', 'change', 'leave'] as ChoiceType[]).map(type => {
              const cd = CD[type];
              const isSelected = selChoice === type;
              return (
                <div key={type} style={{ background: '#242120', border: `1px solid ${isSelected ? AC + '44' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                  <div onClick={() => { setSelChoice(type); setChoiceExpanded(prev => ({ ...prev, [type]: !prev[type] })); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 400, color: isSelected ? AC : '#E7E5E4' }}>{cd.title}</div>
                      <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', marginTop: '3px', lineHeight: 1.5 }}>{cd.desc}</div>
                    </div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${isSelected ? AC : '#3C3835'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: AC }} />}
                    </div>
                  </div>
                  {isSelected && choiceExpanded[type] && (
                    <div style={{ borderTop: '1px solid #2A2624' }}>
                      {cd.stages.map((s, idx) => {
                        const key = `${type}-${idx}`;
                        return (
                          <div key={idx} style={{ borderBottom: idx < 2 ? '1px solid #2A2624' : 'none' }}>
                            <div onClick={() => setStageOpen(prev => ({ ...prev, [key]: !prev[key] }))} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', cursor: 'pointer' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2A2624', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '11px', fontWeight: 400, color: '#78716C' }}>{idx + 1}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: '10px', fontWeight: 400, color: '#57534E' }}>{s.lbl}</div>
                                <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E' }}>{s.title}</div>
                              </div>
                            </div>
                            {stageOpen[key] && (
                              <div style={{ padding: '0 14px 12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 300, color: '#78716C', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif", marginBottom: '10px' }}>{s.text}</div>
                                {s.note && (
                                  <textarea value={stageNotes[key] || ''} onChange={e => setStageNotes(prev => ({ ...prev, [key]: e.target.value }))} placeholder="여기에..." style={{ width: '100%', minHeight: '60px', background: '#1C1917', border: '1px solid #3C3835', borderRadius: '8px', padding: '8px', color: '#E7E5E4', fontSize: '12px', fontWeight: 300, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />
                                )}
                                <div style={{ background: s.ai === 'amber' ? '#D4A5740A' : '#7BA8C408', border: `1px solid ${s.ai === 'amber' ? '#D4A57422' : '#7BA8C422'}`, borderRadius: '8px', padding: '8px 10px' }}>
                                  <div style={{ fontSize: '10px', fontWeight: 400, color: s.ai === 'amber' ? '#D4A574' : '#7BA8C4', marginBottom: '3px' }}>{s.ai === 'amber' ? 'Amber' : 'Frost'}</div>
                                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5 }}>{s.aiTxt}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {selChoice && (
              <button onClick={() => setSection('practice')} style={{ width: '100%', padding: '13px', background: AC, border: 'none', borderRadius: '12px', color: '#1C1917', fontSize: '14px', fontWeight: 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '4px' }}>실천으로 이어가기</button>
            )}
          </div>
        )}

        {/* 실천 탭 */}
        {section === 'practice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!selChoice ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 300, color: '#57534E', textAlign: 'center', lineHeight: 1.6 }}>먼저 어떤 고민과<br />마주할지 선택해주세요.</div>
                <button onClick={() => setSection('pattern')} style={{ padding: '8px 20px', background: 'none', border: `1px solid ${AC}44`, borderRadius: '20px', color: AC, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>고민 선택하기</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${AC}15`, border: `1px solid ${AC}33`, borderRadius: '20px', padding: '4px 10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: AC }} />
                    <span style={{ fontSize: '11px', fontWeight: 300, color: AC }}>{currentCD!.badge}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif" }}>{currentCD!.ptitle}</div>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#57534E', marginTop: '3px' }}>{currentCD!.psub}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0,1,2].map(i => {
                    const isDone = stageDone[i];
                    const isActive = !isDone && (i === 0 || stageDone[i-1]);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? AC : isActive ? `${AC}22` : '#2A2624', border: `1px solid ${isDone ? AC : isActive ? AC + '44' : '#3C3835'}` }}>
                          <span style={{ fontSize: '12px', fontWeight: 400, color: isDone ? '#1C1917' : isActive ? AC : '#57534E' }}>{i+1}</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 300, color: isDone ? AC : '#57534E' }}>{currentCD!.stages[i].lbl}</span>
                      </div>
                    );
                  })}
                </div>
                {currentCD!.stages.map((s, idx) => (
                  <div key={idx} style={{ background: '#242120', border: `1px solid ${stageDone[idx] ? AC + '44' : '#2A2624'}`, borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px' }}>
                      <button onClick={() => { const next = [...stageDone]; next[idx] = !next[idx]; setStageDone(next); }} style={{ width: '22px', height: '22px', borderRadius: '50%', border: `1px solid ${stageDone[idx] ? AC : '#3C3835'}`, background: stageDone[idx] ? AC : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}>
                        {stageDone[idx] && <span style={{ fontSize: '11px', color: '#1C1917' }}>✓</span>}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: 400, color: '#57534E', marginBottom: '2px' }}>{s.lbl}</div>
                        <div style={{ fontSize: '14px', fontWeight: 300, color: stageDone[idx] ? '#57534E' : '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", textDecoration: stageDone[idx] ? 'line-through' : 'none' }}>{s.title}</div>
                        <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', marginTop: '3px', lineHeight: 1.5 }}>{s.text}</div>
                      </div>
                    </div>
                    {s.note && (
                      <div style={{ padding: '0 14px 12px' }}>
                        <textarea placeholder="여기에..." style={{ width: '100%', minHeight: '55px', background: '#1C1917', border: '1px solid #3C3835', borderRadius: '8px', padding: '8px', color: '#E7E5E4', fontSize: '12px', fontWeight: 300, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ background: '#242120', border: '1px solid #2A2624', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.08em', color: '#57534E', marginBottom: '5px' }}>다음 단계</div>
                  <div style={{ fontSize: '13px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif", marginBottom: '10px' }}>여기서 한 선택과 실천이 Me에 쌓여요.</div>
                  <button onClick={() => navigate('/home/me')} style={{ padding: '7px 18px', background: 'none', border: `1px solid ${AC}44`, borderRadius: '20px', color: AC, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Me에서 변화 보기</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 커뮤니티 탭 */}
        {section === 'community' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 300, color: '#57534E' }}>같은 선택을 한 사람들이에요. 읽는 공간이에요.</div>
            {GROUPS.map((g, i) => {
              const isMyChoice = selChoice !== null && g.choice === selChoice;
              return (
                <div key={i} onClick={() => setGroupOpen(prev => ({ ...prev, [i]: !prev[i] }))} style={{ background: '#242120', border: `1px solid ${isMyChoice ? AC + '33' : '#2A2624'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '13px', fontWeight: 400, color: '#E7E5E4', flex: 1, marginRight: '8px' }}>{g.name}</div>
                    <div style={{ fontSize: '11px', color: '#57534E' }}>{g.count}명</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#78716C', marginTop: '4px' }}>{g.desc}</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '7px' }}>
                    {isMyChoice && <span style={{ fontSize: '10px', fontWeight: 400, color: AC, background: `${AC}15`, border: `1px solid ${AC}33`, borderRadius: '4px', padding: '2px 7px' }}>내 선택</span>}
                    {g.tags.map(t => <span key={t} style={{ fontSize: '10px', fontWeight: 300, color: '#57534E', background: '#2A2624', borderRadius: '4px', padding: '2px 7px' }}>{t}</span>)}
                  </div>
                  {groupOpen[i] && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {g.entries.map((entry, j) => <div key={j} style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', serif", padding: '8px', background: '#1C1917', borderRadius: '8px' }}>{entry}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI 시트 */}
      {sheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div onClick={() => setSheetOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#242120', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', maxHeight: '70dvh' }}>
            <div style={{ width: '36px', height: '4px', background: '#3C3835', borderRadius: '2px', margin: '10px auto 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #2A2624' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: sheetType === 'amber' ? '#D4A57415' : '#7BA8C415', border: `1px solid ${sheetType === 'amber' ? '#D4A57444' : '#7BA8C444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: sheetType === 'amber' ? '#D4A574' : '#7BA8C4' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 400, color: '#E7E5E4' }}>{sheetType === 'amber' ? amberName : frostName}</div>
                <div style={{ fontSize: '10px', fontWeight: 300, color: '#57534E' }}>{AI_DATA[sheetType].role}</div>
              </div>
              <button onClick={() => setSheetOpen(false)} style={{ background: 'none', border: 'none', color: '#57534E', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>
              {chatHist[sheetType].map((m, i) => m.role === 'ai' ? (
                <div key={i} style={{ background: sheetType === 'amber' ? '#D4A5740A' : '#7BA8C408', border: `1px solid ${sheetType === 'amber' ? '#D4A57422' : '#7BA8C422'}`, borderRadius: '11px 11px 11px 3px', padding: '10px 13px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 300, color: '#E7E5E4', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.55 }}>{m.text}</div>
                  {m.tone && <div style={{ fontSize: '9px', fontWeight: 300, color: sheetType === 'amber' ? '#D4A57477' : '#7BA8C477', marginTop: '2px' }}>{m.tone}</div>}
                </div>
              ) : (
                <div key={i} style={{ background: `${AC}09`, border: `1px solid ${AC}22`, borderRadius: '11px 11px 3px 11px', padding: '9px 13px', alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: '#A8A29E', lineHeight: 1.6 }}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '7px 13px 13px', borderTop: '1px solid #2A2624', display: 'flex', gap: '7px', alignItems: 'center' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder={`${sheetType === 'amber' ? amberName : frostName}에게 말해요...`} style={{ flex: 1, background: '#242120', border: '1px solid #3C3835', borderRadius: '20px', padding: '7px 12px', color: '#A8A29E', fontSize: '12px', fontWeight: 300, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={sendMsg} style={{ width: '28px', height: '28px', borderRadius: '50%', background: sheetType === 'amber' ? '#D4A574' : '#7BA8C4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 11V1M1 6l5-5 5 5" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
