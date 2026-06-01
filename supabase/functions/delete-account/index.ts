import { createServiceClient, createUserClient } from '../_shared/supabase.ts';
import { httpError, httpOk } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return httpError(405, 'method_not_allowed');

  const userClient = createUserClient(req);
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) return httpError(401, 'unauthorized');

  const svc = createServiceClient();

  const { error: msgError } = await svc
    .from('messages')
    .update({ body: '[Message from deleted account]' })
    .eq('sender_id', user.id);
  if (msgError) {
    logger.error('delete-account anonymize messages failed', {
      userId: user.id,
      cause: msgError.message,
    });
    return httpError(500, 'db_error');
  }

  const { error: deleteError } = await svc.auth.admin.deleteUser(user.id);
  if (deleteError) {
    logger.error('delete-account auth delete failed', {
      userId: user.id,
      cause: deleteError.message,
    });
    return httpError(500, 'auth_error');
  }

  logger.info('delete-account complete', { userId: user.id });
  return httpOk({ deleted: true });
});
