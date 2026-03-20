import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KeywordConnection {
  keyword1: string;
  keyword2: string;
  correlation: number;
  shared_users: number;
  connection_type: 'strong' | 'unexpected' | 'emerging';
  significance: number;
}

export interface GroupPsychology {
  positive_sentiment: number;
  active_discussions: number;
  trending_keyword: string;
  mood_trend: number; // -1 to 1
  engagement_level: 'low' | 'medium' | 'high';
}

export interface CollectiveWisdom {
  total_participants: number;
  total_definitions: number;
  network_clusters: number;
  knowledge_density: number;
  wisdom_score: number;
}

export const useHiddenConnections = () => {
  return useQuery({
    queryKey: ['hidden-connections'],
    queryFn: async (): Promise<KeywordConnection[]> => {
      try {
        // stories 테이블에서 키워드별 사용자 정보 가져오기
        const { data: stories, error } = await supabase
          .from('stories')
          .select('keyword, user_id, created_at')
          .not('user_id', 'is', null);

        if (error) throw error;
        if (!stories || stories.length === 0) return [];

        // 키워드별 사용자 그룹핑
        const keywordUsers: { [keyword: string]: Set<string> } = {};
        stories.forEach(story => {
          if (!keywordUsers[story.keyword]) {
            keywordUsers[story.keyword] = new Set();
          }
          keywordUsers[story.keyword].add(story.user_id);
        });

        const keywords = Object.keys(keywordUsers);
        const connections: KeywordConnection[] = [];

        // 키워드 간 연결성 분석
        for (let i = 0; i < keywords.length; i++) {
          for (let j = i + 1; j < keywords.length; j++) {
            const keyword1 = keywords[i];
            const keyword2 = keywords[j];
            const users1 = keywordUsers[keyword1];
            const users2 = keywordUsers[keyword2];

            // 공통 사용자 수 계산
            const sharedUsers = new Set([...users1].filter(x => users2.has(x)));
            const sharedCount = sharedUsers.size;

            if (sharedCount < 2) continue; // 최소 2명 이상 공통 사용자

            // 상관관계 계산 (Jaccard 유사도)
            const unionSize = new Set([...users1, ...users2]).size;
            const correlation = (sharedCount / unionSize) * 100;

            // 연결 유형 결정
            let connectionType: 'strong' | 'unexpected' | 'emerging' = 'strong';
            let significance = correlation;

            // 예상치 못한 연결 판별 (키워드 길이나 특성 기반)
            const isUnexpected = (
              (keyword1.length <= 2 && keyword2.length >= 4) ||
              (keyword1.length >= 4 && keyword2.length <= 2) ||
              Math.abs(keyword1.length - keyword2.length) >= 3
            );

            if (isUnexpected && correlation > 30) {
              connectionType = 'unexpected';
              significance += 20; // 예상치 못한 연결에 보너스
            } else if (correlation > 70) {
              connectionType = 'strong';
            } else if (correlation > 40 && sharedCount >= 5) {
              connectionType = 'emerging';
              significance += 10;
            }

            connections.push({
              keyword1,
              keyword2,
              correlation: Math.round(correlation),
              shared_users: sharedCount,
              connection_type: connectionType,
              significance: Math.round(significance)
            });
          }
        }

        // 중요도 순으로 정렬하고 상위 10개 반환
        return connections
          .sort((a, b) => b.significance - a.significance)
          .slice(0, 10);

      } catch (error) {
        console.error('Error analyzing hidden connections:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

export const useGroupPsychology = () => {
  return useQuery({
    queryKey: ['group-psychology'],
    queryFn: async (): Promise<GroupPsychology> => {
      try {
        // 최근 24시간 데이터 분석
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: recentStories, error } = await supabase
          .from('stories')
          .select('keyword, impression, definition, created_at')
          .gte('created_at', yesterday.toISOString());

        if (error) throw error;

        if (!recentStories || recentStories.length === 0) {
          return {
            positive_sentiment: 50,
            active_discussions: 0,
            trending_keyword: '데이터 없음',
            mood_trend: 0,
            engagement_level: 'low'
          };
        }

        // 감정 분석
        const positiveWords = ['행복', '기쁨', '즐거', '좋은', '사랑', '희망', '감사', '만족', '웃음', '평화'];
        const negativeWords = ['슬픔', '아픔', '힘들', '어려', '고민', '걱정', '우울', '외로', '스트레스', '불안'];

        let positiveCount = 0;
        let totalSentimentWords = 0;

        recentStories.forEach(story => {
          const text = (story.impression + ' ' + story.definition).toLowerCase();
          const positives = positiveWords.filter(word => text.includes(word)).length;
          const negatives = negativeWords.filter(word => text.includes(word)).length;
          
          positiveCount += positives;
          totalSentimentWords += positives + negatives;
        });

        const positiveSentiment = totalSentimentWords > 0 
          ? Math.round((positiveCount / totalSentimentWords) * 100)
          : 50;

        // 트렌딩 키워드 (최근 24시간 가장 많이 언급)
        const keywordCounts: { [keyword: string]: number } = {};
        recentStories.forEach(story => {
          keywordCounts[story.keyword] = (keywordCounts[story.keyword] || 0) + 1;
        });

        const trendingKeyword = Object.entries(keywordCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '미래';

        // 활동 수준 계산
        const activeDiscussions = recentStories.length;
        const engagementLevel: 'low' | 'medium' | 'high' = 
          activeDiscussions < 10 ? 'low' :
          activeDiscussions < 50 ? 'medium' : 'high';

        // 기분 트렌드 (-1~1 사이)
        const moodTrend = (positiveSentiment - 50) / 50;

        return {
          positive_sentiment: positiveSentiment,
          active_discussions: activeDiscussions,
          trending_keyword: trendingKeyword,
          mood_trend: Math.max(-1, Math.min(1, moodTrend)),
          engagement_level: engagementLevel
        };

      } catch (error) {
        console.error('Error analyzing group psychology:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  });
};

export const useCollectiveWisdom = () => {
  return useQuery({
    queryKey: ['collective-wisdom'],
    queryFn: async (): Promise<CollectiveWisdom> => {
      try {
        // 전체 참여자 수
        const { data: participants, error: participantsError } = await supabase
          .from('stories')
          .select('user_id')
          .not('user_id', 'is', null);

        if (participantsError) throw participantsError;

        const uniqueParticipants = new Set(participants?.map(p => p.user_id) || []).size;

        // 전체 정의 수
        const { count: totalDefinitions, error: definitionsError } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true });

        if (definitionsError) throw definitionsError;

        // 키워드별 클러스터 분석
        const { data: keywordData, error: keywordError } = await supabase
          .from('stories')
          .select('keyword');

        if (keywordError) throw keywordError;

        const uniqueKeywords = new Set(keywordData?.map(k => k.keyword) || []).size;

        // 지식 밀도 계산 (정의 수 / 참여자 수)
        const knowledgeDensity = uniqueParticipants > 0 
          ? Math.round((totalDefinitions || 0) / uniqueParticipants * 10) / 10
          : 0;

        // 네트워크 클러스터 추정 (키워드 수의 60-80%)
        const networkClusters = Math.round(uniqueKeywords * 0.7);

        // 집단 지혜 점수 (종합 점수 0-100)
        const wisdomScore = Math.min(100, Math.round(
          (uniqueParticipants * 0.3) + 
          (Math.min(uniqueKeywords, 50) * 0.4) + 
          (Math.min(knowledgeDensity, 10) * 3)
        ));

        return {
          total_participants: uniqueParticipants,
          total_definitions: totalDefinitions || 0,
          network_clusters: networkClusters,
          knowledge_density: knowledgeDensity,
          wisdom_score: wisdomScore
        };

      } catch (error) {
        console.error('Error analyzing collective wisdom:', error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15분
    gcTime: 30 * 60 * 1000, // 30분
  });
};