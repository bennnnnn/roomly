import { useState } from 'react';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import type { ListingPhotoMeta } from '../types';

export interface ListingPhotoGalleryProps {
  photos: ListingPhotoMeta[];
  testID?: string;
}

export function ListingPhotoGallery({ photos, testID }: ListingPhotoGalleryProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const urls = photos.map((p) => p.signedUrl).filter((u): u is string => Boolean(u));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  if (urls.length === 0) {
    return (
      <View
        testID={testID}
        className="aspect-video w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
      >
        <Text className="text-caption text-neutral-500">No photos</Text>
      </View>
    );
  }

  return (
    <View testID={testID}>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${uri}-${String(i)}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, aspectRatio: 16 / 9 }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        )}
      />
      {urls.length > 1 ? (
        <View className="absolute bottom-sm w-full flex-row items-center justify-center gap-xs">
          {urls.map((uri, i) => (
            <View
              key={uri}
              className={`h-1.5 rounded-full ${
                i === index ? 'w-4 bg-neutral-0' : 'w-1.5 bg-neutral-0/50'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
