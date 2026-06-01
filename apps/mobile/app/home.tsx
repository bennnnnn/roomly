import { Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { logger } from '../src/lib/logger';
import { supabase } from '../src/lib/supabaseClient';

/**
 * Placeholder home screen for authenticated users. Slice 1F replaces this
 * with the real bottom-tab navigator (Browse · Saved · ＋ · Messages · Me).
 *
 * Includes a Sign-out button so the auth loop is testable end-to-end on a
 * real device the moment a Supabase project exists.
 */
export default function Home() {
  async function handleSignOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn('signOut returned error', { code: error.code });
    }
  }

  return (
    <View
      testID="home-screen"
      className="flex-1 items-center justify-center gap-lg bg-neutral-0 p-xl dark:bg-neutral-900"
    >
      <Text className="text-title text-neutral-900 dark:text-neutral-0">You're signed in.</Text>
      <Text className="text-body text-neutral-500 dark:text-neutral-300">
        Real home screen lands in Slice 1F.
      </Text>
      <Button
        label="Sign out"
        variant="secondary"
        onPress={() => {
          void handleSignOut();
        }}
        testID="home-sign-out"
      />
    </View>
  );
}
