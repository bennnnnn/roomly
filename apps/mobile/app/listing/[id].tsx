import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { ListingDetailBody } from '../../src/features/listings/components/ListingDetailBody';
import { useListingDetail } from '../../src/features/listings/hooks/useListingDetail';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useListingDetail(id);

  if (query.isLoading) {
    return (
      <View testID="listing-detail-loading" className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View
        testID="listing-detail-error"
        className="flex-1 items-center justify-center gap-md p-xl"
      >
        <Text className="text-body">This listing is no longer available.</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ListingDetailBody
      listing={query.data}
      testID="listing-detail"
      onEdit={() => router.push(`/listing/${id}/edit`)}
    />
  );
}
