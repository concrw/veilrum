// #10 고민 유형 분기 — 고민 카테고리별 맞춤 경로 안내
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CONCERNS = [
  { id: 'breakup', label: '이별/단절', icon: '💔', route: '/home/vent', desc: '감정을 먼저 쏟아내세요' },
  { id: 'conflict', label: '갈등/다툼', icon: '⚡', route: '/home/dig', desc: '패턴을 파고들어 보세요' },
  { id: 'anxiety', label: '관계 불안', icon: '😰', route: '/home/vent', desc: '불안의 뿌리를 찾아가요' },
  { id: 'communication', label: '소통 문제', icon: '🗣️', route: '/home/set', desc: '경계와 합의를 설정해요' },
  { id: 'identity', label: '나를 모르겠어', icon: '🎭', route: '/home/get', desc: 'V-File로 가면을 탐색해요' },
  { id: 'growth', label: '성장하고 싶어', icon: '🌱', route: '/home/me', desc: '변화를 추적하고 기록해요' },
];

export default function ConcernRouter() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const concern = CONCERNS.find(c => c.id === selected);

  return (
    <div className="bg-card border rounded-2xl p-5 space-y-3">
      <p className="text-xs text-muted-foreground">지금 무엇이 고민인가요?</p>

      <div className="grid grid-cols-3 gap-2">
        {CONCERNS.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            className={`rounded-xl p-2.5 text-center transition-all ${
              selected === c.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 border border-transparent'
            }`}>
            <span className="text-lg block">{c.icon}</span>
            <p className="text-[10px] mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      {concern && (
        <button onClick={() => navigate(concern.route)}
          className="w-full bg-primary/5 border border-primary/20 rounded-xl p-3 text-left hover:bg-primary/10 transition-colors">
          <p className="text-xs font-medium text-primary">{concern.desc}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{concern.label} → {concern.route.split('/').pop()} 탭으로 이동</p>
        </button>
      )}
    </div>
  );
}
