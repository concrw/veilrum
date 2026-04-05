// WhyFlow 직업 CRUD 로직 (Step 1~6)
import { useState, useEffect } from 'react';
import { veilrumDb } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { WhySession, JobEntry } from '@/types/why';

interface UseWhyJobsProps {
  user: { id: string } | null;
  session: WhySession | null;
  setSession: React.Dispatch<React.SetStateAction<WhySession | null>>;
  jobs: JobEntry[];
  setJobs: React.Dispatch<React.SetStateAction<JobEntry[]>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  happySet: Set<string>;
  setHappySet: React.Dispatch<React.SetStateAction<Set<string>>>;
  painSet: Set<string>;
  setPainSet: React.Dispatch<React.SetStateAction<Set<string>>>;
  createSession: () => Promise<WhySession | null>;
  updateSessionStep: (step: number) => Promise<void>;
  timerRef: React.MutableRefObject<number | null>;
}

export function useWhyJobs(props: UseWhyJobsProps) {
  const {
    user, session, setSession, jobs, setJobs,
    step, setStep, happySet, setHappySet, painSet, setPainSet,
    createSession, updateSessionStep, timerRef,
  } = props;

  // Step 1 (브레인스토밍)
  const [memoText, setMemoText] = useState('');

  // Step 2/3 (정의/각인)
  const [jobIdx, setJobIdx] = useState(0);
  const [defText, setDefText] = useState('');
  const [memText, setMemText] = useState('');

  // Step 5 (이유)
  const [reasonIdx, setReasonIdx] = useState(0);
  const [reasonText, setReasonText] = useState('');

  // Step 6 (경험)
  const [expIdx, setExpIdx] = useState(0);
  const [hasExp, setHasExp] = useState(false);
  const [expNote, setExpNote] = useState('');

  // 현재 작업 직업 idx 복원
  useEffect(() => {
    if (jobs.length === 0) return;
    if (step === 2 || step === 3) {
      const idx = jobs.findIndex(j => !j.definition || !j.first_memory);
      setJobIdx(idx >= 0 ? idx : 0);
    }
    if (step === 5) {
      const classified = jobs.filter(j => j.category && j.category !== 'neutral');
      const idx = classified.findIndex(j => !j.reason);
      setReasonIdx(idx >= 0 ? idx : 0);
    }
    if (step === 6) {
      const idx = jobs.findIndex(j => j.has_experience === undefined || j.has_experience === null);
      setExpIdx(idx >= 0 ? idx : 0);
    }
  }, [jobs.length, step]);

  // Step 2 정의 텍스트 동기화
  const currentJobForDef = jobs[jobIdx];
  useEffect(() => {
    if (currentJobForDef) {
      setDefText(currentJobForDef.definition ?? '');
      setMemText(currentJobForDef.first_memory ?? '');
    }
  }, [jobIdx, jobs.length]);

  // Step 5 이유 텍스트 동기화
  const classifiedJobs = jobs.filter(j => j.category && j.category !== 'neutral');
  const currentJobForReason = classifiedJobs[reasonIdx];
  useEffect(() => {
    if (currentJobForReason) setReasonText(currentJobForReason.reason ?? '');
  }, [reasonIdx, classifiedJobs.length]);

  // Step 6 경험 동기화
  const currentJobForExp = jobs[expIdx];
  useEffect(() => {
    if (currentJobForExp) {
      setHasExp(currentJobForExp.has_experience ?? false);
      setExpNote(currentJobForExp.experience_note ?? '');
    }
  }, [expIdx, jobs.length]);

  // ── Step 1: 브레인스토밍 완료 ──
  const handleStep1Done = async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);

    const lines = memoText.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
    if (lines.length === 0) {
      toast({ title: '직업을 1개 이상 입력해 주세요.', variant: 'destructive' });
      return;
    }

    let sess = session;
    if (!sess) {
      sess = await createSession();
      if (!sess) return;
    }

    const payload = lines.map((name, i) => ({
      session_id: sess!.id,
      user_id: user!.id,
      job_name: name,
      sort_order: i,
    }));

    const { data: inserted, error } = await veilrumDb
      .from('why_job_entries')
      .insert(payload)
      .select();

    if (error) {
      toast({ title: '직업 저장 실패', variant: 'destructive' });
      return;
    }

    setJobs(inserted as JobEntry[]);
    setJobIdx(0);

    await veilrumDb
      .from('why_sessions')
      .update({ current_step: 2, timer_ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', sess.id);
    setSession(prev => prev ? { ...prev, current_step: 2 } : prev);
    setStep(2);
    toast({ title: `${lines.length}개 직업 저장 완료` });
  };

  // ── Step 2: 정의 저장 ──
  const saveDefinition = async () => {
    if (!defText.trim()) {
      toast({ title: '나만의 정의를 입력해 주세요.', variant: 'destructive' });
      return false;
    }
    const { error } = await veilrumDb
      .from('why_job_entries')
      .update({ definition: defText.trim(), updated_at: new Date().toISOString() })
      .eq('id', currentJobForDef.id);
    if (error) { toast({ title: '저장 실패', variant: 'destructive' }); return false; }
    setJobs(prev => prev.map(j => j.id === currentJobForDef.id ? { ...j, definition: defText.trim() } : j));
    return true;
  };

  const handleStep2Next = async () => {
    const ok = await saveDefinition();
    if (!ok) return;
    if (jobIdx < jobs.length - 1) {
      setJobIdx(jobIdx + 1);
    } else {
      setJobIdx(0);
      await updateSessionStep(3);
      setStep(3);
    }
  };

  // ── Step 3: 각인 순간 ──
  const currentJobForMem = jobs[jobIdx];

  const saveMemory = async () => {
    if (!memText.trim()) {
      toast({ title: '각인 순간을 입력해 주세요.', variant: 'destructive' });
      return false;
    }
    const { error } = await veilrumDb
      .from('why_job_entries')
      .update({ first_memory: memText.trim(), updated_at: new Date().toISOString() })
      .eq('id', currentJobForMem.id);
    if (error) { toast({ title: '저장 실패', variant: 'destructive' }); return false; }
    setJobs(prev => prev.map(j => j.id === currentJobForMem.id ? { ...j, first_memory: memText.trim() } : j));
    return true;
  };

  const handleStep3Next = async () => {
    const ok = await saveMemory();
    if (!ok) return;
    if (jobIdx < jobs.length - 1) {
      setJobIdx(jobIdx + 1);
    } else {
      await updateSessionStep(4);
      setStep(4);
    }
  };

  // ── Step 4: 분류 ──
  const toggleHappy = (id: string) => {
    setHappySet(prev => { const s = new Set(prev); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });
    setPainSet(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const togglePain = (id: string) => {
    setPainSet(prev => { const s = new Set(prev); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });
    setHappySet(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleStep4Done = async () => {
    if (happySet.size === 0) {
      toast({ title: '행복한 직업을 1개 이상 선택해 주세요.', variant: 'destructive' });
      return;
    }
    const updates = jobs.map(j => ({
      id: j.id,
      category: happySet.has(j.id) ? 'happy' : painSet.has(j.id) ? 'pain' : 'neutral',
    }));
    for (const u of updates) {
      await veilrumDb.from('why_job_entries').update({ category: u.category, updated_at: new Date().toISOString() }).eq('id', u.id);
    }
    setJobs(prev => prev.map(j => {
      const category: JobEntry['category'] = happySet.has(j.id) ? 'happy' : painSet.has(j.id) ? 'pain' : 'neutral';
      return { ...j, category };
    }));
    setReasonIdx(0);
    await updateSessionStep(5);
    setStep(5);
  };

  // ── Step 5: 이유 ──
  const saveReason = async () => {
    if (!reasonText.trim()) {
      toast({ title: '이유를 입력해 주세요.', variant: 'destructive' });
      return false;
    }
    const { error } = await veilrumDb
      .from('why_job_entries')
      .update({ reason: reasonText.trim(), updated_at: new Date().toISOString() })
      .eq('id', currentJobForReason.id);
    if (error) { toast({ title: '저장 실패', variant: 'destructive' }); return false; }
    setJobs(prev => prev.map(j => j.id === currentJobForReason.id ? { ...j, reason: reasonText.trim() } : j));
    return true;
  };

  const handleStep5Next = async () => {
    const ok = await saveReason();
    if (!ok) return;
    if (reasonIdx < classifiedJobs.length - 1) {
      setReasonIdx(reasonIdx + 1);
    } else {
      setExpIdx(0);
      await updateSessionStep(6);
      setStep(6);
    }
  };

  // ── Step 6: 경험 ──
  const saveExp = async () => {
    const { error } = await veilrumDb
      .from('why_job_entries')
      .update({ has_experience: hasExp, experience_note: expNote.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', currentJobForExp.id);
    if (error) { toast({ title: '저장 실패', variant: 'destructive' }); return false; }
    setJobs(prev => prev.map(j => j.id === currentJobForExp.id ? { ...j, has_experience: hasExp, experience_note: expNote.trim() || null } : j));
    return true;
  };

  const handleStep6Next = async (onAnalyze: () => void) => {
    const ok = await saveExp();
    if (!ok) return;
    if (expIdx < jobs.length - 1) {
      setExpIdx(expIdx + 1);
    } else {
      await updateSessionStep(7);
      setStep(7);
      onAnalyze();
    }
  };

  return {
    memoText, setMemoText,
    jobIdx, setJobIdx,
    defText, setDefText,
    memText, setMemText,
    reasonIdx, setReasonIdx,
    reasonText, setReasonText,
    expIdx, setExpIdx,
    hasExp, setHasExp,
    expNote, setExpNote,
    currentJobForDef,
    currentJobForMem,
    currentJobForReason,
    currentJobForExp,
    classifiedJobs,
    handleStep1Done,
    handleStep2Next,
    handleStep3Next,
    toggleHappy,
    togglePain,
    handleStep4Done,
    handleStep5Next,
    handleStep6Next,
  };
}
