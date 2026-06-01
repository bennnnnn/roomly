// Pull in Tailwind's compiled atlas. Must be at the entry layout so styles
// are available for every screen the Router mounts.
import '../global.css';

import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
