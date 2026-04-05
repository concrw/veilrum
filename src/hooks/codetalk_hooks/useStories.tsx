import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Story {
  id: string;
  keyword: string;
  definition: string;
  memory: string;
  author: string;
  reactions: number;
}

export const useStories = (keyword?: string) => {
  return useQuery({
    queryKey: ['stories', keyword],
    queryFn: async () => {
      try {
        // 실제 사용자 스토리만 조회 (보안 강화)
        let query = supabase
          .from('stories')
          .select('id, keyword, definition, impression, created_at')
          .order('created_at', { ascending: false });

        // Filter by keyword if provided
        if (keyword) {
          query = query.eq('keyword', keyword);
        }

        const { data: realStories, error: realError } = await query;
        
        if (realError) {
          console.warn('실제 스토리 조회 오류:', realError.message);
        }

        // 가상 스토리 조회 (개인정보 노출 방지)
        let ghostQuery = supabase
          .from('ghost_stories')
          .select('id, keyword, definition, impression, created_at')
          .order('created_at', { ascending: false });

        if (keyword) {
          ghostQuery = ghostQuery.eq('keyword', keyword);
        }

        const { data: ghostStories, error: ghostError } = await ghostQuery;
        
        if (ghostError) {
          console.warn('가상 스토리 조회 오류:', ghostError.message);
        }

        // 모든 스토리 합치기 (개인정보는 포함하지 않음)
        const allStories = [
          ...(realStories || []),
          ...(ghostStories || [])
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Transform database data to match Story interface
        const transformedStories: Story[] = allStories.map((story, index) => ({
          id: story.id,
          keyword: story.keyword,
          definition: story.definition,
          memory: story.impression,
          author: `사용자${String((index % 99) + 1).padStart(3, '0')}`, // 안전한 익명 표시
          reactions: Math.floor(Math.random() * 20) + 1
        }));

        console.log(`📚 스토리 조회 완료: 실제 ${realStories?.length || 0}개, 가상 ${ghostStories?.length || 0}개`);
        
        return transformedStories;

      } catch (error: unknown) {
        console.error('스토리 조회 완전 실패:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Deprecated hook - RPC 함수 사용 중단
export const useTodayKeyword = () => {
  return useQuery({
    queryKey: ['todayKeyword'],
    queryFn: async () => {
      try {
        // RPC 함수 대신 직접 DB 쿼리 사용 (보안 및 안정성)
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('daily_keywords')
          .select('keyword')
          .eq('date', today)
          .limit(1);

        if (error) {
          console.warn('오늘 키워드 조회 오류:', error.message);
          return "외면";
        }

        return data?.[0]?.keyword || "외면";

      } catch (error: unknown) {
        console.error('오늘 키워드 조회 실패:', error);
        return "외면";
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
