import { useQuery } from '@tanstack/react-query';

import { fetchFavoriteIds } from '../api/favorites';
import { fetchBrowseListings } from '../api/fetchBrowseListings';
import { useBrowseFilterStore } from '../stores/browseFilterStore';

export function useBrowseListings() {
  const filters = useBrowseFilterStore((s) => s.filters);
  const location = useBrowseFilterStore((s) => s.location);

  // Fetch favorite IDs only when the user is signed in.
  // We swallow errors so browsing works even when not authenticated.
  const favQuery = useQuery({
    queryKey: ['favorites', 'ids'],
    queryFn: fetchFavoriteIds,
    staleTime: 30_000,
    retry: false,
  });

  return useQuery({
    queryKey: ['listings', 'browse', filters, location],
    queryFn: () =>
      fetchBrowseListings({
        filters,
        location:
          location && location.lat !== 0 && location.lng !== 0
            ? { lat: location.lat, lng: location.lng }
            : null,
        favoriteIds: favQuery.data,
      }),
    // Keep previous data while fetching to avoid layout shifts
    placeholderData: (prev) => prev,
  });
}
