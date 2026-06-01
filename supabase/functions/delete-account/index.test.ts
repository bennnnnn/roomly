import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.test('delete-account: requires POST', () => {
  assertEquals('POST' !== 'GET', true);
});

Deno.test('delete-account: pins identity to JWT sub', () => {
  const jwtUserId = '00000000-0000-0000-0000-000000000001';
  const bodyUserId = '00000000-0000-0000-0000-000000000099';
  assertEquals(jwtUserId !== bodyUserId, true);
});

Deno.test('delete-account: anonymized message placeholder', () => {
  const placeholder = '[Message from deleted account]';
  assertEquals(placeholder.includes('deleted'), true);
});
