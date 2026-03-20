// Dig — 왜 내가 이런지 알고 싶다
// 기능: 상황 입력 → 반복 구조 탐지 → M43 매칭 + AI 패턴 해석

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const SITUATIONS = ['연인/파트너', '가족', '친구', '직장/동료', '나 자신', '기타'];

interface MatchResult {
  question: string;
  answer: string;
  researcher: string;
  domain: string;
  score: number;
}

export default function DigPage() {
  const { user, axisScores } = useAuth();
  const [situation, setSituation] = useState('');
  const [text, setText] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [selected, setSelected] = useState<MatchResult | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [interpreting, setInterpreting] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
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

      const scored = questions.map((q: any) => {
        const qText = (q.question ?? '').toLowerCase();
        const kws = (q.keywords ?? []).map((k: string) => k.toLowerCase());
        let kwScore = 0, textScore = 0;
        for (const t of tokens) {
          if (kws.some((k: string) => k.includes(t))) kwScore += 1;
          if (qText.includes(t)) textScore += 0.5;
        }
        const score = tokens.length > 0
          ? (kwScore / tokens.length) * 0.6 + (textScore / tokens.length) * 0.4
          : 0;
        return { q, score };
      })
        .filter((x: any) => x.score >= 0.2)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5);

      if (user && scored.length > 0) {
        await (supabase as any).from('m43_user_question_logs').insert({
          user_id: user.id,
          user_question: query,
          matched_question_id: scored[0].q.id,
          match_score: scored[0].score,
          mode: 'T',
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
    onSuccess: async (data) => {
      setResults(data);
      if (data.length > 0) {
        const top = data[0];
        setSelected(top);
        // AI 패턴 해석 요청
        setInterpreting(true);
        setInterpretation('');
        try {
          const { data: res, error } = await supabase.functions.invoke('dig-interpret', {
            body: {
              situation,
              text,
              matchedQuestion: top.question,
              matchedAnswer: top.answer,
              researcher: top.researcher,
              domain: top.domain,
              axisScores,
            },
          });
          if (!error) setInterpretation(res?.interpretation ?? '');
        } catch (e) {
          console.error('dig-interpret error:', e);
        } finally {
          setInterpreting(false);
        }
      }
    },
  });

  const handleSubmit = () => {
    const query = `${situation} ${text}`.trim();
    if (!query) return;
    searchMutation.mutate(query);
  };

  if (selected) {
    return (
      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        <button
          onClick={() => { setSelected(null); setInterpretation(''); }}
          className="text-xs text-muted-foreground"
        >← 돌아가기</button>

        {/* AI 패턴 해석 */}
        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground">패턴 해석</p>
          {interpreting ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              분석 중...
            </div>
          ) : interpretation ? (
            <p className="text-sm leading-relaxed">{interpretation}</p>
          ) : null}
        </div>

        {/* M43 연구 매칭 */}
        <div className="bg-card border rounded-2xl p-5 space-y-4">
          <div>
            <span className="text-xs text-muted-foreground">{selected.domain}</span>
            <p className="font-medium mt-1">{selected.question}</p>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">— {selected.researcher}</p>
            <p className="text-sm leading-relaxed">{selected.answer}</p>
          </div>
        </div>

        {results.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">다른 관련 답변</p>
            {results.slice(1).map((r, i) => (
              <button key={i} onClick={() => setSelected(r)}
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
      <div>
        <h2 className="text-lg font-semibold">Dig</h2>
        <p className="text-sm text-muted-foreground mt-1">왜 이런 패턴이 반복되는지 파고들어요.</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">어떤 관계 상황인가요?</p>
        <div className="grid grid-cols-3 gap-2">
          {SITUATIONS.map(s => (
            <button key={s} onClick={() => setSituation(s)}
              className={`px-3 py-2.5 rounded-xl border text-xs transition-colors
                ${situation === s ? 'border-primary bg-primary/5' : 'border-border'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        placeholder="구체적인 상황을 입력해 주세요"
        value={text}
        onChange={e => setText(e.target.value)}
        className="h-28 resize-none"
      />

      {axisScores && axisScores.C <= 35 && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          💡 욕구표현 축이 낮게 나왔어요. 원하는 것을 말하기 어려운 패턴이 있을 수 있어요.
        </p>
      )}

      <Button className="w-full h-11" onClick={handleSubmit}
        disabled={searchMutation.isPending || (!situation && !text.trim())}>
        {searchMutation.isPending ? '탐색 중...' : '패턴 분석 시작'}
      </Button>
    </div>
  );
}
