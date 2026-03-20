import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const QUESTIONS = [
  {
    key: 'relationship_goal',
    question: '지금 관계에서 가장 원하는 것은?',
    type: 'choice' as const,
    options: ['더 깊은 이해', '성장', '연결감', '치유'],
  },
  {
    key: 'current_challenge',
    question: '관계에서 반복되는 어려움이 있다면? (선택)',
    type: 'text' as const,
    placeholder: '자유롭게 적어주세요 (최대 200자)',
  },
  {
    key: 'emotion_style',
    question: '나는 주로 어떻게 감정을 처리하나요?',
    type: 'choice' as const,
    options: ['혼자 생각 정리', '대화로 해소', '행동으로 전환', '시간이 지나면서'],
  },
  {
    key: 'relationship_style',
    question: '관계를 대할 때 나의 스타일은?',
    type: 'choice' as const,
    options: ['분석적으로 파악', '감정으로 공감', '실용적으로 해결'],
  },
];

export default function CoreQuestions() {
  const navigate = useNavigate();
  const { user, setOnboardingStep } = useAuth();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const q = QUESTIONS[current];
  const isLast = current === QUESTIONS.length - 1;

  const handleSelect = async (value: string) => {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    if (!isLast) {
      setCurrent(current + 1);
    } else {
      await saveAndProceed(next);
    }
  };

  const handleTextNext = async () => {
    const next = { ...answers };
    if (!next[q.key]) next[q.key] = '';
    setAnswers(next);
    if (!isLast) {
      setCurrent(current + 1);
    } else {
      await saveAndProceed(next);
    }
  };

  const saveAndProceed = async (data: Record<string, string>) => {
    if (user) {
      const rows = Object.entries(data).map(([k, v]) => ({
        user_id: user.id, question_key: k, response_value: v,
      }));
      await (supabase as any).schema('veilrum').from('cq_responses').upsert(rows);
    }
    await setOnboardingStep('priper');
    navigate('/onboarding/priper/start');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        {/* 진행바 */}
        <div className="flex gap-1.5 mb-10">
          {QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= current ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-2">{current + 1} / {QUESTIONS.length}</p>
        <h2 className="text-xl font-semibold mb-8 leading-snug">{q.question}</h2>

        {q.type === 'choice' && (
          <div className="space-y-3">
            {q.options!.map(opt => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all
                  ${answers[q.key] === opt ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {q.type === 'text' && (
          <div className="space-y-4">
            <Textarea
              placeholder={q.placeholder}
              maxLength={200}
              value={answers[q.key] ?? ''}
              onChange={e => setAnswers({ ...answers, [q.key]: e.target.value })}
              className="h-32 resize-none"
            />
            <Button className="w-full" onClick={handleTextNext}>
              {isLast ? '진단 시작하기' : '다음'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
