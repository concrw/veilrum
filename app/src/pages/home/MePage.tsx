import { useState, useEffect, useRef, useCallback } from 'react';
import { AmberBtn, FrostBtn } from '../../layouts/HomeLayout';
import { useAmberAttention } from '../../hooks/useAmberAttention';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useUserProfile } from '../../context/UserProfileContext';

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#1C1917', bg2: '#242120', bg3: '#292524',
  border: '#3C3835', border2: '#2A2624',
  text: '#E7E5E4', text2: '#A8A29E', text3: '#78716C',
  text4: '#57534E', text5: '#3C3835',
  amber: '#D4A574', amberGold: '#E7C17A', amberDim: '#A07850',
  frost: '#7BA8C4',
};

// ── Static data (TODO: replace with Supabase) ─────────────────────────────────
const ZONES = [
  { layer: 'social', title: '사회적인 나', color: C.frost, sub: '직장, 처음 만남, SNS, 공식 자리',
    items: [
      { id: 's1', name: '직장/학교에서의 나',    desc: '완벽하게 통제된 나',      sensitive: false, defaultOn: true  },
      { id: 's2', name: '처음 만나는 사람 앞',   desc: '과하게 친절한 나',        sensitive: false, defaultOn: true  },
      { id: 's3', name: 'SNS에서의 나',          desc: '보여주고 싶은 나',        sensitive: false, defaultOn: true  },
      { id: 's4', name: '공식적인 자리에서',     desc: '역할로만 존재하는 나',    sensitive: false, defaultOn: false },
    ]},
  { layer: 'daily', title: '일상적인 나', color: C.amber, sub: '가족, 친구, 연인, 혼자',
    items: [
      { id: 'd1', name: '가족 안에서의 나',       desc: '항상 괜찮은 척하는 나',  sensitive: false, defaultOn: true  },
      { id: 'd2', name: '친한 친구 앞에서',       desc: '진짜에 가장 가까운 나',  sensitive: false, defaultOn: true  },
      { id: 'd3', name: '연인/파트너 앞에서',     desc: '가장 불안한 나',         sensitive: true,  defaultOn: true  },
      { id: 'd4', name: '혼자 있을 때의 나',      desc: '아무도 없을 때 무너지는 나', sensitive: false, defaultOn: true  },
    ]},
  { layer: 'secret', title: '비밀스러운 나', color: C.amberDim, sub: '감정 비밀, 관계 비밀, 욕망, 수치심, 야망',
    items: [
      { id: 't1', name: '감정적 비밀',    desc: '말 못 한 상처들',          sensitive: true,  defaultOn: true  },
      { id: 't2', name: '관계적 비밀',    desc: '드러내기 두려운 관계 패턴', sensitive: true, defaultOn: true  },
      { id: 't3', name: '욕망/성적 영역', desc: '억눌러온 욕구들',          sensitive: true,  defaultOn: false },
      { id: 't4', name: '수치심 영역',    desc: '가장 숨기고 싶은 것',      sensitive: true,  defaultOn: false },
      { id: 't5', name: '야망/욕심 영역', desc: '인정받고 싶은 나',         sensitive: false, defaultOn: true  },
    ]},
];

const TOTAL_ZONES = ZONES.reduce((sum, g) => sum + g.items.length, 0);

const RADAR_DATA = {
  prev: { axes: ['애착', '소통', '욕구', '역할'], vals: [52, 44, 38, 81] },
  now:  { axes: ['애착', '소통', '욕구', '역할'], vals: [63, 59, 45, 77] },
};

const PERSONAS = [
  { name: '"역할자" 나', color: C.frost, zone: '사회적인 나 전체',
    desc: '직장, 공식 자리, 처음 만나는 사람 앞에서 완벽하게 통제된 모습을 보여요. 실수를 용납하지 않고 항상 능숙해 보이려 해요.',
    tags: ['통제', '완벽주의', '역할 고착'],
    conflict: '혼자 있을 때의 나와 극명히 달라요. "역할자"일 때 아무것도 필요 없는 척하다가, 혼자서 무너져요.' },
  { name: '"맞춰주는" 나', color: C.amber, zone: '연인/가족 앞',
    desc: '가까운 사람 앞에서 상대의 기분에 따라 내 모습이 달라져요. 원하는 게 있어도 말하지 못하고 상대가 원하는 걸 먼저 해요.',
    tags: ['불안 애착', '자기 소거', '감정 연동'],
    conflict: '"역할자" 나는 아무것도 필요 없는 척하는데, "맞춰주는" 나는 상대에게 집착해요. 둘 다 진짜 욕구를 숨기는 방식이에요.' },
  { name: '"무너지는" 나', color: C.amberDim, zone: '혼자 있을 때',
    desc: '아무도 없을 때야 비로소 피곤함이 나와요. 낮에 쌓인 것들이 한꺼번에 무너지고, 아무것도 하기 싫어져요.',
    tags: ['감정 억압 해소', '고립', '燃盡'],
    conflict: '밖에서 완벽한 척한 대가를 혼자서 치러요. 이 나가 존재한다는 걸 아무도 몰라요.' },
  { name: '"진짜에 가까운" 나', color: C.amberGold, zone: '친한 친구 앞',
    desc: '가장 오래된 친구 앞에서만 간헐적으로 진짜가 나와요. 그런데도 전부를 보여주진 않아요. 비밀스러운 나는 여기서도 숨겨져요.',
    tags: ['간헐적 진정성', '신뢰 관계', '불완전한 개방'],
    conflict: '가장 진짜에 가깝지만, 그래도 절반만 보여줘요. 욕망과 수치심 영역은 여기서도 닫혀 있어요.' },
];

const PEOPLE = [
  { name: '지아', rel: '연인 · 3년', color: C.amber,
    pattern: '지아의 기분이 가라앉으면 내가 뭔가 잘못한 것 같아요. 확인하고 달래주려 하고, 그게 반복돼요.',
    conflict: '나는 연인 앞에서 원하는 게 없는 척해요. 그러다 쌓이면 갑자기 냉정해져요.',
    tags: ['불안 애착', '감정 연동', '소통 단절'] },
  { name: '엄마', rel: '가족 · 핵심 관계', color: C.amberDim,
    pattern: '엄마 앞에서는 항상 "잘 지내요"예요. 힘들어도 말 안 해요. 약해 보이기 싫어서예요.',
    conflict: '"역할자" 나의 기원이 여기예요. 엄마 앞에서 처음으로 "완벽한 아이"가 됐어요.',
    tags: ['감정 억제', '역할 고착', '기원 관계'] },
  { name: '재현', rel: '친구 · 15년', color: C.frost,
    pattern: '재현한테는 가장 솔직한 편이에요. 근데 여전히 욕망이나 수치심은 말 못 해요.',
    conflict: '가장 가까운데도 전부를 못 보여줘요. "진짜에 가까운 나"가 여기서도 한계가 있어요.',
    tags: ['부분적 신뢰', '이미지 관리', '비밀 유지'] },
  { name: '팀장님', rel: '직장 · 권위 관계', color: C.text4,
    pattern: '팀장님 앞에서 실수를 절대 인정 못 해요. 인정하면 무너질 것 같아서요.',
    conflict: '권위 있는 사람 앞에서 "역할자"가 가장 극단적으로 나와요.',
    tags: ['권위 관계', '방어적 반응', '인정 욕구'] },
];

const FRIENDS = [
  { name: '서연', av: '서', color: C.amber, match: '89%',
    reason: '애착 불안 + 관계에서 자기 소거 패턴. 비슷한 고민을 겪고 있어요.' },
  { name: '민준', av: '민', color: C.frost, match: '82%',
    reason: '역할로만 살다가 지친 패턴. 직장 맥락에서 비슷한 페르소나를 가졌어요.' },
  { name: '하은', av: '하', color: C.amberDim, match: '77%',
    reason: '감정을 말하지 못하고 혼자 삭이는 패턴. 같은 고민을 지나온 사람이에요.' },
];

const LANG_LABELS: Record<string, string> = { ko: '한국어', en: 'English', ja: '日本語' };

// ── Radar chart (SVG) ─────────────────────────────────────────────────────────
function RadarChart({ mode }: { mode: 'prev' | 'now' }) {
  const data = RADAR_DATA[mode];
  const prev = RADAR_DATA.prev;
  const cx = 75, cy = 75, r = 52;
  const n = data.axes.length;
  const angles = data.axes.map((_, i) => (Math.PI * 2 * i / n) - Math.PI / 2);

  const pt = (val: number, idx: number) => ({
    x: cx + r * (val / 100) * Math.cos(angles[idx]),
    y: cy + r * (val / 100) * Math.sin(angles[idx]),
  });
  const ptFull = (ratio: number, idx: number) => ({
    x: cx + r * ratio * Math.cos(angles[idx]),
    y: cy + r * ratio * Math.sin(angles[idx]),
  });

  const gridPaths = [0.25, 0.5, 0.75, 1].map(ratio => {
    const pts = angles.map((_, i) => ptFull(ratio, i));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  });

  const prevPts = prev.vals.map((v, i) => pt(v, i));
  const prevPath = prevPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  const nowPts = data.vals.map((v, i) => pt(v, i));
  const nowPath = nowPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width="150" height="150" viewBox="0 0 150 150">
      {gridPaths.map((d, i) => <path key={i} d={d} fill="none" stroke={C.border2} strokeWidth="1" />)}
      {angles.map((_, i) => {
        const p = ptFull(1, i);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border2} strokeWidth="1" />;
      })}
      {mode === 'now' && (
        <path d={prevPath} fill={`${C.amberGold}06`} stroke={`${C.amberGold}33`} strokeWidth="1.5" strokeDasharray="3,3" />
      )}
      <path d={nowPath} fill={`${C.amberGold}14`} stroke={C.amberGold} strokeWidth="1.8" />
      {nowPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.amberGold} />)}
      {angles.map((_, i) => {
        const p = ptFull(1.22, i);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill={C.text4} fontFamily="DM Sans, sans-serif">
            {data.axes[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Toggle component ──────────────────────────────────────────────────────────
function ZoneToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      style={{
        width: 36, height: 20, borderRadius: 99, flexShrink: 0, cursor: 'pointer', position: 'relative',
        background: on ? `${C.amberGold}33` : C.border2,
        border: `1px solid ${on ? `${C.amberGold}66` : C.border}`,
        transition: 'all .25s',
      }}
    >
      <span style={{
        width: 14, height: 14, borderRadius: '50%', position: 'absolute', top: 2,
        left: on ? 18 : 2, background: on ? C.amberGold : C.text4, transition: 'all .25s', display: 'block',
      }} />
    </button>
  );
}

// ── AI Sheet ──────────────────────────────────────────────────────────────────
interface Msg { role: 'ai' | 'user'; text: string }

function AISheet({
  open, type, aiName, onClose,
}: {
  open: boolean; type: 'amber' | 'frost'; aiName: string; onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const color = type === 'amber' ? C.amber : C.frost;
  const role = type === 'amber' ? '비서 · F모드' : '닥터 · T모드';

  useEffect(() => {
    if (open && msgs.length === 0) {
      const greeting = type === 'amber'
        ? '안녕하세요. 오늘 나에 대해 더 알고 싶은 게 있나요?'
        : '데이터를 분석할 준비가 됐어요. 어떤 패턴을 살펴볼까요?';
      setMsgs([{ role: 'ai', text: greeting }]);
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const AMBER_POOL = [
    '그 마음, 잘 들었어요. 조금 더 이야기해줄 수 있어요?',
    '그 감정이 언제 가장 강하게 올라와요?',
    '지금 나에 대해 새롭게 알게 된 게 있어요?',
    '어떤 관계에서 그게 가장 많이 나타나요?',
    '그 페르소나가 언제부터 있었던 것 같아요?',
    '그 패턴이 당신을 어떻게 보호해왔어요?',
    '지금 가장 달라지고 싶은 게 뭐예요?',
    '오늘 어떤 상황이 있었어요?',
    '그게 지금 어떤 기분이에요?',
    '어떤 관계에서 진짜 나와 가장 가까운 것 같아요?',
  ];
  const FROST_POOL = [
    '흥미로운 패턴이에요. 데이터를 더 모아야 정확해질 것 같아요.',
    '이 반응이 얼마나 자주 반복돼요?',
    '어떤 트리거가 이 패턴을 활성화해요?',
    '4축 점수와 연결해서 생각해봐요. 어떤 축이 이 상황에서 가장 크게 작동했어요?',
    'Zone 데이터를 보면 닫힌 영역과 연결될 수 있어요.',
    '감정이 아니라 행동 패턴으로 봐요. 어떤 행동이 반복됐어요?',
    '이 패턴의 보상 구조가 뭔지 알면 더 빨리 이해할 수 있어요.',
    '변화를 원한다면 — 어떤 상황에서 이 패턴이 작동 안 했는지 찾는 게 먼저예요.',
  ];

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMsgs(prev => [...prev, { role: 'user', text: t }]);
    setInput('');
    const pool = type === 'amber' ? AMBER_POOL : FROST_POOL;
    const reply = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      setMsgs(prev => [...prev, { role: 'ai', text: reply }]);
    }, 900);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 30,
          opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
          transition: 'opacity .3s',
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: C.bg,
          borderRadius: '20px 20px 0 0', border: `1px solid #44403C`, borderBottom: 'none',
          zIndex: 31, display: 'flex', flexDirection: 'column', maxHeight: '75%',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div style={{ width: 32, height: 3, borderRadius: 99, background: C.border, margin: '10px auto 0' }} />
        <div style={{ padding: '10px 18px 8px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, border: `1px solid ${color}44` }}>
            <span style={{ width: 17, height: 17, borderRadius: '50%', background: color, display: 'block' }} />
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, flex: 1 }}>{aiName}</span>
          <span style={{ fontSize: 10, color: C.text4 }}>{role}</span>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.text4, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '11px 17px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          {msgs.map((m, i) => m.role === 'ai' ? (
            <div key={i} style={{ borderRadius: '11px 11px 11px 3px', padding: '10px 13px', background: `${color}0A`, border: `1px solid ${color}22` }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.text, lineHeight: 1.55 }}>{m.text}</p>
              <p style={{ fontSize: 9, color: `${color}77`, marginTop: 2 }}>{type === 'amber' ? 'F-mode' : 'T-mode'}</p>
            </div>
          ) : (
            <div key={i} style={{ background: `${C.amberGold}0D`, border: `1px solid ${C.amberGold}22`, borderRadius: '11px 11px 3px 11px', padding: '9px 13px', alignSelf: 'flex-end', maxWidth: '85%' }}>
              <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.6 }}>{m.text}</p>
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, padding: '7px 13px 13px', borderTop: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', gap: 7 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="말해요..."
            style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 20, padding: '7px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.text2, outline: 'none' }}
          />
          <button onClick={send} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 11V1M1 6l5-5 5 5" stroke={C.bg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ── Settings sheet ─────────────────────────────────────────────────────────────
function SettingsSheet({
  open, onClose, amberName, frostName,
  onRenameAmber, onRenameFrost, lang, onChangeLang,
}: {
  open: boolean; onClose: () => void;
  amberName: string; frostName: string;
  onRenameAmber: () => void; onRenameFrost: () => void;
  lang: string; onChangeLang: (l: string) => void;
}) {
  const [langOpen, setLangOpen] = useState(false);
  const [notifAmber, setNotifAmber] = useState(true);
  const [notifReport, setNotifReport] = useState(true);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity .3s' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: C.bg,
        borderRadius: '22px 22px 0 0', border: `1px solid #44403C`, borderBottom: 'none',
        zIndex: 41, display: 'flex', flexDirection: 'column', maxHeight: '85%',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ width: 32, height: 3, borderRadius: 99, background: C.border, margin: '10px auto 0', flexShrink: 0 }} />
        <div style={{ padding: '12px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 18, color: C.text }}>설정</span>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.text4, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 언어 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>언어</p>
          <div onClick={() => setLangOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={C.text3} strokeWidth="1.2"/><path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8S8 14.5 8 14.5M1.5 8h13" stroke={C.text3} strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>언어 설정</p>
              <p style={{ fontSize: 10, color: C.text4 }}>앱 전체 언어를 변경해요</p>
            </div>
            <span style={{ fontSize: 11, color: C.text3 }}>{LANG_LABELS[lang]}</span>
            <span style={{ fontSize: 11, color: C.text5, transform: langOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
          </div>
          {langOpen && (
            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, overflow: 'hidden' }}>
              {['ko', 'en', 'ja'].map(l => (
                <div key={l} onClick={() => { onChangeLang(l); setLangOpen(false); }}
                  style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: l !== 'ja' ? `1px solid ${C.border2}` : 'none', cursor: 'pointer', background: lang === l ? `${C.amberGold}08` : 'transparent' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.text }}>{LANG_LABELS[l]}</span>
                  <span style={{ fontSize: 11, color: C.amberGold, opacity: lang === l ? 1 : 0 }}>✓</span>
                </div>
              ))}
            </div>
          )}

          {/* AI 캐릭터 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>AI 캐릭터</p>
          {[
            { name: amberName, sub: '비서 · F모드', color: C.amber, onClick: onRenameAmber },
            { name: frostName, sub: '닥터 · T모드', color: C.frost, onClick: onRenameFrost },
          ].map((ai, i) => (
            <div key={i} onClick={ai.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${ai.color}15`, border: `1px solid ${ai.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: ai.color, display: 'block' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>{ai.name}</p>
                <p style={{ fontSize: 10, color: C.text4 }}>{ai.sub}</p>
              </div>
              <span style={{ fontSize: 11, color: C.text3 }}>이름 변경</span>
              <span style={{ fontSize: 11, color: C.text5 }}>›</span>
            </div>
          ))}

          {/* 알림 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>알림</p>
          {[
            { label: 'Amber 알림', sub: '패시브 모드 푸시 알림', on: notifAmber, set: setNotifAmber },
            { label: '주간 리포트 알림', sub: '매주 월요일 오전', on: notifReport, set: setNotifReport },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔔</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>{row.label}</p>
                <p style={{ fontSize: 10, color: C.text4 }}>{row.sub}</p>
              </div>
              <ZoneToggle on={row.on} onToggle={() => row.set((v: boolean) => !v)} />
            </div>
          ))}

          {/* 구독 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>구독</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>구독 관리</p>
              <p style={{ fontSize: 10, color: C.text4 }}>갱신일 2026년 4월 20일</p>
            </div>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, border: `1px solid ${C.amberGold}44`, color: C.amberGold, background: `${C.amberGold}08` }}>Pro</span>
            <span style={{ fontSize: 11, color: C.text5 }}>›</span>
          </div>

          {/* 개인정보 */}
          <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.09em', textTransform: 'uppercase', color: C.text5, padding: '8px 0 4px' }}>개인정보 & 계정</p>
          {['데이터 및 개인정보', '계정 설정'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 11, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.text, marginBottom: 1 }}>{label}</p>
              </div>
              <span style={{ fontSize: 11, color: C.text5 }}>›</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: C.bg2, border: `1px solid #C0807033`, borderRadius: 11, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 11l3-3-3-3M13 8H6M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6" stroke="#C08070" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#C08070' }}>로그아웃</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Rename sheet ───────────────────────────────────────────────────────────────
function RenameSheet({
  open, onClose, title, currentName, onApply,
}: {
  open: boolean; onClose: () => void; title: string; currentName: string; onApply: (n: string) => void;
}) {
  const [val, setVal] = useState('');
  useEffect(() => { if (open) setVal(currentName); }, [open, currentName]);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity .3s' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: C.bg,
        borderRadius: '22px 22px 0 0', border: `1px solid #44403C`, borderBottom: 'none',
        zIndex: 51, maxHeight: '50%', display: 'flex', flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ width: 32, height: 3, borderRadius: 99, background: C.border, margin: '10px auto 0', flexShrink: 0 }} />
        <div style={{ padding: '12px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 18, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.text4, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, color: C.text4 }}>이 캐릭터를 뭐라고 부를까요? 언제든 바꿀 수 있어요.</p>
          <input
            value={val} onChange={e => setVal(e.target.value)}
            placeholder="새 이름을 입력해요..."
            style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text2, outline: 'none', width: '100%' }}
          />
          <button
            onClick={() => { if (val.trim()) { onApply(val.trim()); onClose(); } }}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: C.amberGold, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 400, color: C.bg, cursor: 'pointer' }}
          >적용하기</button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MePage() {
  type Tab = 'growth' | 'people' | 'zone';
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('growth');

  // Zone 상태 — persona_zones 테이블과 동기화
  const [zoneState, setZoneState] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ZONES.forEach(g => g.items.forEach(item => { init[item.id] = item.defaultOn; }));
    return init;
  });
  const [zonesLoaded, setZonesLoaded] = useState(false);

  // persona_zones 로드
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .schema('veilrum')
      .from('persona_zones')
      .select('sub_zone, is_enabled')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const loaded: Record<string, boolean> = {};
          (data as { sub_zone: string; is_enabled: boolean }[]).forEach(
            row => { loaded[row.sub_zone] = row.is_enabled; }
          );
          setZoneState(prev => ({ ...prev, ...loaded }));
        }
        setZonesLoaded(true);
      });
  }, [user]);

  // zone 토글 → Supabase UPDATE
  const toggleZone = useCallback(async (id: string) => {
    if (!user) return;
    const newVal = !zoneState[id];
    setZoneState(prev => ({ ...prev, [id]: newVal }));
    await (supabase as any)
      .schema('veilrum')
      .from('persona_zones')
      .upsert({
        user_id: user.id,
        sub_zone: id,
        is_enabled: newVal,
        layer: ZONES.find(g => g.items.some(i => i.id === id))?.layer ?? 'social',
        enabled_at: new Date().toISOString(),
      }, { onConflict: 'user_id,sub_zone' });
  }, [user, zoneState]);

  const { amberName, frostName, renameAmber, renameFrost } = useUserProfile();
  const [chartMode, setChartMode] = useState<'prev' | 'now'>('now');
  const [openPersona, setOpenPersona] = useState<number | null>(null);
  const [openPerson, setOpenPerson] = useState<number | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [reportOpen, setReportOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [aiSheet, setAiSheet] = useState<'amber' | 'frost' | null>(null);
  const amberFlash = useAmberAttention();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<'amber' | 'frost' | null>(null);
  const [lang, setLang] = useState('ko');
  const [dmToast, setDmToast] = useState('');
  const [shareToast, setShareToast] = useState(false);

  const calcPct = useCallback(() => {
    const on = Object.values(zoneState).filter(Boolean).length;
    return Math.round(on / TOTAL_ZONES * 100);
  }, [zoneState]);

  const pct = calcPct();
  const closedCount = Object.values(zoneState).filter(v => !v).length;

  const seedTitle = pct < 40 ? '씨앗을 심었어요' : pct < 65 ? '패턴이 보이기 시작했어요' : pct < 85 ? '뿌리를 내리는 중' : '꽃이 피어나고 있어요';

  const SEED_STAGES = [
    { icon: '🌱', label: '씨앗\n심기',   threshold: 0  },
    { icon: '🌿', label: '패턴\n발견',   threshold: 40 },
    { icon: '🌳', label: '뿌리\n내리기', threshold: 65 },
    { icon: '🌸', label: '꽃\n피우기',   threshold: 85 },
  ];

  const stageStatus = (i: number) => {
    const next = SEED_STAGES[i + 1]?.threshold ?? 101;
    if (pct >= next) return 'done';
    if (pct >= SEED_STAGES[i].threshold) return 'active';
    return 'none';
  };

  const sendDM = (name: string) => {
    setDmToast(`${name}에게 대화 신청을 보냈어요 💬`);
    setTimeout(() => setDmToast(''), 2200);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'growth', label: '나의 성장' },
    { id: 'people', label: '내 사람들' },
    { id: 'zone',   label: 'Zone'     },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px 9px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border2}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 22, color: C.text, lineHeight: 1 }}>ME</span>
          <span style={{ fontSize: 10, fontWeight: 300, color: C.text4, letterSpacing: '.02em' }}>나를 알아가고 있어요</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setSettingsOpen(true)} style={{ width: 28, height: 28, borderRadius: '50%', background: C.border2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke={C.text3} strokeWidth="1.2"/>
              <path d="M13.3 6.7l-.9-.5a5.1 5.1 0 0 0 0-1.4l.9-.5a.5.5 0 0 0 .2-.7l-1-1.7a.5.5 0 0 0-.7-.2l-.9.5a5 5 0 0 0-1.2-.7V1a.5.5 0 0 0-.5-.5H6.8A.5.5 0 0 0 6.3 1v1a5 5 0 0 0-1.2.7l-.9-.5a.5.5 0 0 0-.7.2l-1 1.7a.5.5 0 0 0 .2.7l.9.5a5.1 5.1 0 0 0 0 1.4l-.9.5a.5.5 0 0 0-.2.7l1 1.7a.5.5 0 0 0 .7.2l.9-.5a5 5 0 0 0 1.2.7V15a.5.5 0 0 0 .5.5h2.4a.5.5 0 0 0 .5-.5v-1a5 5 0 0 0 1.2-.7l.9.5a.5.5 0 0 0 .7-.2l1-1.7a.5.5 0 0 0-.2-.7z" stroke={C.text3} strokeWidth="1.2"/>
            </svg>
          </button>
          <AmberBtn onClick={() => setAiSheet('amber')} flash={amberFlash} />
          <FrostBtn onClick={() => setAiSheet('frost')} />
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border2}`, padding: '0 20px', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontSize: 11, fontWeight: tab === t.id ? 400 : 300, color: tab === t.id ? C.amberGold : C.text4, padding: '10px 0', marginRight: 20, background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t.id ? C.amberGold : 'transparent'}`, cursor: 'pointer', transition: 'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Growth tab ── */}
      {tab === 'growth' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 80px', display: 'flex', flexDirection: 'column', gap: 11 }}>

          {/* Seed card */}
          <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '17px 19px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 13 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.08em', textTransform: 'uppercase', color: C.amberGold, marginBottom: 5 }}>나의 씨앗</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 21, color: C.text, lineHeight: 1.2 }}>{seedTitle}</p>
                <p style={{ fontSize: 10, fontWeight: 300, color: C.text4, marginTop: 3, lineHeight: 1.4 }}>대화 63회 · 통찰 14개 · 선택 5개<br />3개 관계 영역에서 패턴 발견됨</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 34, color: C.text, lineHeight: 1 }}>{pct}</span>
                  <span style={{ fontSize: 11, fontWeight: 300, color: C.text3 }}>%</span>
                </div>
                <p style={{ fontSize: 9, fontWeight: 300, color: C.text4, marginTop: 2 }}>정밀도</p>
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <div style={{ height: 4, background: C.border2, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${C.amberGold},${C.amber})`, width: `${pct}%`, transition: 'width .8s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                {['씨앗', '새싹', '뿌리', '꽃'].map(l => <span key={l} style={{ fontSize: 9, fontWeight: 300, color: C.text5 }}>{l}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {SEED_STAGES.map((s, i) => {
                const st = stageStatus(i);
                const bgColor = st === 'none' ? C.bg : st === 'active' ? `${C.amberGold}0D` : `${C.amberGold}06`;
                const borderColor = st === 'none' ? C.border : st === 'active' ? `${C.amberGold}55` : `${C.amberGold}33`;
                const textColor = st === 'none' ? C.text5 : st === 'active' ? C.amberGold : C.text3;
                return (
                  <div key={i} style={{ flex: 1, background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '8px 6px', textAlign: 'center', transition: 'all .3s' }}>
                    <div style={{ fontSize: 13, marginBottom: 3 }}>{s.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 300, color: textColor, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frost bar */}
          {closedCount > 0 && (
            <div className="vr-fade-in" style={{ background: `${C.frost}08`, border: `1px solid ${C.frost}22`, borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 17, height: 17, borderRadius: '50%', background: `${C.frost}15`, border: `1px solid ${C.frost}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.frost, display: 'block' }} />
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 12, color: C.text3, flex: 1, lineHeight: 1.5 }}>
                "현재 정밀도 {pct}%. {closedCount}개 영역이 닫혀 있어요. 열면 더 정확해져요."
              </p>
              <span style={{ fontSize: 9, color: C.text5, flexShrink: 0, marginTop: 2 }}>Frost</span>
            </div>
          )}

          {/* Multi-persona */}
          <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '15px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text }}>멀티페르소나</span>
              <span style={{ fontSize: 9, fontWeight: 300, color: C.text4 }}>{PERSONAS.length}개 발견됨</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PERSONAS.map((p, i) => {
                const isOpen = openPersona === i;
                return (
                  <div key={i} onClick={() => setOpenPersona(isOpen ? null : i)}
                    style={{ background: isOpen ? `${C.amberGold}06` : C.bg, border: `1px solid ${isOpen ? `${C.amberGold}44` : C.border}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'all .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'block' }} />
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 14, color: C.text, flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, border: `1px solid ${isOpen ? `${C.amberGold}33` : C.border}`, color: isOpen ? C.amberGold : C.text4 }}>{p.zone}</span>
                    </div>
                    {isOpen && (
                      <div style={{ paddingTop: 9, marginTop: 9, borderTop: `1px solid ${C.border2}` }}>
                        <p style={{ fontSize: 11, fontWeight: 300, color: C.text3, lineHeight: 1.55, marginBottom: 6 }}>{p.desc}</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 7 }}>
                          {p.tags.map(tag => <span key={tag} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.text4 }}>{tag}</span>)}
                        </div>
                        <div style={{ background: `${C.amberGold}08`, border: `1px solid ${C.amberGold}22`, borderRadius: 7, padding: '7px 9px' }}>
                          <p style={{ fontSize: 9, color: C.amberGold, marginBottom: 2, fontWeight: 400, letterSpacing: '.05em' }}>다른 페르소나와의 충돌</p>
                          <p style={{ fontSize: 11, fontWeight: 300, color: C.text2, lineHeight: 1.5 }}>{p.conflict}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '15px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text }}>관계 프로필 변화</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['prev', 'now'] as const).map(m => (
                  <button key={m} onClick={() => setChartMode(m)}
                    style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, border: `1px solid ${chartMode === m ? `${C.amberGold}44` : C.border}`, color: chartMode === m ? C.amberGold : C.text4, background: chartMode === m ? `${C.amberGold}08` : 'transparent', cursor: 'pointer', transition: 'all .15s' }}>
                    {m === 'prev' ? '1개월 전' : '지금'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <RadarChart mode={chartMode} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {RADAR_DATA[chartMode].axes.map((axis, i) => {
                const nowVal = RADAR_DATA[chartMode].vals[i];
                const prevVal = RADAR_DATA.prev.vals[i];
                const delta = nowVal - prevVal;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.bg, borderRadius: 7, padding: '5px 8px' }}>
                    <span style={{ fontSize: 9, fontWeight: 300, color: C.text4, flex: 1 }}>{axis}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.text }}>{nowVal}</span>
                    {chartMode === 'now'
                      ? <span style={{ fontSize: 9, fontWeight: 400, color: delta >= 0 ? C.amberGold : C.text4 }}>{delta >= 0 ? '+' : ''}{delta}</span>
                      : <span style={{ fontSize: 10, fontWeight: 300, color: C.text5, marginLeft: 2 }}>기준</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly report */}
          <div onClick={() => setReportOpen(v => !v)}
            className="vr-fade-in"
            style={{ background: C.bg2, border: `1px solid ${reportOpen ? `${C.amberGold}44` : C.border}`, borderRadius: 14, padding: '14px 17px', cursor: 'pointer', transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 99, border: `1px solid ${C.amberGold}33`, background: `${C.amberGold}08` }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.amberGold, display: 'block' }} />
                <span style={{ fontSize: 9, fontWeight: 400, color: C.amberGold }}>3월 리포트</span>
              </div>
              <span style={{ fontSize: 12, color: C.text5, transform: reportOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>모든 관계에서 같은 패턴이 반복되고 있었어요</p>
            <p style={{ fontSize: 11, fontWeight: 300, color: C.text4, lineHeight: 1.5 }}>직장, 연인, 친구, 가족 — 맥락은 달랐지만 핵심 패턴은 하나였어요.</p>
            {reportOpen && (
              <div style={{ paddingTop: 10, marginTop: 10, borderTop: `1px solid ${C.border2}` }}>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {[{ a: '애착', v: '+11', up: true }, { a: '소통', v: '+15', up: true }, { a: '욕구', v: '+7', up: true }, { a: '역할', v: '-4', up: false }].map(r => (
                    <div key={r.a} style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 8px' }}>
                      <span style={{ fontSize: 9, fontWeight: 300, color: C.text4 }}>{r.a}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.text }}>{r.v}</span>
                      <span style={{ fontSize: 9, fontWeight: 400, color: r.up ? C.amberGold : C.text4 }}>{r.up ? '↑' : '↓'}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, fontWeight: 300, color: C.text2, lineHeight: 1.55 }}>역할 축이 내려간 건 나쁜 신호가 아니에요. "역할로서의 나"에 덜 집착하게 됐다는 뜻이에요.</p>
              </div>
            )}
          </div>

          {/* Initial diagnosis */}
          <div onClick={() => setDiagOpen(v => !v)}
            className="vr-fade-in"
            style={{ background: C.bg2, border: `1px solid ${diagOpen ? `${C.amberGold}44` : C.border}`, borderRadius: 14, padding: '14px 17px', cursor: 'pointer', transition: 'border-color .2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.07em', textTransform: 'uppercase', color: C.text4 }}>처음 진단 결과</span>
              <span style={{ fontSize: 12, color: C.text5, transform: diagOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text, marginBottom: 7, lineHeight: 1.35 }}>모든 관계에서 나를 잃어버리는 사람</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[{ l: '애착', v: 52 }, { l: '소통', v: 44 }, { l: '욕구', v: 38 }, { l: '역할', v: 81 }].map(ax => (
                <div key={ax.l} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 300, color: C.text4 }}>{ax.l}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 12, color: C.text }}>{ax.v}</span>
                </div>
              ))}
            </div>
            {diagOpen && (
              <div style={{ paddingTop: 10, marginTop: 10, borderTop: `1px solid ${C.border2}` }}>
                <p style={{ fontSize: 11, fontWeight: 300, color: C.text3, lineHeight: 1.55 }}>역할 점수(81)가 압도적으로 높았어요. 나보다 역할이 먼저였던 거예요 — 직장에서의 나, 자식으로서의 나, 연인에게 맞춰주는 나.</p>
              </div>
            )}
          </div>

          {/* Friend recommendations */}
          <div className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text }}>대화가 잘 통할 것 같아요</span>
              <span style={{ fontSize: 9, fontWeight: 300, color: C.text4 }}>패턴과 zone 교집합 기준</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FRIENDS.map((f, i) => (
                <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.bg }}>{f.av}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 14, color: C.text, marginBottom: 2 }}>{f.name}</p>
                    <p style={{ fontSize: 10, fontWeight: 300, color: C.text4, lineHeight: 1.4 }}>{f.reason}</p>
                  </div>
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, border: `1px solid ${C.amberGold}33`, color: C.amberGold, background: `${C.amberGold}08`, flexShrink: 0, whiteSpace: 'nowrap' }}>{f.match}</span>
                  <button onClick={() => sendDM(f.name)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v8H8l-3 2V10H2z" stroke={C.text4} strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
            </div>
            {dmToast && <p style={{ fontSize: 10, fontWeight: 300, color: C.amberGold, textAlign: 'center', marginTop: 6 }}>{dmToast}</p>}
          </div>

          {/* Share card */}
          <div className="vr-fade-in" style={{ background: `linear-gradient(135deg,${C.amberGold}08,${C.bg})`, border: `1px solid ${C.amberGold}33`, borderRadius: 14, padding: '14px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.amberGold}15`, border: `1px solid ${C.amberGold}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 10l4-4 3 3 5-6" stroke={C.amberGold} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text }}>나의 변화 공유하기</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 300, color: C.text4, lineHeight: 1.5, marginBottom: 9 }}>처음과 지금이 얼마나 달라졌는지 한 장으로.</p>
            <button onClick={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2500); }}
              style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: C.amberGold, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 400, color: C.bg, cursor: 'pointer' }}>
              공유 카드 만들기
            </button>
            {shareToast && <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 300, color: C.amberGold, marginTop: 7 }}>준비 중이에요 — 곧 만들 수 있어요 🌱</p>}
          </div>
        </div>
      )}

      {/* ── People tab ── */}
      {tab === 'people' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '11px 20px 10px', borderBottom: `1px solid ${C.border2}` }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text, marginBottom: 2 }}>내 관계 안에 있는 사람들</p>
            <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>이 사람들과의 관계에서 패턴이 발견됐어요.</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '11px 20px 80px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PEOPLE.map((p, i) => {
              const isOpen = openPerson === i;
              return (
                <div key={i} onClick={() => setOpenPerson(isOpen ? null : i)}
                  className="vr-fade-in"
                  style={{ background: isOpen ? `${C.amberGold}04` : C.bg2, border: `1px solid ${isOpen ? `${C.amberGold}44` : C.border}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.bg }}>{p.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text, marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>{p.rel}</p>
                    </div>
                    <span style={{ fontSize: 12, color: C.text5, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
                  </div>
                  {isOpen && (
                    <div style={{ paddingTop: 10, marginTop: 10, borderTop: `1px solid ${C.border2}` }}>
                      <p style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.06em', textTransform: 'uppercase', color: C.text4, marginBottom: 4 }}>발견된 패턴</p>
                      <p style={{ fontSize: 11, fontWeight: 300, color: C.text2, lineHeight: 1.55, marginBottom: 7, fontFamily: "'Cormorant Garamond', serif" }}>{p.pattern}</p>
                      <div style={{ background: `${C.amberGold}08`, border: `1px solid ${C.amberGold}22`, borderRadius: 7, padding: '7px 9px', marginBottom: 7 }}>
                        <p style={{ fontSize: 9, color: C.amberGold, marginBottom: 2, fontWeight: 400, letterSpacing: '.05em' }}>페르소나 충돌</p>
                        <p style={{ fontSize: 11, fontWeight: 300, color: C.text2, lineHeight: 1.5 }}>{p.conflict}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.tags.map(tag => <span key={tag} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, border: `1px solid ${C.border}`, color: C.text4 }}>{tag}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button style={{ padding: '11px 0', borderRadius: 11, border: `1px dashed ${C.border}`, background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 300, color: C.text5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke={C.text5} strokeWidth="1.3" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke={C.text5} strokeWidth="1.3" strokeLinecap="round"/></svg>
              사람 추가하기
            </button>
          </div>
        </div>
      )}

      {/* ── Zone tab ── */}
      {tab === 'zone' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, padding: '11px 20px 10px', borderBottom: `1px solid ${C.border2}` }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 16, color: C.text, marginBottom: 2 }}>탐색 범위 설정</p>
            <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>열어둔 영역 안에서만 AI가 작동해요.</p>
          </div>
          <div style={{ flexShrink: 0, padding: '9px 20px', borderBottom: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 300, color: C.text4, flexShrink: 0 }}>정밀도</span>
            <div style={{ flex: 1, height: 3, background: C.border2, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${C.amberGold},${C.amber})`, width: `${pct}%`, transition: 'width .4s ease' }} />
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 14, color: C.amberGold, flexShrink: 0, minWidth: 34, textAlign: 'right' }}>{pct}%</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '11px 20px 80px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {closedCount > 0 && (
              <div style={{ background: `${C.frost}08`, border: `1px solid ${C.frost}22`, borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 17, height: 17, borderRadius: '50%', background: `${C.frost}15`, border: `1px solid ${C.frost}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.frost, display: 'block' }} />
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: 12, color: C.text3, flex: 1, lineHeight: 1.5 }}>
                  "현재 정밀도 {pct}%. {closedCount}개 영역이 닫혀 있어요."
                </p>
                <span style={{ fontSize: 9, color: C.text5, flexShrink: 0, marginTop: 2 }}>Frost</span>
              </div>
            )}
            {ZONES.map((g, gi) => {
              const groupOpen = openGroups[gi] !== false;
              return (
                <div key={gi} className="vr-fade-in" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 13, overflow: 'hidden' }}>
                  <div onClick={() => setOpenGroups(prev => ({ ...prev, [gi]: !groupOpen }))}
                    style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0, display: 'block' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text, marginBottom: 2 }}>{g.title}</p>
                      <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>{g.sub}</p>
                    </div>
                    <span style={{ fontSize: 11, color: C.text5, transform: groupOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block', flexShrink: 0 }}>›</span>
                  </div>
                  {groupOpen && (
                    <div style={{ borderTop: `1px solid ${C.border2}` }}>
                      {g.items.map((item, ii) => (
                        <div key={item.id} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: ii < g.items.length - 1 ? `1px solid ${C.border2}` : 'none' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 13.5, color: C.text, marginBottom: 1 }}>{item.name}</p>
                            <p style={{ fontSize: 10, fontWeight: 300, color: C.text4 }}>{item.desc}</p>
                          </div>
                          {item.sensitive && (
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, border: `1px solid ${C.amberDim}33`, color: C.amberDim, background: `${C.amberDim}0A`, flexShrink: 0 }}>민감</span>
                          )}
                          <ZoneToggle
                            on={zoneState[item.id]}
                            onToggle={() => toggleZone(item.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Sheets */}
      <AISheet open={aiSheet === 'amber'} type="amber" aiName={amberName} onClose={() => setAiSheet(null)} />
      <AISheet open={aiSheet === 'frost'} type="frost" aiName={frostName} onClose={() => setAiSheet(null)} />

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        amberName={amberName} frostName={frostName}
        onRenameAmber={() => { setSettingsOpen(false); setTimeout(() => setRenameTarget('amber'), 350); }}
        onRenameFrost={() => { setSettingsOpen(false); setTimeout(() => setRenameTarget('frost'), 350); }}
        lang={lang} onChangeLang={setLang}
      />

      {/* Rename Sheet */}
      <RenameSheet
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title={renameTarget === 'amber' ? '엠버 이름 변경' : '프로스트 이름 변경'}
        currentName={renameTarget === 'amber' ? amberName : frostName}
        onApply={(n) => {
          if (renameTarget === 'amber') renameAmber(n);
          else renameFrost(n);
          setRenameTarget(null);
        }}
      />
    </div>
  );
}
