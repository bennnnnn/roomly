import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
  title?: string;
  showBack?: boolean;
  right?: ReactNode;
  testID?: string;
}

export function ScreenHeader({ title, showBack = true, right, testID }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={{ paddingTop: insets.top }}
      className="border-b border-neutral-100 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="min-h-[44px] flex-row items-center justify-between px-lg py-sm">
        <View className="min-w-[72px] flex-row items-center">
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              testID={testID ? `${testID}-back` : 'screen-header-back'}
              className="py-xs pr-md"
            >
              <Text className="text-body text-accent-500">← Back</Text>
            </Pressable>
          ) : null}
        </View>
        {title ? (
          <Text
            className="flex-1 text-center text-body font-semibold text-neutral-900 dark:text-neutral-0"
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        <View className="min-w-[72px] items-end">{right ?? null}</View>
      </View>
    </View>
  );
}
