/**
 * Placeholder for generated Supabase types.
 *
 * Run `pnpm db:types` (added in Slice 1D) to regenerate
 * `src/generated/database.ts` from the live Supabase schema, then re-export
 * the needed types from this file.
 *
 * For now this exports an empty `Database` shape so `@supabase/supabase-js`
 * can be typed against it without weakening to `any`. When real tables land,
 * the generator overwrites this with the actual schema and consumers get
 * proper autocomplete on `from('...')` chains for free.
 */

/**
 * Hand-written stub matching `supabase/migrations/20260531000001_profiles.sql`.
 *
 * Slice 1D-X (TBD) will replace this with the output of:
 *   `supabase gen types typescript --linked > src/generated/database.ts`
 * tracked by OQ-017.
 *
 * Keep this file in sync with the migrations until then — `pnpm typecheck`
 * is the contract.
 */

export type AccountType = 'individual' | 'company';

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  account_type: AccountType;
  company_name: string | null;
  company_logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  account_type?: AccountType;
  company_name?: string | null;
  company_logo_url?: string | null;
  is_verified?: boolean;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string | null;
  account_type?: AccountType;
  company_name?: string | null;
  company_logo_url?: string | null;
}

export interface BlockRow {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface BlockInsert {
  blocker_id: string;
  blocked_id: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      blocks: {
        Row: BlockRow;
        Insert: BlockInsert;
        Update: Partial<BlockInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_blocked_between: {
        Args: { a: string; b: string };
        Returns: boolean;
      };
    };
    Enums: { account_type: AccountType };
    CompositeTypes: Record<string, never>;
  };
}

export type Placeholder = Record<string, never>;
