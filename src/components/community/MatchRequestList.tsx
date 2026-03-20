import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, X, Eye } from "lucide-react";

interface PersonalMatchRequest {
  id: string;
  requester_id: string;
  target_email: string;
  target_user_id?: string;
  status: "pending" | "accepted" | "declined" | "completed";
  analysis_result?: {
    sync_rate: number;
    complement_rate: number;
    detailed_analysis: string;
    strengths: string[];
    growth_areas: string[];
  };
  created_at: string;
  responded_at?: string;
  requester_name?: string;
}

interface MatchRequestListProps {
  requests: PersonalMatchRequest[];
  currentUserId: string;
  isLoading: boolean;
  onRespond: (requestId: string, response: "accepted" | "declined") => void;
  onViewDetails: (request: PersonalMatchRequest) => void;
}

export const MatchRequestList = ({ 
  requests, 
  currentUserId, 
  isLoading, 
  onRespond,
  onViewDetails 
}: MatchRequestListProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case "accepted":
        return <Badge variant="secondary" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />수락됨</Badge>;
      case "declined":
        return <Badge variant="destructive" className="text-xs"><X className="w-3 h-3 mr-1" />거절됨</Badge>;
      case "completed":
        return <Badge variant="default" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 받은 요청과 보낸 요청 분리
  const receivedRequests = requests.filter(req => req.target_user_id === currentUserId);
  const sentRequests = requests.filter(req => req.requester_id === currentUserId);

  const renderAnalysisResult = (result: PersonalMatchRequest["analysis_result"]) => {
    if (!result) return null;

    return (
      <div className="bg-muted/50 p-3 rounded-lg space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">매칭률</div>
            <div className="flex items-center gap-2">
              <Progress value={result.sync_rate} className="h-2 flex-1" />
              <span className="text-xs font-medium">{result.sync_rate}%</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">상호보완률</div>
            <div className="flex items-center gap-2">
              <Progress value={result.complement_rate} className="h-2 flex-1" />
              <span className="text-xs font-medium">{result.complement_rate}%</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium mb-1">주요 강점</div>
            <div className="flex flex-wrap gap-1">
              {result.strengths.slice(0, 3).map((strength, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium mb-1">성장 영역</div>
            <div className="flex flex-wrap gap-1">
              {result.growth_areas.slice(0, 3).map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {result.detailed_analysis}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">매칭 요청 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
        <CardTitle className="text-sm">매칭 요청 관리</CardTitle>
        <p className="text-xs text-muted-foreground">
          받은 요청에 응답하고 보낸 요청의 상태를 확인하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 받은 요청 */}
        {receivedRequests.length > 0 && (
          <div>
            <h4 className="text-xs font-medium mb-3 text-green-700">📨 받은 요청</h4>
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {request.requester_name || request.target_email}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        요청일: {formatDate(request.created_at)}
                      </p>
                    </div>
                    
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRespond(request.id, "declined")}
                          className="text-xs"
                        >
                          거절
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onRespond(request.id, "accepted")}
                          className="text-xs"
                        >
                          수락
                        </Button>
                      </div>
                    )}
                    
                    {request.status === "completed" && request.analysis_result && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(request)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        상세보기
                      </Button>
                    )}
                  </div>
                  
                  {request.status === "completed" && request.analysis_result && (
                    renderAnalysisResult(request.analysis_result)
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보낸 요청 */}
        {sentRequests.length > 0 && (
          <div>
            <h4 className="text-xs font-medium mb-3 text-blue-700">📤 보낸 요청</h4>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {request.target_email}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        요청일: {formatDate(request.created_at)}
                      </p>
                      {request.responded_at && (
                        <p className="text-xs text-muted-foreground">
                          응답일: {formatDate(request.responded_at)}
                        </p>
                      )}
                    </div>
                    
                    {request.status === "completed" && request.analysis_result && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(request)}
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        결과보기
                      </Button>
                    )}
                  </div>
                  
                  {request.status === "completed" && request.analysis_result && (
                    renderAnalysisResult(request.analysis_result)
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 요청이 없는 경우 */}
        {receivedRequests.length === 0 && sentRequests.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              아직 매칭 요청이 없습니다
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              이메일로 상대방에게 분석을 요청해보세요
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};