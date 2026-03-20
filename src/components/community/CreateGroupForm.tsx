import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb } from "lucide-react";

interface CreateGroupFormProps {
  onSubmit: (groupData: {
    name: string;
    theme: string;
    description: string;
  }) => void;
  isLoading: boolean;
}

// 추천 테마 목록
const suggestedThemes = [
  "퍼스널 브랜딩",
  "콘텐츠 마케팅", 
  "커리어 개발",
  "창업·사업",
  "디자인·크리에이티브",
  "개발·기술",
  "글쓰기·출판",
  "투자·재테크",
  "라이프스타일",
  "자기계발",
  "네트워킹",
  "스터디·독서"
];

export const CreateGroupForm = ({ onSubmit, isLoading }: CreateGroupFormProps) => {
  const [groupName, setGroupName] = useState("");
  const [groupTheme, setGroupTheme] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleThemeSelect = (theme: string) => {
    setGroupTheme(theme);
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!groupName.trim()) {
      newErrors.push("그룹 이름을 입력해주세요");
    } else if (groupName.trim().length < 2) {
      newErrors.push("그룹 이름은 2글자 이상이어야 합니다");
    }
    
    if (groupDescription.trim().length > 0 && groupDescription.trim().length < 10) {
      newErrors.push("그룹 소개는 10글자 이상 작성해주세요");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        name: groupName.trim(),
        theme: groupTheme.trim(),
        description: groupDescription.trim()
      });
      
      // 폼 초기화
      setGroupName("");
      setGroupTheme("");
      setGroupDescription("");
      setErrors([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 그룹 만들기
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          관심사가 비슷한 사람들과 함께할 그룹을 만들어보세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 그룹 이름 */}
        <div className="space-y-2">
          <Label htmlFor="group-name" className="text-xs font-medium">
            그룹 이름 *
          </Label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="예) 퍼스널 브랜딩 스터디"
            className="text-xs"
            disabled={isLoading}
          />
        </div>

        {/* 테마 선택 */}
        <div className="space-y-2">
          <Label htmlFor="group-theme" className="text-xs font-medium">
            테마
          </Label>
          <Input
            id="group-theme"
            value={groupTheme}
            onChange={(e) => setGroupTheme(e.target.value)}
            placeholder="직접 입력하거나 아래에서 선택"
            className="text-xs"
            disabled={isLoading}
          />
          
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">추천 테마:</div>
            <div className="flex flex-wrap gap-1">
              {suggestedThemes.map((theme) => (
                <Button
                  key={theme}
                  variant={groupTheme === theme ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeSelect(theme)}
                  className="text-xs h-6"
                  disabled={isLoading}
                >
                  {theme}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 그룹 소개 */}
        <div className="space-y-2">
          <Label htmlFor="group-description" className="text-xs font-medium">
            그룹 소개
          </Label>
          <Textarea
            id="group-description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="그룹의 목적, 활동 방식, 참여 대상 등을 자유롭게 소개해주세요"
            className="text-xs min-h-20"
            rows={4}
            disabled={isLoading}
          />
          <div className="text-xs text-muted-foreground text-right">
            {groupDescription.length}/500
          </div>
        </div>

        {/* 에러 메시지 */}
        {errors.length > 0 && (
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="text-xs text-red-600 flex items-center gap-1">
                <span>•</span>
                {error}
              </div>
            ))}
          </div>
        )}

        {/* 생성 버튼 */}
        <Button 
          className="w-full text-xs" 
          onClick={handleSubmit}
          disabled={isLoading || !groupName.trim()}
        >
          {isLoading ? "그룹 생성 중..." : "그룹 만들기"}
        </Button>

        {/* 팁 */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
            <div>
              <h5 className="text-xs font-medium mb-1">성공적인 그룹 만들기 팁</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>명확한 목적</strong>: 그룹의 목표와 활동을 구체적으로 명시</li>
                <li>• <strong>적극적 운영</strong>: 초기에는 창설자가 활발하게 소통</li>
                <li>• <strong>규칙 설정</strong>: 건전한 커뮤니티를 위한 기본 가이드라인</li>
                <li>• <strong>정기 활동</strong>: 일정한 주기의 이벤트나 모임 계획</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};