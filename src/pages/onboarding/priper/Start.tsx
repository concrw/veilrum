import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PriperStart() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full space-y-8">
        {/* 가면 아이콘 */}
        <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-4xl">🎭</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold">당신의 Prime Mask를 찾습니다</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            12가지 관계 가면 중 당신에게 가장 가까운 패턴을 발견합니다
          </p>
        </div>

        <div className="bg-card border rounded-xl p-5 text-left space-y-3">
          {[
            { icon: '⏱', text: '40개 질문 · 약 8분' },
            { icon: '💡', text: '솔직한 답변일수록 정확합니다' },
            { icon: '🔒', text: '결과는 오직 당신에게만 보입니다' },
            { icon: '↩️', text: '중단 후 이어서 진행 가능합니다' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <Button className="w-full h-12 text-base" onClick={() => navigate('/onboarding/priper/questions')}>
          진단 시작
        </Button>
      </div>
    </div>
  );
}
