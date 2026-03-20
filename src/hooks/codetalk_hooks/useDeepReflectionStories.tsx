import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReflectionStory {
  id: string;
  keyword: string;
  definition: string;
  impression: string;
  user_id: string;
  created_at: string;
  // 추가 계산 필드
  sentiment?: 'positive' | 'negative' | 'neutral';
  depth_score?: number;
}

export const useDeepReflectionStories = () => {
  return useQuery({
    queryKey: ['deep-reflection-stories'],
    queryFn: async (): Promise<ReflectionStory[]> => {
      try {
        // 최근 3일간의 스토리 중에서 깊이 있는 사색을 보여주는 것들을 선별
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: stories, error } = await supabase
          .from('stories')
          .select('*')
          .gte('created_at', threeDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (!stories || stories.length === 0) {
          return [];
        }

        // 스토리를 분석하여 깊이 점수 계산
        const analyzedStories = stories.map(story => {
          const impressionLength = story.impression?.length || 0;
          const definitionLength = story.definition?.length || 0;
          const hasPersonalExperience = /나는|내가|저는|제가|경험|느꼈|생각했|기억/.test(story.impression || '');
          const hasEmotionalDepth = /감정|마음|느낌|울었|웃었|행복|슬픔|기쁨|아픔|고민|생각/.test(story.impression || '');
          const hasPhilosophicalThinking = /인생|삶|의미|가치|존재|철학|깨달|성장|변화|배웠/.test(story.impression || '');
          
          // 깊이 점수 계산 (0-100)
          let depthScore = 0;
          
          // 길이 점수 (최대 30점)
          depthScore += Math.min(impressionLength / 20, 20);
          depthScore += Math.min(definitionLength / 10, 10);
          
          // 개인적 경험 (20점)
          if (hasPersonalExperience) depthScore += 20;
          
          // 감정적 깊이 (25점)
          if (hasEmotionalDepth) depthScore += 25;
          
          // 철학적 사고 (25점)
          if (hasPhilosophicalThinking) depthScore += 25;
          
          // 감정 분석 (간단한 키워드 기반)
          const positiveWords = ['행복', '기쁨', '즐거', '좋은', '사랑', '희망', '감사', '만족'];
          const negativeWords = ['슬픔', '아픔', '힘들', '어려', '고민', '걱정', '우울', '외로'];
          
          const text = (story.impression + ' ' + story.definition).toLowerCase();
          const positiveCount = positiveWords.filter(word => text.includes(word)).length;
          const negativeCount = negativeWords.filter(word => text.includes(word)).length;
          
          let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          if (positiveCount > negativeCount) sentiment = 'positive';
          else if (negativeCount > positiveCount) sentiment = 'negative';

          return {
            ...story,
            depth_score: Math.round(depthScore),
            sentiment
          };
        });

        // 깊이 점수 순으로 정렬하고 상위 6개 선택
        const topStories = analyzedStories
          .filter(story => story.depth_score >= 40) // 최소 깊이 점수
          .sort((a, b) => b.depth_score - a.depth_score)
          .slice(0, 6);

        // 다양성을 위해 키워드별로 중복 제거 (같은 키워드는 최대 2개까지)
        const keywordCounts: { [key: string]: number } = {};
        const diverseStories = topStories.filter(story => {
          const count = keywordCounts[story.keyword] || 0;
          if (count < 2) {
            keywordCounts[story.keyword] = count + 1;
            return true;
          }
          return false;
        });

        return diverseStories.slice(0, 4); // 최종 4개 선택
      } catch (error) {
        console.error('Error fetching deep reflection stories:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};