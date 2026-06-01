import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { BrowseFeed } from '../../src/features/listings/components/BrowseFeed';
import { useSessionStatus } from '../../src/state/session';

export default function Browse() {
  const router = useRouter();
  const status = useSessionStatus();

  return (
    <View testID="tab-browse" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Browse
        </Text>
        {status === 'anonymous' ? (
          <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button">
            <Text className="text-body font-medium text-accent-500">Log in</Text>
          </Pressable>
        ) : null}
      </View>
      <BrowseFeed />
    </View>
  );
}
