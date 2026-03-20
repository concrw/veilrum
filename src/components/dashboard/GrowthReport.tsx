import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Target,
  ChevronRight
} from "lucide-react";

interface GrowthStage {
  stage: string;
  title: string;
  completed: boolean;
  progress: number;
  description: string;
  route: string;
}

interface GrowthReportProps {
  whyCompleted: boolean;
  ikigaiCompleted: boolean;
  brandCompleted: boolean;
  communityActive: boolean;
  onNavigate: (route: string) => void;
}

export const GrowthReport = ({ 
  whyCompleted, 
  ikigaiCompleted, 
  brandCompleted, 
  communityActive,
  onNavigate 
}: GrowthReportProps) => {

  const stages: GrowthStage[] = [
    {
      stage: "1단계",
      title: "Why 분석",
      completed: whyCompleted,
      progress: whyCompleted ? 100 : 0,
      description: "행복/고통 패턴 분석 완료",
      route: "/why"
    },
    {
      stage: "2단계", 
      title: "Ikigai 설계",
      completed: ikigaiCompleted,
      progress: ikigaiCompleted ? 100 : whyCompleted ? 30 : 0,
      description: "생의 목적 4영역 완성",
      route: "/ikigai"
    },
    {
      stage: "3단계",
      title: "브랜드 구축", 
      completed: brandCompleted,
      progress: brandCompleted ? 100 : ikigaiCompleted ? 40 : 0,
      description: "개인 브랜드 전략 수립",
      route: "/brand"
    },
    {
      stage: "4단계",
      title: "커뮤니티 매칭",
      completed: communityActive,
      progress: communityActive ? 100 : brandCompleted ? 60 : 0, 
      description: "싱크로율 기반 연결",
      route: "/commu"
    }
  ];

  const overallProgress = stages.reduce((acc, stage) => acc + stage.progress, 0) / 4;
  const completedStages = stages.filter(stage => stage.completed).length;

  return (
    <Card className="bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            성장 현황
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {completedStages}/4 단계 완료
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 진행률 */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">전체 진행률</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* 단계별 상태 */}
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div 
              key={stage.stage}
              className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
              onClick={() => onNavigate(stage.route)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6">
                  {stage.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : stage.progress > 0 ? (
                    <Clock className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Target className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{stage.title}</span>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 h-4"
                    >
                      {stage.stage}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {stage.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* 다음 액션 */}
        <div className="pt-2 border-t">
          {completedStages === 4 ? (
            <div className="text-center">
              <p className="text-xs text-green-600 mb-2">🎉 모든 단계를 완료했습니다!</p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onNavigate('/commu')}
                className="text-xs"
              >
                커뮤니티에서 활동하기
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                다음 단계: {stages.find(s => !s.completed)?.title}
              </p>
              <Button 
                size="sm"
                onClick={() => onNavigate(stages.find(s => !s.completed)?.route || '/why')}
                className="text-xs"
              >
                계속하기
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};