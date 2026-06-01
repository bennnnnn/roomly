/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
// ^ Messaging tables (Slice 5 migration) aren't in the generated Database type
//   yet. Remove this disable once pnpm db:types runs after the migration is applied.

import { supabase } from '../../../lib/supabaseClient';

import type { ConversationItem, MessageItem } from '../types';

/**
 * Helper: returns a weakly-typed view of the supabase client for tables that
 * the generated Database type hasn't picked up yet (migration not yet applied
 * locally when `pnpm db:types` was last run).
 *
 * Remove this once migration 20260601160000_messaging is applied and types
 * are regenerated.
 */
function db(): Record<string, any> {
  // We cast through unknown so the strongly-typed client for registered tables
  // is still available everywhere else.
  return supabase;
}

interface ConvRow {
  conversation_id: string;
  conversations: {
    id: string;
    listing_id: string;
    last_message_at: string;
    listings: {
      id: string;
      title: string;
      listing_photos: {
        storage_path: string;
        is_cover: boolean;
        sort_order: number;
      }[];
    };
  };
}

export async function fetchConversations(): Promise<ConversationItem[]> {
  const { data, error } = await db()
    .from('conversation_participants')
    .select(
      `conversation_id, conversations!inner(id, listing_id, last_message_at, listings!inner(id, title, listing_photos(storage_path, is_cover, sort_order)))`,
    );

  if (error) throw error;
  const rows = (data ?? []) as unknown as ConvRow[];

  return rows.map((row) => {
    const conv = row.conversations;
    const listing = conv.listings;
    const photos = listing.listing_photos ?? [];

    const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
    const coverPath =
      sorted.find((p) => p.is_cover)?.storage_path ?? sorted[0]?.storage_path ?? null;

    return {
      id: conv.id,
      listingId: listing.id,
      listingTitle: listing.title,
      listingThumbnail: coverPath,
      otherUserId: '',
      otherUserName: '',
      lastMessage: null,
      lastMessageAt: conv.last_message_at,
      unreadCount: 0,
    };
  });
}

interface MsgRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export async function fetchMessages(conversationId: string, limit = 50): Promise<MessageItem[]> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id ?? '';

  const { data, error } = await db()
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  const rows = (data ?? []) as unknown as MsgRow[];

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    isMine: row.sender_id === myId,
  }));
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageItem> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) throw new Error('Sign in to send messages');

  const { data, error } = await db()
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: myId,
      body,
    })
    .select('id, conversation_id, sender_id, body, created_at')
    .single();

  if (error) throw error;
  const row = data as unknown as MsgRow;

  // Bump last_message_at on the conversation
  await db()
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    isMine: true,
  };
}
