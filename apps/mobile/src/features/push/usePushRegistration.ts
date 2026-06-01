import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { logger } from '../../lib/logger';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../state/session';

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
});

async function registerToken(userId: string): Promise<void> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing !== Notifications.PermissionStatus.GRANTED) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== Notifications.PermissionStatus.GRANTED) {
      return;
    }
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenResult.data;
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  const result = await supabase.functions.invoke('register-push-token', {
    body: { expoPushToken, platform },
  });

  if (result.error) {
    const message = result.error instanceof Error ? result.error.message : 'invoke failed';
    logger.warn('register-push-token failed', { userId, message });
  }
}

/** Registers the device Expo push token when the user is signed in. */
export function usePushRegistration(): void {
  const user = useUser();

  useEffect(() => {
    if (!user?.id) return;
    void registerToken(user.id);
  }, [user?.id]);
}
