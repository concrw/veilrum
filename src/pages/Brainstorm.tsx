import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const DURATION_SECONDS = 600; // 10 minutes

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

interface JobItem {
  id: string;
  job_name: string;
  created_at?: string;
}

const Brainstorm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(DURATION_SECONDS);

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const sessionCreatedRef = useRef(false);

  // Create session and start timer once on mount
  useEffect(() => {
    if (sessionCreatedRef.current) return;
    sessionCreatedRef.current = true;

const createSession = async () => {
      const { data, error } = await (supabase as any)
        .from("brainstorm_sessions")
        .insert({ timer_duration: DURATION_SECONDS, status: "active", user_id: user?.id ?? null })
        .select("id, started_at")
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "세션 생성 실패",
          description: "네트워크 상태를 확인한 뒤 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }

setSessionId(data.id);
      localStorage.setItem('priper:last_session_id', data.id);

      // Start timer
      endTimeRef.current = Date.now() + DURATION_SECONDS * 1000;
      setSecondsLeft(DURATION_SECONDS);

      intervalRef.current = window.setInterval(() => {
        if (!endTimeRef.current) return;
        const diff = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(diff);
      }, 1000);
    };

    createSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // When timer ends, finalize session and navigate
  useEffect(() => {
    if (secondsLeft !== 0 || !sessionId) return;

    const finalize = async () => {
      await (supabase as any)
        .from("brainstorm_sessions")
        .update({
          ended_at: new Date().toISOString(),
          status: "completed",
          total_jobs: jobs.length,
        })
        .eq("id", sessionId);

      navigate("/define");
    };

    finalize();
  }, [secondsLeft, sessionId, jobs.length, navigate]);

  const addJob = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !sessionId) return;

    // Optimistic add
    const tempId = `temp-${Math.random().toString(36).slice(2)}`;
    setJobs((prev) => [{ id: tempId, job_name: trimmed }, ...prev]);
    setInput("");

    const { data, error } = await (supabase as any)
      .from("job_entries")
      .insert({ job_name: trimmed, session_id: sessionId })
      .select("id, job_name, created_at")
      .maybeSingle();

    if (error || !data) {
      // rollback optimistic item
      setJobs((prev) => prev.filter((j) => j.id !== tempId));
      toast({
        title: "직업 추가 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    // replace temp with actual
    setJobs((prev) => [{ id: data.id, job_name: data.job_name, created_at: data.created_at }, ...prev.filter((j) => j.id !== tempId)]);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addJob(input);
    }
  };

  const formatted = useMemo(() => formatTime(secondsLeft), [secondsLeft]);

  return (
    <>
      <Helmet>
        <title>직업 브레인스토밍 | PRIPER</title>
        <meta name="description" content="10분간 모든 직업을 떠올려보세요" />
        <link rel="canonical" href={`${window.location.origin}/brainstorm`} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        
          <header className="mb-4">
            <h1 className="text-2xl font-medium">10분 직업 브레인스토밍</h1>
          </header>

          <div className="flex justify-center mb-4">
            <div className="text-5xl md:text-6xl font-light tracking-widest tabular-nums">{formatted}</div>
          </div>

          <section className="space-y-4">
            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle>아이디어 입력</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="직업명을 입력하고 Enter를 누르세요"
                    disabled={!sessionId || secondsLeft === 0}
                    aria-label="직업명 입력"
                    className="rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    onClick={() => addJob(input)}
                    disabled={!sessionId || secondsLeft === 0 || !input.trim()}
                    variant="secondary"
                  >
                    추가
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">총 {jobs.length}개</p>
              </CardContent>
            </Card>

            <Card className="bg-card/60">
              <CardHeader>
                <CardTitle>실시간 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 pr-3">
                  <ul className="space-y-2">
                    {jobs.map((j) => (
                      <li key={j.id} className="rounded-md border border-border bg-background/50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{j.job_name}</span>
                          {j.created_at ? (
                            <time className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleTimeString()}</time>
                          ) : null}
                        </div>
                      </li>
                    ))}
                    {jobs.length === 0 && (
                      <li className="text-sm text-muted-foreground">아직 추가된 직업이 없습니다. 아이디어를 입력해보세요!</li>
                    )}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
        
      </main>
    </>
  );
};

export default Brainstorm;
