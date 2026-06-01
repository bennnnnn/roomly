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
Owners cannot set `status = 'active'` via client RLS; publish is server-only (Slice 4).
Anon may `SELECT` `storage.objects` in `listing-photos` for active listings (signed URLs).

## Slice 4 — Payments (2026-06-01)

| Table            | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `payments`       | Server-written payment rows; users read own        |
| `webhook_events` | Stripe webhook idempotency keys; service-role only |

Enums: `payment_type`, `payment_status`.

`publish_listing(listing_id, user_id)` RPC activates a listing after payment (called from Edge Function).

## Slice 5 — Messaging (2026-06-01)

| Table                       | Purpose                                |
| --------------------------- | -------------------------------------- |
| `conversations`             | Thread per listing inquiry             |
| `conversation_participants` | Members (renter + host)                |
| `conversation_hidden`       | Per-user soft-delete                   |
| `messages`                  | Chat messages; Realtime with `filter:` |
