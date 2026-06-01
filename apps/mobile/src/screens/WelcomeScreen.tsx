import { Text, View } from 'react-native';

import { TIMINGS } from '@roomly/lib';
import { COLORS, FONT_SIZES, SPACING } from '@roomly/ui-tokens';

export default function WelcomeScreen() {
  return (
    <View
      testID="welcome-screen"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.neutral[0],
        padding: SPACING.xl,
      }}
    >
      <Text
        style={{
          fontSize: FONT_SIZES.heading,
          fontWeight: '600',
          color: COLORS.neutral[900],
        }}
      >
        Welcome to Roomly
      </Text>
      <Text
        style={{
          marginTop: SPACING.sm,
          fontSize: FONT_SIZES.body,
          color: COLORS.neutral[500],
        }}
      >
        Presence heartbeat: {TIMINGS.presenceHeartbeatMs} ms
      </Text>
    </View>
  );
}
