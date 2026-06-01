import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { createSessionFromUrl } from '../../src/lib/authDeepLink';

/** Handles `roomly://auth/callback` after email verification or magic link. */
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        await createSessionFromUrl(url);
      }
      router.replace('/(tabs)/browse');
    })();
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  );
}
