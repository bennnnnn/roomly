import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { logger } from './logger';
import { supabase } from './supabaseClient';

export async function signInWithApple(): Promise<{ error?: string }> {
  if (Platform.OS !== 'ios') {
    return { error: 'Apple Sign-In is only available on iOS.' };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: 'Apple Sign-In did not return a token.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      logger.warn('signInWithIdToken apple failed', { code: error.code });
      return { error: error.message };
    }

    return {};
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('ERR_REQUEST_CANCELED')) {
      return {};
    }
    return { error: 'Apple Sign-In did not complete.' };
  }
}
