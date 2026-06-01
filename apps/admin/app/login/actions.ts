'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '../../lib/supabase/server';

export async function sendMagicLink(formData: FormData): Promise<{ error?: string }> {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (!email.includes('@')) {
    return { error: 'Enter a valid email address.' };
  }

  const origin = (await headers()).get('origin') ?? 'http://localhost:3000';
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
