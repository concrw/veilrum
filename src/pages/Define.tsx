import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface JobEntry {
  id: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
}

const Define = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [definition, setDefinition] = useState("");
  const [firstMemory, setFirstMemory] = useState("");

  const current = jobs[index];
  const total = jobs.length;
  const progress = useMemo(() => (total > 0 ? Math.round(((index + 1) / total) * 100) : 0), [index, total]);

  // Load latest completed session and its job entries
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // 1) latest completed session
      const { data: session, error: sErr } = await (supabase as any)
        .from("brainstorm_sessions")
        .select("id, ended_at")
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .maybeSingle();

      if (sErr || !session) {
        setLoading(false);
        toast({ title: "세션 없음", description: "완료된 브레인스토밍 세션이 없습니다.", variant: "destructive" });
        return;
      }

      setSessionId(session.id);

      // 2) related job entries
      const { data: entries, error: eErr } = await (supabase as any)
        .from("job_entries")
        .select("id, job_name, definition, first_memory, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (eErr) {
        setLoading(false);
        toast({ title: "데이터 로드 실패", description: "직업 목록을 불러오지 못했습니다.", variant: "destructive" });
        return;
      }

      setJobs(entries || []);
      if ((entries || []).length > 0) {
        setIndex(0);
        setDefinition(entries[0].definition || "");
        setFirstMemory(entries[0].first_memory || "");
      }
      setLoading(false);
    };

    load();
  }, []);

  const saveCurrent = useCallback(async () => {
    if (!current) return true;
    const payload = { definition: definition.trim() || null, first_memory: firstMemory.trim() || null };
    const { error } = await (supabase as any)
      .from("job_entries")
      .update(payload)
      .eq("id", current.id);
    if (error) {
      toast({ title: "저장 실패", description: "변경사항을 저장하지 못했습니다.", variant: "destructive" });
      return false;
    }
    setJobs((prev) =>
      prev.map((j, i) => (i === index ? { ...j, definition: payload.definition, first_memory: payload.first_memory } : j))
    );
    return true;
  }, [current, definition, firstMemory, index]);

  const goPrev = async () => {
    if (index === 0) return;
    const ok = await saveCurrent();
    if (!ok) return;
    const nextIndex = index - 1;
    setIndex(nextIndex);
    const j = jobs[nextIndex];
    setDefinition(j.definition || "");
    setFirstMemory(j.first_memory || "");
  };

  const goNext = async () => {
    if (total === 0) return;
    const ok = await saveCurrent();
    if (!ok) return;

    if (index + 1 >= total) {
      navigate("/classify");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    const j = jobs[nextIndex];
    setDefinition(j.definition || "");
    setFirstMemory(j.first_memory || "");
  };

  return (
    <>
      <Helmet>
        <title>직업 정의 | PRIPER</title>
        <meta name="description" content="이전 브레인스토밍 직업들에 대한 정의와 각인 순간을 작성하세요." />
        <link rel="canonical" href={`${window.location.origin}/define`} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground py-6">
        
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">불러오는 중...</div>
          ) : total === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-4">완료된 세션이 없거나 직업이 없습니다.</p>
              <Button onClick={() => navigate("/brainstorm")}>브레인스토밍 시작</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <header className="space-y-2">
                <h1 className="sr-only">직업 정의</h1>
                <Progress value={progress} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {index + 1}/{total}
                  </span>
                  {sessionId && <span className="opacity-70">세션: {sessionId.slice(0, 8)}...</span>}
                </div>
              </header>

              <Card className="bg-card/60">
                <CardHeader>
                  <CardTitle className="text-2xl font-light tracking-wide">{current?.job_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">이 직업에 대한 당신만의 정의를 작성해주세요</p>
                    <Textarea
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder="예) 이 직업은 사람과 기술을 연결하여 문제를 해결하는 역할입니다."
                      className="min-h-32 bg-transparent"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      이 직업을 처음 알게 된 순간을 육하원칙(언제,어디서,누구와,무엇을,왜,어떻게)으로 자세히 적어주세요
                    </p>
                    <Textarea
                      value={firstMemory}
                      onChange={(e) => setFirstMemory(e.target.value)}
                      placeholder="예) 2018년, 학교 도서관에서 친구와 진로 상담을 하던 중 기사에서 처음 접했습니다..."
                      className="min-h-40 bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="secondary" onClick={goPrev} disabled={index === 0}>
                      이전
                    </Button>
                    <Button onClick={goNext}>{index + 1 >= total ? "완료" : "다음"}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        
      </main>
    </>
  );
};

export default Define;
