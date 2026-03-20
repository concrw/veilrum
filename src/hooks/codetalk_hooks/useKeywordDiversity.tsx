import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KeywordDiversityData {
  keyword: string;
  diversity: number;
  definitions: number;
  averageLength: number;
  uniqueUsers: number;
}

export const useKeywordDiversity = () => {
  return useQuery({
    queryKey: ['keywordDiversity'],
    queryFn: async (): Promise<KeywordDiversityData[]> => {
      try {
        // Get all stories with their keywords
        const { data: stories, error } = await supabase
          .from('stories')
          .select('keyword, definition, impression, user_id')
          .not('keyword', 'is', null);

        if (error) {
          console.error('Error fetching stories for diversity analysis:', error);
          throw error;
        }

        if (!stories || stories.length === 0) {
          return [];
        }

        // Group stories by keyword
        const keywordGroups = stories.reduce((acc, story) => {
          if (!acc[story.keyword]) {
            acc[story.keyword] = [];
          }
          acc[story.keyword].push(story);
          return acc;
        }, {} as Record<string, typeof stories>);

        // Calculate diversity for each keyword
        const diversityData: KeywordDiversityData[] = Object.entries(keywordGroups).map(([keyword, keywordStories]) => {
          const definitions = keywordStories.length;
          
          // Calculate text similarity-based diversity
          const definitionTexts = keywordStories.map(s => s.definition.toLowerCase().trim());
          const impressionTexts = keywordStories.map(s => s.impression.toLowerCase().trim());
          
          // Simple diversity calculation based on unique text patterns
          const uniqueDefinitions = new Set(definitionTexts).size;
          const uniqueImpressions = new Set(impressionTexts).size;
          const uniqueUsers = new Set(keywordStories.map(s => s.user_id)).size;
          
          // Diversity score based on uniqueness ratio and text length variance
          const avgDefinitionLength = definitionTexts.reduce((sum, text) => sum + text.length, 0) / definitionTexts.length;
          const avgImpressionLength = impressionTexts.reduce((sum, text) => sum + text.length, 0) / impressionTexts.length;
          
          // Calculate variance in text lengths
          const defLengthVariance = definitionTexts.reduce((sum, text) => sum + Math.pow(text.length - avgDefinitionLength, 2), 0) / definitionTexts.length;
          const impLengthVariance = impressionTexts.reduce((sum, text) => sum + Math.pow(text.length - avgImpressionLength, 2), 0) / impressionTexts.length;
          
          // Diversity calculation (0-100%)
          const uniquenessRatio = (uniqueDefinitions + uniqueImpressions) / (definitions * 2);
          const lengthDiversityFactor = Math.min((Math.sqrt(defLengthVariance + impLengthVariance) / 100), 1);
          const userDiversityFactor = uniqueUsers / definitions;
          
          const diversity = Math.min(
            Math.round((uniquenessRatio * 40 + lengthDiversityFactor * 30 + userDiversityFactor * 30) * 100),
            100
          );

          return {
            keyword,
            diversity,
            definitions,
            averageLength: Math.round((avgDefinitionLength + avgImpressionLength) / 2),
            uniqueUsers
          };
        });

        // Sort by diversity descending
        return diversityData.sort((a, b) => b.diversity - a.diversity);
      } catch (error) {
        console.error('Error calculating keyword diversity:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10분 - 다양성 분석은 계산이 복잡하므로 캐시 오래 유지
    gcTime: 30 * 60 * 1000, // 30분
  });
};

export const useKeywordDiversityStats = (diversityData?: KeywordDiversityData[]) => {
  return useQuery({
    queryKey: ['keywordDiversityStats', diversityData],
    queryFn: async () => {
      try {
        if (!diversityData || diversityData.length === 0) {
          return {
            consensusKeywords: 0,
            balancedKeywords: 0,
            diverseKeywords: 0,
            mostConsensus: null,
            mostDiverse: null,
            mostBalanced: null,
            totalKeywords: 0
          };
        }

        const consensusKeywords = diversityData.filter(k => k.diversity < 70);
        const balancedKeywords = diversityData.filter(k => k.diversity >= 70 && k.diversity < 85);
        const diverseKeywords = diversityData.filter(k => k.diversity >= 85);

        // Find specific keywords for insights
        const mostConsensus = consensusKeywords.length > 0 
          ? consensusKeywords.reduce((prev, curr) => prev.diversity < curr.diversity ? prev : curr)
          : null;

        const mostDiverse = diverseKeywords.length > 0
          ? diverseKeywords.reduce((prev, curr) => prev.diversity > curr.diversity ? prev : curr)
          : null;

        const mostBalanced = balancedKeywords.length > 0
          ? balancedKeywords.reduce((prev, curr) => 
              Math.abs(prev.diversity - 77.5) < Math.abs(curr.diversity - 77.5) ? prev : curr
            )
          : null;

        return {
          consensusKeywords: consensusKeywords.length,
          balancedKeywords: balancedKeywords.length,
          diverseKeywords: diverseKeywords.length,
          mostConsensus,
          mostDiverse,
          mostBalanced,
          totalKeywords: diversityData.length
        };
      } catch (error) {
        console.error('Error calculating diversity stats:', error);
        return {
          consensusKeywords: 0,
          balancedKeywords: 0,
          diverseKeywords: 0,
          mostConsensus: null,
          mostDiverse: null,
          mostBalanced: null,
          totalKeywords: 0
        };
      }
    },
    enabled: !!diversityData,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};