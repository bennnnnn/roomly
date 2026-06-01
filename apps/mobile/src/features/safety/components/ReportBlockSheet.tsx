import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '../../../components/Button';
import { blockUser, submitReport } from '../api/blockAndReport';

import type { ReportTargetType } from '@roomly/db-types';

export interface ReportBlockSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  blockUserId?: string | undefined;
  onClose: () => void;
  onComplete?: () => void;
}

export function ReportBlockSheet({
  visible,
  targetType,
  targetId,
  blockUserId,
  onClose,
  onComplete,
}: ReportBlockSheetProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function handleReport(): Promise<void> {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError('Describe the issue in a few words.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await submitReport(targetType, targetId, trimmed);
      onComplete?.();
      onClose();
      setReason('');
    } catch {
      setError('Could not submit report.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBlock(): Promise<void> {
    if (!blockUserId) return;
    setBusy(true);
    setError(undefined);
    try {
      await blockUser(blockUserId);
      onComplete?.();
      onClose();
    } catch {
      setError('Could not block user.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-neutral-0 p-lg dark:bg-neutral-900">
        <View className="mb-lg flex-row items-center justify-between">
          <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">
            Safety
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-body text-accent-500">Close</Text>
          </Pressable>
        </View>
        <TextInput
          className="mb-md min-h-[100px] rounded-md border border-neutral-200 p-md text-body dark:border-neutral-700"
          placeholder="Why are you reporting this?"
          placeholderTextColor="#9ca3af"
          multiline
          value={reason}
          onChangeText={setReason}
        />
        {error ? <Text className="mb-md text-caption text-semantic-danger">{error}</Text> : null}
        <Button
          label={busy ? 'Submitting…' : 'Submit report'}
          loading={busy}
          onPress={() => void handleReport()}
          testID="report-submit"
        />
        {blockUserId ? (
          <View className="mt-sm">
            <Button
              label="Block user"
              variant="secondary"
              loading={busy}
              onPress={() => void handleBlock()}
              testID="block-user"
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
