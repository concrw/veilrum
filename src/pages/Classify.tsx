import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface Entry {
  id: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
  category: "happy" | "pain" | "neutral" | null;
  reason: string | null;
  created_at?: string;
}

const Classify = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const total = entries.length;
  const unclassified = useMemo(() => entries.filter((e) => !e.category), [entries]);
  const happy = useMemo(() => entries.filter((e) => e.category === "happy"), [entries]);
  const pain = useMemo(() => entries.filter((e) => e.category === "pain"), [entries]);
  const neutral = useMemo(() => entries.filter((e) => e.category === "neutral"), [entries]);
  const classifiedCount = total - unclassified.length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // 1) 최신 completed 세션 찾기
      const { data: session, error: sErr } = await supabase
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

      // 2) 해당 세션의 직업들 로드
      const { data: jobs, error: jErr } = await supabase
        .from("job_entries")
        .select("id, job_name, definition, first_memory, category, reason, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (jErr) {
        setLoading(false);
        toast({ title: "로드 실패", description: "직업 데이터를 불러오지 못했습니다.", variant: "destructive" });
        return;
      }

      setEntries(jobs || []);
      setLoading(false);
    };

    load();
  }, []);

  const handleReasonChange = (id: string, v: string) => {
    setReasonDrafts((prev) => ({ ...prev, [id]: v }));
  };

  const classify = async (id: string, category: Entry["category"]) => {
    const reason = (reasonDrafts[id] || "").trim() || null;
    setSavingId(id);
    const { error } = await supabase
      .from("job_entries")
      .update({ category, reason })
      .eq("id", id);
    setSavingId(null);

    if (error) {
      toast({ title: "분류 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
      return;
    }

    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, category, reason } : e)));
  };

  const done = total > 0 && classifiedCount === total;

  return (
    <>
      <Helmet>
        <title>직업 분류 | V-File</title>
        <meta name="description" content="정의한 직업들을 바탕으로 분류를 진행합니다." />
        <link rel="canonical" href={`${window.location.origin}/classify`} />
      </Helmet>
      <main className="min-h-screen bg-background text-foreground py-6">
        
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">불러오는 중...</div>
          ) : total === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-4">분류할 직업이 없습니다.</p>
              <Button onClick={() => navigate("/brainstorm")}>브레인스토밍 시작</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <header className="flex items-center justify-between">
                <h1 className="text-xl font-medium">직업 분류</h1>
                <div className="text-sm text-muted-foreground">
                  진행: {classifiedCount}/{total}
                </div>
              </header>

              {/* 미분류 영역 */}
              <Card className="bg-card/60">
                <CardHeader>
                  <CardTitle>미분류 ({unclassified.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 pr-3">
                    <ul className="space-y-3">
                      {unclassified.map((e) => (
                        <li key={e.id} className="border border-border rounded-md p-3 bg-background/50">
                          <div className="font-medium mb-1">{e.job_name}</div>
                          {e.definition && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{e.definition}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              value={reasonDrafts[e.id] ?? e.reason ?? ""}
                              onChange={(ev) => handleReasonChange(e.id, ev.target.value)}
                              placeholder="이유 (선택)"
                              className="h-9"
                            />
                            <Button size="sm" variant="secondary" onClick={() => classify(e.id, "happy")} disabled={savingId === e.id}>
                              HAPPINESS
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => classify(e.id, "pain")} disabled={savingId === e.id}>
                              SUFFERING
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => classify(e.id, "neutral")} disabled={savingId === e.id}>
                              NEUTRAL
                            </Button>
                          </div>
                        </li>
                      ))}
                      {unclassified.length === 0 && <li className="text-sm text-muted-foreground">모든 직업을 분류했습니다.</li>}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 카테고리 영역 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>HAPPINESS ({happy.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 pr-3">
                      <ul className="space-y-2">
                        {happy.map((e) => (
                          <li key={e.id} className="text-sm border border-border rounded px-2 py-1 bg-background/50">
                            {e.job_name}
                          </li>
                        ))}
                        {happy.length === 0 && <li className="text-sm text-muted-foreground">없음</li>}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>SUFFERING ({pain.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 pr-3">
                      <ul className="space-y-2">
                        {pain.map((e) => (
                          <li key={e.id} className="text-sm border border-border rounded px-2 py-1 bg-background/50">
                            {e.job_name}
                          </li>
                        ))}
                        {pain.length === 0 && <li className="text-sm text-muted-foreground">없음</li>}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-card/60">
                  <CardHeader>
                    <CardTitle>NEUTRAL ({neutral.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 pr-3">
                      <ul className="space-y-2">
                        {neutral.map((e) => (
                          <li key={e.id} className="text-sm border border-border rounded px-2 py-1 bg-background/50">
                            {e.job_name}
                          </li>
                        ))}
                        {neutral.length === 0 && <li className="text-sm text-muted-foreground">없음</li>}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {done && (
                <div className="flex justify-end">
                  <Button onClick={() => navigate("/results")}>결과 보기</Button>
                </div>
              )}
            </div>
          )}
        
      </main>
    </>
  );
};

export default Classify;
