import { useQuery } from '@tanstack/react-query';

import { fetchPublicProfile } from '../api/fetchPublicProfile';

export function usePublicProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'public', userId],
    queryFn: () => fetchPublicProfile(userId ?? ''),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
