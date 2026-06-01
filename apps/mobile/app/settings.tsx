import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Card } from '../src/components/Card';
import { useOwnedListingCount } from '../src/features/listings/hooks/useOwnedListingCount';
import { fetchBlockedUsers, unblockUser } from '../src/features/settings/api/blockedUsers';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../src/features/settings/api/notificationPreferences';
import { LEGAL_URLS } from '../src/lib/legalUrls';
import { openExternalUrl } from '../src/lib/openExternalUrl';
import { useUser } from '../src/state/session';

import type { NotificationPreferences } from '../src/features/settings/api/notificationPreferences';

export default function Settings() {
  const router = useRouter();
  const user = useUser();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [blocked, setBlocked] = useState<{ blocked_id: string; created_at: string }[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const { data: ownedListingCount = 0 } = useOwnedListingCount(Boolean(user));
  const isHost = ownedListingCount > 0;

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    setPrefsLoading(true);
    try {
      const data = await fetchNotificationPreferences();
      setPrefs(data);
    } finally {
      setPrefsLoading(false);
    }
  }, [user]);

  const loadBlocked = useCallback(async () => {
    if (!user) return;
    setBlockedLoading(true);
    try {
      const data = await fetchBlockedUsers();
      setBlocked(data);
    } finally {
      setBlockedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadPrefs();
    void loadBlocked();
  }, [loadPrefs, loadBlocked]);

  async function patchPrefs(patch: Partial<NotificationPreferences>): Promise<void> {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await updateNotificationPreferences(patch);
  }

  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Settings
        </Text>
      </View>

      <View className="gap-lg p-lg">
        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">Account</Text>
          <SettingRow label="Edit profile" onPress={() => router.push('/settings/edit-profile')} />
          {isHost ? (
            <SettingRow label="Billing history" onPress={() => router.push('/billing')} />
          ) : null}
          {isHost ? (
            <SettingRow
              label="Account type"
              onPress={() => router.push('/settings/account-type')}
            />
          ) : null}
          <SettingRow label="Change email" onPress={() => router.push('/settings/change-email')} />
          <SettingRow label="Change password" onPress={() => router.push('/reset-password')} />
        </Card>

        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">
            Notifications
          </Text>
          {prefsLoading || !prefs ? (
            <ActivityIndicator className="my-md" />
          ) : (
            <>
              <ToggleRow
                label="New message (push)"
                value={prefs.new_message_push}
                onValueChange={(v) => void patchPrefs({ new_message_push: v })}
              />
              <ToggleRow
                label="Listing expiring (push)"
                value={prefs.listing_expiring_push}
                onValueChange={(v) => void patchPrefs({ listing_expiring_push: v })}
              />
              <ToggleRow
                label="Payment receipts (email)"
                value={prefs.payment_receipt_email}
                onValueChange={(v) => void patchPrefs({ payment_receipt_email: v })}
              />
              <ToggleRow
                label="Marketing emails"
                value={prefs.marketing_opt_in}
                onValueChange={(v) => void patchPrefs({ marketing_opt_in: v })}
              />
            </>
          )}
        </Card>

        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">
            Blocked users
          </Text>
          {blockedLoading ? (
            <ActivityIndicator className="my-md" />
          ) : blocked.length === 0 ? (
            <Text className="py-sm text-body text-neutral-500">No blocked users.</Text>
          ) : (
            blocked.map((row) => (
              <View
                key={row.blocked_id}
                className="flex-row items-center justify-between border-t border-neutral-100 py-sm dark:border-neutral-800"
              >
                <Text className="font-mono text-caption text-neutral-600 dark:text-neutral-400">
                  {row.blocked_id.slice(0, 8)}…
                </Text>
                <Pressable
                  onPress={() => {
                    void unblockUser(row.blocked_id).then(() => void loadBlocked());
                  }}
                  testID={`unblock-${row.blocked_id}`}
                >
                  <Text className="text-caption text-accent-500">Unblock</Text>
                </Pressable>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">
            Legal & support
          </Text>
          <SettingRow
            label="Terms of service"
            onPress={() => void openExternalUrl(LEGAL_URLS.terms)}
          />
          <SettingRow
            label="Privacy policy"
            onPress={() => void openExternalUrl(LEGAL_URLS.privacy)}
          />
          <SettingRow label="Help & FAQ" onPress={() => void openExternalUrl(LEGAL_URLS.help)} />
          <SettingRow
            label="Contact support"
            onPress={() => void openExternalUrl(LEGAL_URLS.support)}
          />
        </Card>

        <Card>
          <Text className="text-caption font-semibold uppercase text-red-500">Danger zone</Text>
          <SettingRow
            label="Delete account"
            destructive
            onPress={() => {
              Alert.alert(
                'Delete account?',
                'This permanently removes your account and listings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => router.push('/settings/delete-account'),
                  },
                ],
              );
            }}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  destructive = false,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-sm"
      accessibilityRole="button"
    >
      <Text
        className={`text-body ${destructive ? 'text-red-500' : 'text-neutral-900 dark:text-neutral-0'}`}
      >
        {label}
      </Text>
      <Text className="text-caption text-neutral-400">{'>'}</Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-sm">
      <Text className="text-body text-neutral-900 dark:text-neutral-0">{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
