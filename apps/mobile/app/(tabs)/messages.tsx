import { Text, View } from 'react-native';

import { Card } from '../../src/components/Card';

export default function Messages() {
  return (
    <View testID="tab-messages" className="flex-1 gap-md bg-neutral-50 p-lg dark:bg-neutral-900">
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        Messages
      </Text>
      <Card>
        <Text className="text-body text-neutral-500 dark:text-neutral-300">
          When you message a host or get a message about your listing, the conversation will appear
          here. Realtime chat lands in Slice 5.
        </Text>
      </Card>
    </View>
  );
}
