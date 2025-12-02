import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// 분리된 컴포넌트들 import
import { RecommendedMatches } from "@/components/community/RecommendedMatches";
import { PersonalMatchRequest } from "@/components/community/PersonalMatchRequest";
import { MatchRequestList } from "@/components/community/MatchRequestList";
import { CommunityGroups } from "@/components/community/CommunityGroups";
import { CreateGroupForm } from "@/components/community/CreateGroupForm";

// 타입 정의
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

const Community = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("recommendations");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [loading, user, navigate]);

  // 사용자 분석 완료 상태 확인
  const { data: userAnalysisStatus } = useQuery({
    queryKey: ["user-analysis-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("has_completed_analysis")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasCompletedAnalysis = userAnalysisStatus?.has_completed_analysis ?? false;

  // 추천 매칭 데이터
  const { data: matchData, isLoading: matchesLoading } = useQuery<{ matches: MatchItem[] }>({
    queryKey: ["compatibility-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("calculate-compatibility", { 
        body: {} 
      });
      if (error) throw error;
      return data as { matches: MatchItem[] };
    },
    enabled: !!user && hasCompletedAnalysis,
  });

  const matchesByType = useMemo(() => {
    const list = matchData?.matches ?? [];
    return {
      similar: list.filter((m) => m.match_type === "similar").slice(0, 5),
      complementary: list.filter((m) => m.match_type === "complementary").slice(0, 5),
    };
  }, [matchData]);

  // 개인 매칭 요청 데이터
  const { data: personalRequests, isLoading: requestsLoading } = useQuery<PersonalMatchRequest[]>({
    queryKey: ["personal-match-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_match_requests")
        .select("*")
        .or(`requester_id.eq.${user!.id},target_user_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PersonalMatchRequest[];
    },
    enabled: !!user,
  });

  // 그룹 데이터
  const { data: groups, isLoading: groupsLoading } = useQuery<GroupItem[]>({
    queryKey: ["community-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_groups")
        .select("id, name, description, theme, creator_id, member_count, created_at, avg_sync_rate")
        .order("avg_sync_rate", { ascending: false, nullsLast: true });
      if (error) throw error;
      return data as GroupItem[];
    },
    enabled: !!user,
  });

  // 개인 매칭 요청 보내기
  const requestPersonalMatch = useMutation({
    mutationFn: async (targetEmail: string) => {
      if (!targetEmail.trim()) throw new Error("이메일을 입력하세요");
      
      // 상대방이 PRIPER 사용자인지 확인
      const { data: targetUser, error: userError } = await supabase
        .from("profiles")
        .select("id, email, has_completed_analysis")
        .eq("email", targetEmail.trim())
        .maybeSingle();

      if (userError) throw new Error("사용자 검색 중 오류가 발생했습니다");
      
      if (!targetUser) {
        // 비사용자인 경우 초대 이메일 발송
        const { error: inviteError } = await supabase.functions.invoke("send-match-invitation", {
          body: { targetEmail: targetEmail.trim(), requesterName: user!.email }
        });
        if (inviteError) throw inviteError;
        throw new Error("상대방이 PRIPER 사용자가 아닙니다. 초대 이메일을 발송했습니다.");
      }

      if (!targetUser.has_completed_analysis) {
        throw new Error("상대방이 아직 Why 분석을 완료하지 않았습니다. 분석 완료 후 다시 시도해주세요.");
      }

      // 매칭 요청 생성
      const { error } = await supabase.from("personal_match_requests").insert({
        requester_id: user!.id,
        target_email: targetEmail.trim(),
        target_user_id: targetUser.id,
        status: "pending"
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ 
        title: "매칭 요청 전송", 
        description: "상대방이 수락하면 분석 결과를 확인할 수 있습니다." 
      });
      qc.invalidateQueries({ queryKey: ["personal-match-requests"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "요청 실패", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // 매칭 요청 응답
  const respondToRequest = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: "accepted" | "declined" }) => {
      const { error } = await supabase
        .from("personal_match_requests")
        .update({ 
          status: response, 
          responded_at: new Date().toISOString() 
        })
        .eq("id", requestId);

      if (error) throw error;

      // 수락한 경우 분석 실행
      if (response === "accepted") {
        const { error: analysisError } = await supabase.functions.invoke("analyze-personal-match", {
          body: { requestId }
        });
        if (analysisError) throw analysisError;
      }
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: variables.response === "accepted" ? "매칭 수락" : "매칭 거절", 
        description: variables.response === "accepted" ? "분석이 진행됩니다." : "요청이 거절되었습니다." 
      });
      qc.invalidateQueries({ queryKey: ["personal-match-requests"] });
    },
    onError: (error: any) => {
      toast({ title: "응답 실패", description: error.message, variant: "destructive" });
    },
  });

  // 그룹 참여
  const joinMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from("group_members").insert({ 
        group_id: groupId, 
        user_id: user!.id 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "그룹 참여 완료", description: "이제 커뮤니티에서 함께 활동해보세요." });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
    },
    onError: (error: any) => {
      toast({ title: "참여 실패", description: error.message, variant: "destructive" });
    },
  });

  // 그룹 생성
  const createGroup = useMutation({
    mutationFn: async (groupData: { name: string; theme: string; description: string }) => {
      if (!groupData.name.trim()) throw new Error("그룹 이름을 입력하세요");
      const { error } = await supabase.from("community_groups").insert({
        name: groupData.name.trim(),
        description: groupData.description.trim() || null,
        theme: groupData.theme.trim() || null,
        creator_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "그룹 생성 완료", description: "관심사가 맞는 사람들과 소통해보세요." });
      qc.invalidateQueries({ queryKey: ["community-groups"] });
    },
    onError: (error: any) => {
      toast({ title: "생성 실패", description: error.message, variant: "destructive" });
    },
  });

  // 매칭 연결 (추후 구현)
  const handleConnect = async (userId: string) => {
    toast({ 
      title: "연결 기능 준비중", 
      description: "곧 매칭된 사용자와 연결할 수 있습니다." 
    });
  };

  // 매칭 요청 상세보기 (추후 구현)
  const handleViewDetails = (request: PersonalMatchRequest) => {
    toast({ 
      title: "상세 분석", 
      description: "상세 분석 화면이 곧 추가됩니다." 
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-xs">커뮤니티를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>커뮤니티 매칭 | PRIPER</title>
        <meta name="description" content="Prime Perspective 기반 커뮤니티 매칭과 그룹 참여" />
        <link rel="canonical" href={`${window.location.origin}/community`} />
      </Helmet>
      
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-4 text-center" aria-label="커뮤니티 페이지 헤더">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: 'auto' }}
            alt="커뮤니티 헤더 이미지"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>

        {/* 네비게이션 */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/ikigai')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ikigai로 돌아가기
          </Button>
        </div>

        <header className="mb-6 text-center">
          <h1 className="text-sm font-medium mb-2">커뮤니티 매칭</h1>
          <p className="text-xs text-muted-foreground">
            Prime Perspective 기반으로 나와 맞는 사람들을 찾고 함께 성장하세요
          </p>
        </header>

        {/* 🔥 UPDATED: 미니멀 분석 미완료 안내 */}
        {!hasCompletedAnalysis && (
          <div className="mb-6 text-center py-4 border rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">
              Why 분석을 완료하면 매칭 기능을 사용할 수 있습니다
            </p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate('/why')}
              className="text-xs h-auto p-1"
            >
              Why 분석 완료하기
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recommendations" className="text-xs">추천 매칭</TabsTrigger>
            <TabsTrigger value="personal" className="text-xs">개인 분석</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">그룹</TabsTrigger>
            <TabsTrigger value="create" className="text-xs">그룹 만들기</TabsTrigger>
          </TabsList>

          {/* 추천 매칭 탭 */}
          <TabsContent value="recommendations" className="space-y-6">
            <RecommendedMatches
              matchesByType={matchesByType}
              isLoading={matchesLoading}
              onConnect={handleConnect}
            />
          </TabsContent>

          {/* 개인 매칭 분석 탭 */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonalMatchRequest
                onSubmit={(email) => requestPersonalMatch.mutate(email)}
                isLoading={requestPersonalMatch.isPending}
              />
              
              <MatchRequestList
                requests={personalRequests || []}
                currentUserId={user?.id || ""}
                isLoading={requestsLoading}
                onRespond={(requestId, response) => 
                  respondToRequest.mutate({ requestId, response })
                }
                onViewDetails={handleViewDetails}
              />
            </div>
          </TabsContent>

          {/* 커뮤니티 그룹 탭 */}
          <TabsContent value="groups" className="space-y-6">
            <CommunityGroups
              groups={groups || []}
              isLoading={groupsLoading}
              onJoinGroup={(groupId) => joinMutation.mutate(groupId)}
              isJoining={joinMutation.isPending}
            />
          </TabsContent>

          {/* 그룹 생성 탭 */}
          <TabsContent value="create" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <CreateGroupForm
                onSubmit={(groupData) => createGroup.mutate(groupData)}
                isLoading={createGroup.isPending}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Community;