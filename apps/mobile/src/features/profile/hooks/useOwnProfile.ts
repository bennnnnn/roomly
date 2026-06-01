import { useQuery } from '@tanstack/react-query';

import { fetchOwnProfile } from '../api/ownProfile';

export function useOwnProfile(enabled: boolean) {
  return useQuery({
    queryKey: ['profile', 'own'],
    queryFn: fetchOwnProfile,
    enabled,
  });
}
