import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';
import { type ColorValue } from 'react-native';

import { COLORS } from '@roomly/ui-tokens';

import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IconName; color: ColorValue }) {
  return <Ionicons name={name} size={22} color={color} />;
}

/**
 * Bottom-tab layout. Order follows PRD §3.1:
 * Browse · Saved · ＋ · Messages · Me.
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
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <TabIcon name="search-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <TabIcon name="heart-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'List',
          tabBarLabel: 'List',
          tabBarIcon: ({ color }) => <TabIcon name="add-circle-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <TabIcon name="chatbubble-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color }) => <TabIcon name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
