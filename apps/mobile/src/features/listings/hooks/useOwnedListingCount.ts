import { useQuery } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabaseClient';

export function useOwnedListingCount(enabled: boolean) {
  return useQuery({
    queryKey: ['listings', 'owned-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
    enabled,
    staleTime: 60_000,
  });
}
