// Pull in Tailwind's compiled atlas. Must be at the entry layout so styles
// are available for every screen the Router mounts.
import '../global.css';

import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { bootstrapSession } from '../src/state/session';

export default function RootLayout() {
  // Start the single Supabase auth listener at app boot. bootstrapSession is
  // idempotent (retro §1) so even with React 19's Strict-Mode double-invoke
  // we end up with exactly one subscription.
  useEffect(() => {
    const cleanup = bootstrapSession();
    return cleanup;
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
