import BottomNavigation from "@/components/BottomNavigation";
import { KeywordDialog } from "@/components/KeywordDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCombinedInsightData } from "@/hooks/useCombinedInsightData";
import { useDynamicInsights } from "@/hooks/useDynamicInsights";
import { useDeepReflectionStories } from "@/hooks/useDeepReflectionStories";
import { useHiddenConnections, useGroupPsychology, useCollectiveWisdom } from "@/hooks/usePremiumInsights";
import { useKeywordEcosystem } from "@/hooks/useKeywordEcosystem";
import { supabase } from "@/integrations/supabase/client";
import { INSIGHT_CONSTANTS } from "@/lib/insightConstants";
import { TimeFlowChart } from "@/components/charts/TimeFlowChart";
import { EmotionChart } from "@/components/charts/EmotionChart";
import { InsightStats } from "@/components/insights/InsightStats";
import { KeywordDiversityCard } from "@/components/insights/KeywordDiversityCard";
import { KeywordEmotionMatrix } from "@/components/insights/KeywordEmotionMatrix";
import { DeepReflectionSection } from "@/components/insights/DeepReflectionSection";
import { PremiumModal } from "@/components/insights/PremiumModal";

const Insight = () => {
  const navigate = useNavigate();
  const {
    subscription,
    loading: subscriptionLoading,
    createCheckout
  } = useSubscription();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const {
    data: combinedData,
    loadingState,
    refetch
  } = useCombinedInsightData();

  // 통합된 데이터에서 개별 데이터 추출
  const {
    stats,
    keywordDiversityData,
    diversityStats,
    emotionData,
    keywordEmotionData,
    timeFlowData,
    submissionPattern
  } = combinedData;

  // 동적 인사이트 생성
  const dynamicInsights = useDynamicInsights(keywordDiversityData, diversityStats, emotionData);

  // 깊이 있는 사색 스토리
  const {
    data: reflectionStories,
    isLoading: isLoadingStories
  } = useDeepReflectionStories();

  // 프리미엄 인사이트 데이터
  const {
    data: hiddenConnections,
    isLoading: isLoadingConnections
  } = useHiddenConnections();
  const {
    data: groupPsychology,
    isLoading: isLoadingPsychology
  } = useGroupPsychology();
  const {
    data: collectiveWisdom,
    isLoading: isLoadingWisdom
  } = useCollectiveWisdom();
  const {
    data: keywordEcosystem,
    isLoading: isLoadingEcosystem
  } = useKeywordEcosystem();
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // 키워드 다양성 데이터 메모이제이션
  const displayedKeywordData = useMemo(() => {
    if (!keywordDiversityData || keywordDiversityData.length === 0) {
      return [];
    }
    const {
      KEYWORDS_MOBILE,
      KEYWORDS_DESKTOP
    } = INSIGHT_CONSTANTS.DISPLAY_LIMITS;
    return showAllKeywords ? keywordDiversityData : keywordDiversityData.slice(0, isMobile ? KEYWORDS_MOBILE : KEYWORDS_DESKTOP);
  }, [keywordDiversityData, showAllKeywords, isMobile]);

  // 지난 일주일 키워드 데이터
  const [weeklyKeywords, setWeeklyKeywords] = useState<Record<string, unknown>[]>([]);

  // 지난 일주일 키워드 가져오기
  useEffect(() => {
    const fetchWeeklyKeywords = async () => {
      try {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 6);
        const {
          data,
          error
        } = await supabase.from('daily_keywords').select('*').gte('date', weekAgo.toISOString().split('T')[0]).lte('date', today.toISOString().split('T')[0]).order('date', {
          ascending: false
        });
        if (error) {
          console.error('Error fetching weekly keywords:', error);
          return;
        }
        setWeeklyKeywords(data || []);
      } catch (error) {
        console.error('Error in fetchWeeklyKeywords:', error);
      }
    };
    fetchWeeklyKeywords();
  }, []);

  return <div className="min-h-screen pb-20 relative bg-transparent">
      <main className="container mx-auto px-6 md:px-12 lg:px-24 py-4 md:py-8 space-y-4 md:space-y-8 mt-[30px]">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              집단지성 인사이트
              <Crown className="w-6 h-6 text-yellow-500" />
            </h1>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto px-2">
            모든 참가자의 생각이 모여 만드는 집단의 지혜를 탐색해보세요.
            <br />
            당신의 생각이 전체 속에서 어떤 위치에 있는지 발견할 수 있습니다.
          </p>

          {/* Error Details */}
          {loadingState.isError && loadingState.errors.length > 0 && <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mx-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium mb-1">일부 기능에서 문제가 발생했습니다:</p>
                <ul className="text-xs space-y-1">
                  {loadingState.errors.map((error, index) => <li key={index}>• {error}</li>)}
                </ul>
                <p className="text-xs mt-2 opacity-75">새로고침 버튼을 눌러 다시 시도해주세요.</p>
              </div>
            </div>}
        </div>

        {/* Stats Overview */}
        <InsightStats stats={stats} isLoading={loadingState.loadingStages.stats} />

        {/* Keyword Diversity Analysis */}
        <KeywordDiversityCard
          isLoading={loadingState.loadingStages.diversity}
          displayedKeywordData={displayedKeywordData}
          diversityStats={diversityStats}
          dynamicInsights={dynamicInsights}
        />

        {/* Keyword-Emotion Matrix */}
        <KeywordEmotionMatrix
          isLoading={loadingState.loadingStages.emotion}
          keywordEmotionData={keywordEmotionData}
        />

        {/* Emotion Distribution Chart */}
        <Card className="opacity-80">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">전체 감정 분포</CardTitle>
            <CardDescription className="text-sm">
              모든 각인 스토리에서 나타나는 감정의 전체적인 분포
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <EmotionChart data={emotionData} isLoading={loadingState.loadingStages.emotion} />
          </CardContent>
        </Card>

        {/* Time Flow Section */}
        <Card className="opacity-80">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">시간대별 집단 사고 흐름</CardTitle>
            <CardDescription className="text-sm">
              하루 중 언제 가장 활발한 사고가 일어나는지 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <TimeFlowChart data={timeFlowData} isLoading={loadingState.loadingStages.timeFlow} />

            {/* Time Flow Insights */}
            {submissionPattern && <div className="mt-6 bg-muted/20 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  시간대별 활동 패턴
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{submissionPattern.peakHour}</div>
                    <div className="text-xs text-muted-foreground">가장 활발한 시간</div>
                    <div className="text-xs">({submissionPattern.peakCount}개)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-muted-foreground">{submissionPattern.quietHour}</div>
                    <div className="text-xs text-muted-foreground">가장 조용한 시간</div>
                    <div className="text-xs">({submissionPattern.quietCount}개)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{submissionPattern.averagePerHour}</div>
                    <div className="text-xs text-muted-foreground">시간당 평균</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{submissionPattern.totalSubmissions}</div>
                    <div className="text-xs text-muted-foreground">총 제출수</div>
                  </div>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* Popular Keywords */}
        <Card className="opacity-80">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">현재 주목 받는 키워드</CardTitle>
            <CardDescription className="text-sm">
              가장 많은 반응을 얻은 정의와 각인 스토리
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {loadingState.loadingStages.diversity ? <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">키워드 데이터 로딩 중...</div>
              </div> : displayedKeywordData.length === 0 ? <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">표시할 키워드가 없습니다.</div>
              </div> : <div className="flex flex-wrap gap-2 md:gap-3">
                {displayedKeywordData?.map(item => <KeywordDialog key={item.keyword} keyword={item.keyword} definitionCount={item.definitions}>
                    <Badge variant="secondary" className="text-xs px-2 py-1 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                      {item.keyword} ({item.definitions})
                    </Badge>
                  </KeywordDialog>)}
              </div>}
          </CardContent>
        </Card>

        {/* Deep Reflection Stories */}
        <DeepReflectionSection
          isLoading={isLoadingStories}
          reflectionStories={reflectionStories}
        />

        {/* Premium Collective Intelligence Features */}
        {!(subscription.subscribed || isAdmin)}

        {(subscription.subscribed || isAdmin) && <div className="space-y-6">



          </div>}
      </main>

      {/* Premium Modal */}
      <PremiumModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        onCheckout={createCheckout}
      />

      {/* AI 프리미엄 집단지성인사이트 버튼 */}
      <div className="container mx-auto px-6 md:px-12 lg:px-24 mb-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm font-medium text-primary">AI 프리미엄 집단 지성 인사이트</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mb-3">
              AI가 분석한 집단지성의 숨겨진 패턴과 심층 인사이트를 만나보세요.
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => {
            if (!subscription.subscribed && !isAdmin) {
              setPremiumModalOpen(true);
            } else {
              navigate('/ai-collective-insight');
            }
          }}>
              AI 프리미엄 집단지성 인사이트 보기
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>;
};
export default Insight;
