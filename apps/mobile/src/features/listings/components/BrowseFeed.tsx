import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useSessionStatus } from '../../../state/session';
import { toggleFavorite } from '../api/favorites';
import { useBrowseListings } from '../hooks/useBrowseListings';
import { useBrowseFilterStore } from '../stores/browseFilterStore';

import { BrowseMap } from './BrowseMap';
import { FilterSheet } from './FilterSheet';
import { ListingCard } from './ListingCard';
import { LocationSelector } from './LocationSelector';

import type { BrowseListingItem } from '../types';

type ViewMode = 'list' | 'map';

export function BrowseFeed() {
  const router = useRouter();
  const sessionStatus = useSessionStatus();
  const query = useBrowseListings();
  const queryClient = useQueryClient();
  const location = useBrowseFilterStore((s) => s.location);
  const activeFilterCount = useBrowseFilterStore((s) => s.activeFilterCount);
  const [filterVisible, setFilterVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Favorite toggle mutation
  const favMutation = useMutation({
    mutationFn: ({ id, isFav }: { id: string; isFav: boolean }) => toggleFavorite(id, isFav),
    onMutate: async ({ id, isFav }) => {
      await queryClient.cancelQueries({ queryKey: ['listings', 'browse'] });
      const prev = queryClient.getQueryData(['listings', 'browse']);
      queryClient.setQueryData(
        ['listings', 'browse'],
        (old: { items: BrowseListingItem[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? { ...item, isFavorite: !isFav } : item,
            ),
          };
        },
      );
      // Also invalidate the favorites ID set
      void queryClient.invalidateQueries({ queryKey: ['favorites', 'ids'] });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['listings', 'browse'], context.prev);
      }
    },
  });

  const handleFavoriteToggle = useCallback(
    (item: BrowseListingItem) => {
      if (sessionStatus !== 'authenticated') {
        router.push('/sign-in');
        return;
      }
      favMutation.mutate({ id: item.id, isFav: item.isFavorite });
    },
    [favMutation, router, sessionStatus],
  );

  // Loading
  if (query.isLoading) {
    return (
      <View testID="browse-loading" className="flex-1 items-center justify-center gap-md">
        <ActivityIndicator />
        <Text className="text-body text-neutral-500">Loading listings…</Text>
      </View>
    );
  }

  // Error
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

  const { items } = query.data ?? { items: [], nextCursor: null };
  const resultCount = items.length;

  // Empty
  if (items.length === 0) {
    return (
      <>
        {/* Filter bar even when empty */}
        <View className="flex-row items-center gap-sm px-lg py-sm">
          <Pressable
            onPress={() => setLocationVisible(true)}
            className="flex-1 rounded-md border border-neutral-200 px-md py-sm dark:border-neutral-700"
          >
            <Text className="text-body text-neutral-700 dark:text-neutral-200" numberOfLines={1}>
              {location?.label ?? 'All locations'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterVisible(true)}
            className="rounded-md border border-neutral-200 px-md py-sm dark:border-neutral-700"
          >
            <Text className="text-body text-neutral-700 dark:text-neutral-200">
              Filters{activeFilterCount() > 0 ? ` (${activeFilterCount()})` : ''}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode((v) => (v === 'list' ? 'map' : 'list'))}
            className="rounded-md border border-neutral-200 px-md py-sm dark:border-neutral-700"
          >
            <Text className="text-body text-neutral-700 dark:text-neutral-200">
              {viewMode === 'list' ? '🗺️' : '📋'}
            </Text>
          </Pressable>
        </View>

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

        <FilterSheet
          visible={filterVisible}
          resultCount={0}
          onClose={() => setFilterVisible(false)}
        />
        <LocationSelector visible={locationVisible} onClose={() => setLocationVisible(false)} />
      </>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <View className="flex-row items-center gap-sm px-lg py-sm">
        <Pressable
          onPress={() => setLocationVisible(true)}
          className="flex-1 rounded-md border border-neutral-200 px-md py-sm dark:border-neutral-700"
        >
          <Text className="text-body text-neutral-700 dark:text-neutral-200" numberOfLines={1}>
            {location?.label ?? 'All locations'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilterVisible(true)}
          className="rounded-md border border-neutral-200 px-md py-sm dark:border-neutral-700"
        >
          <Text className="text-body text-neutral-700 dark:text-neutral-200">
            Filters{activeFilterCount() > 0 ? ` (${activeFilterCount()})` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode((v) => (v === 'list' ? 'map' : 'list'))}
          className="rounded-md border border-neutral-200 px-md py-sm dark:border-neutral-700"
        >
          <Text className="text-body text-neutral-700 dark:text-neutral-200">
            {viewMode === 'list' ? '🗺️' : '📋'}
          </Text>
        </Pressable>
      </View>

      {/* List / Map */}
      {viewMode === 'list' ? (
        <FlatList
          testID="browse-list"
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-md px-lg pb-xxl"
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              testID={`listing-card-${item.id}`}
              onPress={() => router.push(`/listing/${item.id}`)}
              onFavoriteToggle={() => handleFavoriteToggle(item)}
            />
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            // Pagination: future enhancement — load more with the nextCursor
          }}
        />
      ) : (
        <BrowseMap listings={items} />
      )}

      <FilterSheet
        visible={filterVisible}
        resultCount={resultCount}
        onClose={() => setFilterVisible(false)}
      />
      <LocationSelector visible={locationVisible} onClose={() => setLocationVisible(false)} />
    </>
  );
}
