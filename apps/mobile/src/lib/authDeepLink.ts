import * as Linking from 'expo-linking';

import { logger } from './logger';
import { supabase } from './supabaseClient';

/** Parses Supabase auth redirect URLs (magic link / OAuth) and stores the session. */
export async function createSessionFromUrl(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  const params = parsed.queryParams ?? {};

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

  if (!accessToken || !refreshToken) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    logger.error('auth deep link setSession failed', { message: error.message });
    throw error;
  }
}
