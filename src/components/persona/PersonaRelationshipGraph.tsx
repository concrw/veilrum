import { useState, useEffect } from "react";
import {
  usePersonas,
  usePersonaRelationships,
  useAnalyzePersonaRelationships,
} from "@/hooks/usePersonas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, InfoIcon, Zap, AlertTriangle, Heart, Sparkles } from "lucide-react";
import { ARCHETYPE_CONFIGS } from "@/integrations/supabase/persona-types";

type RelationshipType = "synergy" | "conflict" | "neutral";

interface DBRelationship {
  id: string;
  persona1_id: string;
  persona2_id: string;
  relationship_type: RelationshipType;
  strength_score: number;
  description: string;
  common_keywords: string[];
  ai_insights?: string;
}

export function PersonaRelationshipGraph() {
  const { data: personas, isLoading: personasLoading } = usePersonas();
  const { data: relationships, isLoading: relationshipsLoading } = usePersonaRelationships();
  const { mutate: analyzeRelationships, isPending: isAnalyzing } = useAnalyzePersonaRelationships();

  const isLoading = personasLoading || relationshipsLoading;

  // Auto-analyze if no relationships exist
  useEffect(() => {
    if (!isLoading && personas && personas.length >= 2 && (!relationships || relationships.length === 0)) {
      analyzeRelationships();
    }
  }, [personas, relationships, isLoading]);

  if (isLoading || isAnalyzing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            {isAnalyzing ? "AI가 페르소나 관계를 분석 중..." : "로딩 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (!personas || personas.length < 2) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          페르소나 관계 분석은 2개 이상의 페르소나가 있을 때 사용할 수 있습니다.
        </AlertDescription>
      </Alert>
    );
  }

  if (!relationships || relationships.length === 0) {
    return (
      <div className="text-center space-y-4 py-12">
        <InfoIcon className="w-12 h-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold mb-2">관계 분석이 필요합니다</h3>
          <p className="text-sm text-muted-foreground mb-4">
            AI가 페르소나 간의 시너지와 충돌을 분석합니다
          </p>
          <Button onClick={() => analyzeRelationships()} disabled={isAnalyzing}>
            <Sparkles className="w-4 h-4 mr-2" />
            관계 분석 시작하기
          </Button>
        </div>
      </div>
    );
  }

  // Get persona details for each relationship
  const enrichedRelationships = (relationships as DBRelationship[]).map((rel) => {
    const persona1 = personas.find((p) => p.id === rel.persona1_id);
    const persona2 = personas.find((p) => p.id === rel.persona2_id);
    return { ...rel, persona1, persona2 };
  }).filter((rel) => rel.persona1 && rel.persona2);

  const synergyRelations = enrichedRelationships.filter((r) => r.relationship_type === "synergy");
  const conflictRelations = enrichedRelationships.filter((r) => r.relationship_type === "conflict");
  const neutralRelations = enrichedRelationships.filter((r) => r.relationship_type === "neutral");

  const getRelationshipIcon = (type: RelationshipType) => {
    switch (type) {
      case "synergy":
        return <Zap className="w-5 h-5 text-green-500" />;
      case "conflict":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "neutral":
        return <Heart className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRelationshipColor = (type: RelationshipType) => {
    switch (type) {
      case "synergy":
        return "border-green-200 bg-green-50";
      case "conflict":
        return "border-orange-200 bg-orange-50";
      case "neutral":
        return "border-blue-200 bg-blue-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Re-analyze Button */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1 space-y-2">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            페르소나 관계 분석
          </h2>
          <p className="text-muted-foreground">
            {personas.length}개 페르소나 간 {enrichedRelationships.length}개 관계 발견
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => analyzeRelationships()}
          disabled={isAnalyzing}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          재분석
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {synergyRelations.length}
              </span>
            </div>
            <p className="text-xs text-green-700">시너지</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {neutralRelations.length}
              </span>
            </div>
            <p className="text-xs text-blue-700">중립</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {conflictRelations.length}
              </span>
            </div>
            <p className="text-xs text-orange-700">충돌</p>
          </CardContent>
        </Card>
      </div>

      {/* Relationship Cards */}
      <div className="space-y-4">
        {enrichedRelationships
          .sort((a, b) => {
            // Sort by type priority (synergy > neutral > conflict), then by strength
            const typePriority = { synergy: 3, neutral: 2, conflict: 1 };
            const diff = typePriority[b.relationship_type] - typePriority[a.relationship_type];
            return diff !== 0 ? diff : b.strength_score - a.strength_score;
          })
          .map((relationship) => {
            const { persona1, persona2 } = relationship;
            if (!persona1 || !persona2) return null;

            return (
              <Card key={relationship.id} className={`border-2 ${getRelationshipColor(relationship.relationship_type)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getRelationshipIcon(relationship.relationship_type)}
                      <CardTitle className="text-lg">
                        {relationship.relationship_type === "synergy" && "시너지"}
                        {relationship.relationship_type === "conflict" && "충돌"}
                        {relationship.relationship_type === "neutral" && "중립적 관계"}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        강도 {Math.round(relationship.strength_score)}%
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: persona1.color_hex }}
                      >
                        <span className="text-white">
                          {ARCHETYPE_CONFIGS[persona1.persona_archetype || "Explorer"]?.icon || "👤"}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{persona1.persona_name}</span>
                    </div>
                    <span className="text-muted-foreground">↔</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: persona2.color_hex }}
                      >
                        <span className="text-white">
                          {ARCHETYPE_CONFIGS[persona2.persona_archetype || "Explorer"]?.icon || "👤"}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{persona2.persona_name}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{relationship.description}</p>

                  {relationship.common_keywords && relationship.common_keywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">공통 키워드</p>
                      <div className="flex flex-wrap gap-1">
                        {relationship.common_keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Insights */}
                  {relationship.ai_insights && (
                    <div className="pt-2 border-t">
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                        <p className="text-xs font-medium">AI 인사이트</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{relationship.ai_insights}</p>
                    </div>
                  )}

                  {/* Actionable insights */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-1">💡 실행 제안</p>
                    <p className="text-xs text-muted-foreground">
                      {relationship.relationship_type === "synergy" &&
                        "이 두 페르소나를 결합한 콘텐츠나 서비스를 기획해보세요. 시너지를 극대화할 수 있습니다."}
                      {relationship.relationship_type === "neutral" &&
                        "각 페르소나를 독립적으로 브랜딩하되, 필요시 연결고리를 만들어 보완 관계로 발전시키세요."}
                      {relationship.relationship_type === "conflict" &&
                        "명확한 타겟 세그먼테이션이 필요합니다. 각 페르소나에 맞는 별도 채널이나 콘텐츠 라인을 고려하세요."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
