import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

import { createUserClient } from '../_shared/supabase.ts';
import { httpError, httpOk } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';

const Input = z.object({
  expoPushToken: z.string().min(10),
  platform: z.enum(['ios', 'android', 'web']),
});

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return httpError(405, 'method_not_allowed');

  const userClient = createUserClient(req);
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) return httpError(401, 'unauthorized');

  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return httpError(400, 'invalid_input', parsed.error.format());

  const { expoPushToken, platform } = parsed.data;

  const { error } = await userClient.from('push_tokens').upsert(
    {
      user_id: user.id,
      expo_push_token: expoPushToken,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );

  if (error) {
    logger.error('push token upsert failed', { userId: user.id, cause: error.message });
    return httpError(500, 'db_error');
  }

  return httpOk({ registered: true });
});
