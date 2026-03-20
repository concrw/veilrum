import { useMemo } from 'react';

export interface ReflectionQuestion {
  id: string;
  question: string;
  category: string;
  isNew: boolean;
  pattern: string; // 어떤 패턴에서 생성되었는지
}

export const usePersonalizedReflectionQuestions = (stories: any[]) => {
  return useMemo(() => {
    if (!stories || stories.length === 0) {
      return [];
    }

    const questions: ReflectionQuestion[] = [];

    // 1. 키워드 빈도 분석
    const keywordCounts: { [keyword: string]: number } = {};
    const keywordDates: { [keyword: string]: Date[] } = {};
    
    stories.forEach(story => {
      keywordCounts[story.keyword] = (keywordCounts[story.keyword] || 0) + 1;
      if (!keywordDates[story.keyword]) {
        keywordDates[story.keyword] = [];
      }
      keywordDates[story.keyword].push(new Date(story.created_at));
    });

    // 가장 자주 쓰는 키워드
    const mostFrequentKeyword = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostFrequentKeyword && mostFrequentKeyword[1] >= 2) {
      questions.push({
        id: 'frequent-keyword',
        question: `'${mostFrequentKeyword[0]}'을(를) ${mostFrequentKeyword[1]}번 정의하셨네요. 이 키워드가 현재 당신에게 특별한 의미를 갖는 이유는 무엇일까요?`,
        category: '빈도 패턴',
        isNew: true,
        pattern: 'most_frequent'
      });
    }

    // 2. 시간 패턴 분석 (최근 vs 과거)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentStories = stories.filter(story => new Date(story.created_at) >= oneWeekAgo);
    const olderStories = stories.filter(story => new Date(story.created_at) < oneWeekAgo);

    if (recentStories.length > 0 && olderStories.length > 0) {
      const recentKeywords = new Set(recentStories.map(s => s.keyword));
      const olderKeywords = new Set(olderStories.map(s => s.keyword));
      
      // 새롭게 등장한 키워드
      const newKeywords = [...recentKeywords].filter(k => !olderKeywords.has(k));
      if (newKeywords.length > 0) {
        const randomNewKeyword = newKeywords[Math.floor(Math.random() * newKeywords.length)];
        questions.push({
          id: 'new-keyword',
          question: `최근에 '${randomNewKeyword}'라는 키워드를 새롭게 정의하기 시작했네요. 이 변화를 이끈 계기나 경험은 무엇인가요?`,
          category: '변화 추적',
          isNew: true,
          pattern: 'new_emergence'
        });
      }

      // 사라진 키워드
      const disappearedKeywords = [...olderKeywords].filter(k => !recentKeywords.has(k));
      if (disappearedKeywords.length > 0) {
        const randomDisappeared = disappearedKeywords[Math.floor(Math.random() * disappearedKeywords.length)];
        questions.push({
          id: 'disappeared-keyword',
          question: `예전에 자주 정의하던 '${randomDisappeared}'를 최근에는 언급하지 않으시네요. 이 키워드에 대한 관심이나 관점이 바뀐 이유가 있을까요?`,
          category: '변화 추적',
          isNew: false,
          pattern: 'keyword_fade'
        });
      }
    }

    // 3. 감정 패턴 분석
    const positiveKeywords = ['사랑', '행복', '기쁨', '희망', '평화', '만족', '감사', '즐거움'];
    const negativeKeywords = ['슬픔', '걱정', '스트레스', '불안', '외로움', '화', '분노', '좌절'];
    const neutralKeywords = ['성장', '변화', '도전', '학습', '경험', '시간', '관계', '소통'];

    const userPositiveCount = stories.filter(s => positiveKeywords.includes(s.keyword)).length;
    const userNegativeCount = stories.filter(s => negativeKeywords.includes(s.keyword)).length;
    const userNeutralCount = stories.filter(s => neutralKeywords.includes(s.keyword)).length;

    const totalEmotionalStories = userPositiveCount + userNegativeCount + userNeutralCount;
    
    if (totalEmotionalStories >= 3) {
      const dominantEmotion = 
        userPositiveCount > userNegativeCount && userPositiveCount > userNeutralCount ? 'positive' :
        userNegativeCount > userPositiveCount && userNegativeCount > userNeutralCount ? 'negative' : 'neutral';

      if (dominantEmotion === 'positive') {
        questions.push({
          id: 'positive-pattern',
          question: `긍정적인 키워드들을 자주 정의하시는 편이네요. 현재 당신의 삶에서 이런 긍정적 에너지의 원천은 무엇인가요?`,
          category: '감정 패턴',
          isNew: false,
          pattern: 'positive_dominant'
        });
      } else if (dominantEmotion === 'negative') {
        questions.push({
          id: 'negative-pattern',
          question: `최근 어려움이나 고민과 관련된 키워드들을 많이 정의하셨네요. 이런 감정들을 정의하는 것이 당신에게 어떤 도움이 되고 있나요?`,
          category: '감정 패턴',
          isNew: true,
          pattern: 'negative_dominant'
        });
      } else {
        questions.push({
          id: 'balanced-pattern',
          question: `다양한 관점에서 균형잡힌 키워드들을 정의하고 계시네요. 이런 균형잡힌 사고가 일상에서 어떻게 도움이 되고 있나요?`,
          category: '사고 패턴',
          isNew: false,
          pattern: 'balanced_thinking'
        });
      }
    }

    // 4. 정의 길이 패턴 분석
    const avgDefinitionLength = stories.reduce((sum, story) => sum + (story.definition?.length || 0), 0) / stories.length;
    const avgImpressionLength = stories.reduce((sum, story) => sum + (story.impression?.length || 0), 0) / stories.length;

    if (avgDefinitionLength > 50 || avgImpressionLength > 100) {
      questions.push({
        id: 'detailed-reflection',
        question: `평소 키워드를 정의할 때 매우 구체적이고 자세하게 설명하시는 편이네요. 이렇게 깊이 있게 생각하는 습관은 언제부터 시작되었나요?`,
        category: '사고 스타일',
        isNew: false,
        pattern: 'detailed_thinker'
      });
    }

    // 5. 일관성 있는 키워드 재정의 패턴
    const repeatedKeywords = Object.entries(keywordCounts).filter(([, count]) => count >= 2);
    if (repeatedKeywords.length > 0) {
      const randomRepeated = repeatedKeywords[Math.floor(Math.random() * repeatedKeywords.length)];
      questions.push({
        id: 'redefinition-pattern',
        question: `'${randomRepeated[0]}'을(를) 여러 번 정의하셨는데, 각각의 정의를 비교해보면 어떤 변화나 성장이 보이나요?`,
        category: '성장 추적',
        isNew: true,
        pattern: 'redefinition'
      });
    }

    // 6. 기본 질문 (데이터가 부족할 때)
    if (questions.length === 0) {
      questions.push({
        id: 'basic-reflection',
        question: `지금까지 정의한 키워드들을 다시 살펴보며, 현재의 나를 가장 잘 표현하는 키워드는 무엇인가요?`,
        category: '자기 성찰',
        isNew: false,
        pattern: 'basic_reflection'
      });
    }

    // 최대 3개까지만 반환
    return questions.slice(0, 3);
  }, [stories]);
};