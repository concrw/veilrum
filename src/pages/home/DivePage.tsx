import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Mode = 'F' | 'T';

const EMOTION_LIST = [
  { emoji: '😔', label: '무기력' }, { emoji: '😤', label: '답답' },
  { emoji: '😰', label: '불안' },  { emoji: '😌', label: '평온' },
  { emoji: '🥹', label: '벅참' },  { emoji: '😑', label: '공허' },
  { emoji: '😡', label: '분노' },  { emoji: '😢', label: '슬픔' },
];

const SITUATION_TYPES = ['연인/파트너', '가족', '친구', '직장/동료', '나 자신', '기타'];

interface MatchResult {
  question: string;
  answer: string;
  researcher: string;
  domain: string;
  score: number;
}

export default function DivePage() {
  const { user, axisScores } = useAuth();
  const [mode, setMode] = useState<Mode>(axisScores && axisScores.B >= 60 ? 'F' : 'T');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [selectedSituation, setSelectedSituation] = useState('');
  const [userInput, setUserInput] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<MatchResult | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      // 1. m43_domain_questions에서 키워드 매칭
      const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

      const { data: questions } = await (supabase as any)
        .from('m43_domain_questions')
        .select(`
          id, question, keywords, category,
          m43_domain_answers(answer, m43_researchers(name, specialty)),
          m43_domains(name, code)
        `)
        .limit(200);

      if (!questions) return [];

      // 스코어 계산
      const scored = questions.map((q: any) => {
        const qText = (q.question ?? '').toLowerCase();
        const kws = (q.keywords ?? []).map((k: string) => k.toLowerCase());

        let kwScore = 0;
        let textScore = 0;

        for (const t of tokens) {
          if (kws.some((k: string) => k.includes(t))) kwScore += 1;
          if (qText.includes(t)) textScore += 0.5;
        }

        const kwNorm = tokens.length > 0 ? kwScore / tokens.length : 0;
        const textNorm = tokens.length > 0 ? textScore / tokens.length : 0;
        const score = kwNorm * 0.6 + textNorm * 0.4;

        return { q, score };
      }).filter((x: any) => x.score >= 0.2)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5);

      // 로그 저장
      if (user && scored.length > 0) {
        await (supabase as any).from('m43_user_question_logs').insert({
          user_id: user.id,
          user_question: query,
          matched_question_id: scored[0].q.id,
          match_score: scored[0].score,
          mode,
        });
      }

      return scored.map(({ q, score }: any) => ({
        question: q.question,
        answer: q.m43_domain_answers?.[0]?.answer ?? '',
        researcher: q.m43_domain_answers?.[0]?.m43_researchers?.name ?? '연구원',
        domain: q.m43_domains?.name ?? '',
        score,
      }));
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.length > 0) setSelectedResult(data[0]);
    },
  });

  const handleSubmit = () => {
    const query = mode === 'F'
      ? `${selectedEmotion} ${userInput}`.trim()
      : `${selectedSituation} ${userInput}`.trim();
    if (!query) return;
    searchMutation.mutate(query);
  };

  // 답변 화면
  if (selectedResult) {
    return (
      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        <button onClick={() => setSelectedResult(null)} className="text-xs text-muted-foreground flex items-center gap-1">
          ← 돌아가기
        </button>
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <div>
            <span className="text-xs text-muted-foreground">{selectedResult.domain}</span>
            <p className="font-medium mt-1">{selectedResult.question}</p>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">— {selectedResult.researcher}</p>
            <p className="text-sm leading-relaxed">{selectedResult.answer}</p>
          </div>
        </div>
        {results.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">다른 관련 답변</p>
            {results.slice(1).map((r, i) => (
              <button key={i} onClick={() => setSelectedResult(r)}
                className="w-full text-left bg-card border rounded-xl p-3 text-xs hover:border-primary/50 transition-colors">
                <span className="text-muted-foreground">{r.domain} · {r.researcher}</span>
                <p className="mt-1 line-clamp-2">{r.question}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      {/* 모드 토글 */}
      <div className="bg-card border rounded-2xl p-1 flex">
        {(['F', 'T'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {m === 'F' ? '😔 F 모드 · 감정 공감' : '🧠 T 모드 · 분석 코칭'}
          </button>
        ))}
      </div>

      {mode === 'F' ? (
        <div className="space-y-4">
          <p className="text-sm font-medium">지금 어떤 감정인가요?</p>
          <div className="grid grid-cols-4 gap-2">
            {EMOTION_LIST.map(e => (
              <button key={e.label} onClick={() => setSelectedEmotion(e.label)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-colors
                  ${selectedEmotion === e.label ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <span className="text-xl">{e.emoji}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>
          <Textarea placeholder="무슨 일이 있었나요?" value={userInput} onChange={e => setUserInput(e.target.value)} className="h-24 resize-none" />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium">어떤 관계 상황인가요?</p>
          <div className="grid grid-cols-3 gap-2">
            {SITUATION_TYPES.map(s => (
              <button key={s} onClick={() => setSelectedSituation(s)}
                className={`px-3 py-2.5 rounded-xl border text-xs transition-colors
                  ${selectedSituation === s ? 'border-primary bg-primary/5' : 'border-border'}`}>
                {s}
              </button>
            ))}
          </div>
          <Textarea placeholder="구체적인 상황을 입력해 주세요" value={userInput} onChange={e => setUserInput(e.target.value)} className="h-24 resize-none" />
          {axisScores && axisScores.C <= 35 && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              💡 욕구표현 축이 낮게 나왔어요. 원하는 것을 말하기 어려운 패턴이 있을 수 있어요.
            </p>
          )}
        </div>
      )}

      <Button className="w-full h-11" onClick={handleSubmit}
        disabled={searchMutation.isPending || (!selectedEmotion && !selectedSituation && !userInput.trim())}>
        {searchMutation.isPending ? '탐색 중...' : mode === 'F' ? 'AI 상담사와 대화 시작' : '관계 패턴 분석 시작'}
      </Button>
    </div>
  );
}
