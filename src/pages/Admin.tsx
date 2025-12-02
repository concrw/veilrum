import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  Brain,
  Target,
  MessageSquare,
  Calendar,
  ArrowLeft,
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface AnalysisStats {
  whyAnalysisCompleted: number;
  ikigaiCompleted: number;
  brandCompleted: number;
  averageCompletionRate: number;
}

interface CommunityStats {
  totalGroups: number;
  totalPosts: number;
  totalEvents: number;
  activeMatchRequests: number;
}

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h1 className="text-lg font-medium mb-2">접근 권한 없음</h1>
          <p className="text-sm text-muted-foreground mb-4">
            관리자만 접근할 수 있는 페이지입니다.
          </p>
          <Button onClick={() => navigate("/me")} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            마이페이지로 돌아가기
          </Button>
        </div>
      </main>
    );
  }

  // Fetch user stats
  const { data: userStats, isLoading: userStatsLoading } = useQuery<UserStats>({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Users with recent activity (active users)
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", weekAgo.toISOString());

      // New users this week
      const { count: newUsersThisWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      // New users this month
      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
      };
    },
    enabled: !!user && isAdmin,
  });

  // Fetch analysis stats
  const { data: analysisStats, isLoading: analysisStatsLoading } = useQuery<AnalysisStats>({
    queryKey: ["admin-analysis-stats"],
    queryFn: async () => {
      // Why analysis completed (has prime_perspective)
      const { count: whyCount } = await supabase
        .from("why_analysis")
        .select("*", { count: "exact", head: true })
        .not("prime_perspective", "is", null);

      // Ikigai completed
      const { count: ikigaiCount } = await supabase
        .from("ikigai_designs")
        .select("*", { count: "exact", head: true })
        .not("final_ikigai_text", "is", null);

      // Brand completed
      const { count: brandCount } = await supabase
        .from("brand_strategies")
        .select("*", { count: "exact", head: true })
        .not("brand_direction", "is", null);

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const total = totalUsers || 1;
      const avgRate =
        (((whyCount || 0) + (ikigaiCount || 0) + (brandCount || 0)) / (total * 3)) * 100;

      return {
        whyAnalysisCompleted: whyCount || 0,
        ikigaiCompleted: ikigaiCount || 0,
        brandCompleted: brandCount || 0,
        averageCompletionRate: Math.round(avgRate),
      };
    },
    enabled: !!user && isAdmin,
  });

  // Fetch community stats
  const { data: communityStats, isLoading: communityStatsLoading } = useQuery<CommunityStats>({
    queryKey: ["admin-community-stats"],
    queryFn: async () => {
      const { count: totalGroups } = await supabase
        .from("community_groups")
        .select("*", { count: "exact", head: true });

      const { count: totalPosts } = await supabase
        .from("group_posts")
        .select("*", { count: "exact", head: true });

      const { count: totalEvents } = await supabase
        .from("group_events")
        .select("*", { count: "exact", head: true });

      const { count: activeMatchRequests } = await supabase
        .from("personal_match_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        totalGroups: totalGroups || 0,
        totalPosts: totalPosts || 0,
        totalEvents: totalEvents || 0,
        activeMatchRequests: activeMatchRequests || 0,
      };
    },
    enabled: !!user && isAdmin,
  });

  // Fetch recent signups
  const { data: recentSignups } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  // Fetch chat stats
  const { data: chatStats } = useQuery({
    queryKey: ["admin-chat-stats"],
    queryFn: async () => {
      const { count: totalRooms } = await supabase
        .from("chat_rooms")
        .select("*", { count: "exact", head: true });

      const { count: totalMessages } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true });

      return {
        totalRooms: totalRooms || 0,
        totalMessages: totalMessages || 0,
      };
    },
    enabled: !!user && isAdmin,
  });

  const isLoading = userStatsLoading || analysisStatsLoading || communityStatsLoading;

  // Stats Cards Component
  const StatsCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: number; label: string };
  }) => (
    <Card className="bg-card/60">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-500">
                  +{trend.value} {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // User Stats Overview
  const UserStatsOverview = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Users className="w-4 h-4" />
        사용자 현황
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="전체 사용자"
          value={userStats?.totalUsers || 0}
          icon={Users}
          trend={
            userStats?.newUsersThisWeek
              ? { value: userStats.newUsersThisWeek, label: "이번 주" }
              : undefined
          }
        />
        <StatsCard
          title="활성 사용자"
          value={userStats?.activeUsers || 0}
          subtitle="최근 7일 활동"
          icon={Activity}
        />
        <StatsCard
          title="이번 주 가입"
          value={userStats?.newUsersThisWeek || 0}
          icon={Calendar}
        />
        <StatsCard
          title="이번 달 가입"
          value={userStats?.newUsersThisMonth || 0}
          icon={TrendingUp}
        />
      </div>
    </div>
  );

  // Analysis Stats Overview
  const AnalysisStatsOverview = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Brain className="w-4 h-4" />
        분석 완료 현황
      </h3>
      <Card className="bg-card/60">
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs">전체 완료율</span>
            <Badge variant="secondary" className="text-xs">
              {analysisStats?.averageCompletionRate || 0}%
            </Badge>
          </div>
          <Progress value={analysisStats?.averageCompletionRate || 0} className="h-2" />

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs">Why 분석</span>
              </div>
              <span className="text-xs font-medium">
                {analysisStats?.whyAnalysisCompleted || 0}명
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs">Ikigai 설계</span>
              </div>
              <span className="text-xs font-medium">
                {analysisStats?.ikigaiCompleted || 0}명
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs">브랜드 구축</span>
              </div>
              <span className="text-xs font-medium">
                {analysisStats?.brandCompleted || 0}명
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Community Stats Overview
  const CommunityStatsOverview = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Users className="w-4 h-4" />
        커뮤니티 현황
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="전체 그룹"
          value={communityStats?.totalGroups || 0}
          icon={Users}
        />
        <StatsCard
          title="전체 게시글"
          value={communityStats?.totalPosts || 0}
          icon={MessageSquare}
        />
        <StatsCard
          title="전체 이벤트"
          value={communityStats?.totalEvents || 0}
          icon={Calendar}
        />
        <StatsCard
          title="대기 중 매칭"
          value={communityStats?.activeMatchRequests || 0}
          icon={Target}
        />
      </div>

      {chatStats && (
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="채팅방"
            value={chatStats.totalRooms}
            icon={MessageSquare}
          />
          <StatsCard
            title="메시지"
            value={chatStats.totalMessages}
            icon={MessageSquare}
          />
        </div>
      )}
    </div>
  );

  // Recent Signups List
  const RecentSignupsList = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Clock className="w-4 h-4" />
        최근 가입자
      </h3>
      <Card className="bg-card/60">
        <CardContent className="pt-4">
          {recentSignups && recentSignups.length > 0 ? (
            <div className="space-y-2">
              {recentSignups.map((signup: any) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">
                        {signup.display_name || signup.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {signup.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(signup.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              가입자가 없습니다
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Funnel Analysis Component
  const FunnelAnalysis = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        퍼널 분석
      </h3>
      <Card className="bg-card/60">
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">전체 가입</span>
                <span className="text-xs font-medium">
                  {userStats?.totalUsers || 0}명 (100%)
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Why 분석 완료</span>
                <span className="text-xs font-medium">
                  {analysisStats?.whyAnalysisCompleted || 0}명 (
                  {userStats?.totalUsers
                    ? Math.round(
                        ((analysisStats?.whyAnalysisCompleted || 0) /
                          userStats.totalUsers) *
                          100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <Progress
                value={
                  userStats?.totalUsers
                    ? ((analysisStats?.whyAnalysisCompleted || 0) /
                        userStats.totalUsers) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Ikigai 설계 완료</span>
                <span className="text-xs font-medium">
                  {analysisStats?.ikigaiCompleted || 0}명 (
                  {userStats?.totalUsers
                    ? Math.round(
                        ((analysisStats?.ikigaiCompleted || 0) /
                          userStats.totalUsers) *
                          100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <Progress
                value={
                  userStats?.totalUsers
                    ? ((analysisStats?.ikigaiCompleted || 0) /
                        userStats.totalUsers) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">브랜드 구축 완료</span>
                <span className="text-xs font-medium">
                  {analysisStats?.brandCompleted || 0}명 (
                  {userStats?.totalUsers
                    ? Math.round(
                        ((analysisStats?.brandCompleted || 0) /
                          userStats.totalUsers) *
                          100
                      )
                    : 0}
                  %)
                </span>
              </div>
              <Progress
                value={
                  userStats?.totalUsers
                    ? ((analysisStats?.brandCompleted || 0) /
                        userStats.totalUsers) *
                      100
                    : 0
                }
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-xs">통계 로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>관리자 대시보드 | PRIPER</title>
        <meta name="description" content="PRIPER 관리자 대시보드" />
      </Helmet>

      <main className="min-h-screen bg-background px-4 pb-24 pt-6 overflow-y-auto scrollbar-hide">
        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm font-medium">관리자 대시보드</h1>
            <p className="text-xs text-muted-foreground">서비스 현황 및 통계</p>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">
              개요
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              사용자
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              분석
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <UserStatsOverview />
            <AnalysisStatsOverview />
            <CommunityStatsOverview />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserStatsOverview />
            <RecentSignupsList />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalysisStatsOverview />
            <FunnelAnalysis />
            <CommunityStatsOverview />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
};

export default Admin;
