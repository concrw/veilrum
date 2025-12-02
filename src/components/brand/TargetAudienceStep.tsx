import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Lightbulb, Users } from "lucide-react";
import { useState } from "react";

interface TargetAudience {
  age_range: string;
  interests: string[];
  pain_points: string[];
  preferred_channels: string[];
}

interface TargetAudienceStepProps {
  targetAudience: TargetAudience;
  onUpdate: (audience: TargetAudience) => void;
}

// 추천 관심사
const suggestedInterests = [
  "자기계발", "커리어", "창업", "투자", "마케팅", "디자인", "기술", "라이프스타일",
  "건강", "여행", "요리", "패션", "뷰티", "육아", "교육", "문화예술"
];

// 추천 페인포인트
const suggestedPainPoints = [
  "시간 부족", "정보 부족", "스킬 부족", "동기 부족", "방향성 혼란", 
  "업무 스트레스", "번아웃", "인간관계", "재정 관리", "일-생활 균형",
  "진로 고민", "학습 어려움", "의사결정 어려움", "변화 적응"
];

// 추천 선호 채널
const suggestedChannels = [
  "유튜브", "인스타그램", "블로그", "팟캐스트", "뉴스레터", "온라인 강의",
  "웨비나", "커뮤니티", "메신저", "소셜미디어", "오프라인 모임"
];

export const TargetAudienceStep = ({
  targetAudience,
  onUpdate
}: TargetAudienceStepProps) => {
  const [newInterest, setNewInterest] = useState("");
  const [newPainPoint, setNewPainPoint] = useState("");
  const [newChannel, setNewChannel] = useState("");

  const updateField = (field: keyof TargetAudience, value: string | string[]) => {
    onUpdate({
      ...targetAudience,
      [field]: value
    });
  };

  const addItem = (field: 'interests' | 'pain_points' | 'preferred_channels', item: string) => {
    if (item.trim() && !targetAudience[field].includes(item.trim())) {
      updateField(field, [...targetAudience[field], item.trim()]);
    }
  };

  const removeItem = (field: 'interests' | 'pain_points' | 'preferred_channels', index: number) => {
    const newArray = [...targetAudience[field]];
    newArray.splice(index, 1);
    updateField(field, newArray);
  };

  const addSuggested = (field: 'interests' | 'pain_points' | 'preferred_channels', item: string) => {
    if (!targetAudience[field].includes(item)) {
      updateField(field, [...targetAudience[field], item]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4" />
          타겟 고객
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          브랜드가 타겟하는 고객층을 구체적으로 정의하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Range */}
        <div className="space-y-2">
          <Label htmlFor="age-range" className="text-xs font-medium">
            연령대
          </Label>
          <Input
            id="age-range"
            value={targetAudience.age_range}
            onChange={(e) => updateField('age_range', e.target.value)}
            placeholder="예: 25-35세, 30대, 20대 후반-30대 초반"
            className="text-xs"
          />
          <p className="text-xs text-muted-foreground">
            주요 타겟 고객의 연령대를 설정하세요
          </p>
        </div>

        {/* Interests */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">관심사</Label>
          
          {/* Current Interests */}
          <div className="flex flex-wrap gap-1">
            {targetAudience.interests.map((interest, index) => (
              <Badge key={index} variant="default" className="text-xs bg-blue-500/20">
                {interest}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('interests', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Interest */}
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="새 관심사 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('interests', newInterest);
                  setNewInterest("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('interests', newInterest);
                setNewInterest("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Interests */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 관심사:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedInterests
                .filter(interest => !targetAudience.interests.includes(interest))
                .map((interest) => (
                <Button
                  key={interest}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('interests', interest)}
                >
                  {interest}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Pain Points */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">페인포인트</Label>
          
          {/* Current Pain Points */}
          <div className="flex flex-wrap gap-1">
            {targetAudience.pain_points.map((pain, index) => (
              <Badge key={index} variant="destructive" className="text-xs bg-red-500/20">
                {pain}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('pain_points', index)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Pain Point */}
          <div className="flex gap-2">
            <Input
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              placeholder="새 페인포인트 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('pain_points', newPainPoint);
                  setNewPainPoint("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('pain_points', newPainPoint);
                setNewPainPoint("");
              }}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Suggested Pain Points */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">추천 페인포인트:</p>
            <div className="flex flex-wrap gap-1">
              {suggestedPainPoints
                .filter(pain => !targetAudience.pain_points.includes(pain))
                .map((pain) => (
                <Button
                  key={pain}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('pain_points', pain)}
                >
                  {pain}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Preferred Channels */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">선호 채널</Label>
          
          {/* Current Channels */}
          <div className="flex flex-wrap gap-1">
            {targetAudience.preferred_channels.map((channel, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-green-500/20">
                {channel}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 w-3 h-3"
                  onClick={() => removeItem('preferred_channels', index)}
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
              placeholder="새 채널 입력"
              className="text-xs"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addItem('preferred_channels', newChannel);
                  setNewChannel("");
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                addItem('preferred_channels', newChannel);
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
                .filter(channel => !targetAudience.preferred_channels.includes(channel))
                .map((channel) => (
                <Button
                  key={channel}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => addSuggested('preferred_channels', channel)}
                >
                  {channel}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
            <div>
              <h5 className="text-xs font-medium mb-1">타겟 고객 설정 팁</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>연령대</strong>: 너무 넓지 않게, 구체적으로 설정하세요</li>
                <li>• <strong>관심사</strong>: 브랜드와 관련성이 높은 관심사 우선</li>
                <li>• <strong>페인포인트</strong>: 브랜드가 해결할 수 있는 문제들</li>
                <li>• <strong>선호 채널</strong>: 타겟이 실제로 활용하는 플랫폼</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border-t pt-4">
          <h5 className="text-xs font-medium mb-2">타겟 고객 프로필</h5>
          <div className="bg-background border rounded-lg p-3 space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">연령대:</span>{" "}
              <span className="font-medium">
                {targetAudience.age_range || "연령대를 설정하세요"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">관심사({targetAudience.interests.length}개):</span>{" "}
              {targetAudience.interests.slice(0, 3).join(", ")}
              {targetAudience.interests.length > 3 && ` 외 ${targetAudience.interests.length - 3}개`}
            </div>
            <div>
              <span className="text-muted-foreground">페인포인트({targetAudience.pain_points.length}개):</span>{" "}
              {targetAudience.pain_points.slice(0, 3).join(", ")}
              {targetAudience.pain_points.length > 3 && ` 외 ${targetAudience.pain_points.length - 3}개`}
            </div>
            <div>
              <span className="text-muted-foreground">선호 채널({targetAudience.preferred_channels.length}개):</span>{" "}
              {targetAudience.preferred_channels.slice(0, 3).join(", ")}
              {targetAudience.preferred_channels.length > 3 && ` 외 ${targetAudience.preferred_channels.length - 3}개`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};