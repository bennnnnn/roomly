import { Text, View } from 'react-native';

import { Card } from '../../src/components/Card';

/**
 * Browse tab — placeholder. Slice 2 (Listings) populates this with the feed.
 */
export default function Browse() {
  return (
    <View testID="tab-browse" className="flex-1 gap-md bg-neutral-50 p-lg dark:bg-neutral-900">
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        Browse
      </Text>
      <Card>
        <Text className="text-body text-neutral-500 dark:text-neutral-300">
          The listing feed lands in Slice 2.
        </Text>
      </Card>
    </View>
  );
}
