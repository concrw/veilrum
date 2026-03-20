import { useMemo } from 'react';
import { useInsightStats } from './useInsightStats';
import { useKeywordDiversity, useKeywordDiversityStats } from './useKeywordDiversity';
import { useEmotionAnalysis, useKeywordEmotionMatrix } from './useEmotionAnalysis';
import { useTimeFlowAnalysis, useSubmissionPattern } from './useTimeFlowAnalysis';

export interface CombinedInsightData {
  // Basic stats
  stats: ReturnType<typeof useInsightStats>['data'];
  
  // Keyword diversity
  keywordDiversityData: ReturnType<typeof useKeywordDiversity>['data'];
  diversityStats: ReturnType<typeof useKeywordDiversityStats>['data'];
  
  // Emotion analysis
  emotionData: ReturnType<typeof useEmotionAnalysis>['data'];
  keywordEmotionData: ReturnType<typeof useKeywordEmotionMatrix>['data'];
  
  // Time flow analysis
  timeFlowData: ReturnType<typeof useTimeFlowAnalysis>['data'];
  submissionPattern: ReturnType<typeof useSubmissionPattern>['data'];
}

export interface InsightLoadingState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  errors: string[];
  loadingStages: {
    stats: boolean;
    diversity: boolean;
    emotion: boolean;
    timeFlow: boolean;
  };
}

export const useCombinedInsightData = () => {
  // 모든 개별 훅들 호출
  const statsQuery = useInsightStats();
  const diversityQuery = useKeywordDiversity();
  const diversityStatsQuery = useKeywordDiversityStats(diversityQuery.data);
  const emotionQuery = useEmotionAnalysis();
  const emotionMatrixQuery = useKeywordEmotionMatrix();
  const timeFlowQuery = useTimeFlowAnalysis();
  const submissionPatternQuery = useSubmissionPattern(timeFlowQuery.data);

  // 로딩 상태 통합
  const loadingState: InsightLoadingState = useMemo(() => {
    const queries = [
      statsQuery,
      diversityQuery,
      emotionQuery,
      emotionMatrixQuery,
      timeFlowQuery
    ];

    const isLoading = queries.some(q => q.isLoading);
    const isError = queries.some(q => q.isError);
    const isSuccess = queries.every(q => q.isSuccess);
    
    const errors: string[] = [];
    queries.forEach((q, index) => {
      if (q.isError) {
        const errorNames = ['기본 통계', '키워드 다양성', '감정 분석', '키워드 감정 매트릭스', '시간 흐름 분석'];
        errors.push(`${errorNames[index]} 로딩 실패`);
      }
    });

    return {
      isLoading,
      isError,
      isSuccess,
      errors,
      loadingStages: {
        stats: statsQuery.isLoading,
        diversity: diversityQuery.isLoading,
        emotion: emotionQuery.isLoading || emotionMatrixQuery.isLoading,
        timeFlow: timeFlowQuery.isLoading,
      }
    };
  }, [
    statsQuery.isLoading, statsQuery.isError, statsQuery.isSuccess,
    diversityQuery.isLoading, diversityQuery.isError, diversityQuery.isSuccess,
    emotionQuery.isLoading, emotionQuery.isError, emotionQuery.isSuccess,
    emotionMatrixQuery.isLoading, emotionMatrixQuery.isError, emotionMatrixQuery.isSuccess,
    timeFlowQuery.isLoading, timeFlowQuery.isError, timeFlowQuery.isSuccess
  ]);

  // 데이터 통합
  const data: CombinedInsightData = useMemo(() => ({
    stats: statsQuery.data,
    keywordDiversityData: diversityQuery.data,
    diversityStats: diversityStatsQuery.data,
    emotionData: emotionQuery.data,
    keywordEmotionData: emotionMatrixQuery.data,
    timeFlowData: timeFlowQuery.data,
    submissionPattern: submissionPatternQuery.data,
  }), [
    statsQuery.data,
    diversityQuery.data,
    diversityStatsQuery.data,
    emotionQuery.data,
    emotionMatrixQuery.data,
    timeFlowQuery.data,
    submissionPatternQuery.data,
  ]);

  // 수동 리프레시 함수
  const refetch = async () => {
    const promises = [
      statsQuery.refetch(),
      diversityQuery.refetch(),
      emotionQuery.refetch(),
      emotionMatrixQuery.refetch(),
      timeFlowQuery.refetch(),
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  return {
    data,
    loadingState,
    refetch,
    // 개별 쿼리들도 필요시 접근 가능하도록 노출
    queries: {
      stats: statsQuery,
      diversity: diversityQuery,
      emotion: emotionQuery,
      emotionMatrix: emotionMatrixQuery,
      timeFlow: timeFlowQuery,
    }
  };
};