import { Tabs } from 'expo-router';

import { COLORS } from '@roomly/ui-tokens';

/**
 * Bottom-tab layout for authenticated users. Order follows the PRD §3.1:
 * Browse · Saved · ＋ · Messages · Me.
 *
 * Icons land in Slice 7 hardening (`@expo/vector-icons` is bundled with
 * Expo). Text labels + a11y are sufficient for the foundation slice.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent[500],
        tabBarInactiveTintColor: COLORS.neutral[500],
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="create" options={{ title: 'List', tabBarLabel: '＋ List' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
