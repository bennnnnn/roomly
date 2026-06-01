import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '../src/components/Card';
import { supabase } from '../src/lib/supabaseClient';

export default function Settings() {
  const router = useRouter();
  return (
    <ScrollView className="flex-1 bg-neutral-0 dark:bg-neutral-900">
      <View className="border-b border-neutral-100 px-lg pb-sm pt-lg dark:border-neutral-800">
        <Text className="text-heading font-semibold text-neutral-900 dark:text-neutral-0">
          Settings
        </Text>
      </View>

      <View className="gap-lg p-lg">
        {/* Account */}
        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">Account</Text>
          <SettingRow label="Billing history" onPress={() => router.push('/billing')} />
          <SettingRow label="Change email" />
          <SettingRow label="Change password" />
          <SettingRow label="Linked accounts" />
        </Card>

        {/* Notifications */}
        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">
            Notifications
          </Text>
          <SettingRow label="Push notifications" />
          <SettingRow label="Email notifications" />
        </Card>

        {/* Legal */}
        <Card>
          <Text className="text-caption font-semibold uppercase text-neutral-500">
            Legal & support
          </Text>
          <SettingRow label="Terms of service" />
          <SettingRow label="Privacy policy" />
          <SettingRow label="Help & FAQ" />
          <SettingRow label="Contact support" />
        </Card>

        {/* Danger zone */}
        <Card>
          <Text className="text-caption font-semibold uppercase text-red-500">Danger zone</Text>
          <SettingRow
            label="Delete account"
            destructive
            onPress={() => {
              void supabase.auth.signOut();
              router.replace('/sign-in');
            }}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  destructive = false,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-sm"
      accessibilityRole="button"
    >
      <Text
        className={`text-body ${destructive ? 'text-red-500' : 'text-neutral-900 dark:text-neutral-0'}`}
      >
        {label}
      </Text>
      <Text className="text-caption text-neutral-400">{'>'}</Text>
    </Pressable>
  );
}
