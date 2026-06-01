import { Text, View } from 'react-native';

import { TIMINGS } from '@roomly/lib';

export default function WelcomeScreen() {
  return (
    <View
      testID="welcome-screen"
      className="flex-1 items-center justify-center bg-neutral-0 p-xl dark:bg-neutral-900"
    >
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        Welcome to Roomly
      </Text>
      <Text className="mt-sm text-body text-neutral-500 dark:text-neutral-300">
        Presence heartbeat: {TIMINGS.presenceHeartbeatMs} ms
      </Text>
    </View>
  );
}
