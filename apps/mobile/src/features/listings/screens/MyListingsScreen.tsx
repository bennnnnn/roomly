import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useUser } from '../../../state/session';
import { OwnerListingCard } from '../components/OwnerListingCard';
import { useOwnerListings } from '../hooks/useOwnerListings';

import type { OwnerListingRow } from '../api/ownerListings';
import type { ListingStatus } from '@roomly/db-types';

type TabKey = 'active' | 'expired' | 'rented';

function filterByTab(items: OwnerListingRow[], tab: TabKey): OwnerListingRow[] {
  if (tab === 'active') {
    return items.filter(
      (i) => i.status === 'active' || i.status === 'paused' || i.status === 'draft',
    );
  }
  if (tab === 'expired') {
    return items.filter((i) => i.status === 'expired');
  }
  return items.filter((i) => i.status === 'rented');
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'rented', label: 'Rented' },
];

export default function MyListingsScreen() {
  const router = useRouter();
  const user = useUser();
  const [tab, setTab] = useState<TabKey>('active');
  const { query, statusMutation, deleteMutation } = useOwnerListings(Boolean(user));

  const busy = statusMutation.isPending || deleteMutation.isPending;
  const filtered = useMemo(() => filterByTab(query.data ?? [], tab), [query.data, tab]);

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

  const all = query.data ?? [];

  if (all.length === 0) {
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
        <View className="mt-md flex-row gap-sm">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className={`rounded-full px-md py-xs ${
                tab === t.key ? 'bg-accent-500' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}
              testID={`my-listings-tab-${t.key}`}
            >
              <Text
                className={`text-caption font-medium ${
                  tab === t.key ? 'text-neutral-0' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-lg pb-xxl gap-md"
        ListEmptyComponent={
          <Text className="text-body text-neutral-500">No listings in this tab.</Text>
        }
        renderItem={({ item }) => (
          <OwnerListingCard
            item={item}
            busy={busy}
            onOpen={() => router.push(`/listing/${item.id}`)}
            onPay={() => router.push(`/listing/${item.id}/payment`)}
            onEdit={() => router.push(`/listing/${item.id}/edit`)}
            onStatusChange={(status: ListingStatus) => {
              statusMutation.mutate({ id: item.id, status });
            }}
            onDelete={() => {
              deleteMutation.mutate(item.id);
            }}
          />
        )}
      />
    </View>
  );
}
