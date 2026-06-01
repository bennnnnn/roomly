import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../state/session';
import { resendVerificationEmail } from '../api/resendVerification';

const RESEND_COOLDOWN_SEC = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const user = useUser();
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.replace('/(tabs)/browse');
    }
  }, [user?.email_confirmed_at, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    const email = user?.email;
    if (!email || cooldown > 0) return;

    setStatus('sending');
    setErrorMessage(undefined);
    const result = await resendVerificationEmail(email);
    if (result.error) {
      setErrorMessage(result.error);
      setStatus('error');
      return;
    }
    setStatus('sent');
    setCooldown(RESEND_COOLDOWN_SEC);
  }, [user?.email, cooldown]);

  async function handleRefresh(): Promise<void> {
    await supabase.auth.refreshSession();
    const { data } = await supabase.auth.getUser();
    if (data.user?.email_confirmed_at) {
      router.replace('/(tabs)/browse');
    }
  }

  async function handleSignOut(): Promise<void> {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  return (
    <View
      testID="verify-email-screen"
      className="flex-1 justify-center gap-lg bg-neutral-0 px-xl dark:bg-neutral-900"
    >
      <Text className="text-display font-semibold text-neutral-900 dark:text-neutral-0">
        Verify your email
      </Text>
      <Text className="text-body text-neutral-600 dark:text-neutral-300">
        We sent a link to {user?.email ?? 'your inbox'}. Open it on this device to continue
        messaging and listing.
      </Text>

      {status === 'sent' ? (
        <Text className="text-body text-accent-600 dark:text-accent-400" testID="verify-email-sent">
          Verification email sent. Check your inbox.
        </Text>
      ) : null}

      {errorMessage ? (
        <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
      ) : null}

      <Button
        label={
          cooldown > 0
            ? `Resend in ${String(cooldown)}s`
            : status === 'sending'
              ? 'Sending…'
              : 'Resend email'
        }
        onPress={() => void handleResend()}
        disabled={cooldown > 0 || status === 'sending' || !user?.email}
        loading={status === 'sending'}
        testID="verify-email-resend"
      />
      <Button
        label="I verified — refresh"
        variant="secondary"
        onPress={() => void handleRefresh()}
        testID="verify-email-refresh"
      />
      <Button label="Use a different email" variant="ghost" onPress={() => void handleSignOut()} />
    </View>
  );
}
