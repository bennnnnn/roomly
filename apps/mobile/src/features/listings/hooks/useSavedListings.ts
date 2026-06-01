import { useQuery } from '@tanstack/react-query';

import { fetchSavedListings } from '../api/fetchSavedListings';

export function useSavedListings() {
  return useQuery({
    queryKey: ['listings', 'saved'],
    queryFn: fetchSavedListings,
    staleTime: 30_000,
  });
}
