import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { createSessionFromUrl } from './authDeepLink';
import { logger } from './logger';
import { supabase } from './supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'roomly', path: 'auth/callback' });

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) {
    logger.warn('signInWithOAuth google failed', { code: error.code });
    return { error: error.message };
  }

  if (!data.url) {
    return { error: 'Could not start Google sign-in.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  const resultType = String(result.type);
  if (resultType === 'success' && 'url' in result && typeof result.url === 'string') {
    await createSessionFromUrl(result.url);
    return {};
  }

  if (resultType === 'cancel' || resultType === 'dismiss') {
    return {};
  }

  return { error: 'Google sign-in did not complete.' };
}
