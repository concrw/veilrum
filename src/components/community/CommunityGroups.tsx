import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Calendar, ArrowRight } from "lucide-react";

interface GroupItem {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  creator_id: string;
  member_count: number;
  created_at: string;
  recent_activity?: string;
  avg_sync_rate?: number;
}

interface CommunityGroupsProps {
  groups: GroupItem[];
  isLoading: boolean;
  onJoinGroup: (groupId: string) => void;
  isJoining: boolean;
}

export const CommunityGroups = ({
  groups,
  isLoading,
  onJoinGroup,
  isJoining
}: CommunityGroupsProps) => {
  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "오늘";
    if (diffDays === 2) return "어제";
    if (diffDays <= 7) return `${diffDays}일 전`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 전`;
    return `${Math.ceil(diffDays / 30)}개월 전`;
  };

  const getMemberCountBadge = (count: number) => {
    if (count >= 100) return { variant: "default" as const, text: "대형" };
    if (count >= 20) return { variant: "secondary" as const, text: "중형" };
    if (count >= 5) return { variant: "outline" as const, text: "소형" };
    return { variant: "outline" as const, text: "신생" };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            커뮤니티 그룹
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4" />
          커뮤니티 그룹
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          관심사가 비슷한 사람들과 함께 성장하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              아직 그룹이 없습니다
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              첫 번째 그룹을 만들어보세요
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const memberBadge = getMemberCountBadge(group.member_count);
            
            return (
              <div key={group.id} className="border rounded-lg p-3 space-y-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{group.name}</span>
                      
                      {group.theme && (
                        <Badge variant="secondary" className="text-xs">
                          {group.theme}
                        </Badge>
                      )}
                      
                      <Badge variant={memberBadge.variant} className="text-xs">
                        {memberBadge.text}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{group.member_count}명</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(group.created_at)} 생성</span>
                      </div>
                    </div>
                    
                    {group.avg_sync_rate && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-muted-foreground">그룹 평균 매칭률:</span>
                          <span className="font-medium">{group.avg_sync_rate}%</span>
                        </div>
                        <Progress value={group.avg_sync_rate} className="h-1" />
                      </div>
                    )}
                    
                    {group.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    
                    {group.recent_activity && (
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <span className="text-muted-foreground">최근 활동:</span>{" "}
                        <span>{group.recent_activity}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/community/group/${group.id}`)}
                      className="text-xs"
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      상세보기
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onJoinGroup(group.id)}
                      disabled={isJoining}
                      className="text-xs"
                    >
                      {isJoining ? "참여중..." : "참여하기"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {groups.length > 0 && (
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              총 {groups.length}개의 그룹이 있습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};