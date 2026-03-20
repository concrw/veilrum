import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

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

interface Step2DefinitionSectionProps {
  jobs: Job[];
  idx: number;
  setIdx: (idx: number) => void;
  session: SessionInfo | null;
  isNormalizing: boolean;
  onSaveCurrent: (definition: string, memory: string) => Promise<boolean>;
  onPrevStep: () => void;
  onNextStep: () => void;
  canGoStep3: boolean;
}

export const Step2DefinitionSection = ({
  jobs,
  idx,
  setIdx,
  session,
  isNormalizing,
  onSaveCurrent,
  onPrevStep,
  onNextStep,
  canGoStep3
}: Step2DefinitionSectionProps) => {
  const [defDraft, setDefDraft] = useState("");
  const [memDraft, setMemDraft] = useState("");
  
  const current = jobs[idx];
  const total = jobs.length;

  // Update drafts when current job changes
  useEffect(() => {
    if (!current) return;
    setDefDraft(current.definition || "");
    setMemDraft(current.first_memory || "");
  }, [current?.id]);

  const handlePrevItem = async () => {
    if (idx === 0) return;
    const ok = await onSaveCurrent(defDraft.trim(), memDraft.trim());
    if (!ok) return;
    setIdx(idx - 1);
  };

  const handleNextItem = async () => {
    const ok = await onSaveCurrent(defDraft.trim(), memDraft.trim());
    if (!ok) return;
    if (idx + 1 >= total) {
      onNextStep();
      return;
    }
    setIdx(idx + 1);
  };

  if (isNormalizing) {
    return (
      <section className="space-y-4" data-step-visible="2">
        <Card className="bg-card/60">
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">직업 항목 정규화 중...</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4" data-step-visible="2">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={onPrevStep}>뒤로가기</Button>
          <span className="text-sm text-muted-foreground">{idx + 1}/{total}</span>
        </div>
        <Progress value={Math.round((idx + 1) / total * 100)} />
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          {session?.id && <span className="opacity-70">세션: {session.id.slice(0, 8)}...</span>}
        </div>
      </header>

      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg font-light tracking-wide text-center">{current?.job_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">이 직업에 대한 당신만의 정의</p>
            <Textarea 
              value={defDraft} 
              onChange={e => setDefDraft(e.target.value)} 
              placeholder="예) 사람과 기술을 연결해 문제를 해결하는 역할" 
              className="min-h-28 bg-transparent" 
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">처음 각인된 순간 (언제/어디서/누구와/무엇을/왜/어떻게)</p>
            <Textarea 
              value={memDraft} 
              onChange={e => setMemDraft(e.target.value)} 
              placeholder="예) 2018년 도서관에서 친구와 진로 상담 중 기사에서 처음 접함..." 
              className="min-h-36 bg-transparent" 
            />
          </div>
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={handlePrevItem} disabled={idx === 0}>이전</Button>
            <Button 
              onClick={handleNextItem} 
              disabled={!defDraft.trim() || !memDraft.trim()}
            >
              {idx + 1 >= total ? "검토로" : "다음"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onPrevStep}>1단계로</Button>
        <Button onClick={onNextStep} disabled={!canGoStep3}>다음 단계</Button>
      </div>
    </section>
  );
};