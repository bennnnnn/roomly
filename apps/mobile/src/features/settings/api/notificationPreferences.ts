import { supabase } from '../../../lib/supabaseClient';

export interface NotificationPreferences {
  new_message_push: boolean;
  listing_expiring_push: boolean;
  payment_receipt_email: boolean;
  marketing_opt_in: boolean;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Sign in to manage notifications');

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('new_message_push, listing_expiring_push, payment_receipt_email, marketing_opt_in')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return {
    new_message_push: data?.new_message_push ?? true,
    listing_expiring_push: data?.listing_expiring_push ?? true,
    payment_receipt_email: data?.payment_receipt_email ?? true,
    marketing_opt_in: data?.marketing_opt_in ?? false,
  };
}

export async function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Sign in to manage notifications');

  const { error } = await supabase
    .from('notification_preferences')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
}
