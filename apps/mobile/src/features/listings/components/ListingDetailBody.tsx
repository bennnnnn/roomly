import { Image, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { formatListingPrice } from '../api/fetchBrowseListings';
import { LISTING_TYPE_LABELS } from '../constants';

import type { ListingDetail } from '../types';

export interface ListingDetailBodyProps {
  listing: ListingDetail;
  onEdit: () => void;
  testID?: string | undefined;
}

export function ListingDetailBody({ listing, onEdit, testID }: ListingDetailBodyProps) {
  const hero = listing.photos[0]?.signedUrl ?? listing.coverPhotoUrl;

  return (
    <ScrollView testID={testID} className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800">
        {hero ? (
          <Image
            source={{ uri: hero }}
            className="h-full w-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}
      </View>
      <View className="gap-md p-lg">
        <Text className="text-display font-semibold text-neutral-900 dark:text-neutral-0">
          {formatListingPrice(listing.priceCents)}
        </Text>
        <Text className="text-bodyLg text-neutral-700 dark:text-neutral-200">
          {LISTING_TYPE_LABELS[listing.type]} · {listing.areaLabel}
        </Text>
        <Text className="text-caption text-neutral-500">
          Available {listing.availableFrom} · Min stay {String(listing.minMonths)} mo ·{' '}
          {String(listing.viewCount)} views
        </Text>
        <Text className="text-body text-neutral-800 dark:text-neutral-100">
          {listing.description}
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {listing.furnished ? <Tag label="Furnished" /> : null}
          {listing.petsAllowed ? <Tag label="Pets OK" /> : null}
          {listing.hasOwnBath ? <Tag label="Own bath" /> : null}
          {listing.hasSharedBath ? <Tag label="Shared bath" /> : null}
          {listing.noSmoking ? <Tag label="No smoking" /> : null}
          {listing.utilitiesIncluded ? <Tag label="Utilities incl." /> : null}
          {listing.hasParking ? <Tag label="Parking" /> : null}
          {listing.hasLaundry ? <Tag label="Laundry" /> : null}
        </View>
        {listing.status !== 'active' ? (
          <Text className="text-body text-semantic-danger">
            This listing is not live yet ({listing.status}).
          </Text>
        ) : null}
        {listing.isOwner ? (
          <Button label="Edit listing" variant="secondary" onPress={onEdit} testID="listing-edit" />
        ) : (
          <Button
            label="Message host"
            variant="primary"
            disabled
            testID="listing-message"
            onPress={() => undefined}
          />
        )}
        {!listing.isOwner ? (
          <Text className="text-caption text-neutral-500">Messaging lands in Slice 5.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View className="rounded-pill bg-neutral-100 px-sm py-xs dark:bg-neutral-800">
      <Text className="text-caption text-neutral-700 dark:text-neutral-200">{label}</Text>
    </View>
  );
}
