// Held — 감정이 올라와 있고, 일단 말하고 싶다
// 기능: 감정 선택 → 자유 입력 → AI 비판단 수용 응답
// 현재: UI 뼈대 (Claude API Edge Function 연동 예정)

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const EMOTIONS = [
  { emoji: '😔', label: '무기력' },
  { emoji: '😤', label: '답답' },
  { emoji: '😰', label: '불안' },
  { emoji: '😌', label: '평온' },
  { emoji: '🥹', label: '벅참' },
  { emoji: '😑', label: '공허' },
  { emoji: '😡', label: '분노' },
  { emoji: '😢', label: '슬픔' },
];

export default function HeldPage() {
  const { user } = useAuth();
  const [emotion, setEmotion] = useState('');
  const [text, setText] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() && !emotion) return;
    setLoading(true);
    setResponse('');
    try {
      const { data, error } = await supabase.functions.invoke('held-chat', {
        body: { emotion, text, userId: user?.id },
      });
      if (error) throw error;
      setResponse(data?.response ?? '');
    } catch (err) {
      console.error('held-chat error:', err);
      setResponse('지금 응답을 받기 어려워요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (response) {
    return (
      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        <button onClick={() => setResponse('')} className="text-xs text-muted-foreground">← 돌아가기</button>
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <p className="text-xs text-muted-foreground">AI 상담사</p>
          <p className="text-sm leading-relaxed">{response}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Held</h2>
        <p className="text-sm text-muted-foreground mt-1">지금 느끼는 걸 그대로 말해도 괜찮아요.</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">지금 어떤 감정인가요?</p>
        <div className="grid grid-cols-4 gap-2">
          {EMOTIONS.map(e => (
            <button
              key={e.label}
              onClick={() => setEmotion(e.label)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors
                ${emotion === e.label ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <span className="text-xl">{e.emoji}</span>
              <span>{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Textarea
        placeholder="무슨 일이 있었나요? 편하게 적어보세요."
        value={text}
        onChange={e => setText(e.target.value)}
        className="h-32 resize-none"
      />

      <Button
        className="w-full h-11"
        onClick={handleSubmit}
        disabled={loading || (!emotion && !text.trim())}
      >
        {loading ? '읽고 있어요...' : '말하기'}
      </Button>
    </div>
  );
}
