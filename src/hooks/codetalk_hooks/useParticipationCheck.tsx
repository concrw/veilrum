import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getKSTTime } from '@/lib/timeUtils';

interface UseParticipationCheckOptions {
  userId: string | undefined;
  keyword: string | undefined;
  enabled?: boolean;
}

interface UseParticipationCheckReturn {
  hasParticipated: boolean;
  isChecking: boolean;
  checkParticipation: () => Promise<boolean>;
}

/**
 * 사용자의 오늘 키워드 참여 여부를 확인하는 훅
 *
 * @param options - userId, keyword, enabled 옵션
 * @returns 참여 여부, 확인 중 상태, 수동 체크 함수
 */
export const useParticipationCheck = ({
  userId,
  keyword,
  enabled = true,
}: UseParticipationCheckOptions): UseParticipationCheckReturn => {
  const [hasParticipated, setHasParticipated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkParticipation = async (): Promise<boolean> => {
    if (!userId || !keyword) {
      console.log('🔍 [useParticipationCheck] Missing userId or keyword');
      setIsChecking(false);
      return false;
    }

    try {
      const kstNow = getKSTTime();
      const todayDate = kstNow.toISOString().split('T')[0];

      console.log('🔍 [useParticipationCheck] Checking participation:', {
        userId,
        keyword,
        date: todayDate,
      });

      // 오늘 00:00 ~ 23:59 범위에서 해당 키워드로 작성한 스토리 확인
      const { data, error } = await supabase
        .from('stories')
        .select('id, keyword, created_at')
        .eq('user_id', userId)
        .eq('keyword', keyword)
        .gte('created_at', `${todayDate}T00:00:00+09:00`)
        .lte('created_at', `${todayDate}T23:59:59+09:00`)
        .limit(1);

      if (error) {
        console.error('🔍 [useParticipationCheck] Error:', error);
        setIsChecking(false);
        return false;
      }

      const participated = (data?.length || 0) > 0;

      console.log('🔍 [useParticipationCheck] Result:', {
        participated,
        storyCount: data?.length || 0,
      });

      setHasParticipated(participated);
      setIsChecking(false);
      return participated;
    } catch (error) {
      console.error('🔍 [useParticipationCheck] Exception:', error);
      setIsChecking(false);
      return false;
    }
  };

  // 자동 체크 (userId, keyword가 변경되거나 enabled가 true일 때)
  useEffect(() => {
    if (enabled && userId && keyword) {
      console.log('🔍 [useParticipationCheck] Auto-checking participation');
      checkParticipation();
    }
  }, [userId, keyword, enabled]);

  return {
    hasParticipated,
    isChecking,
    checkParticipation,
  };
};
