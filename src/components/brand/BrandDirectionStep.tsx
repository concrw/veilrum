import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb } from "lucide-react";

interface BrandDirection {
  field: string;
  positioning: string;
  core_message: string;
}

interface BrandDirectionStepProps {
  brandDirection: BrandDirection;
  onUpdate: (direction: BrandDirection) => void;
}

export const BrandDirectionStep = ({
  brandDirection,
  onUpdate
}: BrandDirectionStepProps) => {
  
  const handleFieldChange = (field: keyof BrandDirection, value: string) => {
    onUpdate({
      ...brandDirection,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">🎯</span>
          브랜드 방향
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          브랜드의 핵심 방향성을 설정하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field */}
        <div className="space-y-2">
          <Label htmlFor="field" className="text-xs font-medium">
            활동 분야
          </Label>
          <Input
            id="field"
            value={brandDirection.field}
            onChange={(e) => handleFieldChange('field', e.target.value)}
            placeholder="예: 디지털 마케팅, 라이프스타일 콘텐츠, 교육 기술"
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            어떤 분야에서 활동할지 명확히 정의하세요
          </p>
        </div>

        {/* Positioning */}
        <div className="space-y-2">
          <Label htmlFor="positioning" className="text-xs font-medium">
            포지셔닝
          </Label>
          <Input
            id="positioning"
            value={brandDirection.positioning}
            onChange={(e) => handleFieldChange('positioning', e.target.value)}
            placeholder="예: 실무진을 위한 마케팅 전문가, 20대를 위한 라이프 멘토"
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            타겟 고객에게 어떤 전문가로 인식되고 싶은지 설정하세요
          </p>
        </div>

        {/* Core Message */}
        <div className="space-y-2">
          <Label htmlFor="core-message" className="text-xs font-medium">
            핵심 메시지
          </Label>
          <Textarea
            id="core-message"
            value={brandDirection.core_message}
            onChange={(e) => handleFieldChange('core_message', e.target.value)}
            placeholder="예: 복잡한 마케팅을 단순하게, 실무에서 바로 쓸 수 있는 인사이트를 제공합니다"
            className="text-xs min-h-20"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            브랜드가 전달하고자 하는 핵심 가치와 메시지를 작성하세요
          </p>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
            <div>
              <h5 className="text-xs font-medium mb-1">브랜드 방향 설정 팁</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>분야</strong>: 너무 넓지 않게, 구체적인 영역으로 좁히세요</li>
                <li>• <strong>포지셔닝</strong>: "누구를 위한 어떤 전문가"인지 명확히 하세요</li>
                <li>• <strong>메시지</strong>: 타겟의 문제를 어떻게 해결하는지 담으세요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-4">
          <h5 className="text-xs font-medium mb-2">브랜드 방향 미리보기</h5>
          <div className="bg-background border rounded-lg p-3">
            <div className="text-xs space-y-2">
              <div>
                <span className="text-muted-foreground">분야:</span>{" "}
                <span className="font-medium">
                  {brandDirection.field || "분야를 입력하세요"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">포지셔닝:</span>{" "}
                <span className="font-medium">
                  {brandDirection.positioning || "포지셔닝을 입력하세요"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">메시지:</span>{" "}
                <span className="italic">
                  {brandDirection.core_message || "핵심 메시지를 입력하세요"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};