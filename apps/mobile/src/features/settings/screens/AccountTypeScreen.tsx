import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { fetchAccountProfile, updateAccountProfile } from '../api/accountProfile';

import type { AccountType } from '@roomly/db-types';

export default function AccountTypeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [companyName, setCompanyName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchAccountProfile();
      setAccountType(profile.accountType);
      setCompanyName(profile.companyName ?? '');
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
      await updateAccountProfile(accountType, accountType === 'company' ? companyName : null);
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
          Account type
        </Text>
        <Text className="mt-xs text-caption text-neutral-500">
          Host-only. Company accounts show a business name on your public profile.
        </Text>
      </View>

      <View className="gap-md p-lg">
        <TypeOption
          label="Individual"
          description="Personal host"
          selected={accountType === 'individual'}
          onPress={() => setAccountType('individual')}
          testID="account-type-individual"
        />
        <TypeOption
          label="Company"
          description="Property manager or business"
          selected={accountType === 'company'}
          onPress={() => setAccountType('company')}
          testID="account-type-company"
        />

        {accountType === 'company' ? (
          <Input
            label="Company name"
            value={companyName}
            onChangeText={setCompanyName}
            testID="account-type-company-name"
          />
        ) : null}

        {errorMessage ? (
          <Text className="text-caption text-semantic-danger">{errorMessage}</Text>
        ) : null}

        <Button
          label={saving ? 'Saving…' : 'Save'}
          onPress={() => void handleSave()}
          loading={saving}
          testID="account-type-save"
        />
      </View>
    </ScrollView>
  );
}

function TypeOption({
  label,
  description,
  selected,
  onPress,
  testID,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className={`rounded-lg border p-md ${
        selected
          ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
          : 'border-neutral-200 dark:border-neutral-700'
      }`}
    >
      <Text className="text-body font-medium text-neutral-900 dark:text-neutral-0">{label}</Text>
      <Text className="text-caption text-neutral-500">{description}</Text>
    </Pressable>
  );
}
