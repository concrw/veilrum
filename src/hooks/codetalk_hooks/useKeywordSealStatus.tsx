// src/hooks/useKeywordSealStatus.tsx - 수정된 버전

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KeywordInfo {
  keyword: string;
  keywordDate: string;
  isWritingPeriod: boolean;
  isReadingPeriod: boolean;
}

// KST 시간 유틸리티 (정확한 계산)
const getKSTTime = (): Date => {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isKST = timezone === 'Asia/Seoul';
  
  if (isKST) {
    return now;
  } else {
    // UTC 기준으로 9시간 추가
    return new Date(now.getTime() + (9 * 60 * 60 * 1000));
  }
};

export const useCurrentKeywordInfo = () => {
  return useQuery({
    queryKey: ['currentKeywordInfo'],
    queryFn: async (): Promise<KeywordInfo> => {
      try {
        console.log('🔍 [useCurrentKeywordInfo] 키워드 조회 시작');
        
        const kstNow = getKSTTime();
        const today = kstNow.toISOString().split('T')[0];
        
        console.log('📅 [useCurrentKeywordInfo] KST 현재 시간:', kstNow.toLocaleString('ko-KR'));
        console.log('📅 [useCurrentKeywordInfo] 조회할 날짜:', today);

        const { data, error } = await supabase
          .from('daily_keywords')
          .select('keyword, date, definition, example')
          .eq('date', today)
          .limit(1);

        console.log('📊 [useCurrentKeywordInfo] DB 조회 결과:', { data, error });

        if (error) {
          console.error('❌ [useCurrentKeywordInfo] DB 조회 에러:', error);
          throw error;
        }

        // 데이터가 있을 때
        if (data && data.length > 0) {
          const keywordData = data[0];
          console.log('✅ [useCurrentKeywordInfo] 키워드 발견:', keywordData.keyword);
          
          return {
            keyword: keywordData.keyword || '키워드없음',
            keywordDate: keywordData.date || today,
            isWritingPeriod: true,
            isReadingPeriod: false
          };
        }

        // 데이터가 없을 때 - 기본 키워드 반환
        console.log('⚠️ [useCurrentKeywordInfo] 오늘 키워드가 없음, 기본값 사용');
        return {
          keyword: '용서',
          keywordDate: today,
          isWritingPeriod: true,
          isReadingPeriod: false
        };

      } catch (error) {
        console.error('❌ [useCurrentKeywordInfo] 예외 발생:', error);
        
        // 에러 발생 시 기본값 반환
        const kstNow = getKSTTime();
        const today = kstNow.toISOString().split('T')[0];
        
        return {
          keyword: '용서',
          keywordDate: today,
          isWritingPeriod: true,
          isReadingPeriod: false
        };
      }
    },
    staleTime: 60 * 1000,        // 1분간 캐시 유지
    refetchInterval: 60 * 1000,   // 1분마다 자동 새로고침
    retry: 3,                     // 3회 재시도
    retryDelay: 1000,            // 1초 간격으로 재시도
  });
};

export const useKeywordSealStatus = (keyword?: string) => {
  return useQuery({
    queryKey: ['keywordSealStatus', keyword],
    queryFn: async () => {
      if (!keyword) {
        console.log('🔍 [useKeywordSealStatus] 키워드가 없어서 건너뜀');
        return { hasParticipated: false };
      }

      try {
        console.log('🔍 [useKeywordSealStatus] 참여 확인 시작 - 키워드:', keyword);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('🔍 [useKeywordSealStatus] 로그인되지 않음');
          return { hasParticipated: false };
        }

        const kstNow = getKSTTime();
        const today = kstNow.toISOString().split('T')[0];
        
        console.log('🔍 [useKeywordSealStatus] 오늘 날짜:', today);

        // 오늘 00:00 ~ 23:59 범위에서 해당 키워드 참여 확인
        const { data, error } = await supabase
          .from('stories')
          .select('id, keyword, created_at')
          .eq('user_id', user.id)
          .eq('keyword', keyword)
          .gte('created_at', `${today}T00:00:00+09:00`)
          .lte('created_at', `${today}T23:59:59+09:00`)
          .limit(1);

        console.log('📊 [useKeywordSealStatus] 참여 확인 결과:', { data, error });

        if (error) {
          console.error('❌ [useKeywordSealStatus] 참여 확인 에러:', error);
          return { hasParticipated: false };
        }

        const hasParticipated = (data?.length || 0) > 0;
        console.log('✅ [useKeywordSealStatus] 최종 참여 여부:', hasParticipated);

        return { hasParticipated };

      } catch (error) {
        console.error('❌ [useKeywordSealStatus] 예외 발생:', error);
        return { hasParticipated: false };
      }
    },
    enabled: !!keyword,
    staleTime: 30 * 1000,
    retry: 2,
  });
};