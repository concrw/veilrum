import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
import { ContentRecommendations } from "@/components/recommendations/ContentRecommendations";

import {
  Settings,
  TrendingUp,
  Brain,
  Lightbulb,
  CheckCircle,
  Clock,
  Target,
  Users,
  ChevronRight,
  LogOut,
  User,
  Bell,
  Star,
  Briefcase,
  AlertTriangle,
  Heart,
  Zap,
  Calendar,
  Award,
} from "lucide-react";

// Types
interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  has_completed_analysis: boolean;
}

interface MetaInsight {
  type: "strength" | "pattern" | "contradiction" | "growth";
  title: string;
  description: string;
  score?: number;
}

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

interface GrowthStage {
  stage: string;
  title: string;
  completed: boolean;
  progress: number;
  description: string;
  route: string;
}

interface GroupMembership {
  id: string;
  group_id: string;
  joined_at: string;
  group: {
    id: string;
    name: string;
    theme: string | null;
    member_count: number;
  };
}

interface UserActivity {
  type: "post" | "comment" | "event" | "match";
  title: string;
  description: string;
  date: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, has_completed_analysis")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Why analysis data
  const { data: whyData } = useQuery({
    queryKey: ["why-analysis-data", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("why_analysis")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Ikigai data
  const { data: ikigaiData } = useQuery({
    queryKey: ["ikigai-data", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ikigai_designs")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Brand Strategy data
  const { data: brandData } = useQuery({
    queryKey: ["brand-strategy-data", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_strategies")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch group memberships
  const { data: groupMemberships } = useQuery<GroupMembership[]>({
    queryKey: ["user-group-memberships", user?.id],
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("group_members")
        .select("id, group_id, joined_at")
        .eq("user_id", user!.id);
      if (error) throw error;

      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map((m) => m.group_id);
      const { data: groups } = await supabase
        .from("community_groups")
        .select("id, name, theme, member_count")
        .in("id", groupIds);

      const groupMap = new Map(groups?.map((g) => [g.id, g]) || []);

      return memberships.map((m) => ({
        ...m,
        group: groupMap.get(m.group_id)!,
      })).filter((m) => m.group);
    },
    enabled: !!user,
  });

  // Fetch match connections
  const { data: matchConnections } = useQuery({
    queryKey: ["user-match-connections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_matches")
        .select("*")
        .or(`user_id.eq.${user!.id},matched_user_id.eq.${user!.id}`)
        .eq("status", "connected");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: { display_name?: string; avatar_url?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "프로필 저장 완료" });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      setProfileDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout handler
  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await signOut();
      toast({
        title: "로그아웃 완료",
        description: "다음에 또 만나요!",
      });
      navigate("/auth/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "로그아웃 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  // Calculate completion status
  const whyCompleted = !!whyData?.prime_perspective;
  const ikigaiCompleted = !!(
    ikigaiData?.love_elements?.length > 0 &&
    ikigaiData?.good_at_elements?.length > 0 &&
    ikigaiData?.world_needs_elements?.length > 0 &&
    ikigaiData?.paid_for_elements?.length > 0
  );
  const brandCompleted = !!brandData?.brand_direction;
  const communityActive = (groupMemberships?.length || 0) > 0 || (matchConnections?.length || 0) > 0;

  // Generate insights based on actual data
  const metaInsights: MetaInsight[] = useMemo(() => {
    const insights: MetaInsight[] = [];

    if (whyData?.happy_jobs && whyData?.pain_jobs) {
      const happyCount = whyData.happy_jobs.length;
      const painCount = whyData.pain_jobs.length;

      if (happyCount > painCount) {
        insights.push({
          type: "strength",
          title: "긍정적 직업 경험 풍부",
          description: `${happyCount}개의 행복한 직업 경험이 ${painCount}개의 고통스러운 경험보다 많습니다. 긍정적인 패턴이 우세합니다.`,
          score: Math.round((happyCount / (happyCount + painCount)) * 100),
        });
      }

      if (whyData.prime_perspective) {
        insights.push({
          type: "pattern",
          title: "핵심 관점 정립됨",
          description: "Prime Perspective가 도출되어 의사결정의 명확한 기준이 있습니다.",
        });
      }
    }

    if (ikigaiData) {
      const totalElements =
        (ikigaiData.love_elements?.length || 0) +
        (ikigaiData.good_at_elements?.length || 0) +
        (ikigaiData.world_needs_elements?.length || 0) +
        (ikigaiData.paid_for_elements?.length || 0);

      if (totalElements >= 12) {
        insights.push({
          type: "growth",
          title: "풍부한 Ikigai 구성",
          description: `총 ${totalElements}개의 Ikigai 요소가 정의되어 있어 명확한 방향성을 가지고 있습니다.`,
        });
      }
    }

    return insights;
  }, [whyData, ikigaiData]);

  // Generate recommendations based on completion status
  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = [];

    if (!whyCompleted) {
      recs.push({
        id: "complete-why",
        type: "focus",
        priority: "high",
        title: "Why 분석 완료하기",
        description: "행복과 고통 직업 분석을 통해 핵심 가치관을 발견하세요.",
        actionText: "분석 시작",
        route: "/why",
        estimatedTime: "15분",
      });
    }

    if (whyCompleted && !ikigaiCompleted) {
      recs.push({
        id: "complete-ikigai",
        type: "focus",
        priority: "high",
        title: "Ikigai 설계 완료하기",
        description: "생의 목적 4영역을 완성하고 진정한 Ikigai를 찾으세요.",
        actionText: "설계 시작",
        route: "/ikigai",
        estimatedTime: "20분",
      });
    }

    if (ikigaiCompleted && !brandCompleted) {
      recs.push({
        id: "brand-building",
        type: "brand",
        priority: "high",
        title: "개인 브랜드 구축",
        description: "Ikigai를 바탕으로 개인 브랜드 전략을 수립하세요.",
        actionText: "브랜드 설계",
        route: "/brand",
        estimatedTime: "25분",
      });
    }

    if (!communityActive && whyCompleted) {
      recs.push({
        id: "community-matching",
        type: "community",
        priority: "medium",
        title: "커뮤니티 매칭",
        description: "비슷한 가치관을 가진 사람들과 연결되어보세요.",
        actionText: "매칭 시작",
        route: "/community",
        estimatedTime: "10분",
      });
    }

    return recs;
  }, [whyCompleted, ikigaiCompleted, brandCompleted, communityActive]);

  // Growth stages
  const stages: GrowthStage[] = [
    {
      stage: "1단계",
      title: "Why 분석",
      completed: whyCompleted,
      progress: whyCompleted ? 100 : 0,
      description: whyCompleted
        ? `${whyData?.happy_jobs?.length || 0}개 행복 / ${whyData?.pain_jobs?.length || 0}개 고통 분석 완료`
        : "행복/고통 패턴 분석 필요",
      route: "/why",
    },
    {
      stage: "2단계",
      title: "Ikigai 설계",
      completed: ikigaiCompleted,
      progress: ikigaiCompleted ? 100 : whyCompleted ? 30 : 0,
      description: ikigaiCompleted
        ? "생의 목적 4영역 완성"
        : "Ikigai 설계 필요",
      route: "/ikigai",
    },
    {
      stage: "3단계",
      title: "브랜드 구축",
      completed: brandCompleted,
      progress: brandCompleted ? 100 : ikigaiCompleted ? 40 : 0,
      description: brandCompleted
        ? brandData?.brand_direction?.field || "브랜드 전략 수립 완료"
        : "개인 브랜드 전략 수립 필요",
      route: "/brand",
    },
    {
      stage: "4단계",
      title: "커뮤니티 활동",
      completed: communityActive,
      progress: communityActive ? 100 : brandCompleted ? 60 : 0,
      description: communityActive
        ? `${groupMemberships?.length || 0}개 그룹 / ${matchConnections?.length || 0}명 연결`
        : "커뮤니티 참여 필요",
      route: "/community",
    },
  ];

  const overallProgress = stages.reduce((acc, stage) => acc + stage.progress, 0) / 4;
  const completedStages = stages.filter((stage) => stage.completed).length;

  // Settings Dropdown Component
  const SettingsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => setProfileDialogOpen(true)}
          className="text-xs"
        >
          <User className="mr-2 h-3 w-3" />
          프로필 편집
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <PushNotificationToggle variant="switch" className="w-full" />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-xs"
          disabled={loggingOut}
        >
          <LogOut className="mr-2 h-3 w-3" />
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Profile Edit Dialog Component
  const ProfileEditDialog = () => {
    const [localName, setLocalName] = useState(profile?.display_name || "");
    const [localAvatar, setLocalAvatar] = useState(profile?.avatar_url || "");

    useEffect(() => {
      if (profile) {
        setLocalName(profile.display_name || "");
        setLocalAvatar(profile.avatar_url || "");
      }
    }, [profile]);

    const handleSave = () => {
      updateProfile.mutate({
        display_name: localName || null,
        avatar_url: localAvatar || null,
      });
    };

    return (
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">프로필 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">
                이름
              </Label>
              <Input
                id="name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="avatar" className="text-xs">
                아바타 URL
              </Label>
              <Input
                id="avatar"
                value={localAvatar}
                onChange={(e) => setLocalAvatar(e.target.value)}
                placeholder="프로필 이미지 URL"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">이메일</Label>
              <Input
                value={profile?.email ?? ""}
                disabled
                className="text-xs bg-muted"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfileDialogOpen(false)}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="text-xs"
              >
                {updateProfile.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Growth Report Component
  const GrowthReport = () => (
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
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">전체 진행률</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          {stages.map((stage) => (
            <div
              key={stage.stage}
              className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
              onClick={() => navigate(stage.route)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6">
                  {stage.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : stage.progress > 0 ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Target className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{stage.title}</span>
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
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

        <div className="pt-2 border-t">
          {completedStages === 4 ? (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                모든 단계를 완료했습니다
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/community")}
                className="text-xs"
              >
                커뮤니티에서 활동하기
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                다음 단계: {stages.find((s) => !s.completed)?.title}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  const nextStage = stages.find((s) => !s.completed);
                  if (nextStage) navigate(nextStage.route);
                }}
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

  // Meta Cognition Analysis Component
  const MetaCognitionAnalysis = () => {
    const getInsightIcon = (type: MetaInsight["type"]) => {
      switch (type) {
        case "strength":
          return <CheckCircle className="w-3 h-3 text-green-500" />;
        case "pattern":
          return <TrendingUp className="w-3 h-3 text-blue-500" />;
        case "contradiction":
          return <AlertTriangle className="w-3 h-3 text-amber-500" />;
        case "growth":
          return <Brain className="w-3 h-3 text-purple-500" />;
        default:
          return <Brain className="w-3 h-3 text-muted-foreground" />;
      }
    };

    return (
      <Card className="bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4" />
            메타인지 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {whyData?.prime_perspective && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                Prime Perspective
              </h4>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs leading-relaxed">
                  {whyData.prime_perspective}
                </p>
              </div>
            </div>
          )}

          {metaInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                주요 인사이트 ({metaInsights.length}개)
              </h4>
              <div className="space-y-2">
                {metaInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg bg-background/50 border"
                  >
                    <div className="flex items-start gap-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-medium mb-1">
                          {insight.title}
                        </h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.score && (
                          <div className="mt-1">
                            <Progress value={insight.score} className="h-1" />
                            <span className="text-xs font-medium">
                              {insight.score}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!whyData?.prime_perspective && metaInsights.length === 0 && (
            <div className="text-center py-6">
              <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-1">
                아직 분석 데이터가 없습니다
              </p>
              <p className="text-xs text-muted-foreground">
                Why 분석을 완료하면 인사이트를 볼 수 있습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Personalized Recommendations Component
  const PersonalizedRecommendations = () => {
    const getRecommendationIcon = (type: Recommendation["type"]) => {
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

    const getPriorityText = (priority: Recommendation["priority"]) => {
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

    const highPriorityRecs = recommendations.filter((r) => r.priority === "high");
    const otherRecs = recommendations.filter((r) => r.priority !== "high");

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
              <Award className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-xs font-medium mb-1">모든 단계를 완료했습니다!</p>
              <p className="text-xs text-muted-foreground">
                커뮤니티에서 활동하며 네트워크를 확장해보세요
              </p>
            </div>
          ) : (
            <>
              {highPriorityRecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    지금 집중할 영역
                  </h4>
                  <div className="space-y-2">
                    {highPriorityRecs.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-lg border bg-background/80"
                      >
                        <div className="flex items-start gap-2">
                          {getRecommendationIcon(rec.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-xs font-medium">{rec.title}</h5>
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0 h-4"
                              >
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
                              onClick={() => rec.route && navigate(rec.route)}
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

              {otherRecs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    기타 추천사항
                  </h4>
                  <div className="space-y-2">
                    {otherRecs.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getRecommendationIcon(rec.type)}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-medium truncate">
                                {rec.title}
                              </h5>
                              <p className="text-xs text-muted-foreground truncate">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 px-2"
                            onClick={() => rec.route && navigate(rec.route)}
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

  // My Groups Component
  const MyGroups = () => (
    <Card className="bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            내 그룹
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => navigate("/community")}
          >
            전체보기
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!groupMemberships || groupMemberships.length === 0 ? (
          <div className="text-center py-6">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-2">
              아직 참여한 그룹이 없습니다
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate("/community")}
            >
              그룹 찾아보기
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {groupMemberships.slice(0, 3).map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                onClick={() =>
                  navigate(`/community/group/${membership.group_id}`)
                }
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-medium">
                      {membership.group.name}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {membership.group.theme && (
                        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                          {membership.group.theme}
                        </Badge>
                      )}
                      <span>{membership.group.member_count}명</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
            {groupMemberships.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{groupMemberships.length - 3}개 더
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Stats Summary Component
  const StatsSummary = () => (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-card/60">
        <CardContent className="pt-4 pb-3 px-3">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">행복 직업</span>
          </div>
          <p className="text-lg font-bold">
            {whyData?.happy_jobs?.length || 0}개
          </p>
        </CardContent>
      </Card>
      <Card className="bg-card/60">
        <CardContent className="pt-4 pb-3 px-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Ikigai 요소</span>
          </div>
          <p className="text-lg font-bold">
            {(ikigaiData?.love_elements?.length || 0) +
              (ikigaiData?.good_at_elements?.length || 0) +
              (ikigaiData?.world_needs_elements?.length || 0) +
              (ikigaiData?.paid_for_elements?.length || 0)}
            개
          </p>
        </CardContent>
      </Card>
      <Card className="bg-card/60">
        <CardContent className="pt-4 pb-3 px-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">커뮤니티</span>
          </div>
          <p className="text-lg font-bold">
            {groupMemberships?.length || 0}그룹
          </p>
        </CardContent>
      </Card>
      <Card className="bg-card/60">
        <CardContent className="pt-4 pb-3 px-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">매칭 연결</span>
          </div>
          <p className="text-lg font-bold">
            {matchConnections?.length || 0}명
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const greeting = useMemo(
    () =>
      profile?.display_name || user?.email?.split("@")[0] || "사용자",
    [profile?.display_name, user?.email]
  );

  if (profileLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-xs">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>마이페이지 | PRIPER</title>
        <meta name="description" content="PRIPER 마이페이지 - 성장 현황과 맞춤 추천" />
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

        {/* Header Image */}
        <header className="mb-4 text-center">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: "auto" }}
            alt="PRIPER 로고"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>

        {/* Greeting + Settings */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-medium">안녕하세요, {greeting}님</h1>
          <div className="flex items-center gap-2">
            <PushNotificationToggle variant="button" showLabel={false} />
            <NotificationDropdown />
            <SettingsDropdown />
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs">
              개요
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              인사이트
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              활동
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <StatsSummary />
            <GrowthReport />
            <PersonalizedRecommendations />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <MetaCognitionAnalysis />
            <ContentRecommendations />
            {ikigaiData && (
              <Card className="bg-card/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Ikigai 요약
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-red-500">LOVE</h5>
                      <div className="flex flex-wrap gap-1">
                        {ikigaiData.love_elements?.slice(0, 3).map((item: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {(ikigaiData.love_elements?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ikigaiData.love_elements.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-blue-500">GOOD AT</h5>
                      <div className="flex flex-wrap gap-1">
                        {ikigaiData.good_at_elements?.slice(0, 3).map((item: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {(ikigaiData.good_at_elements?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ikigaiData.good_at_elements.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-green-500">WORLD NEEDS</h5>
                      <div className="flex flex-wrap gap-1">
                        {ikigaiData.world_needs_elements?.slice(0, 3).map((item: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {(ikigaiData.world_needs_elements?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ikigaiData.world_needs_elements.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-amber-500">PAID FOR</h5>
                      <div className="flex flex-wrap gap-1">
                        {ikigaiData.paid_for_elements?.slice(0, 3).map((item: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {(ikigaiData.paid_for_elements?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ikigaiData.paid_for_elements.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {ikigaiData.final_ikigai_text && (
                    <div className="mt-4 p-3 bg-background/50 rounded-lg">
                      <h5 className="text-xs font-medium mb-1">최종 Ikigai</h5>
                      <p className="text-xs text-muted-foreground">
                        {ikigaiData.final_ikigai_text}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <MyGroups />
            {matchConnections && matchConnections.length > 0 && (
              <Card className="bg-card/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    매칭 연결
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-lg font-bold mb-1">
                      {matchConnections.length}명
                    </p>
                    <p className="text-xs text-muted-foreground">
                      연결된 사람들과 함께 성장하세요
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Profile Edit Dialog */}
        <ProfileEditDialog />
      </main>
    </>
  );
};

export default Dashboard;
