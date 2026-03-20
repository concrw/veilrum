import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCohortStories = (cohortId?: string, keywordId?: string) => {
  return useQuery({
    queryKey: ['cohort-stories', cohortId, keywordId],
    queryFn: async () => {
      if (!cohortId) return [];

      // Fetch user stories
      const storiesQuery = supabase
        .from('stories')
        .select('id, keyword, definition, impression, created_at, user_id')
        .eq('cohort_id', cohortId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Note: cohort_keyword_id filtering temporarily disabled due to RLS issues
      // Filter will be applied after fetching if needed

      const { data: realStories, error: storiesError } = await storiesQuery;
      if (storiesError) throw storiesError;

      // Fetch ghost stories
      const ghostQuery = supabase
        .from('ghost_stories')
        .select(`
          id,
          keyword,
          definition,
          impression,
          created_at,
          ghost_user_id,
          ghost_users (
            name
          )
        `)
        .eq('cohort_id', cohortId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      const { data: ghostStories, error: ghostError } = await ghostQuery;
      if (ghostError) throw ghostError;

      // Combine and format stories
      const allStories = [
        ...(realStories || []).map((story, index) => ({
          id: story.id,
          keyword: story.keyword,
          definition: story.definition,
          memory: story.impression,
          author: `사용자${String((index % 99) + 1).padStart(3, '0')}`,
          reactions: Math.floor(Math.random() * 20) + 1,
          createdAt: story.created_at,
          isGhost: false,
        })),
        ...(ghostStories || []).map((story: any) => ({
          id: story.id,
          keyword: story.keyword,
          definition: story.definition,
          memory: story.impression,
          author: story.ghost_users?.name || '익명',
          reactions: Math.floor(Math.random() * 20) + 1,
          createdAt: story.created_at,
          isGhost: true,
        })),
      ].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return allStories;
    },
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
