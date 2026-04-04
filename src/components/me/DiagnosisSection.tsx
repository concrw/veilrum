// DiagnosisSection — V-File result display
import { useState } from 'react';
import { C } from '@/lib/colors';

const DIAG_AXIS_BADGE_STYLE = { display: 'flex' as const, alignItems: 'center' as const, gap: 4, padding: '3px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6 } as const;
const DIAG_AXIS_LABEL_STYLE = { fontSize: 9, fontWeight: 300, color: C.text4 } as const;
const DIAG_AXIS_VALUE_STYLE = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: 12, color: C.text } as const;

interface DiagnosisData {
  axisScores?: { axes: string[]; vals: number[] };
  primaryMask?: string;
}

interface DiagnosisSectionProps {
  diagnosis: DiagnosisData | null;
}

export default function DiagnosisSection({ diagnosis: diag }: DiagnosisSectionProps) {
  const [diagOpen, setDiagOpen] = useState(false);

  const diagAxes = diag?.axisScores ?? { axes: ['애착', '소통', '욕구', '역할'], vals: [52, 44, 38, 81] };
  const maskLabel = diag?.primaryMask ?? '모든 관계에서 나를 잃어버리는 사람';
  const maxIdx = diagAxes.vals.indexOf(Math.max(...diagAxes.vals));
  const maxAxis = diagAxes.axes[maxIdx];
  const maxVal = diagAxes.vals[maxIdx];

  return (
    <div onClick={() => setDiagOpen(v => !v)} className="vr-fade-in"
      style={{ background: C.bg2, border: `1px solid ${diagOpen ? `${C.amberGold}44` : C.border}`, borderRadius: 14, padding: '14px 17px', cursor: 'pointer', transition: 'border-color .2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: '.07em', textTransform: 'uppercase', color: C.text4 }}>처음 분석 결과</span>
        <span style={{ fontSize: 12, color: C.text5, transform: diagOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>›</span>
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 15, color: C.text, marginBottom: 7, lineHeight: 1.35 }}>{maskLabel}</p>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {diagAxes.axes.map((l, i) => (
          <div key={l} style={DIAG_AXIS_BADGE_STYLE}>
            <span style={DIAG_AXIS_LABEL_STYLE}>{l}</span>
            <span style={DIAG_AXIS_VALUE_STYLE}>{diagAxes.vals[i]}</span>
          </div>
        ))}
      </div>
      {diagOpen && (
        <div style={{ paddingTop: 10, marginTop: 10, borderTop: `1px solid ${C.border2}` }}>
          <p style={{ fontSize: 11, fontWeight: 300, color: C.text3, lineHeight: 1.55 }}>
            {maxAxis} 점수({maxVal})가 가장 높았어요. 이 영역에서의 패턴이 다른 관계에도 영향을 미치고 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
