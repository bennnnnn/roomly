import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteOwnerListing,
  fetchOwnerListings,
  updateOwnerListingStatus,
} from '../api/ownerListings';

import type { ListingStatus } from '@roomly/db-types';

const QUERY_KEY = ['listings', 'mine'] as const;

export function useOwnerListings(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchOwnerListings,
    enabled,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      updateOwnerListingStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOwnerListing(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return { query, statusMutation, deleteMutation };
}
