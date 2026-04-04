// 위기 대응 3단계 배너
// 1단계: 감지 + 전화번호 (즉시)
// 2단계: 안정화 기법 (호흡 가이드, 그라운딩 5-4-3-2-1)
// 3단계: 전문 상담사 연결
import { useState, useEffect, useRef, memo } from 'react';
import { C } from '@/lib/colors';

type CrisisStage = 'alert' | 'stabilize' | 'connect';

interface CrisisBannerProps {
  severity: 'high' | 'critical';
  onDismiss?: () => void;
}

function BreathingGuide() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);
  const [round, setRound] = useState(1);
  const timerRef = useRef<number>();

  useEffect(() => {
    const seq = [
      { p: 'inhale' as const, d: 4 },
      { p: 'hold' as const, d: 7 },
      { p: 'exhale' as const, d: 8 },
    ];
    let idx = 0;
    let c = seq[0].d;

    const tick = () => {
      c--;
      if (c <= 0) {
        idx = (idx + 1) % 3;
        if (idx === 0) setRound(r => r + 1);
        c = seq[idx].d;
        setPhase(seq[idx].p);
      }
      setCount(c);
    };

    timerRef.current = window.setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const label = phase === 'inhale' ? '들이쉬세요' : phase === 'hold' ? '멈추세요' : '내쉬세요';
  const circleSize = phase === 'inhale' ? 80 : phase === 'hold' ? 80 : 40;

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
        4-7-8 호흡법 · {round}/3 라운드
      </p>
      <div style={{
        width: circleSize, height: circleSize, borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)', margin: '0 auto 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 1s ease-in-out',
      }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>{count}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>{label}</p>
    </div>
  );
}

function GroundingGuide() {
  const steps = [
    { n: 5, sense: '보이는 것', icon: '👁️' },
    { n: 4, sense: '만질 수 있는 것', icon: '✋' },
    { n: 3, sense: '들리는 것', icon: '👂' },
    { n: 2, sense: '냄새 맡을 수 있는 것', icon: '👃' },
    { n: 1, sense: '맛볼 수 있는 것', icon: '👅' },
  ];
  const [step, setStep] = useState(0);

  return (
    <div style={{ padding: '12px 0' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 10, textAlign: 'center' }}>
        5-4-3-2-1 그라운딩
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            onClick={() => setStep(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10,
              background: i === step ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: i === step ? 600 : 400 }}>
              {s.n}가지 {s.sense}을 찾아보세요
            </span>
            {i < step && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>done</span>}
          </div>
        ))}
      </div>
      {step < steps.length - 1 && (
        <button
          onClick={() => setStep(s => Math.min(s + 1, steps.length - 1))}
          style={{
            display: 'block', width: '100%', marginTop: 10,
            padding: '8px 0', borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          다음 단계
        </button>
      )}
    </div>
  );
}

export const CrisisBanner = memo(function CrisisBanner({ severity, onDismiss }: CrisisBannerProps) {
  const [stage, setStage] = useState<CrisisStage>('alert');
  const [expanded, setExpanded] = useState(false);
  const [stabilizeMode, setStabilizeMode] = useState<'breathing' | 'grounding' | null>(null);

  const isCritical = severity === 'critical';

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: 80,
        left: 12,
        right: 12,
        zIndex: 9999,
        background: isCritical ? '#DC2626' : '#D97706',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s ease-out',
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* 단계 표시 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['alert', 'stabilize', 'connect'] as CrisisStage[]).map((s, i) => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: stage === s ? '#fff' : 'rgba(255,255,255,0.25)',
            cursor: 'pointer',
          }} onClick={() => setStage(s)} />
        ))}
      </div>

      {/* 1단계: 알림 */}
      {stage === 'alert' && (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
              {isCritical ? '🆘' : '⚠️'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>
                {isCritical
                  ? '지금 많이 힘드시군요. 혼자 감당하지 않아도 돼요.'
                  : '힘든 감정이 느껴지시나요? 도움을 요청할 수 있어요.'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.5 }}>
                이 앱은 전문 상담을 대체하지 않습니다.
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                aria-label="배너 닫기"
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
                  fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => setStage('stabilize')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              먼저 마음을 가라앉히기
            </button>
            <button
              onClick={() => setStage('connect')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: '#fff', color: isCritical ? '#DC2626' : '#D97706',
                fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              전문가에게 연락하기
            </button>
          </div>
        </>
      )}

      {/* 2단계: 안정화 */}
      {stage === 'stabilize' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>
              잠깐 멈추고, 지금 여기에 집중해 볼게요
            </p>
            {onDismiss && (
              <button onClick={onDismiss} aria-label="닫기"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                ✕
              </button>
            )}
          </div>

          {!stabilizeMode && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStabilizeMode('breathing')}
                style={{
                  flex: 1, padding: '14px 10px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: '#fff', cursor: 'pointer', textAlign: 'center',
                }}
              >
                <span style={{ display: 'block', fontSize: 24, marginBottom: 6 }}>🫁</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>호흡 가이드</span>
                <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>4-7-8 호흡법</span>
              </button>
              <button
                onClick={() => setStabilizeMode('grounding')}
                style={{
                  flex: 1, padding: '14px 10px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: '#fff', cursor: 'pointer', textAlign: 'center',
                }}
              >
                <span style={{ display: 'block', fontSize: 24, marginBottom: 6 }}>🌿</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>그라운딩</span>
                <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>5-4-3-2-1 기법</span>
              </button>
            </div>
          )}

          {stabilizeMode === 'breathing' && <BreathingGuide />}
          {stabilizeMode === 'grounding' && <GroundingGuide />}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {stabilizeMode && (
              <button
                onClick={() => setStabilizeMode(null)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
                  background: 'transparent', color: '#fff', fontSize: 11, cursor: 'pointer',
                }}
              >
                다른 기법 선택
              </button>
            )}
            <button
              onClick={() => setStage('connect')}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, cursor: 'pointer',
              }}
            >
              전문가 연결로 이동
            </button>
          </div>
        </>
      )}

      {/* 3단계: 상담사 연결 */}
      {stage === 'connect' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>
              전문가에게 연락해 주세요
            </p>
            {onDismiss && (
              <button onClick={onDismiss} aria-label="닫기"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="tel:1393" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
              background: '#fff', color: '#DC2626', textDecoration: 'none',
            }}>
              <span style={{ fontSize: 20 }}>📞</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>자살예방상담전화 1393</p>
                <p style={{ fontSize: 10, color: '#666', margin: 0 }}>24시간 · 무료 · 즉시 연결</p>
              </div>
            </a>
            <a href="tel:1577-0199" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none',
            }}>
              <span style={{ fontSize: 20 }}>📞</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>정신건강위기상담 1577-0199</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0 }}>24시간 · 무료</p>
              </div>
            </a>
            <a href="tel:1588-9191" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none',
            }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>생명의전화 1588-9191</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>24시간</p>
              </div>
            </a>
            <a href="tel:1388" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none',
            }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>청소년 전화 1388</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>24시간</p>
              </div>
            </a>
          </div>

          <button
            onClick={() => setStage('stabilize')}
            style={{
              display: 'block', width: '100%', marginTop: 10,
              padding: '8px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent', color: '#fff', fontSize: 11, cursor: 'pointer',
            }}
          >
            마음 가라앉히기로 돌아가기
          </button>

          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 10, textAlign: 'center' }}>
            VEILRUM은 자기탐색 도구이며, 전문 심리상담 또는 치료를 대체하지 않습니다.
          </p>
        </>
      )}
    </div>
  );
});
