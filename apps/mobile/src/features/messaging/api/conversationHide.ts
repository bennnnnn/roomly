import { supabase } from '../../../lib/supabaseClient';

/** Soft-hide a conversation for the current user (PRD "delete chat"). */
export async function hideConversation(conversationId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) throw new Error('Sign in to manage conversations');

  const { error } = await supabase.from('conversation_hidden').upsert({
    user_id: myId,
    conversation_id: conversationId,
  });

  if (error) throw error;
}

/** Hide every shared thread with a user (e.g. after block). */
export async function hideConversationsWithUser(otherUserId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) return;

  const { data: myRows, error: myError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', myId);

  if (myError) throw myError;

  const myConvoIds = (myRows ?? []).map((r) => r.conversation_id);
  if (myConvoIds.length === 0) return;

  const { data: sharedRows, error: sharedError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', otherUserId)
    .in('conversation_id', myConvoIds);

  if (sharedError) throw sharedError;

  const sharedIds = (sharedRows ?? []).map((r) => r.conversation_id);
  if (sharedIds.length === 0) return;

  const { error } = await supabase.from('conversation_hidden').upsert(
    sharedIds.map((conversation_id) => ({
      user_id: myId,
      conversation_id,
    })),
  );

  if (error) throw error;
}
