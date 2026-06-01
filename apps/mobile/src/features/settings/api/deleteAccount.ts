import { env } from '../../../lib/env';
import { supabase } from '../../../lib/supabaseClient';

function functionsBaseUrl(): string {
  return `${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
}

/** Permanently deletes the signed-in account (server-side). */
export async function deleteAccount(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Sign in to delete your account');

  const resp = await fetch(`${functionsBaseUrl()}/delete-account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!resp.ok) {
    const body = (await resp.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'delete_account_failed');
  }

  await supabase.auth.signOut();
}
