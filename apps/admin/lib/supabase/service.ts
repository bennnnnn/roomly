import { createClient } from '@supabase/supabase-js';

import { getPublicSupabaseEnv, getServiceRoleKey } from '../env';

import type { Database } from '@roomly/db-types';

/** Service-role client for moderation queries. Server-only. */
export function createServiceClient() {
  const { url } = getPublicSupabaseEnv();
  return createClient<Database>(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
