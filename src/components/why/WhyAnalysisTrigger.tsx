/**
 * WhyAnalysisTrigger Component
 * Button to trigger Why pattern analysis
 * Shows requirements and warnings before analysis
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  useJobEntryStats,
  useAnalyzeWhyPatterns,
  hasEnoughDataForAnalysis,
} from "@/hooks/useWhyAnalysis";

interface WhyAnalysisTriggerProps {
  sessionId?: string;
  onAnalysisComplete?: () => void;
}

export function WhyAnalysisTrigger({
  sessionId,
  onAnalysisComplete,
}: WhyAnalysisTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useJobEntryStats();
  const { mutate: analyze, isPending } = useAnalyzeWhyPatterns();

  const handleAnalyze = () => {
    analyze(
      { sessionId },
      {
        onSuccess: () => {
          setDialogOpen(false);
          onAnalysisComplete?.();
        },
      }
    );
  };

  if (statsLoading) {
    return (
      <Button disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        데이터 확인 중...
      </Button>
    );
  }

  if (!stats) {
    return null;
  }

  const hasEnoughData = hasEnoughDataForAnalysis(stats);
  const canAnalyze = stats.total >= 5; // Minimum requirement

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          disabled={!canAnalyze}
          className="w-full md:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Why 패턴 분석하기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Why 패턴 분석</DialogTitle>
          <DialogDescription>
            AI가 당신의 행복과 고통 패턴을 분석하여 Prime Perspective를 도출합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Data Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">현재 데이터 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">총 직업 수</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">경험한 직업</p>
                  <p className="text-2xl font-bold">{stats.with_experience}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">행복 직업</p>
                  <p className="text-2xl font-bold text-green-600">{stats.happy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">고통 직업</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pain}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Check */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">분석 요구사항</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                {stats.total >= 10 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-sm">
                  최소 10개 이상의 직업 (현재: {stats.total}개)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stats.happy >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-sm">
                  최소 3개 이상의 행복 직업 (현재: {stats.happy}개)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stats.pain >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <span className="text-sm">
                  최소 3개 이상의 고통 직업 (현재: {stats.pain}개)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Warning or Info */}
          {!hasEnoughData && canAnalyze && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                현재 데이터로도 분석이 가능하지만, 더 정확한 결과를 위해서는 최소 요구사항을
                충족하는 것을 권장합니다. 추가로 직업을 입력하거나 지금 바로 분석할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}

          {!canAnalyze && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                분석을 위해 최소 5개 이상의 직업이 필요합니다. 더 많은 직업을 추가해주세요.
              </AlertDescription>
            </Alert>
          )}

          {hasEnoughData && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                충분한 데이터가 확보되었습니다. 신뢰도 높은 분석 결과를 받을 수 있습니다!
              </AlertDescription>
            </Alert>
          )}

          {/* What happens next */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">분석 과정:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• AI가 행복/고통 직업의 키워드를 추출합니다</li>
                <li>• 반복 패턴을 분석하여 공통점을 찾습니다</li>
                <li>• 각인 순간과 연결하여 근본 원인을 파악합니다</li>
                <li>• Prime Perspective를 자동 생성합니다</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                분석은 약 30초~1분 정도 소요됩니다.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                분석 시작
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
