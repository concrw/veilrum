import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cohort } from '@/types/cohorts';

export const useUserCohorts = (userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-cohorts', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_cohorts')
        .select(`
          *,
          cohort:cohorts(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Extract cohorts from the joined data and sort by sort_order
      const cohorts = data
        .map(uc => uc.cohort as Cohort)
        .filter(Boolean)
        .sort((a, b) => a.sort_order - b.sort_order);

      return cohorts;
    },
    enabled: !!userId,
  });

  const joinCohort = useMutation({
    mutationFn: async (cohortId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_cohorts')
        .insert({ user_id: userId, cohort_id: cohortId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cohorts', userId] });
    },
  });

  const leaveCohort = useMutation({
    mutationFn: async (cohortId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_cohorts')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cohorts', userId] });
    },
  });

  return {
    ...query,
    joinCohort,
    leaveCohort,
  };
};
