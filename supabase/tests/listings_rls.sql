-- pgTAP: listings + listing_photos + favorites RLS (Slice 2).
-- Run: supabase test db (local stack).

begin;

select plan(11);

-- ============================================================================
-- RLS enabled
-- ============================================================================

select ok(
  (select relrowsecurity from pg_class where relname = 'listings' and relnamespace = 'public'::regnamespace),
  'listings has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'listing_photos' and relnamespace = 'public'::regnamespace),
  'listing_photos has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'favorites' and relnamespace = 'public'::regnamespace),
  'favorites has RLS enabled'
);

-- ============================================================================
-- Owner insert + public cannot see draft
-- ============================================================================

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-000000000010', 'host@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000011', 'renter@example.com', 'authenticated', 'authenticated');

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';

select lives_ok(
  $$ insert into public.listings (
       id, owner_id, type, title, description, price_cents, available_from,
       area_label, lat, lng, status
     ) values (
       '00000000-0000-0000-0000-000000000020',
       '00000000-0000-0000-0000-000000000010',
       'single_bedroom',
       'Cozy room',
       'A bright room with desk and closet near transit.',
       99900,
       current_date + 1,
       'Downtown',
       40.7,
       -74.0,
       'draft'
     ) $$,
  'owner can insert a draft listing'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select is_empty(
  $$ select id from public.listings where id = '00000000-0000-0000-0000-000000000020' $$,
  'other user cannot see draft listing'
);

-- ============================================================================
-- Active listing visible to renter; block hides it
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';

select throws_like(
  $$ update public.listings set status = 'active' where id = '00000000-0000-0000-0000-000000000020' $$,
  '%server-only%',
  'owner cannot self-activate listing (publish is server-only in Slice 4)'
);

set local role = service_role;

select lives_ok(
  $$ update public.listings set status = 'active' where id = '00000000-0000-0000-0000-000000000020' $$,
  'service role can activate listing for tests'
);

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select isnt_empty(
  $$ select id from public.listings where id = '00000000-0000-0000-0000-000000000020' $$,
  'renter can see active listing'
);

insert into public.blocks (blocker_id, blocked_id)
values ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010');

select is_empty(
  $$ select id from public.listings where id = '00000000-0000-0000-0000-000000000020' $$,
  'renter cannot see listing after blocking host'
);

-- ============================================================================
-- Photo max-8 trigger
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000010';

select lives_ok(
  $$ insert into public.listing_photos (listing_id, storage_path, sort_order)
     select '00000000-0000-0000-0000-000000000020',
            '00000000-0000-0000-0000-000000000010/00000000-0000-0000-0000-000000000020/p' || g::text || '.jpg',
            g::smallint
     from generate_series(0, 7) g $$,
  'owner can insert 8 photos'
);

select throws_like(
  $$ insert into public.listing_photos (listing_id, storage_path, sort_order)
     values ('00000000-0000-0000-0000-000000000020', 'extra.jpg', 0) $$,
  '%at most 8 photos%',
  '9th photo insert is rejected'
);

select * from finish();
rollback;
