import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cohort } from '@/types/cohorts';

export const useCohorts = () => {
  return useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Cohort[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
