import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TodayKeyword } from "@/components/TodayKeyword";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { STRINGS } from "@/constants/strings";
import { MESSAGES } from "@/constants/messages";
import { UI_TEXT } from "@/constants/ui";
import BottomNavigation from "@/components/BottomNavigation";
import { useCurrentKeywordInfo } from "@/hooks/useKeywordSealStatus";
import { getKSTTime } from "@/lib/timeUtils";
import { useParticipationCheck } from "@/hooks/useParticipationCheck";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { ERRORS } from "@/constants/errors";
import { useUserCohorts } from "@/hooks/useUserCohorts";
import { useUserCohortKeywords } from "@/hooks/useUserCohortKeywords";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError, handleSuccess, handleAuthError } = useErrorHandler();

  // Cohort check
  const { data: userCohorts, isLoading: cohortsLoading } = useUserCohorts(user?.id);

  // Get all cohort keywords for today
  const { data: cohortKeywords } = useUserCohortKeywords(user?.id);

  // 키워드 정보 조회 (개선된 훅 사용)
  const { data: keywordInfo, isLoading: keywordLoading, error: keywordError } = useCurrentKeywordInfo();

  // 참여 확인 훅 사용
  const { hasParticipated, isChecking: checkingParticipation, checkParticipation } = useParticipationCheck({
    userId: user?.id,
    keyword: keywordInfo?.keyword,
    enabled: !!user && !!keywordInfo?.keyword,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleUserSubmit = async (definition: string, memory: string) => {
    if (!user) {
      handleAuthError(navigate);
      return;
    }

    if (!keywordInfo?.keyword) {
      handleError(null, ERRORS.FETCH.KEYWORD_FAILED);
      return;
    }

    try {
      // Get user's main cohort (fallback to first cohort if main not found)
      const mainCohort = userCohorts?.find(c => c.slug === 'main') || userCohorts?.[0];

      // Get today's keyword for the main cohort
      const { data: cohortKeyword } = await supabase
        .from('cohort_keywords')
        .select('id')
        .eq('cohort_id', mainCohort?.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      const { error } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          keyword: keywordInfo.keyword,
          definition,
          impression: memory,
          cohort_id: mainCohort?.id,
          cohort_keyword_id: cohortKeyword?.id,
        });

      if (error) {
        handleError(error, ERRORS.SAVE.STORY_FAILED);
      } else {
        checkParticipation();
        handleSuccess('정의각인이 성공적으로 저장되었습니다', '저장 완료');
      }
    } catch (error) {
      handleError(error, ERRORS.SAVE.GENERIC);
    }
  };

  const handleKeywordChange = (newKeyword: string) => {
    checkParticipation();
  };

  if (loading || cohortsLoading) {
    return (
      <div className="min-h-screen pb-20 relative bg-transparent overflow-y-auto scrollbar-hide">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">
            {loading ? '로그인 확인 중...' : '코호트 정보 로딩 중...'}
          </p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (keywordLoading || checkingParticipation) {
    return (
      <div className="min-h-screen pb-20 relative bg-transparent overflow-y-auto scrollbar-hide">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">
            {keywordLoading ? '키워드를 불러오는 중...' : '참여 확인 중...'}
          </p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (keywordError) {
    console.error('❌ [Index] 키워드 로딩 에러:', keywordError);
    return (
      <div className="min-h-screen pb-20 relative bg-transparent overflow-y-auto scrollbar-hide">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground text-red-500">
            키워드를 불러오는 중 오류가 발생했습니다
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            새로고침
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!keywordInfo) {
    return (
      <div className="min-h-screen pb-20 relative bg-transparent overflow-y-auto scrollbar-hide">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">키워드 정보가 없습니다</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative bg-transparent overflow-y-auto scrollbar-hide">
      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 py-6 md:py-8 mt-2.5">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            
            {/* Today's Keyword in Header */}
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-3">
                <img
                  src="/codetalk-white.png"
                  alt="CodeTalk Logo"
                  className="w-4 h-4 md:w-5 md:h-5 object-contain"
                />
                <span className="text-base md:text-xl font-medium text-white whitespace-nowrap network-glow-text">
                  CodeTalk : {keywordInfo.keyword}
                </span>
              </div>
            </div>
            
            <div className="flex-1 flex justify-end">
              {!user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-2 h-10 px-3"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">로그인</span>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 lg:px-24 pt-3 pb-8 space-y-8">
        {/* Main Cohort Keyword Section */}
        <section>
          <TodayKeyword
            keyword={keywordInfo.keyword}
            onSubmit={handleUserSubmit}
            onKeywordChange={handleKeywordChange}
            disabled={false}
            hasParticipated={hasParticipated}
          />
        </section>

        {/* Other Cohorts Section */}
        {cohortKeywords && cohortKeywords.filter(ck => ck.cohort_slug !== 'main').length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">내가 참여한 주제방</h2>
            <div className="flex flex-wrap gap-2">
              {cohortKeywords
                .filter(ck => ck.cohort_slug !== 'main')
                .map(cohortKeyword => (
                  <button
                    key={cohortKeyword.cohort_id}
                    onClick={() => navigate(`/cohort/${cohortKeyword.cohort_slug}`)}
                    className="px-3 py-2 text-xs border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <span className="font-medium">{cohortKeyword.cohort_name}</span>
                    {cohortKeyword.keyword && (
                      <span className="text-muted-foreground">
                        "{cohortKeyword.keyword}"
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Index;