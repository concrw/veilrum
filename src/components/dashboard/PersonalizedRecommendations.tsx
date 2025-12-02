import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Target, 
  Users, 
  Briefcase,
  ChevronRight,
  Star,
  Clock
} from "lucide-react";

interface Recommendation {
  id: string;
  type: "focus" | "skill" | "community" | "brand" | "action";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionText: string;
  route?: string;
  estimatedTime?: string;
}

interface PersonalizedRecommendationsProps {
  recommendations: Recommendation[];
  onNavigate: (route: string) => void;
  onActionClick: (recommendationId: string) => void;
}

export const PersonalizedRecommendations = ({
  recommendations,
  onNavigate,
  onActionClick
}: PersonalizedRecommendationsProps) => {
  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case "focus":
        return <Target className="w-3 h-3" />;
      case "skill":
        return <Star className="w-3 h-3" />;
      case "community":
        return <Users className="w-3 h-3" />;
      case "brand":
        return <Briefcase className="w-3 h-3" />;
      case "action":
        return <Lightbulb className="w-3 h-3" />;
      default:
        return <Lightbulb className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case "high":
        return "bg-red-50 border-red-200 text-red-700";
      case "medium":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "low":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-muted/50";
    }
  };

  const getPriorityText = (priority: Recommendation['priority']) => {
    switch (priority) {
      case "high":
        return "긴급";
      case "medium":
        return "중요";
      case "low":
        return "일반";
      default:
        return "";
    }
  };

  const highPriorityRecommendations = recommendations.filter(r => r.priority === "high");
  const otherRecommendations = recommendations.filter(r => r.priority !== "high");

  return (
    <Card className="bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          맞춤 추천사항
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">아직 추천사항이 없습니다</p>
            <p className="text-xs text-muted-foreground">더 많은 분석을 완료하면 맞춤 추천을 받을 수 있습니다</p>
          </div>
        ) : (
          <>
            {/* 우선순위 높은 추천사항 */}
            {highPriorityRecommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-red-600">🔥 이번 주 집중할 영역</h4>
                <div className="space-y-2">
                  {highPriorityRecommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getRecommendationIcon(rec.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-xs font-medium">{rec.title}</h5>
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {getPriorityText(rec.priority)}
                            </Badge>
                            {rec.estimatedTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-2 h-2" />
                                {rec.estimatedTime}
                              </div>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed mb-2">
                            {rec.description}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                            onClick={() => {
                              if (rec.route) {
                                onNavigate(rec.route);
                              } else {
                                onActionClick(rec.id);
                              }
                            }}
                          >
                            {rec.actionText}
                            <ChevronRight className="w-2 h-2 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 기타 추천사항 */}
            {otherRecommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  기타 추천사항 ({otherRecommendations.length}개)
                </h4>
                <div className="space-y-2">
                  {otherRecommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className="p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getRecommendationIcon(rec.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-medium truncate">{rec.title}</h5>
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-1 py-0 h-4 ${getPriorityColor(rec.priority)}`}
                              >
                                {getPriorityText(rec.priority)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 px-2"
                          onClick={() => {
                            if (rec.route) {
                              onNavigate(rec.route);
                            } else {
                              onActionClick(rec.id);
                            }
                          }}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};