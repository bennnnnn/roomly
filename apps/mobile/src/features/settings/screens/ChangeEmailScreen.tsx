import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../state/session';

const REDIRECT = 'roomly://auth/callback';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const user = useUser();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function handleSave(): Promise<void> {
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setSaving(true);
    setErrorMessage(undefined);
    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      { emailRedirectTo: REDIRECT },
    );
    setSaving(false);

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
          Change email
        </Text>
        <Text className="mt-xs text-caption text-neutral-500">Current: {user?.email ?? '—'}</Text>
      </View>
      <View className="gap-md p-lg">
        {sent ? (
          <Text
            className="text-body text-accent-600 dark:text-accent-400"
            testID="change-email-sent"
          >
            We sent a confirmation link to {email}. Open it on this device to finish the change.
          </Text>
        ) : (
          <>
            <Input
              label="New email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              testID="change-email-input"
            />
            {errorMessage ? (
              <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
            ) : null}
            <Button
              label={saving ? 'Sending…' : 'Send confirmation'}
              onPress={() => void handleSave()}
              loading={saving}
              testID="change-email-save"
            />
          </>
        )}
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
