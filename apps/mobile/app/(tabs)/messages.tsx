import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { Skeleton } from '../../src/components/Skeleton';
import { useConversations } from '../../src/features/messaging/hooks/useConversations';

export default function Messages() {
  const router = useRouter();
  const query = useConversations();

  if (query.isLoading) {
    return (
      <View
        testID="messages-loading"
        className="flex-1 gap-sm bg-neutral-50 p-lg dark:bg-neutral-900"
      >
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View
        testID="messages-error"
        className="flex-1 items-center justify-center gap-md bg-neutral-50 p-xl dark:bg-neutral-900"
      >
        <Text className="text-body text-neutral-700 dark:text-neutral-200">
          Couldn't load messages
        </Text>
        <Button label="Retry" onPress={() => void query.refetch()} testID="messages-retry" />
      </View>
    );
  }

  const conversations = query.data ?? [];

  if (conversations.length === 0) {
    return (
      <View testID="tab-messages" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
        <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
          <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
            Messages
          </Text>
        </View>
        <EmptyState
          title="No messages yet"
          message="Contact a host from a listing to start a conversation."
        />
      </View>
    );
  }

  return (
    <View testID="tab-messages" className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Messages
        </Text>
      </View>
      <FlatList
        testID="messages-list"
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-xxl"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/conversation/${item.id}`)}
            testID={`conversation-${item.id}`}
            className="flex-row items-center gap-md border-b border-neutral-100 px-lg py-md dark:border-neutral-800"
          >
            <View className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <View className="flex-1">
              <Text className="text-body font-medium text-neutral-900 dark:text-neutral-0">
                {item.listingTitle}
              </Text>
              {item.lastMessage ? (
                <Text className="text-caption text-neutral-500" numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              ) : (
                <Text className="text-caption text-neutral-400">No messages yet</Text>
              )}
            </View>
            <Text className="text-caption text-neutral-400">
              {formatTimeAgo(item.lastMessageAt)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
