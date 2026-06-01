-- pgTAP test for ADR-0006 RLS contract on profiles + blocks.
--
-- Run with: `supabase test db` (requires `supabase start` to be up).
-- Skipped in CI until a real Supabase test project is provisioned (OQ-018).

begin;

select plan(10);

-- ============================================================================
-- 1. RLS is enabled on the right tables.
-- ============================================================================

select ok(
  (select relrowsecurity from pg_class where relname = 'profiles' and relnamespace = 'public'::regnamespace),
  'profiles has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'blocks' and relnamespace = 'public'::regnamespace),
  'blocks has RLS enabled'
);

-- ============================================================================
-- 2. Profile auto-create trigger fires.
-- ============================================================================

-- Insert a fake auth user (in test schema we can use a service-role connection).
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values (
  '00000000-0000-0000-0000-000000000001',
  'alice@example.com',
  '{}'::jsonb,
  'authenticated',
  'authenticated'
);

select results_eq(
  $$ select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000001' $$,
  $$ values ('alice') $$,
  'on_auth_user_created seeds display_name from email local-part'
);

-- ============================================================================
-- 3. profiles SELECT policy — public read with block filter.
-- ============================================================================

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'carol@example.com', 'authenticated', 'authenticated');

-- Carol blocks Alice; Alice should NOT see Carol's profile, but Bob still can.
insert into public.blocks (blocker_id, blocked_id)
values ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001');

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'; -- act as Alice

select is_empty(
  $$ select id from public.profiles where id = '00000000-0000-0000-0000-000000000003' $$,
  'Alice cannot see Carol after Carol blocks Alice'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'; -- act as Bob
select isnt_empty(
  $$ select id from public.profiles where id = '00000000-0000-0000-0000-000000000003' $$,
  'Bob can still see Carol (no block between them)'
);

-- ============================================================================
-- 4. profiles UPDATE policy — owner only.
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

select lives_ok(
  $$ update public.profiles set display_name = 'Alice (updated)' where id = '00000000-0000-0000-0000-000000000001' $$,
  'Alice can update her own profile'
);

select is(
  (
    with updated as (
      update public.profiles
      set display_name = 'hack'
      where id = '00000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::int from updated
  ),
  0,
  'Alice cannot update Bob''s profile (RLS rejects)'
);

-- ============================================================================
-- 5. profiles INSERT — no direct policy; trigger is the only path.
-- ============================================================================

select throws_ok(
  $$ insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-000000000099', 'rogue') $$,
  '42501',
  null,
  'profiles INSERT is rejected (only the auth.users trigger may insert)'
);

-- ============================================================================
-- 6. profiles DELETE — no direct policy; cascade is the only path.
-- ============================================================================

select is(
  (
    with deleted as (
      delete from public.profiles where id = '00000000-0000-0000-0000-000000000001'
      returning id
    )
    select count(*)::int from deleted
  ),
  0,
  'profiles DELETE is rejected (only cascade from auth.users may delete)'
);

-- ============================================================================
-- 7. blocks INSERT policy — actor only.
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

select throws_ok(
  $$ insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003') $$,
  '42501',
  null,
  'Bob cannot impersonate Alice when inserting a block'
);

select * from finish();
rollback;
