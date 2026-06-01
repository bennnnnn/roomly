import { useStripe } from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import {
  createPaymentIntent,
  formatAmount,
} from '../../../src/features/listings/api/createPaymentIntent';
import { useListingDetail } from '../../../src/features/listings/hooks/useListingDetail';

interface PaymentState {
  clientSecret: string;
  amount: number;
  paymentType: string;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  listing_create: 'First listing — $9.99/mo',
  listing_multi: 'Additional listing — $17.99/mo flat',
  listing_renew: 'Re-list after expiry — $9.99',
};

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { data: listing } = useListingDetail(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const result = await createPaymentIntent(id);
        setPaymentState(result);

        const { error: sheetError } = await initPaymentSheet({
          paymentIntentClientSecret: result.clientSecret,
          merchantDisplayName: 'Roomly',
          appearance: {
            colors: {
              primary: '#0E8A7D',
            },
          },
        });

        if (sheetError) {
          setError(sheetError.message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [id, initPaymentSheet]);

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    try {
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (String(presentError.code) === 'Canceled') {
          // User dismissed — not an error
          setProcessing(false);
          return;
        }
        setError(presentError.message);
        setProcessing(false);
        return;
      }

      // Payment succeeded — navigate to confirmation
      router.replace({
        pathname: '/listing/[id]/published',
        params: { id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center gap-md bg-neutral-0 dark:bg-neutral-900">
        <ActivityIndicator />
        <Text className="text-body text-neutral-500">Preparing payment…</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-md bg-neutral-0 p-xl dark:bg-neutral-900">
        <Text className="text-body text-neutral-700 dark:text-neutral-200">{error}</Text>
        <Button label="Retry" onPress={() => router.replace(`/listing/${id}/edit`)} />
      </View>
    );
  }

  if (!paymentState || !listing) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 dark:bg-neutral-900">
        <Text className="text-body text-neutral-500">Something went wrong</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="gap-lg p-lg">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Publish your listing
        </Text>

        {/* Listing preview */}
        <Card>
          <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
            {listing.title}
          </Text>
          <Text className="text-caption text-neutral-500">
            {listing.type} · {listing.areaLabel}
          </Text>
        </Card>

        {/* Pricing */}
        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">Plan</Text>
          <Text className="text-body text-neutral-900 dark:text-neutral-0">
            {PAYMENT_TYPE_LABELS[paymentState.paymentType] ?? paymentState.paymentType}
          </Text>
          <View className="mt-md border-t border-neutral-100 pt-md dark:border-neutral-800">
            <View className="flex-row justify-between">
              <Text className="text-body text-neutral-700 dark:text-neutral-200">Subtotal</Text>
              <Text className="text-body text-neutral-900 dark:text-neutral-0">
                {formatAmount(paymentState.amount)}
              </Text>
            </View>
            <View className="mt-sm flex-row justify-between">
              <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
                Total
              </Text>
              <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
                {formatAmount(paymentState.amount)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Fine print */}
        <Text className="text-caption text-neutral-400">
          Auto-expires in 30 days. Never auto-charged — you'll be asked to renew.
        </Text>

        {/* Pay button */}
        <Button
          label={processing ? 'Processing…' : 'Pay & publish'}
          loading={processing}
          onPress={() => void handlePay()}
          testID="pay-button"
        />
      </View>
    </ScrollView>
  );
}
