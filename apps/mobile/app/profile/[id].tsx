import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { formatListingPrice } from '../../src/features/listings/api/fetchBrowseListings';
import { usePublicProfile } from '../../src/features/profile/hooks/usePublicProfile';
import { ReportBlockSheet } from '../../src/features/safety/components/ReportBlockSheet';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = usePublicProfile(id);
  const [reportOpen, setReportOpen] = useState(false);

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 dark:bg-neutral-900">
        <ActivityIndicator />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View className="flex-1 items-center justify-center gap-md p-xl">
        <Text className="text-body">This profile is unavailable.</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const profile = query.data;

  return (
    <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-md pt-lg dark:border-neutral-800">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
              {profile.displayName}
              {profile.isVerified ? ' ✓' : ''}
            </Text>
            {profile.accountType === 'company' && profile.companyName ? (
              <Text className="text-body text-neutral-600 dark:text-neutral-300">
                {profile.companyName}
              </Text>
            ) : null}
            <Text className="mt-xs text-caption text-neutral-500">
              Member since {new Date(profile.memberSince).toLocaleDateString()}
            </Text>
          </View>
          <Pressable onPress={() => setReportOpen(true)} testID="profile-report">
            <Text className="text-caption text-neutral-500">Report</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={profile.listings}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-lg gap-md pb-xxl"
        ListHeaderComponent={
          <Text className="mb-sm text-title font-semibold text-neutral-900 dark:text-neutral-0">
            Listings
          </Text>
        }
        ListEmptyComponent={<Text className="text-body text-neutral-500">No active listings.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/listing/${item.id}`)}
            className="flex-row gap-md rounded-lg border border-neutral-100 p-md dark:border-neutral-800"
          >
            <View className="h-16 w-16 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
              {item.coverPhotoUrl ? (
                <Image source={{ uri: item.coverPhotoUrl }} className="h-full w-full" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="text-body font-medium text-neutral-900 dark:text-neutral-0">
                {item.title}
              </Text>
              <Text className="text-caption text-neutral-500">
                {formatListingPrice(item.priceCents)} · {item.areaLabel}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <ReportBlockSheet
        visible={reportOpen}
        targetType="user"
        targetId={profile.id}
        blockUserId={profile.id}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );
}
