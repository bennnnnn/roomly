import { useQuery } from '@tanstack/react-query';

import { useUser } from '../../../state/session';
import { fetchListingDetail } from '../api/fetchListingDetail';

export function useListingDetail(id: string | undefined) {
  const user = useUser();
  return useQuery({
    queryKey: ['listing', id, user?.id ?? 'anon'],
    queryFn: () => fetchListingDetail(id ?? '', user?.id ?? null),
    enabled: Boolean(id),
  });
}
