import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { ExpandableText } from '../../../components/ExpandableText';
import { formatListingPrice } from '../api/fetchBrowseListings';
import { LISTING_TYPE_LABELS } from '../constants';

import { HostMiniCard } from './HostMiniCard';
import { ListingPhotoGallery } from './ListingPhotoGallery';

import type { ListingDetail } from '../types';

export interface ListingDetailBodyProps {
  listing: ListingDetail;
  onEdit: () => void;
  onMessage?: (() => void) | undefined;
  onViewHost?: (() => void) | undefined;
  messageBusy?: boolean | undefined;
  testID?: string | undefined;
}

export function ListingDetailBody({
  listing,
  onEdit,
  onMessage,
  onViewHost,
  messageBusy = false,
  testID,
}: ListingDetailBodyProps) {
  const unavailable = listing.status !== 'active';

  return (
    <ScrollView
      testID={testID}
      className="flex-1 bg-neutral-0 dark:bg-neutral-900"
      contentContainerClassName="pb-xxl"
    >
      <ListingPhotoGallery photos={listing.photos} testID="listing-photo-gallery" />
      <View className="gap-md p-lg">
        <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
          {listing.title}
        </Text>
        <Text className="text-display font-semibold text-accent-600 dark:text-accent-400">
          {formatListingPrice(listing.priceCents)}
          <Text className="text-bodyLg font-normal text-neutral-500"> /mo</Text>
        </Text>
        <Text className="text-bodyLg text-neutral-700 dark:text-neutral-200">
          {LISTING_TYPE_LABELS[listing.type]} · {listing.areaLabel}
        </Text>
        <Text className="text-caption text-neutral-500">
          Available {listing.availableFrom} · Min stay {String(listing.minMonths)} mo ·{' '}
          {String(listing.viewCount)} views
        </Text>

        {!listing.isOwner && listing.host && onViewHost ? (
          <HostMiniCard
            displayName={listing.host.displayName}
            accountType={listing.host.accountType}
            companyName={listing.host.companyName}
            isVerified={listing.host.isVerified}
            onPress={onViewHost}
            testID="listing-host-card"
          />
        ) : null}

        <ExpandableText text={listing.description} testID="listing-description" />

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

        {unavailable ? (
          <View className="rounded-md bg-neutral-100 p-md dark:bg-neutral-800">
            <Text className="text-body text-neutral-600 dark:text-neutral-300">
              This listing is no longer available.
            </Text>
          </View>
        ) : null}

        {listing.isOwner ? (
          <Button label="Edit listing" variant="secondary" onPress={onEdit} testID="listing-edit" />
        ) : (
          <Button
            label={messageBusy ? 'Opening chat…' : 'Message host'}
            variant="primary"
            disabled={unavailable || messageBusy || !onMessage}
            loading={messageBusy}
            testID="listing-message"
            onPress={() => onMessage?.()}
          />
        )}
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
