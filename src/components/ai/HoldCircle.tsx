import { useEffect, useState } from 'react';
import { C } from '@/lib/colors';

interface HoldCircleProps {
  active: boolean;       // 홀드 중인지
  duration?: number;     // 채워지는 시간 ms (default 600)
  size?: number;         // px (default 80)
  onComplete?: () => void;
}

export default function HoldCircle({ active, duration = 600, size = 80, onComplete }: HoldCircleProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);
      if (pct >= 1) {
        onComplete?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, duration, onComplete]);

  if (!active && progress === 0) return null;

  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        pointerEvents: 'none',
        background: `rgba(0,0,0,${progress * 0.4})`,
        transition: active ? 'none' : 'background 0.3s',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* 배경 원 */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={C.border} strokeWidth={3}
          opacity={0.3}
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={C.amberGold} strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'none' }}
        />
      </svg>
    </div>
  );
}
