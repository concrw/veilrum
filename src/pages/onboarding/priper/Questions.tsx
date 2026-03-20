import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRIPER_QUESTIONS } from '@/data/priperQuestions';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const STORAGE_KEY = 'veilrum:priper-progress';

export default function PriperQuestions() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { responses: r, current: c } = JSON.parse(saved);
        return r ?? {};
      }
    } catch {}
    return {};
  });
  const [sliderVal, setSliderVal] = useState(50);

  // 저장된 위치 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { current: c } = JSON.parse(saved);
        if (c) setCurrent(c);
      }
    } catch {}
  }, []);

  const q = PRIPER_QUESTIONS[current];
  const progress = Math.round(((current) / PRIPER_QUESTIONS.length) * 100);
  const isAnswered = responses[q.id] !== undefined;

  const saveProgress = (newResponses: Record<string, number>, idx: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ responses: newResponses, current: idx }));
  };

  const handleAnswer = (score: number) => {
    const newR = { ...responses, [q.id]: score };
    setResponses(newR);

    if (current < PRIPER_QUESTIONS.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setSliderVal(newR[PRIPER_QUESTIONS[next].id] ?? 50);
      saveProgress(newR, next);
    } else {
      // 완료
      localStorage.removeItem(STORAGE_KEY);
      navigate('/onboarding/priper/result', { state: { responses: newR } });
    }
  };

  const handleSliderConfirm = () => handleAnswer(sliderVal);

  const handlePrev = () => {
    if (current > 0) {
      const prev = current - 1;
      setCurrent(prev);
      setSliderVal(responses[PRIPER_QUESTIONS[prev].id] ?? 50);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        {/* 진행바 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{current + 1} / {PRIPER_QUESTIONS.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full">
            <div className="h-1.5 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 축 배지 */}
        <div className="mb-4">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {q.axis === 'A' ? '애착' : q.axis === 'B' ? '소통' : q.axis === 'C' ? '욕구표현' : '역할'}
          </span>
        </div>

        {/* 질문 */}
        <h2 className="text-lg font-semibold leading-snug mb-8 flex-1">{q.question}</h2>

        {/* 응답 UI */}
        {q.type === 'scenario' && q.choices && (
          <div className="space-y-3">
            {q.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(choice.score)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all
                  ${responses[q.id] === choice.score ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/40'}`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {q.type === 'slider' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Slider
                min={0} max={100} step={5}
                value={[sliderVal]}
                onValueChange={([v]) => setSliderVal(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{q.sliderMin}</span>
                <span className="font-medium text-foreground">{sliderVal}</span>
                <span>{q.sliderMax}</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleSliderConfirm}>다음</Button>
          </div>
        )}

        {q.type === 'binary' && q.choices && (
          <div className="space-y-3">
            {q.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(choice.score)}
                className={`w-full text-left px-4 py-4 rounded-xl border text-sm leading-relaxed transition-all
                  ${responses[q.id] === choice.score ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/40'}`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {/* 이전 버튼 */}
        {current > 0 && (
          <button onClick={handlePrev} className="mt-6 text-xs text-muted-foreground underline underline-offset-2">
            이전 문항으로
          </button>
        )}
      </div>
    </div>
  );
}
