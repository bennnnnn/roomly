import { Text, View } from 'react-native';

import { Card } from '../../src/components/Card';

export default function Saved() {
  return (
    <View testID="tab-saved" className="flex-1 gap-md bg-neutral-50 p-lg dark:bg-neutral-900">
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">Saved</Text>
      <Card>
        <Text className="text-body text-neutral-500 dark:text-neutral-300">
          You haven't saved any listings yet. Tap the heart on a listing to come back to it later.
        </Text>
      </Card>
    </View>
  );
}
