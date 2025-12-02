import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDetectPersonas, usePersonas } from "@/hooks/usePersonas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Users, ArrowRight } from "lucide-react";
import { PersonaPaywall } from "./PersonaPaywall";

interface PersonaDetectionTriggerProps {
  sessionCompleted: boolean;
  userId: string;
}

export function PersonaDetectionTrigger({
  sessionCompleted,
  userId,
}: PersonaDetectionTriggerProps) {
  const navigate = useNavigate();
  const { data: existingPersonas } = usePersonas();
  const { mutate: detectPersonas, isPending, isSuccess, data } = useDetectPersonas();
  const [showResults, setShowResults] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (sessionCompleted && !existingPersonas && !isPending && !isSuccess) {
      detectPersonas();
    }
  }, [sessionCompleted, existingPersonas, detectPersonas, isPending, isSuccess]);

  useEffect(() => {
    if (isSuccess && data) {
      setShowResults(true);
    }
  }, [isSuccess, data]);

  if (isPending) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">페르소나 분석 중...</h3>
              <p className="text-sm text-muted-foreground">
                AI가 당신의 행복 패턴을 분석하고 있습니다
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!showResults || !data) {
    return null;
  }

  const personaCount = data.count || 0;
  const hasMultiplePersonas = personaCount > 1;

  return (
    <>
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <DialogTitle className="text-xl">
                {personaCount}개의 페르소나가 발견되었습니다!
              </DialogTitle>
            </div>
            <DialogDescription>
              AI가 당신의 행복 직업군을 분석한 결과입니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Persona cards preview */}
            <div className="space-y-3">
              {data.personas?.slice(0, 3).map((persona, index) => (
                <Card
                  key={persona.id}
                  className={index === 0 ? "border-primary" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: persona.color_hex }}
                      >
                        <span className="text-white text-sm">
                          {persona.persona_archetype?.charAt(0) || "P"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {persona.persona_name}
                          </h4>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              메인
                            </Badge>
                          )}
                          {index > 0 && (
                            <Badge variant="outline" className="text-xs">
                              서브
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {persona.theme_description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info message */}
            {hasMultiplePersonas && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">멀티 페르소나 발견</p>
                    <p className="text-muted-foreground">
                      무료 버전에서는 <strong>메인 페르소나 1개</strong>만 상세
                      분석할 수 있습니다. 모든 페르소나를 확인하려면 Pro로
                      업그레이드하세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setShowResults(false);
                  navigate("/personas");
                }}
              >
                메인 페르소나 확인하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {hasMultiplePersonas && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setShowResults(false);
                    setPaywallOpen(true);
                  }}
                >
                  모든 페르소나 보기 (Pro)
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
              >
                나중에 하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paywall for multi-persona users */}
      {hasMultiplePersonas && (
        <PersonaPaywall
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          personaCount={personaCount}
          triggerContext="discovery"
        />
      )}
    </>
  );
}
