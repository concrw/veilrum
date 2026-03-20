import { useState, useEffect } from "react";
import {
  usePersonas,
  useGrowthSummary,
  usePersonaMilestones,
  useToggleMilestone,
} from "@/hooks/usePersonas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Circle,
  Loader2,
  InfoIcon,
  Calendar,
  BarChart3
} from "lucide-react";
import { ARCHETYPE_CONFIGS } from "@/integrations/supabase/persona-types";

export function PersonaGrowthDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: personas, isLoading: personasLoading } = usePersonas();
  const { data: growthSummary, isLoading: growthLoading } = useGrowthSummary();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  const { data: milestones, isLoading: milestonesLoading } = usePersonaMilestones(selectedPersonaId);
  const { mutate: toggleMilestone } = useToggleMilestone();

  const isLoading = personasLoading || growthLoading;

  // Realtime subscription for milestones
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("persona-milestones-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "persona_milestones",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Milestone change detected:", payload);
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ["persona-milestones"] });
          queryClient.invalidateQueries({ queryKey: ["all-milestones"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Realtime subscription for growth metrics
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("persona-growth-metrics-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "persona_growth_metrics",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Growth metric added:", payload);
          // Invalidate growth summary to show new data
          queryClient.invalidateQueries({ queryKey: ["growth-summary"] });
          queryClient.invalidateQueries({ queryKey: ["persona-growth-history"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Set initial selected persona
  if (!selectedPersonaId && personas && personas.length > 0) {
    setSelectedPersonaId(personas[0].id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          성장 대시보드는 페르소나가 생성된 후 사용할 수 있습니다.
        </AlertDescription>
      </Alert>
    );
  }

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);
  const selectedGrowth = growthSummary?.find((g: any) => g.persona_id === selectedPersonaId);

  const getTrendIcon = (change: number) => {
    if (change > 2) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < -2) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-blue-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 2) return "text-green-600 bg-green-50";
    if (change < -2) return "text-red-600 bg-red-50";
    return "text-blue-600 bg-blue-50";
  };

  const handleToggleMilestone = (milestoneId: string, currentState: boolean) => {
    toggleMilestone({
      milestoneId,
      isCompleted: !currentState,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          페르소나 성장 추적
        </h2>
        <p className="text-muted-foreground">
          각 페르소나의 발전 과정을 추적하고 목표를 달성하세요
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => {
          const growth = growthSummary?.find((g: any) => g.persona_id === persona.id);
          const currentStrength = growth?.current_strength || persona.strength_score || 0;
          const previousStrength = growth?.previous_strength || currentStrength;
          const change = growth?.change || 0;

          // Calculate milestone completion (we'll get this from milestones)
          const completionRate = 0; // Will be calculated from actual milestones

          return (
            <Card
              key={persona.id}
              className={`cursor-pointer transition-all ${
                selectedPersonaId === persona.id
                  ? "ring-2 ring-primary"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedPersonaId(persona.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: persona.color_hex }}
                    >
                      <span className="text-white">
                        {ARCHETYPE_CONFIGS[persona.persona_archetype || "Explorer"]?.icon || "👤"}
                      </span>
                    </div>
                    <CardTitle className="text-base">{persona.persona_name}</CardTitle>
                  </div>
                  {getTrendIcon(change)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">강도</span>
                    <Badge variant="outline" className={getTrendColor(change)}>
                      {change > 0 ? "+" : ""}
                      {Math.round(change)}%
                    </Badge>
                  </div>
                  <Progress value={currentStrength} className="h-2" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      이전: {Math.round(previousStrength)}%
                    </span>
                    <span className="text-xs font-semibold">
                      현재: {Math.round(currentStrength)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed View */}
      {selectedPersona && (
        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="milestones">
              <Target className="w-4 h-4 mr-2" />
              마일스톤
            </TabsTrigger>
            <TabsTrigger value="progress">
              <BarChart3 className="w-4 h-4 mr-2" />
              성장 추이
            </TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: selectedPersona.color_hex }}
                  >
                    <span className="text-white">
                      {ARCHETYPE_CONFIGS[selectedPersona.persona_archetype || "Explorer"]?.icon ||
                        "👤"}
                    </span>
                  </div>
                  <div>
                    <CardTitle>{selectedPersona.persona_name}</CardTitle>
                    <CardDescription>성장 목표 및 달성 현황</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {milestonesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !milestones || milestones.length === 0 ? (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      아직 마일스톤이 없습니다. 첫 마일스톤을 만들어보세요!
                    </AlertDescription>
                  </Alert>
                ) : (
                  milestones.map((milestone: any) => (
                    <div
                      key={milestone.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        milestone.is_completed ? "bg-green-50 border-green-200" : "bg-card hover:bg-accent"
                      }`}
                      onClick={() => handleToggleMilestone(milestone.id, milestone.is_completed)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {milestone.is_completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-sm">{milestone.title}</h4>
                            {milestone.is_completed && (
                              <Badge variant="outline" className="bg-green-100 text-green-700">
                                완료
                              </Badge>
                            )}
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {milestone.is_completed && milestone.completed_at && (
                              <span>
                                완료일: {new Date(milestone.completed_at).toLocaleDateString("ko-KR")}
                              </span>
                            )}
                            {!milestone.is_completed && milestone.target_date && (
                              <span>
                                목표일: {new Date(milestone.target_date).toLocaleDateString("ko-KR")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>성장 추이</CardTitle>
                <CardDescription>
                  {selectedPersona.persona_name}의 강도 변화 및 발전 방향
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedGrowth ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">현재 강도</span>
                        <span className="text-2xl font-bold">
                          {Math.round(selectedGrowth.current_strength)}%
                        </span>
                      </div>
                      <Progress value={selectedGrowth.current_strength} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">이전 측정</p>
                        <p className="text-xl font-semibold">
                          {Math.round(selectedGrowth.previous_strength)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">변화량</p>
                        <p
                          className={`text-xl font-semibold ${
                            selectedGrowth.change > 0
                              ? "text-green-600"
                              : selectedGrowth.change < 0
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {selectedGrowth.change > 0 ? "+" : ""}
                          {Math.round(selectedGrowth.change)}%
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      아직 성장 데이터가 충분하지 않습니다.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="mt-4">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    💡 페르소나 강도는 관련 활동(Ikigai 설계, 콘텐츠 발행, 커뮤니티 참여 등)을 통해
                    성장합니다. 꾸준히 활동하여 이 페르소나를 발전시켜 보세요!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
