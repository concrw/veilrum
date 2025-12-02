import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, AlertCircle } from "lucide-react";
import { useMasterData, type SocialNeed } from "@/hooks/useMasterData";

interface Step3SocialNeedsProps {
  selectedSocialNeeds: string[];
  customSocialNeed: string;
  onCustomSocialNeedChange: (value: string) => void;
  onToggleSocialNeed: (need: string, checked: boolean) => void;
  onAddCustomSocialNeed: () => void;
  onRemoveSocialNeed: (need: string) => void;
}

export const Step3SocialNeeds = ({
  selectedSocialNeeds,
  customSocialNeed,
  onCustomSocialNeedChange,
  onToggleSocialNeed,
  onAddCustomSocialNeed,
  onRemoveSocialNeed
}: Step3SocialNeedsProps) => {
  const { socialNeeds, loading, error } = useMasterData();

  // 카테고리별로 그룹화
  const groupedSocialNeeds = socialNeeds.reduce((acc, need) => {
    const category = need.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(need);
    return acc;
  }, {} as Record<string, SocialNeed[]>);

  // 추천 사회적 가치 목록 (DB에서 로드된 것들)
  const suggestedSocialNeeds = socialNeeds.map(need => need.need_text);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-muted-foreground">사회적 가치 목록을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">🌍</span>
          세상이 필요한 것 (WORLD NEEDS)
        </CardTitle>
        <p className="text-xs text-muted-foreground">관심 있는 사회적 가치와 문제를 선택하세요</p>
        
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>데이터 로드 중 문제가 발생했습니다. 기본 옵션을 제공합니다.</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Social Needs by Category */}
        <div>
          <h4 className="text-xs font-medium mb-3">추천 사회적 가치</h4>
          
          {Object.keys(groupedSocialNeeds).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedSocialNeeds).map(([category, needs]) => (
                <div key={category}>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2 capitalize">
                    {category === 'general' ? '일반' : category}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-2">
                    {needs.map((need) => (
                      <label key={need.id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox 
                          checked={selectedSocialNeeds.includes(need.need_text)}
                          onCheckedChange={(checked) => onToggleSocialNeed(need.need_text, !!checked)}
                        />
                        <span className="text-xs">{need.need_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">사용 가능한 사회적 가치가 없습니다.</p>
            </div>
          )}
        </div>

        {/* Custom Social Need */}
        <div className="border rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-medium">직접 입력</h4>
          <div className="flex gap-2">
            <Input 
              placeholder="관심 있는 사회적 가치나 문제를 입력하세요" 
              value={customSocialNeed}
              onChange={(e) => onCustomSocialNeedChange(e.target.value)}
              className="text-xs"
            />
            <Button onClick={onAddCustomSocialNeed} size="sm" className="h-8">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Selected Items */}
        {selectedSocialNeeds.length > 0 && (
          <div>
            <h4 className="text-xs font-medium mb-2">선택된 항목</h4>
            <div className="flex flex-wrap gap-1">
              {selectedSocialNeeds.map((item, index) => {
                const isCustom = !suggestedSocialNeeds.includes(item);
                return (
                  <Badge 
                    key={index} 
                    variant={isCustom ? "outline" : "default"}
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onRemoveSocialNeed(item)}
                  >
                    {item} 
                    {isCustom && <span className="ml-1 text-xs opacity-70">(직접입력)</span>}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            선택된 항목: {selectedSocialNeeds.length}개 | 
            전체 옵션: {socialNeeds.length}개 |
            직접 입력: {selectedSocialNeeds.filter(item => !suggestedSocialNeeds.includes(item)).length}개
          </p>
        </div>
      </CardContent>
    </Card>
  );
};