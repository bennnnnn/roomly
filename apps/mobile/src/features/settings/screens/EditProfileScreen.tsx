import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { fetchOwnProfile, updateDisplayName } from '../../profile/api/ownProfile';

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchOwnProfile();
      setDisplayName(profile.displayName);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setErrorMessage(undefined);
    try {
      await updateDisplayName(displayName);
      await queryClient.invalidateQueries({ queryKey: ['profile', 'own'] });
      router.back();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 dark:bg-neutral-900">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Edit profile
        </Text>
      </View>
      <View className="gap-md p-lg">
        <Input
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={60}
          testID="edit-profile-name"
        />
        {errorMessage ? (
          <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
        ) : null}
        <Button
          label={saving ? 'Saving…' : 'Save'}
          onPress={() => void handleSave()}
          loading={saving}
          testID="edit-profile-save"
        />
      </View>
    </ScrollView>
  );
}
