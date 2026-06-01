import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useOwnedListingCount } from '../../src/features/listings/hooks/useOwnedListingCount';
import { useOwnProfile } from '../../src/features/profile/hooks/useOwnProfile';
import { logger } from '../../src/lib/logger';
import { supabase } from '../../src/lib/supabaseClient';
import { useUser } from '../../src/state/session';

/**
 * "Me" tab — adaptive profile hub (Slice 6).
 *
 * Renter menu (0 listings): Saved, Messages, Settings, List-your-place CTA.
 * Host menu (≥1 listing): adds My Listings, Billing.
 */
export default function Me() {
  const user = useUser();
  const router = useRouter();
  const { data: listingCount = 0 } = useOwnedListingCount(Boolean(user));
  const { data: profile } = useOwnProfile(Boolean(user));
  const isHost = listingCount > 0;
  const displayName = profile?.displayName ?? user?.email ?? 'unknown';
  const initial = displayName.charAt(0).toUpperCase();

  async function handleSignOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn('signOut returned error', { code: error.code });
    }
  }

  return (
    <ScrollView
      testID="tab-me"
      className="flex-1 bg-neutral-50 dark:bg-neutral-900"
      contentContainerClassName="gap-md p-lg pb-xxl"
    >
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">Me</Text>

      <Card>
        <View className="items-center gap-sm">
          <Pressable
            onPress={() => router.push('/settings/edit-profile')}
            className="h-16 w-16 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30"
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            testID="me-edit-profile"
          >
            <Text className="text-heading text-accent-500">{initial}</Text>
          </Pressable>
          <Text
            className="text-title font-semibold text-neutral-900 dark:text-neutral-0"
            testID="me-display-name"
          >
            {displayName}
          </Text>
          <Text className="text-caption text-neutral-500">{user?.email ?? ''}</Text>
          <Text className="text-caption text-neutral-500">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </Text>
        </View>
      </Card>

      <Card>
        <MenuItem label="Saved listings" icon="❤️" onPress={() => router.push('/(tabs)/saved')} />
        <MenuDivider />
        <MenuItem label="Messages" icon="💬" onPress={() => router.push('/(tabs)/messages')} />
        {isHost ? (
          <>
            <MenuDivider />
            <MenuItem label="My listings" icon="🏠" onPress={() => router.push('/my-listings')} />
            <MenuDivider />
            <MenuItem label="Billing" icon="💳" onPress={() => router.push('/billing')} />
          </>
        ) : null}
        <MenuDivider />
        <MenuItem label="Settings" icon="⚙️" onPress={() => router.push('/settings')} />
      </Card>

      {!isHost ? (
        <Card testID="me-list-cta">
          <Text className="text-body text-neutral-700 dark:text-neutral-200">
            Have a room to rent?
          </Text>
          <View className="mt-sm">
            <Button label="List your place" onPress={() => router.push('/listing/new')} />
          </View>
        </Card>
      ) : null}

      <Button
        label="Sign out"
        variant="ghost"
        onPress={() => {
          void handleSignOut();
        }}
        testID="me-sign-out"
      />
    </ScrollView>
  );
}

function MenuItem({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-md py-sm"
      accessibilityRole="button"
    >
      <Text className="text-body">{icon}</Text>
      <Text className="text-body text-neutral-900 dark:text-neutral-0">{label}</Text>
    </Pressable>
  );
}

function MenuDivider() {
  return <View className="h-px bg-neutral-100 dark:bg-neutral-800" />;
}
