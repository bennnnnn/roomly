import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { supabase } from '../src/lib/supabaseClient';
import { useUser } from '../src/state/session';

interface OwnerListing {
  id: string;
  title: string;
  price_cents: number;
  status: string;
  area_label: string;
  created_at: string;
  view_count: number;
}

async function fetchMyListings(): Promise<OwnerListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price_cents, status, area_label, created_at, view_count')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600',
  draft: 'text-yellow-600',
  expired: 'text-red-500',
  paused: 'text-neutral-500',
  rented: 'text-blue-600',
};

export default function MyListings() {
  const router = useRouter();
  const user = useUser();
  const query = useQuery({
    queryKey: ['listings', 'mine'],
    queryFn: fetchMyListings,
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 p-xl dark:bg-neutral-900">
        <Text className="text-body text-neutral-500">Sign in to see your listings.</Text>
      </View>
    );
  }

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 dark:bg-neutral-900">
        <ActivityIndicator />
      </View>
    );
  }

  const items = query.data ?? [];

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-md bg-neutral-0 p-xl dark:bg-neutral-900">
        <Text className="text-body text-neutral-500">You haven't listed anything yet.</Text>
        <Button
          label="List your place"
          onPress={() => router.push('/listing/new')}
          testID="my-listings-empty-cta"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          My listings
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-lg pb-xxl gap-md"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/listing/${item.id}`)}
            className="rounded-lg border border-neutral-100 p-md dark:border-neutral-800"
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-body font-medium text-neutral-900 dark:text-neutral-0"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                className={`text-caption font-medium ${STATUS_COLORS[item.status] ?? 'text-neutral-500'}`}
              >
                {item.status}
              </Text>
            </View>
            <Text className="text-caption text-neutral-500">
              ${(item.price_cents / 100).toFixed(2)}/mo · {item.area_label}
            </Text>
            <View className="mt-sm flex-row items-center justify-between">
              <Text className="text-caption text-neutral-400">{item.view_count} views</Text>
              <View className="flex-row gap-sm">
                {item.status === 'draft' || item.status === 'expired' ? (
                  <Button
                    label={item.status === 'expired' ? 'Renew' : 'Pay & publish'}
                    variant="primary"
                    onPress={() => router.push(`/listing/${item.id}/payment`)}
                    testID={`my-listings-pay-${item.id}`}
                  />
                ) : null}
                {item.status === 'draft' ? (
                  <Button
                    label="Edit"
                    variant="secondary"
                    onPress={() => router.push(`/listing/${item.id}/edit`)}
                    testID={`my-listings-edit-${item.id}`}
                  />
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
