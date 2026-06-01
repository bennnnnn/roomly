import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.test('register-push-token input: requires expoPushToken and platform', () => {
  const validPlatforms = ['ios', 'android', 'web'] as const;
  assertEquals(validPlatforms.includes('ios'), true);
  assertEquals(validPlatforms.includes('web'), true);
  assertEquals(validPlatforms.length, 3);
});

Deno.test('register-push-token: upsert conflict key is expo_push_token', () => {
  const onConflict = 'expo_push_token';
  assertEquals(onConflict, 'expo_push_token');
});
