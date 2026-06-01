import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { formatUsdFromCents } from '@roomly/lib';

import { supabase } from '../src/lib/supabaseClient';
import { useUser } from '../src/state/session';

interface PaymentRow {
  id: string;
  amount_cents: number;
  type: string;
  status: string;
  created_at: string;
}

async function fetchMyPayments(): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, amount_cents, type, status, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export default function BillingScreen() {
  const user = useUser();
  const query = useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: fetchMyPayments,
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 p-xl dark:bg-neutral-900">
        <Text className="text-body text-neutral-500">Sign in to view billing.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Billing
        </Text>
      </View>
      {query.isLoading ? (
        <ActivityIndicator className="mt-xl" />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-lg gap-md"
          ListEmptyComponent={<Text className="text-body text-neutral-500">No payments yet.</Text>}
          renderItem={({ item }) => (
            <View className="rounded-lg border border-neutral-100 p-md dark:border-neutral-800">
              <Text className="text-body font-medium text-neutral-900 dark:text-neutral-0">
                {formatUsdFromCents(item.amount_cents)}
              </Text>
              <Text className="text-caption text-neutral-500">
                {item.type.replaceAll('_', ' ')} · {item.status}
              </Text>
              <Text className="text-caption text-neutral-400">
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
