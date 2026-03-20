import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function Welcome() {
  const navigate = useNavigate();
  const { setOnboardingStep } = useAuth();

  const handleStart = async () => {
    await setOnboardingStep('cq');
    navigate('/onboarding/cq');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full space-y-8">
        {/* 로고 */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">VEILRUM</h1>
          <p className="text-muted-foreground text-sm">당신의 관계 언어를 발견하세요</p>
        </div>

        {/* 진행 인디케이터 */}
        <div className="flex justify-center gap-2">
          <div className="w-8 h-1 rounded-full bg-primary" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>

        {/* 메시지 카드 */}
        <div className="space-y-4">
          {[
            { title: '당신만의 가면(Mask)이 있습니다', desc: '관계에서 무의식적으로 쓰는 패턴의 이름' },
            { title: '40개의 질문으로 발견합니다', desc: '약 8분, 솔직할수록 정확해집니다' },
            { title: '4개 모듈이 당신에게 맞춰 열립니다', desc: 'PRIPER · CODETALK · DIVE · Community' },
          ].map((item, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 text-left">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-muted-foreground text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <Button className="w-full h-12 text-base" onClick={handleStart}>
          시작하기
        </Button>
      </div>
    </div>
  );
}
