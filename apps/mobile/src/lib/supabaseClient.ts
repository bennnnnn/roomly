import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';

import type { Database } from '@roomly/db-types';

/**
 * Singleton Supabase client typed against the generated DB schema.
 *
 * Re-importing this file anywhere in the app returns the same instance (JS
 * module caching enforces this) — never call `createClient` directly elsewhere
 * or auth state will split across two stores.
 *
 * Auth config:
 *   - `storage: AsyncStorage` — sessions survive cold starts.
 *   - `autoRefreshToken: true` — silent JWT refresh, no 401 mid-screen.
 *   - `detectSessionInUrl: false` — RN has no URL bar; deep-link callbacks
 *     are handled explicitly by `expo-router` in the auth slice.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
