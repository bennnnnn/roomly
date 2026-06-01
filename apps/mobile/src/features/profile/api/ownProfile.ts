import { supabase } from '../../../lib/supabaseClient';

export interface OwnProfile {
  displayName: string;
  avatarUrl: string | null;
  accountType: 'individual' | 'company';
  isVerified: boolean;
}

export async function fetchOwnProfile(): Promise<OwnProfile> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Sign in to view your profile');

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, account_type, is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Profile not found');

  return {
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    accountType: data.account_type,
    isVerified: data.is_verified,
  };
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const trimmed = displayName.trim();
  if (trimmed.length < 1 || trimmed.length > 60) {
    throw new Error('Name must be 1–60 characters.');
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Sign in to update your profile');

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}
