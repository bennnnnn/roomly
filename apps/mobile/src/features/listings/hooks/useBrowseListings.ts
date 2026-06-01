import { useQuery } from '@tanstack/react-query';

import { fetchBrowseListings } from '../api/fetchBrowseListings';

export function useBrowseListings() {
  return useQuery({
    queryKey: ['listings', 'browse'],
    queryFn: fetchBrowseListings,
  });
}
