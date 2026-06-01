import { useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';

import { sendMessage } from '../../src/features/messaging/api/messaging';
import { useMessages } from '../../src/features/messaging/hooks/useMessages';

import type { MessageItem } from '../../src/features/messaging/types';

function MessageBubble({ message }: { message: MessageItem }) {
  return (
    <View
      className={`mb-sm max-w-[80%] rounded-lg px-md py-sm ${
        message.isMine ? 'self-end bg-accent-500' : 'self-start bg-neutral-200 dark:bg-neutral-700'
      }`}
    >
      <Text
        className={`text-body ${
          message.isMine ? 'text-neutral-0' : 'text-neutral-900 dark:text-neutral-0'
        }`}
      >
        {message.body}
      </Text>
    </View>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: messages, isLoading, addOptimistic } = useMessages(id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<MessageItem>>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !id) return;

    setText('');
    setSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      conversationId: id,
      senderId: '',
      body: trimmed,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    addOptimistic(optimistic);

    try {
      await sendMessage(id, trimmed);
    } catch {
      // Let the user retry; the optimistic message stays visible.
      // A full retry UI could be added in a future iteration.
    } finally {
      setSending(false);
    }
  }, [text, sending, id, addOptimistic]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-0 dark:bg-neutral-900">
        <Text className="text-body text-neutral-500">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-0 dark:bg-neutral-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-md"
        onContentSizeChange={() => {
          if ((messages?.length ?? 0) > 0) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        renderItem={({ item }) => <MessageBubble message={item} />}
      />

      {/* Composer */}
      <View className="flex-row items-center gap-sm border-t border-neutral-100 px-md py-sm dark:border-neutral-800">
        <TextInput
          className="flex-1 rounded-full border border-neutral-200 px-md py-sm text-body text-neutral-900 dark:border-neutral-700 dark:text-neutral-0"
          placeholder="Type a message…"
          placeholderTextColor="#9ca3af"
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => void handleSend()}
          returnKeyType="send"
          editable={!sending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
