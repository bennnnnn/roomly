// Pull in Tailwind's compiled atlas. Must be at the entry layout so styles
// are available for every screen the Router mounts.
import '../global.css';

import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { usePushRegistration } from '../src/features/push/usePushRegistration';
import { createSessionFromUrl } from '../src/lib/authDeepLink';
import { QueryProvider } from '../src/providers/QueryProvider';
import { AppStripeProvider } from '../src/providers/StripeProvider';
import { bootstrapSession } from '../src/state/session';

export default function RootLayout() {
  usePushRegistration();
  // Start the single Supabase auth listener at app boot. bootstrapSession is
  // idempotent (retro §1) so even with React 19's Strict-Mode double-invoke
  // we end up with exactly one subscription.
  useEffect(() => {
    const cleanup = bootstrapSession();
    return cleanup;
  }, []);

  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      void createSessionFromUrl(event.url).catch(() => undefined);
    };
    const sub = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => {
      if (url) void createSessionFromUrl(url).catch(() => undefined);
    });
    return () => sub.remove();
  }, []);

  return (
    <AppStripeProvider>
      <QueryProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryProvider>
    </AppStripeProvider>
  );
}
