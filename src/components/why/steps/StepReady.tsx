import { Button } from '@/components/ui/button';

interface StepReadyProps {
  onStart: () => void;
}

export function StepReady({ onStart }: StepReadyProps) {
  return (
    <div className="bg-card border rounded-2xl p-6 space-y-5">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">V-File Why 분석</p>
        <h3 className="text-xl font-bold">나의 Why를 찾는 여정</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          행복과 고통의 패턴, 그 뿌리를 10단계로 탐색합니다.
          직관과 기억을 살려 솔직하게 답해 주세요.
        </p>
      </div>

      <div className="space-y-2.5">
        {[
          { icon: '⏱', text: '총 2~3시간 소요 (여러 세션에 나눠 진행 가능)' },
          { icon: '🧠', text: '알고 있는 직업을 10분 동안 최대한 많이 떠올려요' },
          { icon: '📝', text: '각 직업에 나만의 정의와 기억을 기록해요' },
          { icon: '🔍', text: 'AI가 패턴을 분석해 Prime Perspective를 도출해요' },
          { icon: '💾', text: '진행 상황은 자동 저장됩니다' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <span>{item.icon}</span>
            <span className="text-muted-foreground leading-relaxed">{item.text}</span>
          </div>
        ))}
      </div>

      <Button className="w-full h-11" onClick={onStart}>
        Why 분석 시작 →
      </Button>
    </div>
  );
}
