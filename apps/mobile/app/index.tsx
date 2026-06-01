import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import WelcomeScreen from '../src/screens/WelcomeScreen';
import { useSessionStatus } from '../src/state/session';

/**
 * Root route — gates everything by session status.
 *
 * - loading: brief splash (no flash of Welcome before redirect).
 * - anonymous: Welcome screen.
 * - authenticated: redirect into the (app) group (lands in Slice 1F).
 *
 * Keeping this as a single switch avoids the "auth check in every screen"
 * footgun from the retro.
 */
export default function Index() {
  const status = useSessionStatus();

  if (status === 'loading') {
    return (
      <View
        testID="root-splash"
        className="flex-1 items-center justify-center bg-neutral-0 dark:bg-neutral-900"
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/browse" />;
  }

  return <WelcomeScreen />;
}
