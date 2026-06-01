import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ListingDetailSkeleton } from '../../src/components/Skeleton';
import { ListingDetailBody } from '../../src/features/listings/components/ListingDetailBody';
import { useListingDetail } from '../../src/features/listings/hooks/useListingDetail';
import { createConversation } from '../../src/features/messaging/api/messaging';
import { ReportBlockSheet } from '../../src/features/safety/components/ReportBlockSheet';
import { logger } from '../../src/lib/logger';
import { useUser } from '../../src/state/session';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useUser();
  const query = useListingDetail(id);
  const [messageBusy, setMessageBusy] = useState(false);
  const [messageError, setMessageError] = useState<string | undefined>();
  const [reportOpen, setReportOpen] = useState(false);

  const handleShare = useCallback(async () => {
    if (!id) return;
    const url = Linking.createURL(`/listing/${id}`);
    await Share.share({
      message: `Check out this room on Roomly: ${url}`,
    });
  }, [id]);

  async function handleMessageHost(): Promise<void> {
    if (!user) {
      router.push('/sign-in');
      return;
    }
    if (!user.email_confirmed_at) {
      router.push('/verify-email');
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
      <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
        <ScreenHeader title="Listing" />
        <ListingDetailSkeleton testID="listing-detail-loading" />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
        <ScreenHeader title="Listing" />
        <View
          testID="listing-detail-error"
          className="flex-1 items-center justify-center gap-md p-xl"
        >
          <Text className="text-body text-neutral-600 dark:text-neutral-300">
            This listing is no longer available.
          </Text>
          <Button label="Go back" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const listing = query.data;

  return (
    <View className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <ScreenHeader
        title="Listing"
        right={
          <View className="flex-row items-center gap-md">
            <Pressable onPress={() => void handleShare()} testID="listing-share">
              <Text className="text-body text-accent-500">Share</Text>
            </Pressable>
            {!listing.isOwner ? (
              <Pressable onPress={() => setReportOpen(true)} testID="listing-report">
                <Text className="text-caption text-neutral-500">Report</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
      <ListingDetailBody
        listing={listing}
        testID="listing-detail"
        onEdit={() => router.push(`/listing/${id}/edit`)}
        onMessage={() => void handleMessageHost()}
        onViewHost={() => router.push(`/profile/${listing.ownerId}`)}
        messageBusy={messageBusy}
      />
      {messageError ? (
        <Text className="px-lg pb-lg text-caption text-semantic-danger">{messageError}</Text>
      ) : null}
      <ReportBlockSheet
        visible={reportOpen}
        targetType="listing"
        targetId={listing.id}
        blockUserId={listing.ownerId}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );
}
