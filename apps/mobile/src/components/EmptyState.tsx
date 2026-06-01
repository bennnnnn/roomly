import { Text, View } from 'react-native';

import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({ title, message, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View testID={testID} className="items-center gap-md px-xl py-xxl">
      <Text className="text-title font-semibold text-neutral-900 dark:text-neutral-0">{title}</Text>
      <Text className="text-center text-body text-neutral-500 dark:text-neutral-400">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          {...(testID !== undefined ? { testID: `${testID}-action` } : {})}
        />
      ) : null}
    </View>
  );
}
