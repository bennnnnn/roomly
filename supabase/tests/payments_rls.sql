-- pgTAP: payments + webhook_events RLS + publish_listing RPC (Slice 4).
-- Run: supabase test db (local stack).

begin;

select plan(8);

-- ============================================================================
-- RLS enabled
-- ============================================================================

select ok(
  (select relrowsecurity from pg_class where relname = 'payments' and relnamespace = 'public'::regnamespace),
  'payments has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'webhook_events' and relnamespace = 'public'::regnamespace),
  'webhook_events has RLS enabled'
);

-- ============================================================================
-- Setup users + listing
-- ============================================================================

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-000000000010', 'host@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000011', 'renter@example.com', 'authenticated', 'authenticated');

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';

insert into public.listings (
  id, owner_id, type, title, description, price_cents, available_from,
  area_label, lat, lng, status
) values (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'single_bedroom',
  'Test listing',
  'A bright room with desk near transit.',
  99900,
  current_date + 1,
  'Downtown',
  40.7,
  -74.0,
  'draft'
);

-- ============================================================================
-- RLS: authenticated users cannot insert payments
-- ============================================================================

select throws_ok(
  $$ insert into public.payments (user_id, listing_id, amount_cents, type, status)
     values (
       '00000000-0000-0000-0000-000000000010',
       '00000000-0000-0000-0000-000000000020',
       999,
       'listing_create',
       'succeeded'
     ) $$,
  '42501',
  null,
  'authenticated user cannot insert a payment row'
);

-- ============================================================================
-- RLS: users can read own payments
-- ============================================================================

-- Insert a payment as service role (bypass RLS) to test read
set local role = service_role;

insert into public.payments (user_id, listing_id, amount_cents, type, status)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000020',
  999,
  'listing_create',
  'succeeded'
);

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';

select results_eq(
  $$ select amount_cents from public.payments $$,
  $$ values (999::integer) $$,
  'owner can read their own payment'
);

-- ============================================================================
-- RLS: other user cannot read someone else's payment
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select is_empty(
  $$ select 1 from public.payments $$,
  'non-owner cannot read another user''s payments'
);

-- ============================================================================
-- RLS: authenticated users cannot read webhook_events
-- ============================================================================

select is_empty(
  $$ select 1 from public.webhook_events $$,
  'authenticated users cannot read webhook_events'
);

-- ============================================================================
-- publish_listing RPC: activates a draft listing
-- ============================================================================

set local role = service_role;

select lives_ok(
  $$ select public.publish_listing(
       '00000000-0000-0000-0000-000000000020',
       '00000000-0000-0000-0000-000000000010'
     ) $$,
  'publish_listing activates a draft listing'
);

select results_eq(
  $$ select status from public.listings where id = '00000000-0000-0000-0000-000000000020' $$,
  $$ values ('active'::public.listing_status) $$,
  'listing status is active after publish_listing'
);

select * from finish();
rollback;
