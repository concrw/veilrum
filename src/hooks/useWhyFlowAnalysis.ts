// WhyFlow AI 분석 + M43 통합 + Prime Perspective 저장 (Step 7~10)
import { veilrumDb, supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { WhySession, JobEntry, AnalysisResult } from '@/types/why';
import type { WhyM43Analysis } from '@/hooks/useM43WhyIntegration';

interface UseWhyFlowAnalysisProps {
  user: { id: string } | null;
  session: WhySession | null;
  setSession: React.Dispatch<React.SetStateAction<WhySession | null>>;
  jobs: JobEntry[];
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  analyzing: boolean;
  setAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  analysisResult: AnalysisResult | null;
  setAnalysisResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  ppText: string;
  setPpText: React.Dispatch<React.SetStateAction<string>>;
  ppSaving: boolean;
  setPpSaving: React.Dispatch<React.SetStateAction<boolean>>;
  m43: {
    analysis: WhyM43Analysis | null;
    setAnalysis: (a: WhyM43Analysis) => void;
    runM43Analysis: (sessionId: string, userId: string, jobs: JobEntry[]) => Promise<WhyM43Analysis | null>;
  };
  updateSessionStep: (step: number) => Promise<void>;
}

export function useWhyFlowAnalysis(props: UseWhyFlowAnalysisProps) {
  const {
    user, session, setSession, jobs,
    setStep, setAnalyzing, setAnalysisResult,
    ppText, setPpSaving,
    m43, updateSessionStep,
  } = props;

  const buildLocalAnalysis = (): AnalysisResult => {
    const happyJobs = jobs.filter(j => j.category === 'happy');
    const painJobs = jobs.filter(j => j.category === 'pain');

    const extractKeywords = (texts: string[]) => {
      const all = texts.join(' ').split(/[\s,.]+/).filter(t => t.length > 1);
      const freq: Record<string, number> = {};
      for (const w of all) freq[w] = (freq[w] ?? 0) + 1;
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
    };

    return {
      happy_patterns: {
        jobs: happyJobs.map(j => j.job_name),
        keywords: extractKeywords(happyJobs.map(j => `${j.reason ?? ''} ${j.first_memory ?? ''}`)),
      },
      pain_patterns: {
        jobs: painJobs.map(j => j.job_name),
        keywords: extractKeywords(painJobs.map(j => `${j.reason ?? ''} ${j.first_memory ?? ''}`)),
      },
      value_alignment: null,
    };
  };

  const runAnalysis = async () => {
    if (!session) return;
    setAnalyzing(true);
    try {
      const localResult = buildLocalAnalysis();
      setAnalysisResult(localResult);

      // Edge Function 호출 (실패해도 진행)
      try {
        const { data, error } = await supabase.functions.invoke('analyze-why-patterns', {
          body: {
            session_id: session.id,
            jobs: jobs.map(j => ({
              job_name: j.job_name,
              definition: j.definition,
              first_memory: j.first_memory,
              category: j.category,
              reason: j.reason,
              has_experience: j.has_experience,
              experience_note: j.experience_note,
            })),
            include_m43: true,
          },
        });
        if (!error && data) {
          setAnalysisResult(prev => prev ? { ...prev, ...data } : data);
        }
      } catch (e) {
        console.warn('analyze-why-patterns edge function skipped:', e);
      }

      // M43 통합 분석
      await m43.runM43Analysis(session.id, user!.id, jobs);

      // 분석 결과 DB 저장
      await veilrumDb
        .from('why_sessions')
        .update({
          happy_patterns: localResult.happy_patterns,
          pain_patterns: localResult.pain_patterns,
          value_alignment: localResult.value_alignment,
          current_step: 7,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      setSession(prev => prev ? { ...prev, current_step: 7 } : prev);
      setStep(7);
    } catch (e) {
      console.error('analysis error:', e);
      const localResult = buildLocalAnalysis();
      setAnalysisResult(localResult);
      await veilrumDb
        .from('why_sessions')
        .update({ happy_patterns: localResult.happy_patterns, pain_patterns: localResult.pain_patterns, current_step: 7, updated_at: new Date().toISOString() })
        .eq('id', session!.id);
      setSession(prev => prev ? { ...prev, current_step: 7 } : prev);
      setStep(7);
    } finally {
      setAnalyzing(false);
    }
  };

  const advanceToStep8 = async () => {
    await updateSessionStep(8);
    setStep(8);
  };

  const advanceToStep9 = async () => {
    await updateSessionStep(9);
    setStep(9);
  };

  const advanceToStep10 = async () => {
    await updateSessionStep(10);
    setStep(10);
  };

  const savePrimePerspective = async () => {
    if (!ppText.trim()) {
      toast({ title: 'Prime Perspective를 작성해 주세요.', variant: 'destructive' });
      return;
    }
    setPpSaving(true);
    try {
      await veilrumDb
        .from('why_sessions')
        .update({
          prime_perspective: ppText.trim(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session!.id);

      await veilrumDb.from('prime_perspectives').upsert({
        user_id: user!.id,
        perspective_text: ppText.trim(),
        m43_domain_codes: m43.analysis?.domainMatches?.slice(0, 5).map((d: { domain: { code: string } }) => d.domain.code) ?? [],
        m43_framework_codes: m43.analysis?.frameworkTags?.filter((f: { relevance: number }) => f.relevance > 0.2).map((f: { framework: { code: string } }) => f.framework.code) ?? [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setSession(prev => prev ? { ...prev, prime_perspective: ppText.trim(), completed_at: new Date().toISOString(), status: 'completed' } : prev);
      toast({ title: 'Prime Perspective 완성!', description: 'Get 탭 → 정체성에서 확인할 수 있어요.' });
    } finally {
      setPpSaving(false);
    }
  };

  return {
    runAnalysis,
    advanceToStep8,
    advanceToStep9,
    advanceToStep10,
    savePrimePerspective,
  };
}
