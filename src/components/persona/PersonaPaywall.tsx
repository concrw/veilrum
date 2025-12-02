import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Crown } from "lucide-react";

interface PersonaPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaCount: number;
  triggerContext: "discovery" | "ikigai" | "branding";
}

export function PersonaPaywall({
  open,
  onOpenChange,
  personaCount,
  triggerContext,
}: PersonaPaywallProps) {
  const getTriggerMessage = () => {
    switch (triggerContext) {
      case "discovery":
        return {
          title: `${personaCount}개의 페르소나가 발견되었습니다`,
          description:
            "하지만 무료 버전에서는 가장 강한 1개 페르소나만 확인할 수 있습니다.",
        };
      case "ikigai":
        return {
          title: "여러 페르소나의 Ikigai를 설계하고 싶으신가요?",
          description:
            "좋아하는 것이 너무 달라서 하나로 정리가 안 될 때, 각 페르소나별 Ikigai를 만들어보세요.",
        };
      case "branding":
        return {
          title: "여러 분야를 통합한 브랜딩 전략이 필요하신가요?",
          description:
            "여러 분야를 다루고 싶지만 브랜드가 산만해 보이지 않도록 전략을 제시해드립니다.",
        };
      default:
        return {
          title: "Pro로 업그레이드",
          description: "모든 페르소나를 활용하세요.",
        };
    }
  };

  const message = getTriggerMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl">{message.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Free vs Pro comparison */}
          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">무료 버전</p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 메인 페르소나 1개만 분석</li>
                <li>• 기본 Prime Perspective</li>
                <li>• 단일 페르소나 Ikigai</li>
              </ul>
            </div>

            <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Pro 버전</p>
                <Badge variant="default" className="ml-auto text-xs">
                  추천
                </Badge>
              </div>
              <ul className="text-sm space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>모든 페르소나</strong> (최대 {personaCount}개) 상세 분석
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>페르소나별 Prime Perspective 생성</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>페르소나 간 시너지/충돌 분석</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>통합 브랜딩 전략 (3가지 옵션)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>페르소나별 성장 추적</span>
                </li>
              </ul>

              <div className="border-t pt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">9,900원</span>
                  <span className="text-sm text-muted-foreground">/월</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  연간 결제 시 99,000원 (2개월 무료)
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button size="lg" className="w-full">
              7일 무료 체험 시작하기
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              나중에 하기
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              언제든지 취소 가능 • 카드 정보 불필요
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
