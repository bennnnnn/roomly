import { Text, View } from 'react-native';

import { Card } from '../../src/components/Card';

export default function Create() {
  return (
    <View testID="tab-create" className="flex-1 gap-md bg-neutral-50 p-lg dark:bg-neutral-900">
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        List your place
      </Text>
      <Card>
        <Text className="text-body text-neutral-500 dark:text-neutral-300">
          The 7-step listing wizard lands in Slice 2.
        </Text>
      </Card>
    </View>
  );
}
