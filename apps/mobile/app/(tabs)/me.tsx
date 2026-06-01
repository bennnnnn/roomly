import { Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { logger } from '../../src/lib/logger';
import { supabase } from '../../src/lib/supabaseClient';
import { useUser } from '../../src/state/session';

/**
 * "Me" tab — minimal profile + sign-out for the foundation slice.
 *
 * The PRD's full adaptive menu (renter vs host based on listings count)
 * lands in Slice 6 (Profiles/Settings/Billing).
 */
export default function Me() {
  const user = useUser();

  async function handleSignOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn('signOut returned error', { code: error.code });
    }
  }

  return (
    <View testID="tab-me" className="flex-1 gap-md bg-neutral-50 p-lg dark:bg-neutral-900">
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">Me</Text>
      <Card>
        <Text className="text-caption text-neutral-500">Signed in as</Text>
        <Text className="text-body text-neutral-900 dark:text-neutral-0" testID="me-email">
          {user?.email ?? 'unknown'}
        </Text>
      </Card>
      <Button
        label="Sign out"
        variant="secondary"
        onPress={() => {
          void handleSignOut();
        }}
        testID="me-sign-out"
      />
    </View>
  );
}
