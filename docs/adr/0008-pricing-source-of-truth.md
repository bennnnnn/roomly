# ADR-0008 — Pricing source of truth

- **Status**: accepted
- **Date**: 2026-05-31

## Context

Roomly's MVP business model is one-time listing fees, not subscriptions (PRD §1, §3.6):

- 0 active properties → `$9.99` for this listing.
- ≥1 active property → `$17.99` flat for every additional listing.
- Re-list of an expired listing → `$9.99`.
- Plus Stripe Tax per Stripe's automatic tax engine.

The dollar amounts in the PRD are **today's** prices, not a contract. Pricing will change (promos, A/B tests, market adjustments) without a mobile release. The PRD already requires the amount to be **server-determined** so the client can never lie about how much to charge (§3.6, "Pricing logic (server-determined)").

Three architectures considered:

1. **Hard-code amounts in the Edge Function** (e.g. literal `9.99` in TypeScript).
2. **Postgres `pricing_tiers(tier_key, amount_cents)` table**, admin edits raw amounts.
3. **Stripe Products + Prices as source of truth, Postgres mapping table for which Price is live per tier.**

## Decision

**Option 3.** Three layers, each with a single, non-overlapping responsibility:

| Layer                          | Owns                                                                                                              | Why                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Stripe (Products + Prices)** | Immutable money primitives: `unit_amount`, currency, tax behavior, tax code.                                      | Stripe Prices are immutable by design — that's the audit trail. Stripe Tax handles taxability without us doing math. |
| **Postgres `pricing_tiers`**   | Mapping `tier_key → active_stripe_price_id` (+ cached `amount_cents` for fast UI render + `currency` for sanity). | Lets admin swap which Stripe Price is live for each tier without a code deploy. Mutations land in `audit_log`.       |
| **Edge Function (Deno)**       | Tier resolution rules ("0 active listings → `first_listing`"); PaymentIntent creation; webhook reconciliation.    | Keeps conditional logic server-side per PRD §3.6; client never sees an amount until the Edge Function returns it.    |

### `pricing_tiers` schema sketch (lands in Slice 4)

```sql
create table public.pricing_tiers (
  tier_key text primary key
    check (tier_key in ('first_listing', 'additional_listing', 'renew')),
  active_stripe_price_id text not null,
  amount_cents int not null,            -- cached from Stripe for UI; not authoritative
  currency text not null default 'usd', -- cached from Stripe; not authoritative
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.pricing_tiers enable row level security;
-- read: admin role only; write: admin role only via SECURITY DEFINER RPC that
-- (a) validates the Price exists in Stripe and (b) writes the audit_log row.
```

### Admin app contract

- **Renders**: current `tier_key → price_id → cached amount + currency` rows; lookup of the live Price in Stripe (read-only) to display the canonical amount + tax behavior.
- **Mutations allowed**: swap `active_stripe_price_id` for a tier. **No raw dollar fields anywhere.** To change a price, an operator (a) creates a new Price in Stripe, (b) points the tier at it from admin. This forces every price change to be auditable in _both_ Stripe and our `audit_log`.
- **Mutations forbidden**: editing `amount_cents` directly; deleting tier rows (status flag if a tier ever retires).

### Edge Function contract (Slice 4)

```
POST /functions/v1/compute-listing-fee
body: { listing_id }
auth: user JWT
→
1. Verify the user owns `listing_id` and it is in `draft` status.
2. Count user's `active` listings → derive tier_key.
3. SELECT active_stripe_price_id, amount_cents FROM pricing_tiers WHERE tier_key = ?
4. Create Stripe PaymentIntent with:
     - price/amount from the looked-up Price (never from request body),
     - automatic_tax: { enabled: true },
     - metadata: { listing_id, tier_key, price_id_at_creation }.
5. Return { client_secret, amount_cents, currency, tier_key }.
```

### Mobile + admin client contract

- Neither app ever ships a numeric price constant. No `PRICES` export in `@roomly/lib`. No hard-coded `9.99` anywhere outside this ADR.
- Mobile renders whatever `amount_cents`/`currency` the Edge Function returns; PaymentSheet handles the rest.
- Admin renders rows from `pricing_tiers` joined with the live Stripe Price lookup.

### Webhook reconciliation (Slice 4)

On `payment_intent.succeeded`:

1. Look up `metadata.listing_id` and `metadata.price_id_at_creation`.
2. Insert into `payments` with `amount`, `currency`, `tier_key`, `stripe_payment_intent`, `stripe_price_id`.
3. Flip listing to `active`, set `expires_at = now() + interval '30 days'`.
4. Resend receipt.
5. `webhook_events(event_id)` PK enforces idempotency.

The PRD's `payments` row gets an additional `stripe_price_id` column so we can answer "what price did this user actually pay?" without depending on Stripe metadata staying around.

## Consequences

- **+** Tax, refunds, chargebacks, accounting all live in Stripe — auditable by a finance team without our code.
- **+** Promos / A/B / market adjustments require zero code: create new Price in Stripe, swap pointer in admin.
- **+** Client apps never carry pricing logic — the threat model of "user patches the binary to send `amount: 0`" is structurally impossible.
- **+** Hardcoded constants prohibition is mechanically checkable: a `rg` for `9\.99|17\.99|999|1799` outside `docs/` should return zero hits at every Slice exit.
- **−** Two systems to keep in sync (Stripe Prices ↔ `pricing_tiers`). Mitigated by: admin write is the _only_ path that changes the pointer, and that path validates against Stripe before commit.
- **−** Adds one Stripe round-trip to the admin pricing page render (Stripe Price lookup). Acceptable; admin page is low-traffic, can be cached for 60s.

## Out of scope (defer to OPEN_QUESTIONS)

- **Promo / discount mechanism.** Stripe Coupons vs. a separate `promo_tier`. Tracked as OQ-015. Decide before any marketing experiment ships.
- **Stripe Tax `tax_code` for digital listing service.** Tracked as OQ-016. Must be set when the Stripe Products are first created.

## Hard rule for every subsequent slice

> No commit may introduce a numeric currency literal (in cents or dollars) outside `docs/`, `supabase/seed.sql` (test fixtures only), or test files. If you find yourself typing `9.99`, stop and revisit this ADR.
