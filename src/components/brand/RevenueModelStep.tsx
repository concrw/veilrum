import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Lightbulb, DollarSign } from "lucide-react";
import { useState } from "react";

interface RevenueModel {
  primary_model: string;
  price_points: string[];
  monetization_channels: string[];
}

interface RevenueModelStepProps {
  revenueModel: RevenueModel;
  onUpdate: (model: RevenueModel) => void;
}

// 추천 수익 모델
const suggestedModels = [
  "구독 서비스", "일회성 상품 판매", "컨설팅/코칭", "온라인 강의", 
  "디지털 콘텐츠", "제휴 마케팅", "광고 수익", "커뮤니티 멤버십"
];

// 추천 가격대
const suggestedPricePoints = [
  "무료 + 프리미엄", "월 9,900원", "월 29,000원", "월 99,000원",
  "일회성 50,000원", "일회성 100,000원", "일회성 300,000원", 
  "시간당 50,000원", "시간당 100,000원", "프로젝트당 500,000원"
];

// 추천 수익화 채널
const suggestedChannels = [
  "개인 홈페이지", "클래스101", "탈잉", "인프런", "유데미", 
  "브런치 구독", "유튜브 멤버십", "패트리온", "네이버 스마트스토어", 
  "크몽", "숨고", "직접 판매"
];

export const RevenueModelStep = ({
  revenueModel,
  onUpdate
}: RevenueModelStepProps) => {
  const [newPricePoint, setNewPricePoint] = useState("");
  const [newChannel, setNewChannel] = useState("");

  const updateField = (field: keyof RevenueModel, value: string | string[]) => {
    onUpdate({
      ...revenueModel,
      [field]: value
    });
  };

  const addItem = (field: 'price_points' | 'monetization_channels', item: string) => {
    if (item.trim() && !revenueModel[field].includes(item.trim())) {
      updateField(field, [...revenueModel[field], item.trim()]);
    }
  };

  const removeItem = (field: 'price_points' | 'monetization_channels', index: number) => {
    const newArray = [...revenueModel[field]];
    newArray.splice(index, 1);
    updateField(field, newArray);
  };

  const addSuggested = (field: 'price_points' | 'monetization_channels', item: string) => {
    if (!revenueModel[field].includes(item)) {
      updateField(field, [...revenueModel[field], item]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4" />
          수익 모델
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          브랜드의 수익화 전략을 구체적으로 설정하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Revenue Model */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">주요 수익 모델</Label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestedModels.map((model) => (
              <button
                key={model}
                onClick={() => updateField('primary_model', model)}
                className={`text-xs p-2 border rounded-lg transition-all hover:border-primary/50 ${
                  revenueModel.primary_model === model 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                    : 'border-border bg-background/50'
                }`}
              >
                {model}
              </button>
            ))}
          </div>

          <Input
            value={revenueModel.primary_model}
            onChange={(e) => updateField('primary_model', e.target.value)}
            placeholder="직접 입력하거나 위에서 선택"
            className="text-xs"
          />
        </div>

        {/* Price Points */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">가격 정책</Label>
          
          {/* Current Price Points */}
          <div className="flex flex-wrap gap-1">
            {revenueModel.price_points.map((price, index) => (
              <Badge key={index} variant="default" className="text-xs bg-green-500/20">
                {price}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('price_points', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Price Point */}
          <div className="flex gap-2">
            <Input
              value={newPricePoint}
              onChange={(e) => setNewPricePoint(e.target.value)}
              placeholder="새 가격 정책 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('price_points', newPricePoint);
                  setNewPricePoint("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('price_points', newPricePoint);
                setNewPricePoint("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Price Points */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 가격대:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedPricePoints
                .filter(price => !revenueModel.price_points.includes(price))
                .map((price) => (
                <Button
                  key={price}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('price_points', price)}
                >
                  {price}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Monetization Channels */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">수익화 채널</Label>
          
          {/* Current Channels */}
          <div className="flex flex-wrap gap-1">
            {revenueModel.monetization_channels.map((channel, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-blue-500/20">
                {channel}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('monetization_channels', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Channel */}
          <div className="flex gap-2">
            <Input
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              placeholder="새 수익화 채널 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('monetization_channels', newChannel);
                  setNewChannel("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('monetization_channels', newChannel);
                setNewChannel("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Channels */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 채널:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedChannels
                .filter(channel => !revenueModel.monetization_channels.includes(channel))
                .map((channel) => (
                <Button
                  key={channel}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('monetization_channels', channel)}
                >
                  {channel}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Strategy Tips */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
            <div>
              <h5 className="text-xs font-medium mb-1">수익 모델 설계 팁</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>시작</strong>: 하나의 수익 모델로 시작해서 점진적 확장</li>
                <li>• <strong>가격</strong>: 타겟 고객의 지불 의사와 경쟁사 분석</li>
                <li>• <strong>채널</strong>: 고객이 자주 이용하는 플랫폼 우선</li>
                <li>• <strong>검증</strong>: MVP로 작게 시작해서 시장 반응 확인</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Business Model Canvas Preview */}
        <div className="border-t pt-4">
          <h5 className="text-xs font-medium mb-2">수익 모델 요약</h5>
          <div className="bg-background border rounded-lg p-3 space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">주요 모델:</span>{" "}
              <span className="font-medium">
                {revenueModel.primary_model || "수익 모델을 선택하세요"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">가격 정책({revenueModel.price_points.length}개):</span>{" "}
              {revenueModel.price_points.slice(0, 3).join(", ")}
              {revenueModel.price_points.length > 3 && ` 외 ${revenueModel.price_points.length - 3}개`}
            </div>
            <div>
              <span className="text-muted-foreground">수익화 채널({revenueModel.monetization_channels.length}개):</span>{" "}
              {revenueModel.monetization_channels.slice(0, 3).join(", ")}
              {revenueModel.monetization_channels.length > 3 && ` 외 ${revenueModel.monetization_channels.length - 3}개`}
            </div>
          </div>
        </div>

        {/* Revenue Projection Hint */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <h5 className="text-xs font-medium mb-1 text-primary">💡 수익 예상</h5>
          <p className="text-xs text-muted-foreground">
            {revenueModel.primary_model && revenueModel.price_points.length > 0 ? (
              `${revenueModel.primary_model} 모델로 ${revenueModel.price_points[0]} 가격정책이라면, 월 10명 고객 확보 시 예상 수익을 계산해보세요.`
            ) : (
              "수익 모델과 가격을 설정하면 예상 수익을 계산할 수 있습니다."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};