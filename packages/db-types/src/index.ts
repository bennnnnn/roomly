/**
 * Supabase-generated Postgres types for Roomly.
 *
 * Regenerate after every migration that changes the schema:
 *   pnpm db:types
 *
 * Requires `supabase link --project-ref <ref>` (one-time per machine).
 * Output lands in `src/generated/database.ts` (committed — it's not a secret).
 */

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './generated/database';

export { Constants } from './generated/database';

/** Convenience aliases for the most-used table rows. */
export type { Database as RoomlyDatabase } from './generated/database';

import type { Database } from './generated/database';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type BlockRow = Database['public']['Tables']['blocks']['Row'];
export type BlockInsert = Database['public']['Tables']['blocks']['Insert'];
export type AccountType = Database['public']['Enums']['account_type'];
