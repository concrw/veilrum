import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { Job, SessionInfo } from "./useWhyPageFlow";

export function useWhyDataOps(
  session: SessionInfo | null,
  jobs: Job[],
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>,
  setIdx: React.Dispatch<React.SetStateAction<number>>,
  setIsNormalizing: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const { user } = useAuth();

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

      const sessionWithJobData = sessionWithJobs.find(s =>
        s.job_entries && s.job_entries.length > 0
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

  const addFromMemo = async (memoText: string) => {
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
      user_id: user?.id ?? null,
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

    setJobs(prev => [...(data as Job[]), ...prev.filter(p => !p.id.startsWith("tmp-"))]);
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
          user_id: user?.id ?? null,
        });
        added.add(low);
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("job_entries")
        .insert(toInsert)
        .select("id, job_name, definition, first_memory, category, reason");

      if (error) {
        setIsNormalizing(false);
        return;
      }
    }

    const combinedIds = combined.map(c => c.id);
    await supabase
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

  const saveCurrent = async (current: Job | undefined, definition: string, memory: string) => {
    if (!current) return true;

    const def = definition.trim();
    const mem = memory.trim();

    if (!def || !mem) {
      toast({
        title: "입력 필요",
        description: "정의와 각인 순간을 모두 작성하세요.",
        variant: "destructive",
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

  const commitClassification = async (
    happySet: Set<string>,
    painSet: Set<string>,
    setStep: (step: 1 | 2 | 3 | 4) => void,
  ) => {
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

      await updateProfileAnalysisStatus();

      toast({
        title: "WHY 분석 완료!",
        description: "이제 Ikigai 설계와 커뮤니티 매칭을 사용할 수 있습니다.",
      });
      setStep(4);
    } catch (e: unknown) {
      console.error("Classification save error:", e);
      toast({ title: "저장 실패", description: "분류 저장에 실패했습니다.", variant: "destructive" });
    }
  };

  const goBackToEditMode = (
    setStep: (step: 1 | 2 | 3 | 4) => void,
    setMemoText: (text: string) => void,
    setSession: React.Dispatch<React.SetStateAction<SessionInfo | null>>,
    resetTimer: () => void,
  ) => {
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

    resetTimer();
  };

  return {
    updateProfileAnalysisStatus,
    findBestSession,
    addFromMemo,
    normalizeCombinedJobs,
    saveCurrent,
    commitClassification,
    goBackToEditMode,
  };
}
