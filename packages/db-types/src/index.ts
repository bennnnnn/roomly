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
export type StaffRole = Database['public']['Enums']['staff_role'];
export type ListingType = Database['public']['Enums']['listing_type'];
export type ListingStatus = Database['public']['Enums']['listing_status'];
export type ListingRow = Database['public']['Tables']['listings']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];
export type ListingPhotoRow = Database['public']['Tables']['listing_photos']['Row'];
export type FavoriteRow = Database['public']['Tables']['favorites']['Row'];
export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentType = Database['public']['Enums']['payment_type'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type WebhookEventRow = Database['public']['Tables']['webhook_events']['Row'];
export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipantRow =
  Database['public']['Tables']['conversation_participants']['Row'];
export type ConversationHiddenRow = Database['public']['Tables']['conversation_hidden']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type ReportRow = Database['public']['Tables']['reports']['Row'];
export type ReportTargetType = Database['public']['Enums']['report_target_type'];
export type PricingTierRow = Database['public']['Tables']['pricing_tiers']['Row'];
