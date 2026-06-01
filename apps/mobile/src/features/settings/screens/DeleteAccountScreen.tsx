import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { deleteAccount } from '../api/deleteAccount';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function handleDelete(): Promise<void> {
    setBusy(true);
    setErrorMessage(undefined);
    try {
      await deleteAccount();
      router.replace('/sign-in');
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Could not delete account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-red-500">Delete account</Text>
      </View>
      <View className="gap-md p-lg">
        <Text className="text-body text-neutral-700 dark:text-neutral-200">
          This permanently removes your account, listings, and messages. This cannot be undone.
        </Text>
        {errorMessage ? (
          <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
        ) : null}
        <Button
          label={busy ? 'Deleting…' : 'Yes, delete my account'}
          onPress={() => void handleDelete()}
          loading={busy}
          testID="delete-account-confirm"
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
