import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

import { Step1BrainstormingSection } from "@/components/why/Step1BrainstormingSection";
import { Step2DefinitionSection } from "@/components/why/Step2DefinitionSection";
import { Step3ClassificationSection } from "@/components/why/Step3ClassificationSection";
import { Step4ResultsSection } from "@/components/why/Step4ResultsSection";

// Constants & Types
const DURATION_SECONDS = 600; // 10 minutes

interface Job {
  id: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
  category: "happy" | "pain" | "neutral" | null;
  reason?: string | null;
}

interface SessionInfo {
  id: string;
  status: "active" | "completed" | string | null;
  ended_at?: string | null;
}

const Why = () => {
  const { user } = useAuth();

  // Global flow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Step 1 state
  const [secondsLeft, setSecondsLeft] = useState<number>(DURATION_SECONDS);
  const [memoText, setMemoText] = useState("");
  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Step 2 state
  const [idx, setIdx] = useState(0);
  const [isNormalizing, setIsNormalizing] = useState(false);

  // Step 3 state
  const [phase, setPhase] = useState<"happy" | "pain">("happy");
  const [happySet, setHappySet] = useState<Set<string>>(new Set());
  const [painSet, setPainSet] = useState<Set<string>>(new Set());

  // Computed values
  const current = jobs[idx];
  const total = jobs.length;
  const resultsReady = useMemo(() => jobs.length > 0 && jobs.every(j => j.category), [jobs]);
  const defsDone = useMemo(() => jobs.length > 0 && jobs.every(j => !!j.definition && !!j.first_memory), [jobs]);
  
  const flowProgress = useMemo(() => {
    let pct = 0;
    if (session && session.ended_at) pct += 25;
    if (defsDone) pct += 25;
    if (resultsReady) pct += 50;
    return pct;
  }, [session, defsDone, resultsReady]);

  const currentJobCount = useMemo(() => {
    if (memoText.trim().length === 0) {
      return jobs.length;
    }
    const memoJobs = memoText
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0).length;
    return memoJobs > 0 ? memoJobs : jobs.length;
  }, [memoText, jobs.length]);

  const canGoStep2 = jobs.length > 0;
  const canGoStep3 = defsDone;
  const canGoStep4 = resultsReady;

  // Profile update function - Why 분석 완료 시 프로필 업데이트
  const updateProfileAnalysisStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_analysis: true })
        .eq('id', user.id);
      
      if (error) {
        console.error("Failed to update profile analysis status:", error);
      } else {
        console.log("✅ Profile analysis status updated successfully");
      }
    } catch (error) {
      console.error("Exception updating profile:", error);
    }
  };

  // Data operations
  const findBestSession = async () => {
    if (!user?.id) return null;

    try {
      const { data: sessionWithJobs, error } = await supabase
        .from("brainstorm_sessions")
        .select(`
          id, status, ended_at, started_at, total_jobs,
          job_entries (id)
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) {
        const { data: fallback } = await supabase
          .from("brainstorm_sessions")
          .select("id, status, ended_at, started_at, total_jobs")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return fallback;
      }

      if (!sessionWithJobs || sessionWithJobs.length === 0) {
        return null;
      }

      const sessionWithJobData = sessionWithJobs.find(session => 
        session.job_entries && session.job_entries.length > 0
      );

      return sessionWithJobData || sessionWithJobs[0];
    } catch (error) {
      console.error("findBestSession error:", error);
      const { data: simple } = await supabase
        .from("brainstorm_sessions")
        .select("id, status, ended_at, started_at, total_jobs")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return simple;
    }
  };

  const addFromMemo = async () => {
    if (!session?.id) return;
    
    const lines = memoText
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    if (lines.length === 0) return;

    const existingLower = new Set(jobs.map(j => j.job_name.toLowerCase()));
    const seen = new Set<string>();
    const uniqueOriginal: string[] = [];
    
    for (const line of lines) {
      const low = line.toLowerCase();
      if (existingLower.has(low) || seen.has(low)) continue;
      seen.add(low);
      uniqueOriginal.push(line);
    }
    
    if (uniqueOriginal.length === 0) {
      toast({
        title: "중복 항목",
        description: "이미 추가된 직업입니다.",
        variant: "destructive",
      });
      return;
    }

    const temps = uniqueOriginal.map(u => ({
      id: `tmp-${Math.random().toString(36).slice(2)}`,
      job_name: u,
      definition: null,
      first_memory: null,
      category: null,
    }) as Job);
    setJobs(prev => [...temps, ...prev]);

    const payload = uniqueOriginal.map(name => ({ 
      job_name: name, 
      session_id: session.id,
      user_id: user?.id ?? null
    }));
    
    const { data, error } = await supabase
      .from("job_entries")
      .insert(payload)
      .select("id, job_name, definition, first_memory, category");
      
    if (error) {
      setJobs(prev => prev.filter(p => !p.id.startsWith("tmp-")));
      toast({ title: "추가 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
      return;
    }
    
    const insertedCount = (data as Job[]).length;
    setJobs(prev => [...(data as Job[]), ...prev.filter(p => !p.id.startsWith("tmp-"))]);
  };

  const finalizeStep1Early = async () => {
    try {
      let sessId = session?.id as string | undefined;
      
      if (!sessId) {
        const { data: created, error: createErr } = await supabase
          .from("brainstorm_sessions")
          .insert({
            timer_duration: DURATION_SECONDS,
            status: "active",
            user_id: user?.id ?? null,
          })
          .select("id, status, ended_at")
          .maybeSingle();
          
        if (createErr || !created) {
          toast({ title: "세션 생성 실패", description: "다시 시도해주세요.", variant: "destructive" });
          return;
        }
        
        sessId = created.id;
        setSession({ id: created.id, status: created.status, ended_at: created.ended_at });
      }

      await addFromMemo();

      const endedAt = new Date().toISOString();
      const { error: updErr } = await supabase
        .from("brainstorm_sessions")
        .update({ ended_at: endedAt, status: "completed", total_jobs: jobs.length })
        .eq("id", sessId);

      if (updErr) {
        toast({ title: "세션 완료 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
        return;
      }

      setSession(prev => prev ? { ...prev, ended_at: endedAt, status: "completed" } : { id: sessId!, status: "completed", ended_at: endedAt });
      toast({ title: "세션 완료", description: "정의 단계로 이동하세요." });
      
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setStep(2);
    } catch (e) {
      console.error("finalizeStep1Early exception", e);
      toast({ title: "오류 발생", description: "세션 완료 중 문제가 발생했습니다.", variant: "destructive" });
    }
  };

  const goBackToEditMode = () => {
    if (jobs.length > 0) {
      const jobNames = jobs.map(j => j.job_name).join(', ');
      setMemoText(jobNames);
      
      toast({
        title: "수정 모드로 전환",
        description: "기존 직업 데이터를 불러왔습니다. 수정 후 다시 진행하세요.",
      });
    }
    
    setStep(1);
    
    if (session?.ended_at) {
      setSession(prev => prev ? { ...prev, ended_at: null, status: "active" } : prev);
    }
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(DURATION_SECONDS);
    endTimeRef.current = null;
  };

  const normalizeCombinedJobs = async () => {
    if (!session?.id) {
      setIsNormalizing(false);
      return;
    }
    
    const combined = jobs.filter(j => j.job_name.includes(","));
    if (combined.length === 0) {
      setIsNormalizing(false);
      return;
    }

    const existingLower = new Set(jobs.map(j => j.job_name.trim().toLowerCase()));
    const toInsert: { job_name: string; session_id: string; user_id: string | null }[] = [];
    const added = new Set<string>();

    for (const row of combined) {
      const parts = row.job_name.split(",").map(s => s.trim()).filter(Boolean);
      for (const name of parts) {
        const low = name.toLowerCase();
        if (existingLower.has(low) || added.has(low)) continue;
        toInsert.push({ 
          job_name: name, 
          session_id: session.id,
          user_id: user?.id ?? null
        });
        added.add(low);
      }
    }

    if (toInsert.length > 0) {
      const { data: inserted, error } = await supabase
        .from("job_entries")
        .insert(toInsert)
        .select("id, job_name, definition, first_memory, category, reason");
        
      if (error) {
        setIsNormalizing(false);
        return;
      }
    }

    const combinedIds = combined.map(c => c.id);
    const { error: delErr } = await supabase
      .from("job_entries")
      .delete()
      .in("id", combinedIds);

    const { data: refreshed } = await supabase
      .from("job_entries")
      .select("id, job_name, definition, first_memory, category, reason")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
      
    setJobs((refreshed || []) as Job[]);
    setIdx(0);
    setIsNormalizing(false);
  };

  const saveCurrent = async (definition: string, memory: string) => {
    if (!current) return true;
    
    const def = definition.trim();
    const mem = memory.trim();
    
    if (!def || !mem) {
      toast({
        title: "입력 필요",
        description: "정의와 각인 순간을 모두 작성하세요.",
        variant: "destructive"
      });
      return false;
    }
    
    const { error } = await supabase
      .from("job_entries")
      .update({ definition: def, first_memory: mem })
      .eq("id", current.id);
      
    if (error) {
      toast({ title: "저장 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
      return false;
    }
    
    setJobs(prev => prev.map(j => j.id === current.id ? { ...j, definition: def, first_memory: mem } : j));
    return true;
  };

  // Step 3 handlers
  const toggleHappy = (id: string) => {
    setHappySet(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      setPainSet(p => {
        const cp = new Set(p);
        cp.delete(id);
        return cp;
      });
      return s;
    });
  };

  const togglePain = (id: string) => {
    setPainSet(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      setHappySet(p => {
        const cp = new Set(p);
        cp.delete(id);
        return cp;
      });
      return s;
    });
  };

  // commitClassification - Why 분석 완료 시 프로필 업데이트 추가
  const commitClassification = async () => {
    if (!session?.id) return;
    
    const ids = jobs.map(j => j.id);
    const happyIds = Array.from(happySet);
    const painIds = Array.from(painSet);
    const neutralIds = ids.filter(id => !happySet.has(id) && !painSet.has(id));
    
    try {
      if (happyIds.length) await supabase.from("job_entries").update({ category: "happy", reason: null }).in("id", happyIds);
      if (painIds.length) await supabase.from("job_entries").update({ category: "pain", reason: null }).in("id", painIds);
      if (neutralIds.length) await supabase.from("job_entries").update({ category: "neutral", reason: null }).in("id", neutralIds);
      
      setJobs(prev => prev.map(j => 
        happySet.has(j.id) ? { ...j, category: "happy" } : 
        painSet.has(j.id) ? { ...j, category: "pain" } : 
        { ...j, category: "neutral" }
      ));

      // Why 분석 완료 시 프로필 업데이트
      await updateProfileAnalysisStatus();
      
      toast({ 
        title: "WHY 분석 완료!", 
        description: "이제 Ikigai 설계와 커뮤니티 매칭을 사용할 수 있습니다." 
      });
      setStep(4);
    } catch (e: any) {
      toast({ title: "저장 실패", description: "분류 저장에 실패했습니다.", variant: "destructive" });
    }
  };

  // Effects
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from("brainstorm_sessions")
          .select("count")
          .limit(1);
        
        if (tableError) {
          toast({
            title: "데이터베이스 연결 문제",
            description: `테이블 접근 실패: ${tableError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        const last = await findBestSession();
        if (!active) return;
        
        if (!last) {
          setSession(null);
          setJobs([]);
          setStep(1);
          return;
        }
        
        setSession({
          id: last.id,
          status: last.status,
          ended_at: last.ended_at
        });
        
        const { data: entries } = await supabase
          .from("job_entries")
          .select("id, job_name, definition, first_memory, category, reason")
          .eq("session_id", last.id)
          .order("created_at", { ascending: true });
        
        const js = (entries || []) as Job[];
        setJobs(js);
        
        if (js.length > 0 && !last.ended_at) {
          const jobNames = js.map(j => j.job_name).join(', ');
          setMemoText(jobNames);
        }
        
        if (js.length > 0) {
          const happyJobs = js.filter(j => j.category === "happy").map(j => j.id);
          const painJobs = js.filter(j => j.category === "pain").map(j => j.id);
          setHappySet(new Set(happyJobs));
          setPainSet(new Set(painJobs));
          
          const allClassified = js.every(j => j.category);
          const hasHappy = happyJobs.length > 0;
          const hasPain = painJobs.length > 0;
          
          if (!allClassified) {
            setPhase(hasHappy && !hasPain ? "pain" : "happy");
          }
        }
        
        const hasAny = js.length > 0;
        const defsDone = hasAny && js.every(j => !!j.definition && !!j.first_memory);
        const clsDone = hasAny && js.every(j => !!j.category);
        
        if (!defsDone && hasAny) {
          const firstIncomplete = js.findIndex(j => !j.definition || !j.first_memory);
          if (firstIncomplete >= 0) {
            setIdx(firstIncomplete);
          }
        }
        
        const nextStep: 1 | 2 | 3 | 4 =
          last.ended_at && clsDone ? 4 :
          last.ended_at && defsDone ? 3 :
          last.ended_at && hasAny ? 2 : 1;
          
        setStep(nextStep);

        // 기존 완료된 분석이 있으면 프로필 업데이트 (한 번만 실행)
        if (clsDone && hasAny) {
          await updateProfileAnalysisStatus();
        }
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user?.id]);

  // Timer effect for Step 1
  useEffect(() => {
    if (step !== 1 || session?.ended_at) return;
    
    const startTimer = () => {
      endTimeRef.current = Date.now() + DURATION_SECONDS * 1000;
      setSecondsLeft(DURATION_SECONDS);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        if (!endTimeRef.current) return;
        const diff = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(diff);
      }, 1000);
    };

    const ensureSession = async () => {
      if (session) return session;
      
      const { data, error } = await supabase
        .from("brainstorm_sessions")
        .insert({
          timer_duration: DURATION_SECONDS,
          status: "active",
          user_id: user?.id ?? null
        })
        .select("id, status, ended_at")
        .maybeSingle();
      
      if (error || !data) {
        toast({
          title: "세션 생성 실패",
          description: error?.message || "다시 시도해주세요.",
          variant: "destructive"
        });
        return null;
      }
      
      setSession({
        id: data.id,
        status: data.status,
        ended_at: data.ended_at
      });
      return { id: data.id } as SessionInfo;
    };
    
    ensureSession().then(s => {
      if (!s) return;
      startTimer();
    });
    
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [step, session, user?.id]);

  // Timer finalize effect
  useEffect(() => {
    if (secondsLeft !== 0 || !session || session.ended_at) return;
    
    const finalize = async () => {
      const endedAt = new Date().toISOString();
      await addFromMemo();
      
      const { error } = await supabase
        .from("brainstorm_sessions")
        .update({ ended_at: endedAt, status: "completed", total_jobs: jobs.length })
        .eq("id", session.id);
        
      if (error) {
        toast({ title: "세션 종료 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
        return;
      }
      
      setSession(prev => prev ? { ...prev, ended_at: endedAt, status: "completed" } : prev);
      toast({ title: "브레인스토밍 종료", description: "정의 단계로 이동할 수 있어요." });
      
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setStep(2);
    };
    finalize();
  }, [secondsLeft, session, jobs.length]);

  // Step 2 normalization effect
  useEffect(() => {
    if (step !== 2) return;
    const hasCombined = jobs.some(j => j.job_name.includes(","));
    if (!hasCombined || isNormalizing) {
      setIsNormalizing(false);
      return;
    }
    
    let active = true;
    setIsNormalizing(true);
    normalizeCombinedJobs().finally(() => {
      if (active) setIsNormalizing(false);
    });
    return () => { active = false; };
  }, [step, jobs.length]);

  return (
    <>
      <Helmet>
        <title>WHY 단계별 플로우 | PRIPER</title>
        <meta name="description" content="10분 브레인스토밍부터 정의·분류·결과까지 한 페이지에서 흐름대로 진행" />
        <link rel="canonical" href={`${window.location.origin}/why`} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-4 text-center" aria-label="WHY 페이지 헤더">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: 'auto' }}
            alt="WHY 단계 헤더 이미지"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
        ) : (
          <div className="space-y-5">
            {step === 1 && (
              <Step1BrainstormingSection
                memoText={memoText}
                setMemoText={setMemoText}
                secondsLeft={secondsLeft}
                currentJobCount={currentJobCount}
                onFinalize={finalizeStep1Early}
                sessionEnded={!!session?.ended_at}
              />
            )}

            {step === 2 && (
              <Step2DefinitionSection
                jobs={jobs}
                idx={idx}
                setIdx={setIdx}
                session={session}
                isNormalizing={isNormalizing}
                onSaveCurrent={saveCurrent}
                onPrevStep={() => setStep(1)}
                onNextStep={() => setStep(3)}
                canGoStep3={canGoStep3}
              />
            )}

            {step === 3 && (
              <Step3ClassificationSection
                jobs={jobs}
                phase={phase}
                setPhase={setPhase}
                happySet={happySet}
                painSet={painSet}
                onToggleHappy={toggleHappy}
                onTogglePain={togglePain}
                onCommitClassification={commitClassification}
                onPrevStep={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <Step4ResultsSection
                jobs={jobs}
                onPrevStep={() => setStep(3)}
                onGoBackToEditMode={goBackToEditMode}
              />
            )}
          </div>
        )}

        <header className="mt-6">
          <div className="mt-3">
            <Progress value={flowProgress} />
            <p className="text-xs text-muted-foreground mt-2">진행률 {flowProgress}% · 단계 {step}/4</p>
          </div>
        </header>
      </main>
    </>
  );
};

export default Why;