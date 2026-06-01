-- 20260601150000_payments.sql
-- Purpose: payments + webhook_events tables + publish_listing RPC (Slice 4).
-- PRD: §4 data model, §3.6 payment flow.
-- Rollback: drop tables, drop function, remove triggered RLS.

begin;

-- ============================================================================
-- Enums
-- ============================================================================

create type public.payment_type as enum ('listing_create', 'listing_multi', 'listing_renew');

create type public.payment_status as enum ('succeeded', 'failed', 'refunded');

-- ============================================================================
-- payments
-- ============================================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  type public.payment_type not null,
  stripe_payment_intent_id text unique,
  status public.payment_status not null default 'succeeded',
  created_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments (user_id, created_at desc);
create index payments_listing_id_idx on public.payments (listing_id);

alter table public.payments enable row level security;

-- Users may read their own payments.
create policy "payments: self select"
  on public.payments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Only server (service_role) may write payments; no insert/update/delete RLS
-- for authenticated users.

-- ============================================================================
-- webhook_events — idempotency keys for Stripe webhooks
-- ============================================================================

create table public.webhook_events (
  provider text not null,
  event_id text not null,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

alter table public.webhook_events enable row level security;

-- No authenticated-user RLS; only service_role should access this table.
-- A blanket read policy for authenticated is intentionally omitted.

-- ============================================================================
-- publish_listing RPC — server-only activation (called from Edge Function)
-- ============================================================================

create or replace function public.publish_listing(
  p_listing_id uuid,
  p_user_id uuid,
  p_expires_at timestamptz default (now() + interval '30 days')
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.listing_status;
begin
  select status into v_status
  from public.listings
  where id = p_listing_id
    and owner_id = p_user_id;

  if v_status is null then
    raise exception 'Listing not found or not owned by user';
  end if;

  if v_status = 'active' then
    raise exception 'Listing is already active';
  end if;

  update public.listings
  set status = 'active',
      expires_at = p_expires_at,
      updated_at = now()
  where id = p_listing_id
    and owner_id = p_user_id;
end;
$$;

-- ============================================================================
-- get_active_listing_count RPC — used by Edge Function to determine price
-- ============================================================================

create or replace function public.get_active_listing_count(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.listings
  where owner_id = p_user_id
    and status = 'active';
  return v_count;
end;
$$;

commit;
