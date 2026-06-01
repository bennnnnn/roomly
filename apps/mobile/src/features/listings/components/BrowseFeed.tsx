import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useBrowseListings } from '../hooks/useBrowseListings';

import { ListingCard } from './ListingCard';

export function BrowseFeed() {
  const router = useRouter();
  const query = useBrowseListings();

  if (query.isLoading) {
    return (
      <View testID="browse-loading" className="flex-1 items-center justify-center gap-md">
        <ActivityIndicator />
        <Text className="text-body text-neutral-500">Loading listings…</Text>
      </View>
    );
  }

  if (query.isError) {
    return (
      <View testID="browse-error" className="flex-1 items-center justify-center gap-md p-xl">
        <Text className="text-body text-neutral-700 dark:text-neutral-200">
          Couldn't load listings
        </Text>
        <Button label="Retry" onPress={() => void query.refetch()} testID="browse-retry" />
      </View>
    );
  }

  const items = query.data ?? [];

  if (items.length === 0) {
    return (
      <View testID="browse-empty" className="flex-1 items-center justify-center gap-md p-xl">
        <Text className="text-center text-body text-neutral-500">
          No listings here yet — be the first to list.
        </Text>
        <Button
          label="List your place"
          onPress={() => router.push('/listing/new')}
          testID="browse-list-cta"
        />
      </View>
    );
  }

  return (
    <FlatList
      testID="browse-list"
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerClassName="gap-md p-lg pb-xxl"
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          testID={`listing-card-${item.id}`}
          onPress={() => router.push(`/listing/${item.id}`)}
        />
      )}
    />
  );
}
