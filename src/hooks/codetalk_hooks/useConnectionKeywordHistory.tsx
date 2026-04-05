import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KeywordStoryPair {
  keyword: string;
  date: string;
  partnerStory: {
    id: string;
    definition: string;
    impression: string;
    created_at: string;
  } | null;
  myStory: {
    id: string;
    definition: string;
    impression: string;
    created_at: string;
  } | null;
}

export const useConnectionKeywordHistory = (partnerId: string, currentUserId: string) => {
  return useQuery({
    queryKey: ["connection-keyword-history", partnerId, currentUserId],
    queryFn: async () => {
      if (!partnerId || !currentUserId) return [];

      // 지난 7일간의 키워드들 가져오기
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // 두 사용자의 스토리들을 가져오기
      const { data: stories, error } = await supabase
        .from("stories")
        .select("*")
        .in("user_id", [partnerId, currentUserId])
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching keyword history:', error);
        return [];
      }

      // 키워드별로 그룹화
      const keywordGroups: { [key: string]: NonNullable<typeof stories>[number][] } = {};
      stories?.forEach(story => {
        const storyDate = new Date(story.created_at).toISOString().split('T')[0];
        const dateKey = `${story.keyword}|${storyDate}`; // 하이픈 대신 | 사용
        if (!keywordGroups[dateKey]) {
          keywordGroups[dateKey] = [];
        }
        keywordGroups[dateKey].push(story);
      });

      // KeywordStoryPair 형태로 변환
      const result: KeywordStoryPair[] = Object.entries(keywordGroups)
        .map(([key, stories]) => {
          const pipeIndex = key.lastIndexOf('|');
          const keyword = key.substring(0, pipeIndex);
          const date = key.substring(pipeIndex + 1);
          const partnerStory = stories.find(s => s.user_id === partnerId);
          const myStory = stories.find(s => s.user_id === currentUserId);
          
          // 두 사람이 모두 작성한 키워드만 반환
          if (!partnerStory || !myStory) return null;

          return {
            keyword,
            date,
            partnerStory: {
              id: partnerStory.id,
              definition: partnerStory.definition,
              impression: partnerStory.impression,
              created_at: partnerStory.created_at
            },
            myStory: {
              id: myStory.id,
              definition: myStory.definition,
              impression: myStory.impression,
              created_at: myStory.created_at
            }
          };
        })
        .filter((item): item is KeywordStoryPair => item !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return result;
    },
    enabled: !!partnerId && !!currentUserId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};