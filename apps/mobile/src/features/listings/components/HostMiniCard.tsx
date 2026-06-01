import { Pressable, Text, View } from 'react-native';

import type { AccountType } from '@roomly/db-types';

export interface HostMiniCardProps {
  displayName: string;
  accountType: AccountType;
  companyName: string | null;
  isVerified: boolean;
  onPress: () => void;
  testID?: string;
}

export function HostMiniCard({
  displayName,
  accountType,
  companyName,
  isVerified,
  onPress,
  testID,
}: HostMiniCardProps) {
  const badge = accountType === 'company' ? 'Company' : 'Individual';

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      className="flex-row items-center gap-md rounded-lg border border-neutral-100 p-md dark:border-neutral-800"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30">
        <Text className="text-body font-semibold text-accent-600 dark:text-accent-400">
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-body font-medium text-neutral-900 dark:text-neutral-0">
          Hosted by {displayName}
          {isVerified ? ' ✓' : ''}
        </Text>
        <Text className="text-caption text-neutral-500">
          {badge}
          {accountType === 'company' && companyName ? ` · ${companyName}` : ''}
        </Text>
      </View>
      <Text className="text-caption text-neutral-400">{'>'}</Text>
    </Pressable>
  );
}
