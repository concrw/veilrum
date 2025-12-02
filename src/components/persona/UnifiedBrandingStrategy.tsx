import { useState, useEffect } from "react";
import { usePersonas, useBrandingStrategy, useSaveBrandingStrategy } from "@/hooks/usePersonas";
import { PersonaWithDetails } from "@/integrations/supabase/persona-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Layers,
  Split,
  Merge,
  CheckCircle2,
  InfoIcon,
  Loader2
} from "lucide-react";
import { ARCHETYPE_CONFIGS } from "@/integrations/supabase/persona-types";
import { toast } from "@/hooks/use-toast";

type BrandingStrategy = "unified" | "hybrid" | "separated";

interface BrandingApproach {
  strategy: BrandingStrategy;
  title: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  bestFor: string;
}

const BRANDING_APPROACHES: BrandingApproach[] = [
  {
    strategy: "unified",
    title: "통합 브랜딩 (Unified)",
    description: "모든 페르소나를 하나의 통합된 브랜드 정체성으로 표현",
    icon: <Merge className="w-5 h-5" />,
    pros: [
      "일관된 브랜드 메시지",
      "관리가 용이함",
      "리소스 효율적",
      "명확한 포지셔닝"
    ],
    cons: [
      "개별 페르소나의 고유성이 약화될 수 있음",
      "일부 타겟층에 덜 매력적일 수 있음"
    ],
    bestFor: "페르소나 간 시너지가 강하고, 통합된 메시지가 명확할 때"
  },
  {
    strategy: "hybrid",
    title: "하이브리드 브랜딩 (Hybrid)",
    description: "핵심 브랜드는 하나, 페르소나별로 서브 브랜드나 콘텐츠 라인 구분",
    icon: <Layers className="w-5 h-5" />,
    pros: [
      "유연한 커뮤니케이션",
      "각 페르소나의 강점 활용",
      "타겟별 맞춤 메시지 가능",
      "브랜드 확장성 높음"
    ],
    cons: [
      "관리 복잡도 증가",
      "일관성 유지에 노력 필요"
    ],
    bestFor: "페르소나가 보완적이며, 다양한 고객층을 타겟할 때"
  },
  {
    strategy: "separated",
    title: "분리 브랜딩 (Separated)",
    description: "각 페르소나를 완전히 독립된 브랜드로 운영",
    icon: <Split className="w-5 h-5" />,
    pros: [
      "각 페르소나의 고유성 극대화",
      "타겟 고객에 최적화",
      "크리에이티브 자유도 높음"
    ],
    cons: [
      "리소스 분산",
      "브랜드 간 시너지 창출 어려움",
      "운영 부담 증가"
    ],
    bestFor: "페르소나 간 차이가 크고, 각각 독립적인 시장을 타겟할 때"
  }
];

export function UnifiedBrandingStrategy() {
  const { data: personas, isLoading: personasLoading } = usePersonas();
  const { data: existingStrategy, isLoading: strategyLoading } = useBrandingStrategy();
  const { mutate: saveStrategy, isPending: isSaving } = useSaveBrandingStrategy();

  const [selectedStrategy, setSelectedStrategy] = useState<BrandingStrategy | null>(null);
  const [customNotes, setCustomNotes] = useState("");

  const isLoading = personasLoading || strategyLoading;

  // Load existing strategy
  useEffect(() => {
    if (existingStrategy) {
      setSelectedStrategy(existingStrategy.strategy_type as BrandingStrategy);
      setCustomNotes(existingStrategy.custom_notes || "");
    }
  }, [existingStrategy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!personas || personas.length <= 1) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          통합 브랜딩 전략은 2개 이상의 페르소나가 있을 때 사용할 수 있습니다.
        </AlertDescription>
      </Alert>
    );
  }

  const mainPersona = personas.find((p) => p.rank_order === 1) || personas[0];
  const subPersonas = personas.filter((p) => p.id !== mainPersona.id);

  const handleSaveStrategy = () => {
    if (!selectedStrategy) {
      toast({
        title: "전략을 선택해주세요",
        description: "브랜딩 전략을 먼저 선택해야 합니다.",
        variant: "destructive"
      });
      return;
    }

    saveStrategy({
      strategyType: selectedStrategy,
      customNotes: customNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          통합 브랜딩 전략
        </h2>
        <p className="text-muted-foreground">
          {personas.length}개의 페르소나를 어떻게 브랜딩할지 전략을 선택하세요
        </p>
      </div>

      {/* Persona Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">발견된 페르소나</CardTitle>
          <CardDescription>
            각 페르소나의 특성을 고려하여 최적의 브랜딩 전략을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Main Persona */}
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-primary/5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: mainPersona.color_hex }}
            >
              <span className="text-white">
                {ARCHETYPE_CONFIGS[mainPersona.persona_archetype || "Explorer"]?.icon || "👤"}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{mainPersona.persona_name}</span>
                <Badge variant="default" className="text-xs">메인</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {mainPersona.theme_description}
              </p>
            </div>
          </div>

          {/* Sub Personas */}
          {subPersonas.map((persona) => (
            <div key={persona.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: persona.color_hex }}
              >
                <span className="text-white">
                  {ARCHETYPE_CONFIGS[persona.persona_archetype || "Explorer"]?.icon || "👤"}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{persona.persona_name}</span>
                  <Badge variant="outline" className="text-xs">서브</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {persona.theme_description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">브랜딩 전략 선택</CardTitle>
          <CardDescription>
            페르소나 간 관계와 목표를 고려하여 가장 적합한 전략을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedStrategy || ""}
            onValueChange={(value) => setSelectedStrategy(value as BrandingStrategy)}
          >
            <div className="space-y-4">
              {BRANDING_APPROACHES.map((approach) => (
                <div key={approach.strategy} className="relative">
                  <RadioGroupItem
                    value={approach.strategy}
                    id={approach.strategy}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={approach.strategy}
                    className="flex flex-col gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {approach.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{approach.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {approach.description}
                        </div>
                      </div>
                      {selectedStrategy === approach.strategy && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    <Tabs defaultValue="pros" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pros" className="text-xs">장점</TabsTrigger>
                        <TabsTrigger value="cons" className="text-xs">단점</TabsTrigger>
                        <TabsTrigger value="bestFor" className="text-xs">적합한 경우</TabsTrigger>
                      </TabsList>
                      <TabsContent value="pros" className="mt-2">
                        <ul className="text-sm space-y-1">
                          {approach.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span className="text-muted-foreground">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="cons" className="mt-2">
                        <ul className="text-sm space-y-1">
                          {approach.cons.map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">⚠</span>
                              <span className="text-muted-foreground">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="bestFor" className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          {approach.bestFor}
                        </p>
                      </TabsContent>
                    </Tabs>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Custom Notes */}
      {selectedStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">전략 노트</CardTitle>
            <CardDescription>
              선택한 전략에 대한 추가 아이디어나 메모를 작성하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="예: 메인 브랜드는 '창의적 문제 해결자'로 포지셔닝하고, 각 페르소나는 콘텐츠 카테고리로 구분..."
              rows={5}
            />
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSaveStrategy}
          disabled={!selectedStrategy || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              전략 저장하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
