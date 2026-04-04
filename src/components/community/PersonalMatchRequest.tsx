import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, AlertCircle } from "lucide-react";

interface PersonalMatchRequestProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
}

export const PersonalMatchRequest = ({ onSubmit, isLoading }: PersonalMatchRequestProps) => {
  const [targetEmail, setTargetEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];

    if (!targetEmail.trim()) {
      newErrors.push("이메일을 입력해주세요");
    } else if (!validateEmail(targetEmail.trim())) {
      newErrors.push("올바른 이메일 형식을 입력해주세요");
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      onSubmit(targetEmail.trim());
      setTargetEmail("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="w-4 h-4" />
          개인 매칭 분석
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          특정인과의 매칭률과 상호보완률을 확인해보세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="target-email" className="text-xs font-medium">
            분석하고 싶은 상대방 이메일
          </Label>
          <div className="flex gap-2">
            <Input
              id="target-email"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="상대방의 이메일을 입력하세요"
              className="text-xs"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !targetEmail.trim()}
              size="sm"
              className="text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  요청중
                </>
              ) : (
                <>
                  <Search className="w-3 h-3 mr-1" />
                  요청
                </>
              )}
            </Button>
          </div>
          
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <h5 className="text-xs font-medium">📋 분석 조건</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 상대방이 V-File 회원이어야 합니다</li>
            <li>• 상대방이 Why 분석을 완료했어야 합니다</li>
            <li>• 상대방이 분석 요청을 수락해야 합니다</li>
            <li>• 양쪽 모두 데이터가 충분해야 신뢰할 수 있습니다</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h5 className="text-xs font-medium mb-1 text-blue-800">💡 분석 결과로 알 수 있는 것</h5>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>매칭률</strong>: 가치관, 관심사, 성향의 유사도</li>
            <li>• <strong>상호보완률</strong>: 서로의 부족한 부분을 채워줄 수 있는 정도</li>
            <li>• <strong>Prime Perspective 일치도</strong>: 근본적 관점의 조화</li>
            <li>• <strong>성장 시너지</strong>: 함께 발전할 수 있는 영역</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};