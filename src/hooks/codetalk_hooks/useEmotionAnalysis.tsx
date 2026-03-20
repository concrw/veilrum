import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmotionDistribution {
  emotion: string;
  count: number;
  color: string;
}

export interface KeywordEmotionMatrix {
  keyword: string;
  긍정: number;
  중성: number;
  부정: number;
  복합: number;
}

// 간단한 감정 분석 함수
const analyzeEmotion = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  // 긍정 키워드들
  const positiveWords = [
    '좋', '행복', '기쁘', '즐거', '사랑', '웃', '감사', '희망', '따뜻', '평화',
    '만족', '축복', '아름다', '소중', '감동', '달콤', '흥미', '신나', '멋지', '훌륭',
    '완벽', '최고', '환상', '놀라', '흥분', '설레', '반가', '고마', '뿌듯', '자랑스러'
  ];
  
  // 부정 키워드들
  const negativeWords = [
    '슬프', '우울', '화', '짜증', '분노', '실망', '절망', '괴로', '아프', '힘들',
    '어려', '무서', '두려', '걱정', '불안', '스트레스', '피곤', '지치', '외로', '쓸쓸',
    '비참', '절절', '원망', '후회', '미안', '죄송', '부끄러', '창피', '억울', '답답'
  ];
  
  // 복합 감정 키워드들 (여러 감정이 섞인)
  const complexWords = [
    '복잡', '복합', '미묘', '애매', '혼란', '갈등', '모순', '딜레마', '양면',
    '그리워', '그립', '아쉬', '섞인', '뒤섞', '오묘', '이상', '묘한'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let complexCount = 0;
  
  // 각 감정 키워드 개수 세기
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  complexWords.forEach(word => {
    if (lowerText.includes(word)) complexCount++;
  });
  
  // 복합 감정이 있거나 긍정/부정이 모두 있으면 복합
  if (complexCount > 0 || (positiveCount > 0 && negativeCount > 0)) {
    return '복합';
  }
  
  // 부정이 더 많으면 부정
  if (negativeCount > positiveCount) {
    return '부정';
  }
  
  // 긍정이 있으면 긍정
  if (positiveCount > 0) {
    return '긍정';
  }
  
  // 아무것도 없으면 중성
  return '중성';
};

export const useEmotionAnalysis = () => {
  return useQuery({
    queryKey: ['emotionAnalysis'],
    queryFn: async (): Promise<EmotionDistribution[]> => {
      try {
        const { data: stories, error } = await supabase
          .from('stories')
          .select('impression')
          .not('impression', 'is', null);

        if (error) {
          console.error('Error fetching stories for emotion analysis:', error);
          throw error;
        }

        if (!stories || stories.length === 0) {
          return [
            { emotion: "긍정", count: 0, color: "#22c55e" },
            { emotion: "중성", count: 0, color: "#6b7280" },
            { emotion: "부정", count: 0, color: "#ef4444" },
            { emotion: "복합", count: 0, color: "#8b5cf6" },
          ];
        }

        // 감정별 카운트
        const emotionCounts = {
          긍정: 0,
          중성: 0,
          부정: 0,
          복합: 0
        };

        stories.forEach(story => {
          const emotion = analyzeEmotion(story.impression);
          emotionCounts[emotion as keyof typeof emotionCounts]++;
        });

        return [
          { emotion: "긍정", count: emotionCounts.긍정, color: "#22c55e" },
          { emotion: "중성", count: emotionCounts.중성, color: "#6b7280" },
          { emotion: "부정", count: emotionCounts.부정, color: "#ef4444" },
          { emotion: "복합", count: emotionCounts.복합, color: "#8b5cf6" },
        ];
      } catch (error) {
        console.error('Error in emotion analysis:', error);
        return [
          { emotion: "긍정", count: 0, color: "#22c55e" },
          { emotion: "중성", count: 0, color: "#6b7280" },
          { emotion: "부정", count: 0, color: "#ef4444" },
          { emotion: "복합", count: 0, color: "#8b5cf6" },
        ];
      }
    },
    staleTime: 15 * 60 * 1000, // 15분 - 감정 분석은 복잡한 계산이므로 캐시 오래 유지
    gcTime: 45 * 60 * 1000, // 45분
  });
};

export const useKeywordEmotionMatrix = () => {
  return useQuery({
    queryKey: ['keywordEmotionMatrix'],
    queryFn: async (): Promise<KeywordEmotionMatrix[]> => {
      try {
        const { data: stories, error } = await supabase
          .from('stories')
          .select('keyword, impression')
          .not('keyword', 'is', null)
          .not('impression', 'is', null);

        if (error) {
          console.error('Error fetching stories for keyword emotion matrix:', error);
          throw error;
        }

        if (!stories || stories.length === 0) {
          return [];
        }

        // 키워드별로 그룹화
        const keywordGroups = stories.reduce((acc, story) => {
          if (!acc[story.keyword]) {
            acc[story.keyword] = [];
          }
          acc[story.keyword].push(story.impression);
          return acc;
        }, {} as Record<string, string[]>);

        // 각 키워드별 감정 분포 계산
        const matrixData: KeywordEmotionMatrix[] = Object.entries(keywordGroups).map(([keyword, impressions]) => {
          const emotionCounts = {
            긍정: 0,
            중성: 0,
            부정: 0,
            복합: 0
          };

          impressions.forEach(impression => {
            const emotion = analyzeEmotion(impression);
            emotionCounts[emotion as keyof typeof emotionCounts]++;
          });

          const total = impressions.length;
          
          return {
            keyword,
            긍정: Math.round((emotionCounts.긍정 / total) * 100),
            중성: Math.round((emotionCounts.중성 / total) * 100),
            부정: Math.round((emotionCounts.부정 / total) * 100),
            복합: Math.round((emotionCounts.복합 / total) * 100),
          };
        });

        // 총 스토리 수가 많은 순으로 정렬
        return matrixData
          .filter(item => Object.values(keywordGroups[item.keyword]).length >= 2) // 최소 2개 이상의 스토리가 있는 키워드만
          .sort((a, b) => keywordGroups[b.keyword].length - keywordGroups[a.keyword].length)
          .slice(0, 10); // 상위 10개만
      } catch (error) {
        console.error('Error calculating keyword emotion matrix:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};