import { Text, View } from 'react-native';

import { BrowseFeed } from '../../src/features/listings/components/BrowseFeed';

export default function Browse() {
  return (
    <View testID="tab-browse" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Browse
        </Text>
      </View>
      <BrowseFeed />
    </View>
  );
}
