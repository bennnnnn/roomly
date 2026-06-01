import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getPublicSupabaseEnv } from '../env';

import type { Database } from '@roomly/db-types';

export async function createClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component read-only — middleware refreshes session.
        }
      },
    },
  });
}
