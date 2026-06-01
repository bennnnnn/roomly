import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { fuzzyMapCoordinate } from '../lib/fuzzyMapCoordinate';

import type { BrowseListingItem } from '../types';

interface BrowseMapProps {
  listings: BrowseListingItem[];
}

const DEFAULT_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

export function BrowseMap({ listings }: BrowseMapProps) {
  const router = useRouter();

  const handleMarkerPress = useCallback(
    (id: string) => {
      router.push(`/listing/${id}`);
    },
    [router],
  );

  if (listings.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-800">
        <Text className="text-body text-neutral-500">No listings to show on map</Text>
      </View>
    );
  }

  return (
    <MapView
      className="flex-1"
      initialRegion={DEFAULT_REGION}
      testID="browse-map"
      accessibilityLabel="Map of listing locations"
    >
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          coordinate={fuzzyMapCoordinate(listing.id, listing.lat, listing.lng)}
          title={listing.title}
          description={`$${(listing.priceCents / 100).toFixed(2)}/mo · ${listing.areaLabel}`}
          onCalloutPress={() => handleMarkerPress(listing.id)}
          testID={`map-marker-${listing.id}`}
        />
      ))}
    </MapView>
  );
}
