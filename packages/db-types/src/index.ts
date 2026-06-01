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

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Placeholder = Record<string, never>;
