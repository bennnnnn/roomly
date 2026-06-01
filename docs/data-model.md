# Data model (living)

Source of truth: `supabase/migrations/`. Regenerate client types with `pnpm db:types`.

## Slice 2 — Listings (2026-06-01)

| Table                      | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `listings`                 | Core listing row; `status` draft/active/…; rules as boolean columns |
| `listing_private_location` | Exact address; owner-only RLS                                       |
| `listing_photos`           | Up to 8 photos; `storage_path` in `listing-photos` bucket           |
| `favorites`                | Renter saves; PK `(user_id, listing_id)`                            |

Enums: `listing_type`, `listing_status`.

Public browse reads `listings` where `status = 'active'` with block filter (ADR-0006).
