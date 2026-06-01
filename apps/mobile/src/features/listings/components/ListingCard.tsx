import { Image, Pressable, Text, View } from 'react-native';

import { formatListingPrice } from '../api/fetchBrowseListings';
import { LISTING_TYPE_LABELS } from '../constants';

import type { BrowseListingItem } from '../types';

export interface ListingCardProps {
  listing: BrowseListingItem;
  onPress: () => void;
  testID?: string | undefined;
}

export function ListingCard({ listing, onPress, testID }: ListingCardProps) {
  const facts = [
    listing.hasOwnBath ? 'Own bath' : null,
    listing.hasSharedBath ? 'Shared bath' : null,
    listing.petsAllowed ? 'Pets OK' : null,
    listing.furnished ? 'Furnished' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="overflow-hidden rounded-lg border border-neutral-100 bg-neutral-0 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <View className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800">
        {listing.coverPhotoUrl ? (
          <Image
            source={{ uri: listing.coverPhotoUrl }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-caption text-neutral-500">No photo</Text>
          </View>
        )}
      </View>
      <View className="gap-xs p-md">
        <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
          {formatListingPrice(listing.priceCents)}
        </Text>
        <Text className="text-body text-neutral-700 dark:text-neutral-200" numberOfLines={1}>
          {LISTING_TYPE_LABELS[listing.type]} · {listing.areaLabel}
        </Text>
        {facts ? (
          <Text className="text-caption text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {facts} · Available {listing.availableFrom}
          </Text>
        ) : (
          <Text className="text-caption text-neutral-500">Available {listing.availableFrom}</Text>
        )}
      </View>
    </Pressable>
  );
}
