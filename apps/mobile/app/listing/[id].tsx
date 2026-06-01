import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { ListingDetailBody } from '../../src/features/listings/components/ListingDetailBody';
import { useListingDetail } from '../../src/features/listings/hooks/useListingDetail';
import { createConversation } from '../../src/features/messaging/api/messaging';
import { logger } from '../../src/lib/logger';
import { useUser } from '../../src/state/session';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useUser();
  const query = useListingDetail(id);
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageError, setMessageError] = useState<string | undefined>();

  async function handleMessageHost(): Promise<void> {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (!user.email_confirmed_at) {
      setMessageError('Verify your email before messaging.');
      return;
    }
    const listing = query.data;
    if (!listing || listing.isOwner) return;

    setMessageBusy(true);
    setMessageError(undefined);
    try {
      const conversationId = await createConversation(listing.id, listing.ownerId);
      router.push(`/conversation/${conversationId}`);
    } catch (e: unknown) {
      logger.warn('create conversation failed', {
        message: e instanceof Error ? e.message : 'unknown',
      });
      setMessageError('Could not start a conversation. Try again.');
    } finally {
      setMessageBusy(false);
    }
  }

  if (query.isLoading) {
    return (
      <View testID="listing-detail-loading" className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View
        testID="listing-detail-error"
        className="flex-1 items-center justify-center gap-md p-xl"
      >
        <Text className="text-body">This listing is no longer available.</Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ListingDetailBody
        listing={query.data}
        testID="listing-detail"
        onEdit={() => router.push(`/listing/${id}/edit`)}
        onMessage={() => void handleMessageHost()}
        messageBusy={messageBusy}
      />
      {messageError ? (
        <Text className="px-lg pb-lg text-caption text-semantic-danger">{messageError}</Text>
      ) : null}
    </View>
  );
}
