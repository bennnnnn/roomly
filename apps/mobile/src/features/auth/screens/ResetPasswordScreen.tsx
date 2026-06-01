import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { supabase } from '../../../lib/supabaseClient';

const REDIRECT = 'roomly://auth/callback';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function handleSubmit(): Promise<void> {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setSending(true);
    setErrorMessage(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: REDIRECT,
    });
    setSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Reset password
        </Text>
        <Text className="mt-xs text-caption text-neutral-500">
          We'll email you a link to set a new password.
        </Text>
      </View>
      <View className="gap-md p-lg">
        {sent ? (
          <Text
            className="text-body text-accent-600 dark:text-accent-400"
            testID="reset-password-sent"
          >
            If an account exists for {email}, you'll receive a reset link shortly.
          </Text>
        ) : (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="reset-password-email"
            />
            {errorMessage ? (
              <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
            ) : null}
            <Button
              label={sending ? 'Sending…' : 'Send reset link'}
              onPress={() => void handleSubmit()}
              loading={sending}
              testID="reset-password-submit"
            />
          </>
        )}
        <Button
          label="Back to sign in"
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      </View>
    </ScrollView>
  );
}
