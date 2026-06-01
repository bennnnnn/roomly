import { supabase } from '../../../lib/supabaseClient';

export interface BlockedUserRow {
  blocked_id: string;
  created_at: string;
}

export async function fetchBlockedUsers(): Promise<BlockedUserRow[]> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) throw new Error('Sign in to view blocked users');

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', myId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function unblockUser(blockedId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const myId = userData?.user?.id;
  if (!myId) throw new Error('Sign in to unblock');

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', myId)
    .eq('blocked_id', blockedId);

  if (error) throw error;
}
