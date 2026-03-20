import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, RefreshCw } from "lucide-react";

interface WhyAnalysisResult {
  love_elements: string[];
  has_analysis: boolean;
  last_session_completed: string | null;
}

interface Step1LoveElementsProps {
  whyAnalysisResults: WhyAnalysisResult;
  loadingWhyData: boolean;
  onSync: () => void;
}

export const Step1LoveElements = ({
  whyAnalysisResults,
  loadingWhyData,
  onSync
}: Step1LoveElementsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">💝</span>
          좋아하는 것 (LOVE)
        </CardTitle>
        <p className="text-xs text-muted-foreground">Why 분석에서 도출된 당신의 행복 패턴입니다</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium">Why 분석 결과</h4>
            <div className="flex items-center gap-2">
              {loadingWhyData && <RefreshCw className="w-3 h-3 animate-spin" />}
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSync}
                disabled={loadingWhyData}
                className="h-6 px-2 text-xs"
              >
                동기화
              </Button>
            </div>
          </div>
          
          {!whyAnalysisResults.has_analysis ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-muted-foreground">아직 WHY 분석을 완료하지 않았습니다.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/why'}
                className="h-6 px-2 text-xs"
              >
                WHY 분석 하러 가기
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {whyAnalysisResults.love_elements.map((item, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer"
                >
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {whyAnalysisResults.has_analysis && (
          <div className="text-xs text-muted-foreground">
            <Lightbulb className="w-3 h-3 inline mr-1" />
            이 항목들은 당신이 행복하다고 분류한 직업들의 공통 패턴에서 추출되었습니다.
            {whyAnalysisResults.last_session_completed && (
              <span className="block mt-1">
                마지막 분석: {new Date(whyAnalysisResults.last_session_completed).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};