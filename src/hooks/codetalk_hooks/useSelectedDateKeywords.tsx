import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSelectedDateKeywords = (selectedDate: Date, partnerId: string, currentUserId: string) => {
  return useQuery({
    queryKey: ["selected-date-keywords", selectedDate.toISOString().split('T')[0], partnerId, currentUserId],
    queryFn: async () => {
      if (!partnerId || !currentUserId) return null;

      const dateString = selectedDate.toISOString().split('T')[0];
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayString = nextDay.toISOString().split('T')[0];

      console.log('🔍 [useSelectedDateKeywords] 쿼리 시작:', {
        dateString,
        nextDayString,
        partnerId,
        currentUserId
      });

      // 선택된 날짜의 두 사용자 스토리를 각각 가져오기
      const { data: stories, error } = await supabase
        .from("stories")
        .select("*")
        .in("user_id", [partnerId, currentUserId])
        .gte("created_at", dateString)
        .lt("created_at", nextDayString)
        .order("created_at", { ascending: false });

      console.log('🔍 [useSelectedDateKeywords] 쿼리 결과:', {
        stories: stories?.length || 0,
        error,
        storiesData: stories
      });

      if (error) {
        console.error('Error fetching date keywords:', error);
        return null;
      }

      // 키워드별로 그룹화
      const keywordGroups: { [keyword: string]: NonNullable<typeof stories>[number][] } = {};
      stories?.forEach(story => {
        if (!keywordGroups[story.keyword]) {
          keywordGroups[story.keyword] = [];
        }
        keywordGroups[story.keyword].push(story);
      });

      console.log('🔍 [useSelectedDateKeywords] 키워드 그룹화:', keywordGroups);

      // 각 키워드에 대해 두 사용자의 스토리 매핑
      const result = Object.entries(keywordGroups).map(([keyword, keywordStories]) => {
        const partnerStory = keywordStories.find(s => s.user_id === partnerId);
        const myStory = keywordStories.find(s => s.user_id === currentUserId);
        
        return {
          keyword,
          date: dateString,
          partnerStory: partnerStory ? {
            id: partnerStory.id,
            definition: partnerStory.definition,
            impression: partnerStory.impression,
            created_at: partnerStory.created_at
          } : null,
          myStory: myStory ? {
            id: myStory.id,
            definition: myStory.definition,
            impression: myStory.impression,
            created_at: myStory.created_at
          } : null
        };
      });

      const finalResult = result.length > 0 ? result[0] : null; // 첫 번째 키워드 반환 (보통 하루에 하나의 키워드)
      
      console.log('🔍 [useSelectedDateKeywords] 최종 결과:', finalResult);
      
      return finalResult;
    },
    enabled: !!partnerId && !!currentUserId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};