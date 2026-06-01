import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { TIMINGS } from '@roomly/lib';

import { Button } from '../components/Button';

/**
 * First screen an anonymous user sees. Pitches the value prop and routes to
 * sign-in. Authenticated users never see this (router redirects them to the
 * app root).
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View
      testID="welcome-screen"
      className="flex-1 items-center justify-center gap-lg bg-neutral-0 p-xl dark:bg-neutral-900"
    >
      <View className="items-center gap-md">
        <Text className="text-display font-semibold text-neutral-900 dark:text-neutral-0">
          Roomly
        </Text>
        <Text className="text-bodyLg text-neutral-500 dark:text-neutral-300">
          A simple place to list rooms and find a home.
        </Text>
      </View>

      <View className="w-full max-w-sm gap-sm">
        <Button
          label="Continue with email"
          onPress={() => router.push('/sign-in')}
          testID="welcome-continue"
        />
        <Text
          className="text-center text-caption text-neutral-500"
          testID="welcome-heartbeat-debug"
        >
          Heartbeat {TIMINGS.presenceHeartbeatMs}ms
        </Text>
      </View>
    </View>
  );
}
