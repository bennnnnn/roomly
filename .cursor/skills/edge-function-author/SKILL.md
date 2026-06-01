---
name: edge-function-author
description: Author a Roomly Supabase Edge Function (Deno) with JWT pinning, zod input validation, idempotency, and Deno tests. Use when creating or modifying files under supabase/functions/.
---

# Edge Function author (Roomly)

Edge Functions are the only place where the client's intent gets translated into authoritative state. Treat them like a public API.

## Checklist

```
- [ ] 1. Define the input shape in zod.
- [ ] 2. Verify JWT and pin caller to auth.uid().
- [ ] 3. Server-compute amounts / state transitions — never trust the client.
- [ ] 4. For webhooks: idempotency via webhook_events table.
- [ ] 5. Escape every user-controlled string before composing email HTML.
- [ ] 6. Write Deno tests: happy path, missing JWT, mismatched sub, idempotent replay, downstream failure.
- [ ] 7. Log via _shared/logger.ts. No raw console.log of PII.
```

## Function template

```ts
// supabase/functions/<name>/index.ts
import { z } from 'https://deno.land/x/zod/mod.ts';
import { createUserClient, createServiceClient } from '../_shared/supabase.ts';
import { logger } from '../_shared/logger.ts';
import { httpError, httpOk } from '../_shared/http.ts';

const Input = z.object({
  // never accept identity fields like senderId; derive from JWT
  listingId: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') return httpError(405, 'method_not_allowed');

  const userClient = createUserClient(req);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return httpError(401, 'unauthorized');

  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return httpError(400, 'invalid_input', parsed.error.format());

  const svc = createServiceClient();
  try {
    // ... server-side logic; always re-read state from DB before deciding.
    return httpOk({ ok: true });
  } catch (cause) {
    logger.error('<name> failed', { userId: user.id, cause });
    return httpError(500, 'internal');
  }
});
```

## Webhook idempotency

```ts
const eventId = stripeEvent.id;
const { error } = await svc.from('webhook_events')
  .insert({ provider: 'stripe', event_id: eventId });
if (error?.code === '23505') return httpOk({ idempotent: true });
if (error) throw error;
// ...process the event...
```

## Test template

```ts
// supabase/functions/<name>/index.test.ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts';

Deno.test('rejects missing JWT', async () => { /* ... */ });
Deno.test('rejects when JWT sub != claimed actor', async () => { /* ... */ });
Deno.test('happy path', async () => { /* ... */ });
Deno.test('idempotent replay returns 200', async () => { /* ... */ });
```

## Do not

- Do not trust `senderId`, `userId`, or any identity claim from the request body.
- Do not compute Stripe amounts on the client.
- Do not interpolate user-controlled strings into email HTML without escaping.
- Do not return raw Postgres error messages — map via `_shared/pg-errors.ts`.
