// Test-only stubs for the public env vars consumed by apps/mobile/src/lib/env.ts.
//
// defineEnv() throws at module-load if a required var is missing — that's the
// design intent in production, but tests don't have a real Supabase project,
// so we provide harmless placeholders here. These values are NEVER reachable
// in a real build (jest is dev-only).
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable_test_key';
process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??= 'pk_test_placeholder';

// AsyncStorage's native module isn't available under jest. The package ships
// an official in-memory mock; register it globally so any module that imports
// AsyncStorage (e.g. supabaseClient) works in tests.
// Docs: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'roomly://auth/callback'),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
}));

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('@react-native-vector-icons/ionicons', () => 'Ionicons');

jest.mock('@react-native-async-storage/async-storage', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mock: unknown = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  return mock;
});
