import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { supabase } from '../../../lib/supabaseClient';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function handleSave(): Promise<void> {
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSaving(true);
    setErrorMessage(undefined);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.replace('/(tabs)/browse');
  }

  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Set new password
        </Text>
      </View>
      <View className="gap-md p-lg">
        <Input
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          testID="update-password-new"
        />
        <Input
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          testID="update-password-confirm"
        />
        {errorMessage ? (
          <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
        ) : null}
        <Button
          label={saving ? 'Saving…' : 'Save password'}
          onPress={() => void handleSave()}
          loading={saving}
          testID="update-password-save"
        />
      </View>
    </ScrollView>
  );
}
