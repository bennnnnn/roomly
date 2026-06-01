import { supabase } from '../../../lib/supabaseClient';

const REDIRECT = 'roomly://auth/callback';

/** Resend the signup verification email (PRD §3.15). Rate-limit in the UI. */
export async function resendVerificationEmail(email: string): Promise<{ error?: string }> {
  const trimmed = email.trim();
  if (!trimmed.includes('@')) {
    return { error: 'Enter a valid email address.' };
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmed,
    options: { emailRedirectTo: REDIRECT },
  });

  if (error) {
    return { error: error.message };
  }
  return {};
}
