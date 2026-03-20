import BottomNavigation from "@/components/BottomNavigation";
import { KeywordDialog } from "@/components/KeywordDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, Users, Brain, Target, ExternalLink, Heart, Crown, Star, Zap, CheckCircle, CreditCard, RefreshCw, AlertCircle } from "lucide-react";
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
import { INSIGHT_CONSTANTS, PREMIUM_MODAL_CONFIG } from "@/lib/insightConstants";
import { TimeFlowChart } from "@/components/charts/TimeFlowChart";
import { EmotionChart } from "@/components/charts/EmotionChart";
import { InsightStats } from "@/components/insights/InsightStats";
import { KeywordDiversityHeatmap } from "@/components/insights/KeywordDiversityHeatmap";
const Insight = () => {
  const navigate = useNavigate();
  const {
    subscription,
    loading: subscriptionLoading,
    createCheckout
  } = useSubscription();
  const {
    isAdmin
  } = useUserRole();
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

  // 프리미엄 모달 핸들러
  const handlePremiumModalClose = (open: boolean) => {
    setPremiumModalOpen(open);
  };

  // AI 프리미엄 집단지성 인사이트 보기 버튼 클릭 핸들러
  const handlePremiumInsightClick = () => {
    if (!subscription.subscribed && !isAdmin) {
      setPremiumModalOpen(true);
    }
  };

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
  const [weeklyKeywords, setWeeklyKeywords] = useState<any[]>([]);

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
        <Card className="opacity-80">
          <CardHeader>
            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Brain className="h-4 w-4 md:h-5 md:w-5" />
                  키워드별 해석 다양성
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  집단지성이 만들어낸 해석의 다양성을 통계적으로 분석합니다.
                  <br />
                  더 다양한 키워드별 해석 다양성이 궁금하시면 AI 프리미엄 집단지성 인사이트를 참고하세요.
                </CardDescription>
              </div>
              
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 space-y-6">
            {loadingState.loadingStages.diversity ? <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">키워드 다양성 분석 중...</div>
              </div> : displayedKeywordData.length === 0 ? <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">분석할 키워드 데이터가 없습니다.</div>
              </div> : <>
                {/* Key Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">가장 합의된 키워드</span>
                    </div>
                    {diversityStats?.mostConsensus ? <>
                        <p className="text-lg font-bold text-green-800 dark:text-green-200">
                          {diversityStats.mostConsensus.keyword} ({diversityStats.mostConsensus.diversity}%)
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {diversityStats.mostConsensus.definitions}개 정의, 높은 일치도
                        </p>
                      </> : <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>}
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">가장 논란 많은 키워드</span>
                    </div>
                    {diversityStats?.mostDiverse ? <>
                        <p className="text-lg font-bold text-red-800 dark:text-red-200">
                          {diversityStats.mostDiverse.keyword} ({diversityStats.mostDiverse.diversity}%)
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {diversityStats.mostDiverse.definitions}개 정의, 매우 다양한 해석
                        </p>
                      </> : <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">균형잡힌 키워드</span>
                    </div>
                    {diversityStats?.mostBalanced ? <>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          {diversityStats.mostBalanced.keyword} ({diversityStats.mostBalanced.diversity}%)
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {diversityStats.mostBalanced.definitions}개 정의, 적절한 다양성
                        </p>
                      </> : <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>}
                  </div>
                </div>

                {/* Diversity Distribution */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">다양성 분포</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {diversityStats?.consensusKeywords || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">합의형 ({INSIGHT_CONSTANTS.DIVERSITY_THRESHOLDS.CONSENSUS}% 미만)</div>
                      <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{
                      width: `${diversityStats?.totalKeywords ? diversityStats.consensusKeywords / diversityStats.totalKeywords * 100 : 0}%`
                    }} />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {diversityStats?.balancedKeywords || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">균형형 ({INSIGHT_CONSTANTS.DIVERSITY_THRESHOLDS.CONSENSUS}-{INSIGHT_CONSTANTS.DIVERSITY_THRESHOLDS.DIVERSE}%)</div>
                      <div className="w-full bg-yellow-100 rounded-full h-2 mt-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{
                      width: `${diversityStats?.totalKeywords ? diversityStats.balancedKeywords / diversityStats.totalKeywords * 100 : 0}%`
                    }} />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {diversityStats?.diverseKeywords || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">다양형 ({INSIGHT_CONSTANTS.DIVERSITY_THRESHOLDS.DIVERSE}% 이상)</div>
                      <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{
                      width: `${diversityStats?.totalKeywords ? diversityStats.diverseKeywords / diversityStats.totalKeywords * 100 : 0}%`
                    }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Correlation Insight */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    흥미로운 발견
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {loadingState.loadingStages.diversity ? <div className="text-center py-4">
                        <div className="text-xs text-muted-foreground">인사이트 생성 중...</div>
                      </div> : dynamicInsights.length === 0 ? <div className="text-center py-4">
                        <div className="text-xs text-muted-foreground">충분한 데이터가 없어 인사이트를 생성할 수 없습니다.</div>
                      </div> : dynamicInsights.map(insight => <div key={insight.id} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                          <span>{insight.text}</span>
                        </div>)}
                  </div>
                </div>

                {/* Mini Heatmap */}
                <KeywordDiversityHeatmap data={displayedKeywordData} />
              </>}
          </CardContent>
        </Card>

        {/* Keyword-Emotion Matrix */}
        <Card className="opacity-80">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">키워드-감정 매트릭스</CardTitle>
            <CardDescription className="text-sm">
              각 키워드가 어떤 감정을 주로 유발하는지 한눈에 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="space-y-4">
              {/* Headers */}
              <div className="grid grid-cols-5 gap-1 text-xs font-medium">
                <div className="text-center">키워드</div>
                <div className="text-center text-green-600">긍정</div>
                <div className="text-center text-gray-600">중성</div>
                <div className="text-center text-red-600">부정</div>
                <div className="text-center text-purple-600">복합</div>
              </div>
              
              {/* Matrix Data */}
              {loadingState.loadingStages.emotion ? <div className="text-center py-8">
                  <div className="text-sm text-muted-foreground">키워드 감정 데이터 로딩 중...</div>
                </div> : !keywordEmotionData || keywordEmotionData.length === 0 ? <div className="text-center py-8">
                  <div className="text-sm text-muted-foreground">분석할 키워드 감정 데이터가 없습니다.</div>
                </div> : <div className="space-y-2">
                  {keywordEmotionData?.map(row => <div key={row.keyword} className="grid grid-cols-5 gap-1 items-center">
                      <div className="text-sm font-medium text-center">{row.keyword}</div>
                      
                      {/* 긍정 */}
                      <div className="relative">
                        <div className="h-6 bg-green-100 rounded-md flex items-center justify-center">
                          <div className="absolute left-0 top-0 h-full bg-green-500 rounded-md transition-all" style={{
                      width: `${row.긍정}%`
                    }} />
                          <span className="relative text-xs font-medium z-10 text-green-800">
                            {row.긍정}%
                          </span>
                        </div>
                      </div>
                      
                      {/* 중성 */}
                      <div className="relative">
                        <div className="h-6 bg-gray-100 rounded-md flex items-center justify-center">
                          <div className="absolute left-0 top-0 h-full bg-gray-500 rounded-md transition-all" style={{
                      width: `${row.중성}%`
                    }} />
                          <span className="relative text-xs font-medium z-10 text-gray-800">
                            {row.중성}%
                          </span>
                        </div>
                      </div>
                      
                      {/* 부정 */}
                      <div className="relative">
                        <div className="h-6 bg-red-100 rounded-md flex items-center justify-center">
                          <div className="absolute left-0 top-0 h-full bg-red-500 rounded-md transition-all" style={{
                      width: `${row.부정}%`
                    }} />
                          <span className="relative text-xs font-medium z-10 text-red-800">
                            {row.부정}%
                          </span>
                        </div>
                      </div>
                      
                      {/* 복합 */}
                      <div className="relative">
                        <div className="h-6 bg-purple-100 rounded-md flex items-center justify-center">
                          <div className="absolute left-0 top-0 h-full bg-purple-500 rounded-md transition-all" style={{
                      width: `${row.복합}%`
                    }} />
                          <span className="relative text-xs font-medium z-10 text-purple-800">
                            {row.복합}%
                          </span>
                        </div>
                      </div>
                    </div>)}
                </div>}
              
              {/* Insights */}
              <div className="bg-muted/20 rounded-lg p-3 mt-4">
                <h4 className="text-xs font-medium mb-2">💡 패턴 발견</h4>
                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                  {keywordEmotionData && keywordEmotionData.length > 0 ? keywordEmotionData.slice(0, 3).map((item, index) => {
                  const dominantEmotion = Math.max(item.긍정, item.중성, item.부정, item.복합);
                  let emotionName = '';
                  if (dominantEmotion === item.긍정) emotionName = '긍정적';else if (dominantEmotion === item.중성) emotionName = '중성적';else if (dominantEmotion === item.부정) emotionName = '부정적';else emotionName = '복합적';
                  return <div key={index}>
                          • <strong>{item.keyword}</strong>은 주로 {emotionName} ({dominantEmotion}%)
                        </div>;
                }) : <div>• 키워드 감정 패턴 분석 중...</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Time Flow Section - moved below matrix */}
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

        {/* 깊이 있는 사색 섹션 */}
        <Card className="opacity-80">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">깊이 있는 사색</CardTitle>
            <CardDescription className="text-sm">
              최근 가장 깊이 있게 써진 각인 스토리들
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {isLoadingStories ? <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">깊이 있는 사색 로딩 중...</div>
              </div> : !reflectionStories || reflectionStories.length === 0 ? <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  아직 깊이 있는 사색 스토리가 충분하지 않습니다.<br />
                  더 많은 참여가 있으면 보여드릴게요!
                </div>
              </div> : <div className="space-y-4">
                {reflectionStories.map((story, index) => {
              const getBorderColor = (sentiment?: string) => {
                switch (sentiment) {
                  case 'positive':
                    return 'border-l-green-500';
                  case 'negative':
                    return 'border-l-blue-500';
                  default:
                    return 'border-l-purple-500';
                }
              };
              const formatDate = (dateString: string) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                });
              };
              return <Card key={story.id} className={`border-l-4 ${getBorderColor(story.sentiment)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{story.keyword}</Badge>
                            <span className="text-xs text-muted-foreground">• 익명</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>깊이: {story.depth_score}점</span>
                            <span>{formatDate(story.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">정의:</p>
                            <p className="text-sm font-medium">{story.definition}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">인상:</p>
                            <p className="text-sm leading-relaxed">{story.impression}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>{story.definition.length + story.impression.length}자</span>
                          <div className="flex items-center gap-2">
                            <Heart className="h-3 w-3" />
                            <span>{Math.floor(Math.random() * 50) + 10}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
            })}
              </div>}
          </CardContent>
        </Card>
        
        {/* Premium Collective Intelligence Features */}
        {!(subscription.subscribed || isAdmin)}
        
        {(subscription.subscribed || isAdmin) && <div className="space-y-6">



          </div>}
      </main>

      {/* 프리미엄 소개 모달 */}
      <Dialog open={premiumModalOpen} onOpenChange={handlePremiumModalClose}>
        <DialogContent className="max-w-sm sm:max-w-sm border-purple-200 shadow-[0_0_30px_rgba(147,51,234,0.3)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text text-transparent">프리미엄 기능 소개</span>
            </DialogTitle>
            <div className="text-xs text-muted-foreground">
              집단지성 인사이트는 프리미엄 서비스입니다
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 프리미엄 기능 소개 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-medium">집단지성 인사이트 열람</h4>
                  <p className="text-xs text-muted-foreground">모든 사용자의 데이터로 만든 통계와 분석</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-medium">AI 관계 분석 무제한</h4>
                  <p className="text-xs text-muted-foreground">AI가 분석하는 관계 패턴과 조언</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-medium">AI전문가 조언 주 3회</h4>
                  <p className="text-xs text-muted-foreground">전문가 수준의 개인 맞춤 조언</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-medium">모든 관계 유형 지원</h4>
                  <p className="text-xs text-muted-foreground">연인, 비즈니스, 사용자 정의 관계 모두 지원</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-medium">광고 없는 경험</h4>
                  <p className="text-xs text-muted-foreground">깔끔하고 집중할 수 있는 환경</p>
                </div>
              </div>
            </div>
            
            {/* 요금제 정보 */}
            <div className="bg-gradient-to-br from-purple-50 to-yellow-50 dark:from-purple-950/20 dark:to-yellow-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">프리미엄 요금제</h3>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-muted-foreground line-through">$15</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text text-transparent">$10</span>
                  </div>
                  <div className="text-xs text-muted-foreground">월 단위</div>
                </div>
              </div>
            </div>

            {/* 결제 버튼 */}
            <Button className="w-full flex items-center gap-2 bg-gradient-to-r from-purple-600 to-yellow-500 hover:from-purple-700 hover:to-yellow-600 text-white shadow-lg" size="lg" onClick={() => createCheckout('premium')}>
              <CreditCard className="w-4 h-4" />
              프리미엄 구독하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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