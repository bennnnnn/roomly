import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { useSessionStatus } from '../../src/state/session';

export default function Create() {
  const router = useRouter();
  const status = useSessionStatus();

  function startWizard(): void {
    if (status !== 'authenticated') {
      router.push('/sign-in');
      return;
    }
    router.push('/listing/new');
  }

  return (
    <View
      testID="tab-create"
      className="flex-1 items-center justify-center gap-lg bg-neutral-50 p-xl dark:bg-neutral-900"
    >
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        List your place
      </Text>
      <Text className="text-center text-body text-neutral-500 dark:text-neutral-300">
        Seven-step wizard with photo upload and drafts. Payment to go live lands in Slice 4.
      </Text>
      <Button label="Start listing" onPress={startWizard} testID="tab-create-start" />
    </View>
  );
}
