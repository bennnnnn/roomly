-- 20260602120000_pricing_reports_messaging_guard.sql
-- Purpose: pricing_tiers (ADR-0008), reports table, message contact-info guard.
-- Rollback: drop in reverse order (dev only).

begin;

-- ============================================================================
-- pricing_tiers — admin-swappable Stripe Price mapping (cached amounts for UI)
-- ============================================================================

create table public.pricing_tiers (
  tier_key text primary key
    check (tier_key in ('first_listing', 'additional_listing', 'renew')),
  active_stripe_price_id text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.pricing_tiers enable row level security;
-- No client policies: amounts are read via service-role Edge Functions only (ADR-0008).

-- Seed MVP prices (Stripe Price IDs are placeholders until wired in Stripe Dashboard).
insert into public.pricing_tiers (tier_key, active_stripe_price_id, amount_cents, currency)
values
  ('first_listing', 'price_first_listing_placeholder', 999, 'usd'),
  ('additional_listing', 'price_additional_listing_placeholder', 1799, 'usd'),
  ('renew', 'price_renew_placeholder', 999, 'usd')
on conflict (tier_key) do update set
  amount_cents = excluded.amount_cents,
  active_stripe_price_id = excluded.active_stripe_price_id;

-- ============================================================================
-- reports — user reports for moderation (Slice 5/7)
-- ============================================================================

create type public.report_target_type as enum ('listing', 'message', 'user');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);

create index reports_reporter_id_idx on public.reports (reporter_id, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

create policy "reports: reporter insert own"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));

create policy "reports: reporter read own"
  on public.reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

-- ============================================================================
-- messages — server-side contact-info mask + flag on insert
-- ============================================================================

create or replace function public.messages_guard_contact_info()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  masked text;
begin
  masked := new.body;

  masked := regexp_replace(masked, '\m[\w.+-]+@[\w-]+\.[\w.-]+\M', '[contact info removed]', 'gi');
  masked := regexp_replace(
    masked,
    '\m(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\M',
    '[contact info removed]',
    'g'
  );
  masked := regexp_replace(masked, 'https?://\S+', '[contact info removed]', 'gi');
  masked := regexp_replace(masked, 'www\.\S+', '[contact info removed]', 'gi');
  masked := regexp_replace(masked, '@\w{2,}', '[contact info removed]', 'g');

  if masked is distinct from new.body then
    new.body := masked;
    new.flagged := true;
  end if;

  return new;
end;
$$;

drop trigger if exists messages_guard_contact_info on public.messages;

create trigger messages_guard_contact_info
  before insert on public.messages
  for each row execute function public.messages_guard_contact_info();

commit;
