import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { ListingCardSkeleton } from '../../src/components/Skeleton';
import { toggleFavorite } from '../../src/features/listings/api/favorites';
import { ListingCard } from '../../src/features/listings/components/ListingCard';
import { useSavedListings } from '../../src/features/listings/hooks/useSavedListings';

import type { BrowseListingItem } from '../../src/features/listings/types';

export default function Saved() {
  const router = useRouter();
  const query = useSavedListings();
  const queryClient = useQueryClient();

  const favMutation = useMutation({
    mutationFn: ({ id, isFav }: { id: string; isFav: boolean }) => toggleFavorite(id, isFav),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['listings', 'saved'] });
      const prev = queryClient.getQueryData(['listings', 'saved']);
      queryClient.setQueryData(['listings', 'saved'], (old: BrowseListingItem[] | undefined) => {
        if (!old) return old;
        return old.filter((item) => item.id !== id);
      });
      void queryClient.invalidateQueries({ queryKey: ['favorites', 'ids'] });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['listings', 'saved'], context.prev);
      }
    },
  });

  if (query.isLoading) {
    return (
      <View testID="saved-loading" className="flex-1 gap-md bg-neutral-50 p-lg dark:bg-neutral-900">
        <ListingCardSkeleton />
        <ListingCardSkeleton />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View
        testID="saved-error"
        className="flex-1 items-center justify-center gap-md bg-neutral-50 p-xl dark:bg-neutral-900"
      >
        <Text className="text-body text-neutral-700 dark:text-neutral-200">
          Couldn't load saved listings
        </Text>
        <Button label="Retry" onPress={() => void query.refetch()} testID="saved-retry" />
      </View>
    );
  }

  const items = query.data ?? [];

  if (items.length === 0) {
    return (
      <View testID="tab-saved" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
        <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
          <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
            Saved
          </Text>
        </View>
        <EmptyState
          title="Nothing saved yet"
          message="Tap the heart on a listing to save it here."
        />
      </View>
    );
  }

  return (
    <View testID="tab-saved" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Saved
        </Text>
      </View>
      <FlatList
        testID="saved-list"
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-md p-lg pb-xxl"
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            testID={`saved-card-${item.id}`}
            onPress={() => router.push(`/listing/${item.id}`)}
            onFavoriteToggle={() => favMutation.mutate({ id: item.id, isFav: true })}
          />
        )}
      />
    </View>
  );
}
