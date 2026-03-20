import { useState, useEffect } from "react";
import { StoryFeed } from "@/components/StoryFeed";
import { TimeGate } from "@/components/TimeGate";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useStories } from "@/hooks/useStories";
import { useCurrentKeywordInfo } from "@/hooks/useKeywordSealStatus";
import { getKSTTime } from "@/lib/timeUtils";
import { MESSAGES } from "@/constants/messages";
import { UNLOCK_HOUR } from "@/lib/constants";
import { useParticipationCheck } from "@/hooks/useParticipationCheck";
import { useUserCohorts } from "@/hooks/useUserCohorts";
import { useUserCohortKeywords } from "@/hooks/useUserCohortKeywords";
import { useCohortStories } from "@/hooks/useCohortStories";
import { CohortSelector } from "@/components/CohortSelector";

const Feed = () => {
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [adminOverride, setAdminOverride] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  // Get user cohorts
  const { data: userCohorts, isLoading: cohortsLoading } = useUserCohorts(user?.id);

  // Get cohort keywords for today
  const { data: cohortKeywords } = useUserCohortKeywords(user?.id);

  // Get current keyword info (fallback for backward compatibility)
  const { data: keywordInfo } = useCurrentKeywordInfo();

  // Select the keyword for the selected cohort
  const selectedKeyword = cohortKeywords?.find(ck => ck.cohort_id === selectedCohortId);

  // Get cohort stories
  const { data: cohortStories = [], isLoading: cohortStoriesLoading, refetch: refetchCohortStories } = useCohortStories(
    selectedCohortId,
    selectedKeyword?.keyword_id || undefined
  );

  // Fallback to old stories hook for backward compatibility
  const { data: stories = [], isLoading: storiesLoading, refetch } = useStories(keywordInfo?.keyword);

  // Use cohort stories if cohort is selected, otherwise use old stories
  const displayStories = selectedCohortId ? cohortStories : stories;
  const displayStoriesLoading = selectedCohortId ? cohortStoriesLoading : storiesLoading;

  // 참여 확인 훅 사용
  const { hasParticipated, isChecking: checkingParticipation } = useParticipationCheck({
    userId: user?.id,
    keyword: selectedKeyword?.keyword || keywordInfo?.keyword,
    enabled: !!user && !!(selectedKeyword?.keyword || keywordInfo?.keyword),
  });

  // Auto-select first cohort
  useEffect(() => {
    if (userCohorts && userCohorts.length > 0 && !selectedCohortId) {
      setSelectedCohortId(userCohorts[0].id);
    }
  }, [userCohorts, selectedCohortId]);

  const isPublicStoryOpenPeriod = () => {
    const kstNow = getKSTTime();
    const currentHour = kstNow.getHours();
    return currentHour >= UNLOCK_HOUR && currentHour <= 23;
  };

  const isCurrentlyPublicStoryOpen = isPublicStoryOpenPeriod();

  // 시간 카운트다운 계산
  const getTimeUntilNextPeriod = () => {
    const kstNow = getKSTTime();
    const currentHour = kstNow.getHours();
    let targetTime: Date;
    let message: string;

    if (isCurrentlyPublicStoryOpen) {
      // 퍼블릭스토리 오픈 중 (18:00~23:59): 자정까지 카운트다운
      targetTime = new Date(kstNow);
      targetTime.setDate(targetTime.getDate() + 1); // 다음날
      targetTime.setHours(0, 0, 0, 0); // 자정
      message = "퍼블릭스토리 종료까지";
    } else {
      // 퍼블릭스토리 닫힘 (00:00~17:59): 18시까지 카운트다운
      targetTime = new Date(kstNow);
      if (currentHour < 18) {
        // 오늘 18시
        targetTime.setHours(18, 0, 0, 0);
      } else {
        // 내일 18시 (이 경우는 없겠지만 안전장치)
        targetTime.setDate(targetTime.getDate() + 1);
        targetTime.setHours(18, 0, 0, 0);
      }
      message = "퍼블릭스토리 오픈까지";
    }

    const diff = Math.max(0, targetTime.getTime() - kstNow.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      message
    };
  };

  // 1초마다 타이머 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 새로고침 핸들러
  const handleRefresh = async () => {
    refetch();
  };

  // 관리자 시계 클릭 핸들러
  const handleAdminClockClick = () => {
    if (isAdmin) {
      setAdminOverride(true);
    }
  };

  // 로딩 중 화면
  if (checkingParticipation || !keywordInfo) {
    return (
      <div className="min-h-screen pb-20 relative bg-transparent">
        <main className="container mx-auto px-6 md:px-12 lg:px-24 py-14 md:py-16">
          <div className="text-center py-8 md:py-12">
            <p className="text-muted-foreground text-sm md:text-base">로딩 중...</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  // 퍼블릭스토리 닫힘 시간 (00:00~17:59): 카운트다운 화면
  if (!isCurrentlyPublicStoryOpen) {
    const timeInfo = getTimeUntilNextPeriod();
    return (
      <div className="min-h-screen pb-20 relative bg-transparent">
        <main className="container mx-auto px-6 md:px-12 lg:px-24 py-14 md:py-16 flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  {timeInfo.message}
                </h3>
                <div className="text-lg font-mono text-primary cursor-pointer" onClick={handleAdminClockClick}>
                  {timeInfo.time}
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  // 퍼블릭스토리 오픈 시간 (18:00~23:59): 참여 여부에 따른 화면 분기
  if (isCurrentlyPublicStoryOpen) {
    if (!hasParticipated) {
      // 참여하지 않은 사용자: 접근 거부 화면
      const timeInfo = getTimeUntilNextPeriod();
      return (
        <div className="min-h-screen pb-20 relative bg-transparent">
          <main className="container mx-auto px-6 md:px-12 lg:px-24 py-14 md:py-16 flex items-center justify-center min-h-[calc(100vh-5rem)]">
            <div className="text-center">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    오늘 키워드에 참여해야 이용 가능합니다
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    메인 페이지에서 "{keywordInfo?.keyword}" 키워드를 기록한 후 이용해주세요
                  </p>
                  <div className="text-lg font-mono text-white mt-4 rounded-lg">
                    {timeInfo.message}: {timeInfo.time}
                  </div>
                </div>
              </div>
            </div>
          </main>
          <BottomNavigation />
        </div>
      );
    }

    // 참여한 사용자: 스토리 화면
    if (displayStoriesLoading || cohortsLoading) {
      return (
        <div className="min-h-screen pb-20 relative bg-transparent">
          <main className="container mx-auto px-6 md:px-12 lg:px-24 py-14 md:py-16">
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">스토리를 불러오는 중...</p>
            </div>
          </main>
          <BottomNavigation />
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-20 relative bg-transparent">
        <main className="container mx-auto px-6 md:px-12 lg:px-24 py-14 md:py-16">
          {/* Cohort Selector */}
          {userCohorts && userCohorts.length > 0 && (
            <div className="mb-6">
              <CohortSelector
                cohorts={userCohorts}
                selectedCohortId={selectedCohortId}
                onCohortChange={setSelectedCohortId}
              />
            </div>
          )}

          {/* Keyword Info */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-medium mb-2">퍼블릭스토리</h2>
            <p className="text-sm text-muted-foreground">
              "{selectedKeyword?.keyword || keywordInfo?.keyword}" 키워드로 작성된 이야기들
            </p>
            {selectedKeyword?.definition && (
              <p className="text-xs text-muted-foreground mt-2 max-w-2xl mx-auto">
                {selectedKeyword.definition}
              </p>
            )}
          </div>

          {/* Story Feed */}
          <StoryFeed
            stories={displayStories}
            onRefresh={selectedCohortId ? refetchCohortStories : handleRefresh}
            todayKeyword={selectedKeyword?.keyword || keywordInfo?.keyword || ''}
          />
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return null;
};

export default Feed;