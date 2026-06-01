import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { logger } from '../lib/logger';
import { signInWithGoogle } from '../lib/oauthSignIn';
import { supabase } from '../lib/supabaseClient';

/**
 * Magic-link sign-in.
 *
 * `signInWithOtp` emails a one-time code/link. On success we show a
 * confirmation state; the session is set on the device once the user clicks
 * the link (handled by Expo Router's deep-link plumbing in Slice 1F).
 *
 * Errors are surfaced inline; never thrown into the parent.
 */

type Status = 'idle' | 'sending' | 'sent' | 'error';

function isLikelyEmail(value: string): boolean {
  // Pragmatic check; Supabase enforces real validation server-side.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const canSubmit = isLikelyEmail(email) && status !== 'sending';

  async function handleGoogle(): Promise<void> {
    setStatus('sending');
    setErrorMessage(undefined);
    const result = await signInWithGoogle();
    if (result.error) {
      setErrorMessage(result.error);
      setStatus('error');
      return;
    }
    setStatus('idle');
  }

  async function handleSubmit(): Promise<void> {
    setStatus('sending');
    setErrorMessage(undefined);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: 'roomly://auth/callback' },
      });
      if (error) {
        logger.warn('signInWithOtp returned error', { code: error.code });
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      logger.error('signInWithOtp threw', { message });
      setErrorMessage('Could not reach Roomly. Check your connection and try again.');
      setStatus('error');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-neutral-0 dark:bg-neutral-900"
      testID="sign-in-screen"
    >
      <View className="flex-1 justify-center gap-lg px-xl">
        <Text className="text-display font-semibold text-neutral-900 dark:text-neutral-0">
          Sign in to Roomly
        </Text>
        <Text className="text-body text-neutral-500 dark:text-neutral-300">
          We'll email you a magic link — no password to remember.
        </Text>

        {status === 'sent' ? (
          <View
            className="rounded-md bg-accent-50 p-md dark:bg-neutral-700"
            testID="sign-in-sent-banner"
          >
            <Text className="text-body text-accent-700 dark:text-accent-50">
              Check your inbox for a link from Roomly. It expires in 10 minutes.
            </Text>
          </View>
        ) : (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              testID="sign-in-email"
              errorMessage={status === 'error' ? errorMessage : undefined}
              editable={status !== 'sending'}
            />
            <Button
              label="Continue with Google"
              variant="secondary"
              onPress={() => {
                void handleGoogle();
              }}
              loading={status === 'sending'}
              disabled={status === 'sending'}
              testID="sign-in-google"
            />
            <Button
              label={status === 'sending' ? 'Sending…' : 'Send magic link'}
              onPress={() => {
                void handleSubmit();
              }}
              loading={status === 'sending'}
              disabled={!canSubmit}
              testID="sign-in-submit"
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
