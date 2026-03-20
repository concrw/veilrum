import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EcosystemSpecies {
  type: 'core' | 'bridge' | 'emerging' | 'specialized';
  keywords: string[];
  description: string;
  color: string;
}

export const useKeywordEcosystem = () => {
  return useQuery({
    queryKey: ['keyword-ecosystem'],
    queryFn: async (): Promise<EcosystemSpecies[]> => {
      try {
        // 모든 키워드와 참여자 정보 가져오기
        const { data: stories, error } = await supabase
          .from('stories')
          .select('keyword, user_id')
          .not('user_id', 'is', null);

        if (error) throw error;
        if (!stories || stories.length === 0) return [];

        // 키워드별 참여자 수와 연결성 분석
        const keywordStats: { [keyword: string]: { 
          userCount: number, 
          users: Set<string>, 
          connections: number 
        } } = {};

        stories.forEach(story => {
          if (!keywordStats[story.keyword]) {
            keywordStats[story.keyword] = {
              userCount: 0,
              users: new Set(),
              connections: 0
            };
          }
          keywordStats[story.keyword].users.add(story.user_id);
        });

        // 사용자 수 계산
        Object.keys(keywordStats).forEach(keyword => {
          keywordStats[keyword].userCount = keywordStats[keyword].users.size;
        });

        // 키워드 간 연결성 계산 (공통 사용자 기반)
        const keywords = Object.keys(keywordStats);
        for (let i = 0; i < keywords.length; i++) {
          for (let j = i + 1; j < keywords.length; j++) {
            const keyword1 = keywords[i];
            const keyword2 = keywords[j];
            const users1 = keywordStats[keyword1].users;
            const users2 = keywordStats[keyword2].users;
            
            const sharedUsers = new Set([...users1].filter(x => users2.has(x)));
            const connectionStrength = sharedUsers.size;
            
            keywordStats[keyword1].connections += connectionStrength;
            keywordStats[keyword2].connections += connectionStrength;
          }
        }

        // 키워드를 생태계 유형별로 분류
        const sortedKeywords = Object.entries(keywordStats)
          .sort(([,a], [,b]) => b.userCount - a.userCount);

        const totalKeywords = sortedKeywords.length;
        const species: EcosystemSpecies[] = [];

        // 핵심종 (상위 20%, 높은 참여자 수)
        const coreCount = Math.max(2, Math.floor(totalKeywords * 0.2));
        const coreKeywords = sortedKeywords
          .slice(0, coreCount)
          .filter(([, stats]) => stats.userCount >= 3)
          .map(([keyword]) => keyword);

        if (coreKeywords.length > 0) {
          species.push({
            type: 'core',
            keywords: coreKeywords.slice(0, 3), // 상위 3개만 표시
            description: '생태계 중심',
            color: 'text-red-600'
          });
        }

        // 연결종 (높은 연결성)
        const bridgeKeywords = sortedKeywords
          .filter(([keyword, stats]) => 
            !coreKeywords.includes(keyword) && 
            stats.connections >= Math.max(2, totalKeywords * 0.1)
          )
          .slice(0, 3)
          .map(([keyword]) => keyword);

        if (bridgeKeywords.length > 0) {
          species.push({
            type: 'bridge',
            keywords: bridgeKeywords,
            description: '다리 역할',
            color: 'text-blue-600'
          });
        }

        // 신흥종 (중간 참여자 수, 최근 등장)
        const emergingKeywords = sortedKeywords
          .filter(([keyword, stats]) => 
            !coreKeywords.includes(keyword) && 
            !bridgeKeywords.includes(keyword) &&
            stats.userCount >= 2 && stats.userCount <= 5
          )
          .slice(0, 3)
          .map(([keyword]) => keyword);

        if (emergingKeywords.length > 0) {
          species.push({
            type: 'emerging',
            keywords: emergingKeywords,
            description: '급성장 중',
            color: 'text-green-600'
          });
        }

        // 전문종 (낮은 참여자 수, 특화된 키워드)
        const specializedKeywords = sortedKeywords
          .filter(([keyword, stats]) => 
            !coreKeywords.includes(keyword) && 
            !bridgeKeywords.includes(keyword) &&
            !emergingKeywords.includes(keyword) &&
            stats.userCount >= 1
          )
          .slice(0, 3)
          .map(([keyword]) => keyword);

        if (specializedKeywords.length > 0) {
          species.push({
            type: 'specialized',
            keywords: specializedKeywords,
            description: '틈새 영역',
            color: 'text-purple-600'
          });
        }

        return species;

      } catch (error) {
        console.error('Error analyzing keyword ecosystem:', error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15분
    gcTime: 30 * 60 * 1000, // 30분
  });
};