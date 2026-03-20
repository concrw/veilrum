import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InsightStats {
  totalParticipants: number;
  totalDefinitions: number;
  activeKeywords: number;
  averageDiversity: number;
}

export const useInsightStats = () => {
  return useQuery({
    queryKey: ['insightStats'],
    queryFn: async (): Promise<InsightStats> => {
      try {
        // 총 참가자 수 (profiles 테이블)
        const { data: totalUsers, error: participantError } = await supabase
          .rpc('count_total_users');

        const participantCount = (typeof totalUsers === 'number') ? totalUsers : 0;

        if (participantError) {
          console.error('Error fetching participant count:', participantError);
        }

        // 총 정의 수 (stories 테이블)
        const { count: definitionCount, error: definitionError } = await supabase
          .from('stories')
          .select('id', { count: 'exact', head: true });

        if (definitionError) {
          console.error('Error fetching definition count:', definitionError);
        }

        // 활성 키워드 수 (daily_keywords 테이블)
        const { count: keywordCount, error: keywordError } = await supabase
          .from('daily_keywords')
          .select('id', { count: 'exact', head: true });

        if (keywordError) {
          console.error('Error fetching keyword count:', keywordError);
        }

        // 키워드별 정의 개수를 가져와서 평균 다양성 계산
        const { data: keywordStats, error: statsError } = await supabase
          .from('stories')
          .select('keyword')
          .not('keyword', 'is', null);

        if (statsError) {
          console.error('Error fetching keyword stats:', statsError);
        }

        // 키워드별 정의 개수 계산
        const keywordGroups = (keywordStats || []).reduce((acc, story) => {
          acc[story.keyword] = (acc[story.keyword] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // 다양성 지수 계산 (단순화된 버전: 키워드별 정의 개수의 표준편차 기반)
        const definitionCounts = Object.values(keywordGroups);
        const avgDefinitions = definitionCounts.length > 0 
          ? definitionCounts.reduce((sum, count) => sum + count, 0) / definitionCounts.length
          : 0;
        
        const variance = definitionCounts.length > 0
          ? definitionCounts.reduce((sum, count) => sum + Math.pow(count - avgDefinitions, 2), 0) / definitionCounts.length
          : 0;
        
        const diversity = Math.min(Math.round((Math.sqrt(variance) / avgDefinitions) * 100) || 0, 100);

        return {
          totalParticipants: participantCount || 0,
          totalDefinitions: definitionCount || 0,
          activeKeywords: keywordCount || 0,
          averageDiversity: diversity || 0
        };
      } catch (error) {
        console.error('Error fetching insight stats:', error);
        // 에러 발생시 기본값 반환
        return {
          totalParticipants: 0,
          totalDefinitions: 0,
          activeKeywords: 0,
          averageDiversity: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5분 - 통계는 자주 변하지 않으므로
    gcTime: 30 * 60 * 1000, // 30분 - 메모리에 오래 보관
  });
};