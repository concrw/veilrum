import { useState } from "react";
import { Button } from "@/components/ui/button";

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

interface DebugOp {
  time: string;
  op: string;
  ok: boolean;
  detail?: any;
}

interface DebugSnapshot {
  session: any | null;
  jobs: Job[];
  fetchedAt: string | null;
}

interface DebugPanelProps {
  user: any;
  session: SessionInfo | null;
  jobs: Job[];
  step: number;
  flowProgress: number;
  currentJobCount: number;
  idx: number;
  total: number;
  defsDone: boolean;
  resultsReady: boolean;
  secondsLeft: number;
  memoTextLength: number;
  debugOps: DebugOp[];
  dbSnapshot: DebugSnapshot;
  onRefreshSnapshot: () => void;
  onClearLogs: () => void;
}

export const DebugPanel = ({
  user,
  session,
  jobs,
  step,
  flowProgress,
  currentJobCount,
  idx,
  total,
  defsDone,
  resultsReady,
  secondsLeft,
  memoTextLength,
  debugOps,
  dbSnapshot,
  onRefreshSnapshot,
  onClearLogs
}: DebugPanelProps) => {
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <aside className="mt-3 rounded-md border border-border bg-background/60 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">디버그 패널</span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-6 px-2 text-xs" 
            onClick={onRefreshSnapshot}
          >
            DB 스냅샷 새로고침
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-6 px-2 text-xs" 
            onClick={onClearLogs}
          >
            로그 지우기
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-6 px-2 text-xs" 
            onClick={() => setDebugOpen(d => !d)}
          >
            {debugOpen ? "숨기기" : "보기"}
          </Button>
        </div>
      </div>
      
      {debugOpen && (
        <div className="mt-2 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border p-2 bg-background/50">
              <div className="font-mono text-xs">
                <div>로그인 사용자: <span className="text-muted-foreground">{user?.id ?? "(비로그인)"}</span></div>
                <div>사용자 이메일: <span className="text-muted-foreground">{user?.email ?? "(없음)"}</span></div>
                <div>세션(상태): <span className="text-muted-foreground">{session?.id ?? "-"}</span> {session?.ended_at ? "(completed)" : "(active/none)"}</div>
                <div>클라이언트 보유 Job 수: {jobs.length}</div>
                <div>현재 단계: {step} · 진행률 {flowProgress}%</div>
                <div>현재 카운트: {currentJobCount}</div>
              </div>
            </div>
            <div className="rounded border border-border p-2 bg-background/50">
              <div className="font-mono text-xs">
                <div>DB 스냅샷 시각: <span className="text-muted-foreground">{dbSnapshot.fetchedAt ?? "-"}</span></div>
                <div>DB 세션 ID: <span className="text-muted-foreground">{dbSnapshot.session?.id ?? "-"}</span></div>
                <div>DB 세션 상태: <span className="text-muted-foreground">{dbSnapshot.session?.status ?? "-"}</span></div>
                <div>DB total_jobs: <span className="text-muted-foreground">{dbSnapshot.session?.total_jobs ?? "-"}</span></div>
                <div>DB Job 수: {dbSnapshot.jobs.length}</div>
              </div>
            </div>
          </div>
          
          <div className="rounded border border-border p-2 bg-background/50">
            <div className="font-semibold mb-1 text-xs">DB Job 미리보기 (최대 5개)</div>
            <ul className="space-y-1 font-mono text-xs">
              {dbSnapshot.jobs.slice(0, 5).map(j => (
                <li key={j.id} className="flex items-center justify-between">
                  <span className="truncate">{j.job_name}</span>
                  <span className="text-muted-foreground ml-2">{j.category ?? "-"}</span>
                </li>
              ))}
              {dbSnapshot.jobs.length === 0 && <li className="text-muted-foreground">데이터 없음</li>}
            </ul>
          </div>
          
          <div className="rounded border border-border p-2 bg-background/50">
            <div className="font-semibold mb-1 text-xs">저장 로그</div>
            <ul className="space-y-1 font-mono text-xs max-h-40 overflow-auto pr-2">
              {debugOps.length === 0 && <li className="text-muted-foreground">기록 없음</li>}
              {debugOps.map((l, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`px-1 rounded ${l.ok ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                    {l.ok ? "OK" : "ERR"}
                  </span>
                  <span>{l.time.split("T")[1]?.split(".")[0]} {l.op}</span>
                  <span className="text-muted-foreground truncate">
                    · {typeof l.detail === "string" ? l.detail : JSON.stringify(l.detail)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="rounded border border-border p-2 bg-background/50">
            <div className="font-semibold mb-1 text-xs">로컬 상태</div>
            <pre className="whitespace-pre-wrap text-xs font-mono">
              {JSON.stringify({
                step,
                sessionEnded: !!session?.ended_at,
                sessionId: session?.id,
                idx,
                total,
                defsDone,
                resultsReady,
                secondsLeft,
                memoTextLength,
                jobsLength: jobs.length,
                currentJobCount,
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </aside>
  );
};