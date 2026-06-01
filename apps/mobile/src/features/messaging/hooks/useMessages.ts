import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { supabase } from '../../../lib/supabaseClient';
import { fetchMessages } from '../api/messaging';

import type { MessageItem } from '../types';

export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      if (!conversationId) throw new Error('Missing conversation ID');
      return fetchMessages(conversationId);
    },
    enabled: Boolean(conversationId),
    staleTime: 5_000,
  });

  // Realtime subscription for new messages in this conversation.
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          queryClient.setQueryData(
            ['messages', conversationId],
            (old: MessageItem[] | undefined) => {
              const existing = old ?? [];
              const alreadyExists = existing.some((m) => m.id === row.id);
              if (alreadyExists) return existing;

              return [
                ...existing,
                {
                  id: row.id as string,
                  conversationId: row.conversation_id as string,
                  senderId: row.sender_id as string,
                  body: row.body as string,
                  createdAt: row.created_at as string,
                  // The subscriber is always the local user; messages from
                  // Realtime are always from the other party.
                  isMine: false,
                },
              ];
            },
          );
        },
      )
      .subscribe();

    subRef.current = channel;

    return () => {
      void channel.unsubscribe();
    };
  }, [conversationId, queryClient]);

  const addOptimistic = useCallback(
    (msg: MessageItem) => {
      queryClient.setQueryData(['messages', conversationId], (old: MessageItem[] | undefined) => [
        ...(old ?? []),
        msg,
      ]);
    },
    [conversationId, queryClient],
  );

  return { ...query, addOptimistic };
}
