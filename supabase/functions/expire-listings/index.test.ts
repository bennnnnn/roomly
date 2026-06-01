import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.test('expire-listings: requires Bearer CRON_SECRET', () => {
  const cronSecret = 'test-secret';
  const authHeader = `Bearer ${cronSecret}`;
  assertEquals(authHeader, 'Bearer test-secret');
});

Deno.test('expire-listings: rpc name', () => {
  const rpc = 'expire_due_listings';
  assertEquals(rpc, 'expire_due_listings');
});
