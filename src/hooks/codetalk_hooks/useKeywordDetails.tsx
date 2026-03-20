import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KeywordDefinition {
  text: string;
  author: string;
  likes: number;
  emotion: string;
  impression: string;
  createdAt: string;
}

export interface KeywordInsights {
  mostCommonEmotion: string;
  averageLikes: number;
  uniqueAuthors: number;
  totalDefinitions: number;
  averageLength: number;
}

export interface KeywordDetails {
  keyword: string;
  definitions: KeywordDefinition[];
  insights: KeywordInsights;
}

// 간단한 감정 분석 함수 (useEmotionAnalysis에서 가져온 것과 동일)
const analyzeEmotion = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  const positiveWords = [
    "좋", "행복", "기쁘", "즐거", "사랑", "웃", "감사", "희망", "따뜻", "평화",
    "만족", "축복", "아름다", "소중", "감동", "달콤", "흥미", "신나", "멋지", "훌륭"
  ];
  
  const negativeWords = [
    "슬프", "우울", "화", "짜증", "분노", "실망", "절망", "괴로", "아프", "힘들",
    "어려", "무서", "두려", "걱정", "불안", "스트레스", "피곤", "지치", "외로", "쓸쓸"
  ];
  
  const complexWords = [
    "복잡", "복합", "미묘", "애매", "혼란", "갈등", "모순", "딜레마", "양면", "그리워"
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let complexCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  complexWords.forEach(word => {
    if (lowerText.includes(word)) complexCount++;
  });
  
  if (complexCount > 0 || (positiveCount > 0 && negativeCount > 0)) {
    return "복합";
  }
  
  if (negativeCount > positiveCount) {
    return "부정";
  }
  
  if (positiveCount > 0) {
    return "긍정";
  }
  
  return "중성";
};

export const useKeywordDetails = (keyword: string) => {
  return useQuery({
    queryKey: ["keywordDetails", keyword],
    queryFn: async (): Promise<KeywordDetails | null> => {
      if (!keyword) return null;

      try {
        const { data: stories, error } = await supabase
          .from("stories")
          .select("definition, impression, user_id, created_at")
          .eq("keyword", keyword)
          .not("definition", "is", null)
          .not("impression", "is", null)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching keyword details:", error);
          throw error;
        }

        if (!stories || stories.length === 0) {
          return {
            keyword,
            definitions: [],
            insights: {
              mostCommonEmotion: "중성",
              averageLikes: 0,
              uniqueAuthors: 0,
              totalDefinitions: 0,
              averageLength: 0,
            },
          };
        }

        // 정의들을 정리하고 감정 분석
        const definitions: KeywordDefinition[] = stories.map((story, index) => {
          const emotion = analyzeEmotion(story.impression);
          const likes = Math.floor(Math.random() * 20) + 1; // 임시로 랜덤 좋아요 수

          return {
            text: story.definition,
            author: "익명", // 개인정보 보호를 위해 익명 처리
            likes,
            emotion,
            impression: story.impression,
            createdAt: story.created_at,
          };
        });

        // 정의들을 좋아요 순으로 정렬하고 상위 4개만 선택
        const sortedDefinitions = definitions
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 4);

        // 인사이트 계산
        const emotionCounts = {
          긍정: 0,
          중성: 0,
          부정: 0,
          복합: 0,
        };

        definitions.forEach((def) => {
          emotionCounts[def.emotion as keyof typeof emotionCounts]++;
        });

        const mostCommonEmotion = Object.entries(emotionCounts).reduce((a, b) =>
          emotionCounts[a[0] as keyof typeof emotionCounts] > emotionCounts[b[0] as keyof typeof emotionCounts] ? a : b
        )[0];

        const averageLikes = Math.round(
          definitions.reduce((sum, def) => sum + def.likes, 0) / definitions.length
        );

        const uniqueAuthors = new Set(stories.map((s) => s.user_id)).size;

        const averageLength = Math.round(
          definitions.reduce((sum, def) => sum + def.text.length, 0) / definitions.length
        );

        return {
          keyword,
          definitions: sortedDefinitions,
          insights: {
            mostCommonEmotion,
            averageLikes,
            uniqueAuthors,
            totalDefinitions: definitions.length,
            averageLength,
          },
        };
      } catch (error) {
        console.error("Error processing keyword details:", error);
        return null;
      }
    },
    enabled: !!keyword,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};