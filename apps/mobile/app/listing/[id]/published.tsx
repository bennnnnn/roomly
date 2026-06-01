import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { useListingDetail } from '../../../src/features/listings/hooks/useListingDetail';

export default function PublishedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: listing } = useListingDetail(id);

  return (
    <View className="flex-1 items-center justify-center gap-lg bg-neutral-0 p-xl dark:bg-neutral-900">
      <Text className="text-2xl">🎉</Text>
      <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
        Your listing is live!
      </Text>
      {listing && (
        <Card>
          <Text className="text-body text-neutral-700 dark:text-neutral-200">{listing.title}</Text>
          <Text className="text-caption text-neutral-500">
            Active for 30 days · Expires{' '}
            {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </Text>
        </Card>
      )}
      <View className="gap-md">
        <Button
          label="View listing"
          onPress={() =>
            router.replace({
              pathname: '/listing/[id]',
              params: { id },
            })
          }
          testID="published-view-listing"
        />
        <Button
          label="Back to browse"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/browse')}
          testID="published-back-browse"
        />
      </View>
    </View>
  );
}
