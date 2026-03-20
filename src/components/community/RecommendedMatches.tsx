import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, Zap, UserPlus, Sparkles } from "lucide-react";

interface MatchItem {
  user_id: string;
  matched_user_id: string;
  match_type: "similar" | "complementary";
  compatibility_score: number;
  match_reasons: string[];
  matched_name: string | null;
  shared_interests?: string[];
  complementary_strengths?: string[];
  sync_rate: number;
  complement_rate: number;
  prime_perspective_alignment: number;
}

interface RecommendedMatchesProps {
  matchesByType: {
    similar: MatchItem[];
    complementary: MatchItem[];
  };
  isLoading: boolean;
  onConnect: (userId: string) => void;
}

export const RecommendedMatches = ({ 
  matchesByType, 
  isLoading, 
  onConnect 
}: RecommendedMatchesProps) => {
  const renderMatchCard = (match: MatchItem, type: "similar" | "complementary") => (
    <div key={`${type}-${match.matched_user_id}`} className="border rounded-lg p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {match.matched_name || `사용자 ${match.matched_user_id.slice(0, 6)}`}
            </span>
            {type === "similar" ? (
              <Heart className="w-3 h-3 text-red-500" />
            ) : (
              <Zap className="w-3 h-3 text-blue-500" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">매칭률:</span>
                <span className="font-medium">{match.sync_rate}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">상호보완률:</span>
                <span className="font-medium">{match.complement_rate}%</span>
              </div>
              {match.prime_perspective_alignment > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-purple-600">
                        <Sparkles className="w-3 h-3" />
                        <span className="font-medium">{match.prime_perspective_alignment}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Prime Perspective 정렬도</p>
                      <p className="text-xs text-muted-foreground">핵심 관점의 유사성</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground mb-1">매칭률</div>
                <Progress value={match.sync_rate} className="h-1" />
              </div>
              <div>
                <div className="text-muted-foreground mb-1">상호보완률</div>
                <Progress value={match.complement_rate} className="h-1" />
              </div>
              {match.prime_perspective_alignment > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                    관점 정렬
                  </div>
                  <Progress value={match.prime_perspective_alignment} className="h-1 [&>div]:bg-purple-500" />
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {match.match_reasons?.[0] || (type === "similar" ? "유사한 성향" : "상호보완적 성향")}
          </p>
          
          {match.shared_interests && match.shared_interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {match.shared_interests.slice(0, 3).map((interest, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {match.shared_interests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.shared_interests.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onConnect(match.matched_user_id)}
          className="text-xs"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          연결
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              유사 성향 매칭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              상호보완 성향 매칭
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            유사 성향 매칭
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            비슷한 가치관과 관심사를 가진 사람들
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {matchesByType.similar.length === 0 ? (
            <div className="text-center py-6">
              <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                아직 유사 성향 매칭이 없습니다
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Why 분석을 완료하면 추천을 받을 수 있어요
              </p>
            </div>
          ) : (
            matchesByType.similar.map((match) => renderMatchCard(match, "similar"))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            상호보완 성향 매칭
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            서로 다른 강점으로 시너지를 낼 수 있는 사람들
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {matchesByType.complementary.length === 0 ? (
            <div className="text-center py-6">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                아직 상호보완 매칭이 없습니다
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Why 분석을 완료하면 추천을 받을 수 있어요
              </p>
            </div>
          ) : (
            matchesByType.complementary.map((match) => renderMatchCard(match, "complementary"))
          )}
        </CardContent>
      </Card>
    </div>
  );
};