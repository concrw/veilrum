import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersonas, useHasMultiplePersonas } from "@/hooks/usePersonas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaPaywall } from "@/components/persona/PersonaPaywall";
import { ArrowRight, Lock, Users, Zap } from "lucide-react";
import { ARCHETYPE_CONFIGS } from "@/integrations/supabase/persona-types";

export default function Personas() {
  const navigate = useNavigate();
  const { data: personas, isLoading: personasLoading } = usePersonas();
  const { data: multiPersonaInfo, isLoading: multiInfoLoading } = useHasMultiplePersonas();
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isLoading = personasLoading || multiInfoLoading;

  const handlePersonaClick = (personaId: string, rank: number) => {
    if (!multiPersonaInfo?.canAccessAll && rank > 1) {
      setPaywallOpen(true);
      return;
    }
    // Navigate to persona detail or perform action
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">페르소나가 아직 생성되지 않았습니다</h2>
        <p className="text-muted-foreground mb-6">
          Why 분석을 완료하면 자동으로 페르소나가 감지됩니다.
        </p>
        <Button onClick={() => navigate("/why")}>Why 분석 시작하기</Button>
      </div>
    );
  }

  const mainPersona = personas[0];
  const subPersonas = personas.slice(1);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">나의 페르소나들</h1>
        <p className="text-muted-foreground">
          {multiPersonaInfo?.hasMultiple
            ? `${personas.length}개의 페르소나가 발견되었습니다`
            : "메인 페르소나를 확인하세요"}
        </p>
      </div>

      {/* Main Persona */}
      <Card className="mb-6 border-primary shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: mainPersona.color_hex }}
              >
                <span className="text-white text-xl">
                  {ARCHETYPE_CONFIGS[mainPersona.persona_archetype || "Explorer"]?.icon || "👤"}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">{mainPersona.persona_name}</CardTitle>
                  <Badge variant="default">메인</Badge>
                </div>
                <CardDescription className="text-sm">
                  {ARCHETYPE_CONFIGS[mainPersona.persona_archetype || "Explorer"]?.name} •{" "}
                  {Math.round(mainPersona.strength_score || 0)}% 강도
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">테마</p>
            <p className="text-sm text-muted-foreground">{mainPersona.theme_description}</p>
          </div>

          {mainPersona.persona_keywords && mainPersona.persona_keywords.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">키워드</p>
              <div className="flex flex-wrap gap-2">
                {mainPersona.persona_keywords.slice(0, 5).map((kw) => (
                  <Badge key={kw.keyword} variant="secondary">
                    {kw.keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => navigate(`/personas/${mainPersona.id}`)}>
              Prime Perspective 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/ikigai?persona=${mainPersona.id}`)}
            >
              Ikigai 설계
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sub Personas */}
      {subPersonas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">추가 페르소나</h2>
            {!multiPersonaInfo?.canAccessAll && (
              <Badge variant="outline" className="gap-1">
                <Lock className="w-3 h-3" />
                Pro 전용
              </Badge>
            )}
          </div>

          {subPersonas.map((persona) => {
            const isLocked = !multiPersonaInfo?.canAccessAll;

            return (
              <Card
                key={persona.id}
                className={`transition-all ${
                  isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md"
                }`}
                onClick={() => handlePersonaClick(persona.id, persona.rank_order || 2)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: persona.color_hex }}
                      >
                        <span className="text-white">
                          {ARCHETYPE_CONFIGS[persona.persona_archetype || "Explorer"]?.icon || "👤"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{persona.persona_name}</CardTitle>
                          {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <CardDescription className="text-sm">
                          {ARCHETYPE_CONFIGS[persona.persona_archetype || "Explorer"]?.name} •{" "}
                          {Math.round(persona.strength_score || 0)}% 강도
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLocked ? (
                    <div className="text-sm text-muted-foreground">
                      Pro로 업그레이드하여 이 페르소나의 상세 분석을 확인하세요
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{persona.theme_description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Relationship Analysis CTA */}
      {multiPersonaInfo?.hasMultiple && multiPersonaInfo.canAccessAll && (
        <Card className="mt-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">페르소나 관계 분석</CardTitle>
            </div>
            <CardDescription>
              여러 페르소나 간의 시너지와 충돌을 분석하고 통합 브랜딩 전략을 설계하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/personas/relationships")}>
              관계 분석 시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paywall Modal */}
      <PersonaPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        personaCount={personas.length}
        triggerContext="discovery"
      />
    </div>
  );
}
