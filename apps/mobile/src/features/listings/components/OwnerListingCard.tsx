import { Alert, Pressable, Text, View } from 'react-native';

import { Button } from '../../../components/Button';

import type { OwnerListingRow } from '../api/ownerListings';
import type { ListingStatus } from '@roomly/db-types';

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600',
  draft: 'text-yellow-600',
  expired: 'text-red-500',
  paused: 'text-neutral-500',
  rented: 'text-blue-600',
};

export interface OwnerListingCardProps {
  item: OwnerListingRow;
  onOpen: () => void;
  onPay: () => void;
  onEdit: () => void;
  onStatusChange: (status: ListingStatus) => void;
  onDelete: () => void;
  busy: boolean;
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function OwnerListingCard({
  item,
  onOpen,
  onPay,
  onEdit,
  onStatusChange,
  onDelete,
  busy,
}: OwnerListingCardProps) {
  const left = daysLeft(item.expires_at);
  const expiringSoon = item.status === 'active' && left !== null && left <= 3 && left >= 0;

  function confirmMarkRented(): void {
    Alert.alert('Mark as rented?', 'This removes the listing from the public feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark rented',
        onPress: () => onStatusChange('rented'),
      },
    ]);
  }

  function confirmDelete(): void {
    Alert.alert('Delete listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }

  function confirmPause(): void {
    const pausing = item.status === 'active';
    Alert.alert(
      pausing ? 'Pause listing?' : 'Unpause listing?',
      pausing
        ? 'Your listing will be hidden until you unpause.'
        : 'Your listing will be visible again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: pausing ? 'Pause' : 'Unpause',
          onPress: () => onStatusChange(pausing ? 'paused' : 'active'),
        },
      ],
    );
  }

  return (
    <View className="rounded-lg border border-neutral-100 p-md dark:border-neutral-800">
      <Pressable onPress={onOpen}>
        <Text
          className="text-body font-medium text-neutral-900 dark:text-neutral-0"
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </Pressable>
      <View className="mt-xs flex-row items-center justify-between">
        <Text className="text-caption text-neutral-500">
          ${(item.price_cents / 100).toFixed(2)}/mo · {item.area_label}
        </Text>
        <Text
          className={`text-caption font-medium ${STATUS_COLORS[item.status] ?? 'text-neutral-500'}`}
        >
          {item.status}
        </Text>
      </View>
      {expiringSoon ? (
        <Text className="mt-xs text-caption text-yellow-600 dark:text-yellow-500">
          Expires in {left} day{left === 1 ? '' : 's'}
        </Text>
      ) : null}
      <Text className="mt-xs text-caption text-neutral-400">{item.view_count} views</Text>
      <View className="mt-sm flex-row flex-wrap gap-sm">
        {item.status === 'draft' || item.status === 'expired' ? (
          <Button
            label={item.status === 'expired' ? 'Renew' : 'Pay & publish'}
            variant="primary"
            loading={busy}
            onPress={onPay}
            testID={`my-listings-pay-${item.id}`}
          />
        ) : null}
        {item.status === 'draft' ? (
          <Button
            label="Edit"
            variant="secondary"
            loading={busy}
            onPress={onEdit}
            testID={`my-listings-edit-${item.id}`}
          />
        ) : null}
        {item.status === 'active' ? (
          <>
            <Button
              label="Mark rented"
              variant="secondary"
              loading={busy}
              onPress={confirmMarkRented}
              testID={`my-listings-rented-${item.id}`}
            />
            <Button
              label="Pause"
              variant="secondary"
              loading={busy}
              onPress={confirmPause}
              testID={`my-listings-pause-${item.id}`}
            />
          </>
        ) : null}
        {item.status === 'paused' ? (
          <Button
            label="Unpause"
            variant="secondary"
            loading={busy}
            onPress={confirmPause}
            testID={`my-listings-unpause-${item.id}`}
          />
        ) : null}
        {item.status === 'draft' || item.status === 'expired' ? (
          <Button
            label="Delete"
            variant="ghost"
            loading={busy}
            onPress={confirmDelete}
            testID={`my-listings-delete-${item.id}`}
          />
        ) : null}
      </View>
    </View>
  );
}
