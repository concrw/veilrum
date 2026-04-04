// Dig — 왜 내가 이런지 알고 싶다
// 기능: 상황 입력 → Division 선택 → 반복 구조 탐지 → M43 매칭 + AI 패턴 해석

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, veilrumDb } from '@/integrations/supabase/client';
import { saveDigSignal } from '@/hooks/useSignalPipeline';
import { ErrorState } from '@/components/ErrorState';
import { usePremiumTrigger } from '@/hooks/usePremiumTrigger';
import { useAiUsageCount } from '@/hooks/useAiUsageCount';
import UpgradeModal from '@/components/premium/UpgradeModal';
import { DigSearchForm } from '@/components/dig/DigSearchForm';
import { DigResultList } from '@/components/dig/DigResultList';
import { DigHistory } from '@/components/dig/DigHistory';

interface Division {
  id: string;
  code: string;
  name: string;
}

interface MatchResult {
  question: string;
  answer: string;
  researcher: string;
  domain: string;
  divisionCode: string;
  score: number;
}

interface DigHistoryItem {
  id: string;
  domain: string;
  content: string;
  score: number;
  situation: string;
  emotion: string;
  created_at: string;
}

interface PatternProfile {
  id: string;
  pattern_axis: string;
  score: number;
  confidence: number;
  trend: 'rising' | 'stable' | 'declining';
}

export default function DigPage() {
  const { user, axisScores } = useAuth();
  const qc = useQueryClient();
  const [situation, setSituation] = useState('');
  const [divisionId, setDivisionId] = useState<string>('');
  const [text, setText] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [selected, setSelected] = useState<MatchResult | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [interpreting, setInterpreting] = useState(false);

  // Vent→Dig 맥락 연결: 최근 Vent 세션 요약 조회
  const { data: recentVent } = useQuery({
    queryKey: ['recent-vent-session', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb
        .from('dive_sessions')
        .select('emotion, context_summary, held_keywords, created_at')
        .eq('user_id', user!.id)
        .eq('session_completed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!data) return null;
      // 24시간 이내 세션만 표시
      const sessionTime = new Date(data.created_at).getTime();
      if (Date.now() - sessionTime > 24 * 60 * 60 * 1000) return null;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
  const [ventDismissed, setVentDismissed] = useState(false);

  // Dig 히스토리 (최근 20건)
  const { data: digHistory = [], isError: digHistoryError, refetch: refetchHistory } = useQuery<DigHistoryItem[]>({
    queryKey: ['dig-history', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb
        .from('user_signals')
        .select('id, domain, content, score, meta, created_at')
        .eq('user_id', user!.id)
        .eq('signal_type', 'dig')
        .order('created_at', { ascending: false })
        .limit(20);
      return (data ?? []).map((d: any) => ({
        id: d.id, domain: d.domain ?? '', content: d.content ?? '',
        score: d.score ?? 0, situation: d.meta?.situation ?? '',
        emotion: d.meta?.emotion ?? '', created_at: d.created_at,
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // 도메인별 반복 횟수 (이번 달)
  const domainCounts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const counts: Record<string, number> = {};
    digHistory.filter(h => h.created_at >= monthStart).forEach(h => {
      if (h.domain) counts[h.domain] = (counts[h.domain] ?? 0) + 1;
    });
    return counts;
  }, [digHistory]);

  const comboPatternCounts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const counts: Record<string, number> = {};
    digHistory.filter(h => h.created_at >= monthStart).forEach(h => {
      const key = `${h.domain}::${h.situation}`;
      if (h.domain) counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [digHistory]);

  const historyPatternIndex = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const domainOrder: Record<string, number> = {};
    const indexMap: Record<string, number> = {};
    const monthItems = digHistory
      .filter(h => h.created_at >= monthStart && h.domain)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    monthItems.forEach(h => {
      domainOrder[h.domain] = (domainOrder[h.domain] ?? 0) + 1;
      indexMap[h.id] = domainOrder[h.domain];
    });
    return indexMap;
  }, [digHistory]);

  const { data: patternProfiles = [] } = useQuery<PatternProfile[]>({
    queryKey: ['pattern-profiles', user?.id],
    queryFn: async () => {
      const { data } = await veilrumDb
        .from('pattern_profiles')
        .select('id, pattern_axis, score, confidence, trend')
        .eq('user_id', user!.id);
      return (data ?? []) as PatternProfile[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: divisions = [] } = useQuery<Division[]>({
    queryKey: ['m43-divisions'],
    queryFn: async () => {
      const { data } = await veilrumDb
        .from('m43_divisions')
        .select('id, code, name')
        .order('code');
      return (data ?? []) as Division[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

      let domainFilter: string[] = [];
      if (divisionId) {
        const { data: domainRows } = await veilrumDb
          .from('m43_domains').select('id').eq('division_id', divisionId);
        domainFilter = (domainRows ?? []).map((d: any) => d.id);
      }

      let questionQuery = veilrumDb
        .from('m43_domain_questions')
        .select(`id, question, keywords, category,
          m43_domain_answers(answer, m43_researchers(name, specialty)),
          m43_domains(id, name, code, division_id, m43_divisions(code))`)
        .limit(300);

      if (domainFilter.length > 0) questionQuery = questionQuery.in('domain_id', domainFilter);

      const { data: questions } = await questionQuery;
      if (!questions) return [];

      interface DomainQuestion {
        id: string; question: string | null; keywords: string[] | null; category: string | null;
        m43_domain_answers: { answer: string; m43_researchers: { name: string; specialty: string } }[] | null;
        m43_domains: { id: string; name: string; code: string; division_id: string; m43_divisions: { code: string } } | null;
      }
      const scored = (questions as DomainQuestion[]).map((q) => {
        const qText = (q.question ?? '').toLowerCase();
        const kws = (q.keywords ?? []).map((k: string) => k.toLowerCase());
        let kwScore = 0, textScore = 0;
        for (const t of tokens) {
          if (kws.some((k: string) => k.includes(t))) kwScore += 1;
          if (qText.includes(t)) textScore += 0.5;
        }
        const score = tokens.length > 0 ? (kwScore / tokens.length) * 0.6 + (textScore / tokens.length) * 0.4 : 0;
        return { q, score };
      }).filter(x => x.score >= 0.2).sort((a, b) => b.score - a.score).slice(0, 5);

      if (user && scored.length > 0) {
        await veilrumDb.from('m43_user_question_logs').insert({
          user_id: user.id, user_question: query,
          matched_question_id: scored[0].q.id, match_score: scored[0].score, mode: 'T',
        });
      }

      return scored.map(({ q, score }) => ({
        question: q.question, answer: q.m43_domain_answers?.[0]?.answer ?? '',
        researcher: q.m43_domain_answers?.[0]?.m43_researchers?.name ?? '연구원',
        domain: q.m43_domains?.name ?? '', divisionCode: q.m43_domains?.m43_divisions?.code ?? '', score,
      })) as MatchResult[];
    },
    onSuccess: async (data) => {
      setResults(data);
      if (data.length > 0) {
        const top = data[0];
        setSelected(top);
        if (user) {
          saveDigSignal(user.id, { situation, text, matchedQuestion: top.question, domain: top.domain, score: top.score });
          qc.invalidateQueries({ queryKey: ['dig-history', user.id] });

          const currentDomainCount = (domainCounts[top.domain] ?? 0) + 1;
          const patternScore = Math.min(100, currentDomainCount * 15);
          const confidence = Math.min(100, top.score * 100);
          const trend = currentDomainCount >= 3 ? 'rising' : 'stable';
          try {
            await veilrumDb.from('pattern_profiles').upsert({
              user_id: user.id, pattern_axis: top.domain, score: patternScore,
              confidence, trend, updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,pattern_axis' });
            qc.invalidateQueries({ queryKey: ['pattern-profiles', user.id] });
          } catch (e) { console.error('pattern_profiles upsert error:', e); }
        }
        setInterpreting(true);
        setInterpretation('');
        try {
          const { data: res, error } = await supabase.functions.invoke('dig-interpret', {
            body: { situation, text, matchedQuestion: top.question, matchedAnswer: top.answer, researcher: top.researcher, domain: top.domain, axisScores, userId: user?.id },
          });
          if (!error) setInterpretation(res?.interpretation ?? '');
        } catch (e) {
          console.error('dig-interpret error:', e);
          setInterpretation('AI 해석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
        finally { setInterpreting(false); }
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
      <DigResultList
        selected={selected}
        results={results}
        situation={situation}
        domainCounts={domainCounts}
        comboPatternCounts={comboPatternCounts}
        patternProfiles={patternProfiles}
        interpretation={interpretation}
        interpreting={interpreting}
        onBack={() => { setSelected(null); setInterpretation(''); }}
        onSelectResult={setSelected}
      />
    );
  }

  if (digHistoryError) {
    return <ErrorState title="Dig 데이터를 불러오지 못했습니다" onRetry={() => refetchHistory()} />;
  }

  return (
    <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Dig</h2>
        <p className="text-sm text-muted-foreground mt-1">왜 이런 패턴이 반복되는지 파고들어요.</p>
      </div>

      {/* Vent→Dig 맥락 연결 배너 */}
      {recentVent && !ventDismissed && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔗</span>
              <p className="text-xs font-medium text-violet-400">Vent에서 이런 패턴이 보였어요</p>
            </div>
            <button onClick={() => setVentDismissed(true)} className="text-xs text-muted-foreground">✕</button>
          </div>
          <p className="text-sm leading-relaxed">
            {recentVent.emotion && <span className="font-medium">{recentVent.emotion}</span>}
            {recentVent.context_summary && (
              <span className="text-muted-foreground"> — {recentVent.context_summary.slice(0, 80)}</span>
            )}
          </p>
          {recentVent.held_keywords && recentVent.held_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(recentVent.held_keywords as string[]).slice(0, 5).map((kw: string, i: number) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                  {kw.slice(0, 20)}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              if (recentVent.emotion) setSituation(recentVent.emotion);
              setVentDismissed(true);
            }}
            className="text-xs text-violet-400 font-medium hover:underline"
          >
            이 맥락으로 탐색 시작하기
          </button>
        </div>
      )}

      <DigSearchForm
        situation={situation}
        onSituationChange={setSituation}
        divisionId={divisionId}
        onDivisionIdChange={setDivisionId}
        divisions={divisions}
        text={text}
        onTextChange={setText}
        axisScores={axisScores}
        onSubmit={handleSubmit}
        isPending={searchMutation.isPending}
      />

      <DigHistory
        digHistory={digHistory}
        domainCounts={domainCounts}
        comboPatternCounts={comboPatternCounts}
        historyPatternIndex={historyPatternIndex}
        patternProfiles={patternProfiles}
      />
    </div>
  );
}
