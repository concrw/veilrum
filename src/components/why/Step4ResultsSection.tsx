import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";

interface Job {
  id: string;
  job_name: string;
  definition: string | null;
  first_memory: string | null;
  category: "happy" | "pain" | "neutral" | null;
  reason?: string | null;
}

interface Step4ResultsSectionProps {
  jobs: Job[];
  onPrevStep: () => void;
  onGoBackToEditMode: () => void;
}

export const Step4ResultsSection = ({
  jobs,
  onPrevStep,
  onGoBackToEditMode
}: Step4ResultsSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analysisCompleted, setAnalysisCompleted] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 분석 완료 상태 확인
  useEffect(() => {
    const checkAnalysisStatus = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_completed_analysis')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking analysis status:', error);
          setAnalysisCompleted(false);
        } else {
          setAnalysisCompleted(data.has_completed_analysis || false);
        }
      } catch (error) {
        console.error('Exception checking analysis status:', error);
        setAnalysisCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAnalysisStatus();
  }, [user?.id]);

  // 분석 완료 처리 함수
  const handleCompleteAnalysis = async () => {
    if (!user?.id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_analysis: true })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setAnalysisCompleted(true);
      toast({
        title: "분석 완료",
        description: "이제 모든 기능을 사용할 수 있습니다.",
      });
    } catch (error: any) {
      console.error('Error updating analysis status:', error);
      toast({
        title: "업데이트 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (jobs.length === 0) {
    return (
      <section className="space-y-4" data-step-visible="4">
        <div className="py-12 text-center text-sm text-muted-foreground">
          먼저 이전 단계를 완료해주세요.
        </div>
      </section>
    );
  }

  const happyCount = jobs.filter(j => j.category === "happy").length;
  const painCount = jobs.filter(j => j.category === "pain").length;
  const neutralCount = jobs.filter(j => j.category === "neutral").length;

  return (
    <section className="space-y-4" data-step-visible="4">
      <Card className="bg-card/60">
        <CardHeader>
          <CardTitle className="text-sm">분석 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 간단한 요약 */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">HAPPINESS</div>
              <div className="text-lg font-light">{happyCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">SUFFERING</div>
              <div className="text-lg font-light">{painCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">NEUTRAL</div>
              <div className="text-lg font-light">{neutralCount}</div>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate('/why-analysis')}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4"
            >
              자세한 결과 페이지에서 키워드·테마·AI 분석을 확인하세요
            </Button>
          </div>

          {/* 🔥 UPDATED: 미니멀 분석 완료 상태 */}
          {!isLoading && (
            <div className="border-t pt-4 space-y-3">
              {analysisCompleted === false ? (
                <>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-3">
                      분석을 완료하면 Ikigai 설계와 커뮤니티 매칭을 사용할 수 있습니다
                    </p>
                    <Button 
                      onClick={handleCompleteAnalysis}
                      disabled={isUpdating}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          처리중
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          분석 완료 처리
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : analysisCompleted === true ? (
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    분석이 완료되었습니다
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/ikigai')}
                      className="text-xs h-auto p-1"
                    >
                      Ikigai 설계
                    </Button>
                    <span className="text-xs text-muted-foreground self-center">·</span>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/community')}
                      className="text-xs h-auto p-1"
                    >
                      커뮤니티 매칭
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={onPrevStep}>
          이전 단계
        </Button>
        <Button size="sm" onClick={onGoBackToEditMode}>
          수정하기
        </Button>
      </div>
    </section>
  );
};