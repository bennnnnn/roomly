import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

import { sendExpoPush } from '../_shared/expo-push.ts';
import { createServiceClient, createUserClient } from '../_shared/supabase.ts';
import { httpError, httpOk } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';

const Input = z.object({
  conversationId: z.string().uuid(),
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

  const { conversationId } = parsed.data;
  const svc = createServiceClient();

  const { data: participants, error: partError } = await svc
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  if (partError || !participants?.length) {
    return httpError(404, 'conversation_not_found');
  }

  const isMember = participants.some((p) => p.user_id === user.id);
  if (!isMember) return httpError(403, 'forbidden');

  const recipientIds = participants.map((p) => p.user_id).filter((id) => id !== user.id);

  if (recipientIds.length === 0) {
    return httpOk({ sent: 0 });
  }

  const { data: prefs } = await svc
    .from('notification_preferences')
    .select('user_id, new_message_push')
    .in('user_id', recipientIds);

  const allowedIds = new Set((prefs ?? []).filter((p) => p.new_message_push).map((p) => p.user_id));

  const { data: tokens } = await svc
    .from('push_tokens')
    .select('expo_push_token, user_id')
    .in('user_id', [...allowedIds]);

  const pushMessages = (tokens ?? []).map((t) => ({
    to: t.expo_push_token,
    title: 'New message',
    body: 'You have a new message on Roomly',
    data: { conversationId },
  }));

  try {
    await sendExpoPush(pushMessages);
  } catch (cause) {
    logger.warn('expo push send failed', { cause: String(cause) });
  }

  return httpOk({ sent: pushMessages.length });
});
