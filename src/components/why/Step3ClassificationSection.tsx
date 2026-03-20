import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Job {
  id: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
  category: "happy" | "pain" | "neutral" | null;
  reason?: string | null;
}

interface Step3ClassificationSectionProps {
  jobs: Job[];
  phase: "happy" | "pain";
  setPhase: (phase: "happy" | "pain") => void;
  happySet: Set<string>;
  painSet: Set<string>;
  onToggleHappy: (id: string) => void;
  onTogglePain: (id: string) => void;
  onCommitClassification: () => void;
  onPrevStep: () => void;
}

export const Step3ClassificationSection = ({
  jobs,
  phase,
  setPhase,
  happySet,
  painSet,
  onToggleHappy,
  onTogglePain,
  onCommitClassification,
  onPrevStep
}: Step3ClassificationSectionProps) => {
  if (jobs.length === 0) {
    return (
      <section className="space-y-4" data-step-visible="3">
        <div className="py-12 text-center text-sm text-muted-foreground">
          먼저 직업을 추가해주세요.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" data-step-visible="3">
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle className="text-sm">분류 2스텝</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {phase === "happy" 
              ? "먼저 행복을 주는 일을 모두 선택하세요." 
              : "이제 고통/소모를 주는 일을 선택하세요. 남은 것은 자동으로 중립 처리됩니다."
            }
          </div>
          
          <ScrollArea className="h-72 pr-3">
            <ul className="space-y-2">
              {jobs.map(job => {
                const selected = phase === "happy" ? happySet.has(job.id) : painSet.has(job.id);
                return (
                  <li 
                    key={job.id} 
                    className="flex items-center justify-between border border-border rounded-md px-3 py-2 bg-background/50"
                  >
                    <span className="font-medium text-sm">{job.job_name}</span>
                    <Button 
                      size="sm" 
                      variant={selected ? (phase === "happy" ? "default" : "destructive") : "secondary"} 
                      onClick={() => phase === "happy" ? onToggleHappy(job.id) : onTogglePain(job.id)}
                      className="text-xs"
                    >
                      {selected ? (phase === "happy" ? "HAPPINESS" : "SUFFERING") : "선택"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>

          <div className="flex items-center justify-between pt-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setPhase("happy")} 
              disabled={phase === "happy"}
            >
              행복 선택
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setPhase("pain")} 
              disabled={phase === "pain"}
            >
              고통 선택
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={onPrevStep}>
          이전 단계
        </Button>
        <Button size="sm" onClick={onCommitClassification} disabled={jobs.length === 0}>
          완료
        </Button>
      </div>
    </section>
  );
};