// #9 미니 도구들 — 호흡/그라운딩/감정 체크인/감사 일기
import { useState } from 'react';

type ToolId = 'breathing' | 'grounding' | 'checkin' | 'gratitude';

const TOOLS: { id: ToolId; icon: string; name: string; desc: string }[] = [
  { id: 'breathing', icon: '🫁', name: '호흡', desc: '4-7-8 호흡법' },
  { id: 'grounding', icon: '🌿', name: '그라운딩', desc: '5-4-3-2-1 기법' },
  { id: 'checkin', icon: '💭', name: '감정 체크인', desc: '지금 느끼는 감정 3개' },
  { id: 'gratitude', icon: '✨', name: '감사 일기', desc: '오늘 고마운 것 1가지' },
];

function BreathingTool({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);

  useState(() => {
    const seq = [{ p: 'inhale' as const, d: 4 }, { p: 'hold' as const, d: 7 }, { p: 'exhale' as const, d: 8 }];
    let idx = 0, c = 4;
    const timer = setInterval(() => {
      c--;
      if (c <= 0) { idx = (idx + 1) % 3; c = seq[idx].d; setPhase(seq[idx].p); }
      setCount(c);
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
    <div className="text-center py-4 space-y-3">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary transition-all"
        style={{ transform: phase === 'inhale' ? 'scale(1.2)' : phase === 'exhale' ? 'scale(0.8)' : 'scale(1)' }}>
        {count}
      </div>
      <p className="text-sm font-medium">{phase === 'inhale' ? '들이쉬세요' : phase === 'hold' ? '멈추세요' : '내쉬세요'}</p>
      <button onClick={onClose} className="text-xs text-muted-foreground">닫기</button>
    </div>
  );
}

export default function MiniToolsCard() {
  const [active, setActive] = useState<ToolId | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);
  const [gratitude, setGratitude] = useState('');

  return (
    <div className="bg-card border rounded-2xl p-5 space-y-3">
      <p className="text-xs text-muted-foreground">미니 도구</p>

      {!active ? (
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className="bg-muted/50 rounded-xl p-3 text-left hover:bg-muted transition-colors">
              <span className="text-lg">{t.icon}</span>
              <p className="text-xs font-medium mt-1">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
      ) : active === 'breathing' ? (
        <BreathingTool onClose={() => setActive(null)} />
      ) : active === 'grounding' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">5-4-3-2-1 그라운딩</p>
          {[
            { n: 5, s: '보이는 것', i: '👁️' }, { n: 4, s: '만질 수 있는 것', i: '✋' },
            { n: 3, s: '들리는 것', i: '👂' }, { n: 2, s: '냄새', i: '👃' }, { n: 1, s: '맛', i: '👅' },
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 text-xs">
              <span>{step.i}</span> {step.n}가지 {step.s}을 찾아보세요
            </div>
          ))}
          <button onClick={() => setActive(null)} className="w-full text-xs text-muted-foreground py-2">닫기</button>
        </div>
      ) : active === 'checkin' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">지금 느끼는 감정 3개를 골라보세요</p>
          <div className="flex flex-wrap gap-1.5">
            {['불안', '슬픔', '화남', '외로움', '평온', '기쁨', '혼란', '지침', '감사', '설렘', '무감각', '안도'].map(e => (
              <button key={e} onClick={() => setCheckinDone(true)}
                className="text-xs px-2.5 py-1 rounded-full border hover:border-primary/50 hover:bg-primary/5 transition-colors">
                {e}
              </button>
            ))}
          </div>
          {checkinDone && <p className="text-xs text-primary">감정을 인식하는 것만으로도 한 걸음이에요</p>}
          <button onClick={() => { setActive(null); setCheckinDone(false); }} className="w-full text-xs text-muted-foreground py-2">닫기</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">오늘 고마운 것 1가지</p>
          <textarea value={gratitude} onChange={e => setGratitude(e.target.value)}
            placeholder="작은 것이라도 좋아요..." maxLength={200}
            className="w-full bg-background border rounded-lg p-2.5 text-xs resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary" />
          {gratitude.trim() && <p className="text-xs text-primary">기록했어요. 오늘도 수고했어요.</p>}
          <button onClick={() => { setActive(null); setGratitude(''); }} className="w-full text-xs text-muted-foreground py-2">닫기</button>
        </div>
      )}
    </div>
  );
}
