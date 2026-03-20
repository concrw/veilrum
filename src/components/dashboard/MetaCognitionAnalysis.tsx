import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface MetaInsight {
  type: "strength" | "pattern" | "contradiction" | "growth";
  title: string;
  description: string;
  score?: number;
}

interface MetaCognitionAnalysisProps {
  aiPerspective: string | null;
  insights: MetaInsight[];
  consistencyScore: number;
  decisionPattern: string;
  loading: boolean;
}

export const MetaCognitionAnalysis = ({
  aiPerspective,
  insights,
  consistencyScore,
  decisionPattern,
  loading
}: MetaCognitionAnalysisProps) => {
  const getInsightIcon = (type: MetaInsight['type']) => {
    switch (type) {
      case "strength":
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case "pattern":
        return <TrendingUp className="w-3 h-3 text-blue-600" />;
      case "contradiction":
        return <AlertTriangle className="w-3 h-3 text-amber-600" />;
      case "growth":
        return <Brain className="w-3 h-3 text-purple-600" />;
      default:
        return <Brain className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getInsightColor = (type: MetaInsight['type']) => {
    switch (type) {
      case "strength":
        return "bg-green-50 border-green-200";
      case "pattern":
        return "bg-blue-50 border-blue-200";
      case "contradiction":
        return "bg-amber-50 border-amber-200";
      case "growth":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-muted/50";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4" />
            메타인지 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse text-muted-foreground" />
            <p className="text-xs text-muted-foreground">AI가 분석 중입니다...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4" />
          메타인지 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prime Perspective */}
        {aiPerspective && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Prime Perspective</h4>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs leading-relaxed">{aiPerspective}</p>
            </div>
          </div>
        )}

        {/* 일관성 점수 */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">의사결정 일관성</span>
            <span className="font-medium">{consistencyScore}%</span>
          </div>
          <Progress value={consistencyScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {consistencyScore >= 80 ? "매우 일관된 의사결정 패턴" :
             consistencyScore >= 60 ? "대체로 일관된 패턴" :
             "의사결정 패턴에 개선이 필요"}
          </p>
        </div>

        {/* 의사결정 패턴 */}
        {decisionPattern && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">의사결정 패턴</h4>
            <Badge variant="secondary" className="text-xs">
              {decisionPattern}
            </Badge>
          </div>
        )}

        {/* 인사이트 리스트 */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              주요 인사이트 ({insights.length}개)
            </h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-medium mb-1">{insight.title}</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      {insight.score && (
                        <div className="mt-1">
                          <span className="text-xs font-medium">{insight.score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 데이터가 없는 경우 */}
        {!aiPerspective && insights.length === 0 && (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">분석할 데이터가 부족합니다</p>
            <p className="text-xs text-muted-foreground">Why 분석을 완료하면 메타인지 분석이 가능합니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};