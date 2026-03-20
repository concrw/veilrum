import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserCohortKeyword } from '@/types/cohorts';

export const useUserCohortKeywords = (userId?: string, date?: Date) => {
  return useQuery({
    queryKey: ['user-cohort-keywords', userId, date?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!userId) return [];

      const dateStr = date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .rpc('get_user_cohort_keywords', {
          p_user_id: userId,
          p_date: dateStr,
        });

      if (error) throw error;
      return data as UserCohortKeyword[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
