import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function Welcome() {
  const navigate = useNavigate();
  const { setOnboardingStep } = useAuth();
  const [phase, setPhase] = useState<'greeting' | 'question' | 'ready'>('greeting');
  const [answer, setAnswer] = useState('');

  // 타이핑 효과로 대화형 진입
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('question'), 2000);
    return () => clearTimeout(t1);
  }, []);

  const handleStart = async () => {
    await setOnboardingStep('cq');
    navigate('/onboarding/cq');
  };

  const handleSkipToDiagnosis = async () => {
    await setOnboardingStep('priper');
    navigate('/onboarding/vfile/start');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">VEILRUM</h1>
          <p className="text-muted-foreground text-xs mt-1">관계의 가면을 발견하는 여정</p>
        </div>

        {/* AI 대화형 진입 */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          {/* AI 인사 */}
          <div className={`transition-all duration-700 ${phase !== 'greeting' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                A
              </div>
              <div className="bg-card border rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                <p className="text-sm leading-relaxed">
                  안녕하세요. 저는 엠버예요.
                </p>
                <p className="text-sm leading-relaxed mt-2 text-muted-foreground">
                  모든 관계에는 보이지 않는 패턴이 있어요.
                  당신만의 패턴을 함께 찾아볼까요?
                </p>
              </div>
            </div>
          </div>

          {/* 질문 */}
          {(phase === 'question' || phase === 'ready') && (
            <div className="transition-all duration-700 opacity-100 translate-y-0 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">
                  A
                </div>
                <div className="bg-card border rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-sm leading-relaxed font-medium">
                    요즘 관계에서 가장 마음에 걸리는 게 있다면, 한 줄로 말해줄 수 있어요?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    건너뛰어도 괜찮아요
                  </p>
                </div>
              </div>

              {/* 사용자 응답 */}
              <div className="pl-11">
                <textarea
                  value={answer}
                  onChange={e => {
                    setAnswer(e.target.value);
                    if (e.target.value.trim()) setPhase('ready');
                  }}
                  placeholder="예: 가까워지면 왜 자꾸 밀어내게 되는지 모르겠어요"
                  className="w-full bg-card border rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={200}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="space-y-3 mt-8">
          {answer.trim() ? (
            <Button className="w-full h-12 text-base" onClick={handleStart}>
              이 마음을 가지고 시작하기
            </Button>
          ) : (
            <Button className="w-full h-12 text-base" onClick={handleStart}>
              시작하기
            </Button>
          )}
          <button
            onClick={handleSkipToDiagnosis}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            바로 V-File 진단으로 →
          </button>
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed text-center">
            VEILRUM은 자기탐색 도구이며, 전문 심리상담 또는 치료를 대체하지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
