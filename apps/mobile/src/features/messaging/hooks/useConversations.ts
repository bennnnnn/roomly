import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '../../../lib/supabaseClient';
import { fetchConversations } from '../api/messaging';

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    staleTime: 10_000,
    refetchInterval: 20_000,
  });

  // Scoped Realtime: refresh when this user's participant row changes (e.g. re-join).
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;

    void supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;

      channel = supabase
        .channel(`conversations-participant-${uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${uid}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: ['conversations'] });
          },
        )
        .subscribe();
    });

    return () => {
      void channel?.unsubscribe();
    };
  }, [queryClient]);

  return query;
}
