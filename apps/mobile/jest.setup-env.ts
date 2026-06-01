// Test-only stubs for the public env vars consumed by apps/mobile/src/lib/env.ts.
//
// defineEnv() throws at module-load if a required var is missing — that's the
// design intent in production, but tests don't have a real Supabase project,
// so we provide harmless placeholders here. These values are NEVER reachable
// in a real build (jest is dev-only).
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable_test_key';

// AsyncStorage's native module isn't available under jest. The package ships
// an official in-memory mock; register it globally so any module that imports
// AsyncStorage (e.g. supabaseClient) works in tests.
// Docs: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('@react-native-async-storage/async-storage', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mock: unknown = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  return mock;
});
