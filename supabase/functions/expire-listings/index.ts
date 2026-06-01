import { createServiceClient } from '../_shared/supabase.ts';
import { httpError, httpOk } from '../_shared/http.ts';
import { logger } from '../_shared/logger.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return httpError(405, 'method_not_allowed');

  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return httpError(401, 'unauthorized');
  }

  const svc = createServiceClient();
  const { data, error } = await svc.rpc('expire_due_listings');

  if (error) {
    logger.error('expire_due_listings failed', { cause: error.message });
    return httpError(500, 'db_error');
  }

  const expiredCount = typeof data === 'number' ? data : 0;
  logger.info('expire_due_listings complete', { expiredCount });

  return httpOk({ expiredCount });
});
