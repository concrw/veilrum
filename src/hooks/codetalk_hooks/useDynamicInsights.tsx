import { useMemo } from 'react';

export interface DynamicInsight {
  id: string;
  text: string;
  type: 'correlation' | 'pattern' | 'trend' | 'anomaly';
  confidence: number;
}

interface KeywordDataItem {
  keyword: string;
  definitions: number;
  diversity: number;
}

interface DiversityStats {
  mostConsensus?: { keyword: string; diversity: number };
  mostDiverse?: { keyword: string; diversity: number };
  totalKeywords: number;
  consensusKeywords: number;
  balancedKeywords: number;
  diverseKeywords: number;
}

interface EmotionDataItem {
  keyword: string;
  positive: number;
  negative: number;
  neutral: number;
}

export const useDynamicInsights = (
  keywordData: KeywordDataItem[] | undefined,
  diversityStats: DiversityStats | undefined,
  emotionData: EmotionDataItem[] | undefined
) => {
  return useMemo(() => {
    if (!keywordData || keywordData.length === 0) {
      return [];
    }

    const insights: DynamicInsight[] = [];

    // 1. 정의 수와 다양성의 상관관계 분석
    if (keywordData.length >= 5) {
      const highDefLowDiv = keywordData.filter(k => k.definitions >= 10 && k.diversity < 70);
      const lowDefHighDiv = keywordData.filter(k => k.definitions < 5 && k.diversity > 85);
      
      if (highDefLowDiv.length > 0) {
        const example = highDefLowDiv[0];
        insights.push({
          id: 'def-diversity-inverse',
          text: `정의가 많다고 항상 다양한 것은 아님: '${example.keyword}'는 ${example.definitions}개 정의지만 다양성 ${example.diversity}%`,
          type: 'correlation',
          confidence: 0.8
        });
      }

      if (lowDefHighDiv.length > 0) {
        const example = lowDefHighDiv[0];
        insights.push({
          id: 'few-def-high-div',
          text: `적은 정의도 매우 다양할 수 있음: '${example.keyword}'는 ${example.definitions}개 정의로 다양성 ${example.diversity}%`,
          type: 'anomaly',
          confidence: 0.7
        });
      }
    }

    // 2. 키워드 길이와 다양성의 패턴
    if (keywordData.length >= 8) {
      const shortKeywords = keywordData.filter(k => k.keyword.length <= 2);
      const longKeywords = keywordData.filter(k => k.keyword.length >= 4);
      
      if (shortKeywords.length >= 3 && longKeywords.length >= 3) {
        const avgShortDiv = shortKeywords.reduce((sum, k) => sum + k.diversity, 0) / shortKeywords.length;
        const avgLongDiv = longKeywords.reduce((sum, k) => sum + k.diversity, 0) / longKeywords.length;
        
        if (Math.abs(avgShortDiv - avgLongDiv) > 10) {
          const comparison = avgShortDiv > avgLongDiv ? '짧은 단어가 더 다양' : '긴 단어가 더 다양';
          const examples = avgShortDiv > avgLongDiv 
            ? shortKeywords.slice(0, 2).map(k => k.keyword).join(', ')
            : longKeywords.slice(0, 2).map(k => k.keyword).join(', ');
          
          insights.push({
            id: 'length-diversity-pattern',
            text: `${comparison}한 해석을 받는 경향: '${examples}' 등이 대표적`,
            type: 'pattern',
            confidence: 0.6
          });
        }
      }
    }

    // 3. 극단적인 합의 vs 극단적인 다양성
    if (diversityStats?.mostConsensus && diversityStats?.mostDiverse) {
      const consensusGap = diversityStats.mostDiverse.diversity - diversityStats.mostConsensus.diversity;
      if (consensusGap > 30) {
        insights.push({
          id: 'consensus-diversity-gap',
          text: `가장 합의된 '${diversityStats.mostConsensus.keyword}'(${diversityStats.mostConsensus.diversity}%)와 가장 논란인 '${diversityStats.mostDiverse.keyword}'(${diversityStats.mostDiverse.diversity}%) 사이 ${consensusGap}%p 차이`,
          type: 'trend',
          confidence: 0.9
        });
      }
    }

    // 4. 감정 데이터와 키워드 다양성의 관계
    if (emotionData && emotionData.length > 0 && keywordData.length > 0) {
      const positiveKeywords = keywordData.filter(k => {
        const emotion = emotionData.find(e => e.keyword === k.keyword);
        return emotion && (emotion.positive > emotion.negative && emotion.positive > emotion.neutral);
      });
      
      if (positiveKeywords.length >= 3) {
        const avgPositiveDiv = positiveKeywords.reduce((sum, k) => sum + k.diversity, 0) / positiveKeywords.length;
        const avgOverallDiv = keywordData.reduce((sum, k) => sum + k.diversity, 0) / keywordData.length;
        
        if (Math.abs(avgPositiveDiv - avgOverallDiv) > 8) {
          const tendency = avgPositiveDiv > avgOverallDiv ? '더 다양한' : '더 일치된';
          insights.push({
            id: 'emotion-diversity-relation',
            text: `긍정적 키워드들이 ${tendency} 해석을 받는 경향 (평균 ${avgPositiveDiv.toFixed(1)}% vs 전체 ${avgOverallDiv.toFixed(1)}%)`,
            type: 'correlation',
            confidence: 0.7
          });
        }
      }
    }

    // 5. 분포의 균형성 분석
    if (diversityStats && diversityStats.totalKeywords >= 10) {
      const { consensusKeywords, balancedKeywords, diverseKeywords, totalKeywords } = diversityStats;
      const distribution = [
        { type: '합의형', count: consensusKeywords },
        { type: '균형형', count: balancedKeywords },
        { type: '다양형', count: diverseKeywords }
      ].sort((a, b) => b.count - a.count);
      
      const dominant = distribution[0];
      const percentage = Math.round((dominant.count / totalKeywords) * 100);
      
      if (percentage > 50) {
        insights.push({
          id: 'distribution-dominance',
          text: `${dominant.type} 키워드가 전체의 ${percentage}%를 차지하며 지배적 (${dominant.count}/${totalKeywords}개)`,
          type: 'trend',
          confidence: 0.8
        });
      } else if (Math.abs(consensusKeywords - diverseKeywords) <= 2) {
        insights.push({
          id: 'balanced-distribution',
          text: `합의형과 다양형이 균형을 이루며 집단지성의 건전한 다양성을 보여줌`,
          type: 'pattern',
          confidence: 0.9
        });
      }
    }

    // confidence 순으로 정렬하고 상위 4개만 반환
    return insights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4);
  }, [keywordData, diversityStats, emotionData]);
};