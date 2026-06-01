-- pgTAP: conversations + messages RLS (Slice 5).
-- Run: supabase test db (local stack).

begin;

select plan(8);

-- ============================================================================
-- RLS enabled
-- ============================================================================

select ok(
  (select relrowsecurity from pg_class where relname = 'conversations' and relnamespace = 'public'::regnamespace),
  'conversations has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'conversation_participants' and relnamespace = 'public'::regnamespace),
  'conversation_participants has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'messages' and relnamespace = 'public'::regnamespace),
  'messages has RLS enabled'
);

-- ============================================================================
-- Setup users + listing
-- ============================================================================

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-000000000010', 'host@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000011', 'renter@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000012', 'outsider@example.com', 'authenticated', 'authenticated');

-- Create an active listing owned by user 10
set local role = service_role;
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
  'active'
);

set local role = authenticated;

-- ============================================================================
-- create_conversation: renter can start a conversation with the host
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select lives_ok(
  $$ select public.create_conversation(
       '00000000-0000-0000-0000-000000000020',
       '00000000-0000-0000-0000-000000000010'
     ) $$,
  'renter can create a conversation with host'
);

-- ============================================================================
-- Participant can insert a message
-- ============================================================================

select lives_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     select c.id,
            '00000000-0000-0000-0000-000000000011',
            'Hello, is this still available?'
     from public.conversations c
     where c.listing_id = '00000000-0000-0000-0000-000000000020'
     limit 1 $$,
  'participant can insert a message'
);

-- ============================================================================
-- Non-participant cannot insert a message
-- ============================================================================

-- Outsider needs a concrete conversation_id; they cannot SELECT conversations under RLS.
set local role = service_role;

create temp table _test_conv as
select id from public.conversations where listing_id = '00000000-0000-0000-0000-000000000020' limit 1;

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000012';

select throws_ok(
  $$ insert into public.messages (conversation_id, sender_id, body)
     select id, '00000000-0000-0000-0000-000000000012', 'Sneaking in' from _test_conv $$,
  '42501',
  null,
  'non-participant cannot insert a message'
);

-- ============================================================================
-- Participant can read own conversation messages
-- ============================================================================

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

select isnt_empty(
  $$ select 1 from public.messages m
     join public.conversations c on c.id = m.conversation_id
     where c.listing_id = '00000000-0000-0000-0000-000000000020' $$,
  'participant can read conversation messages'
);

-- ============================================================================
-- Sender can soft-delete own message
-- ============================================================================

select lives_ok(
  $$ update public.messages
     set deleted_at = now()
     where sender_id = '00000000-0000-0000-0000-000000000011' $$,
  'sender can soft-delete own message'
);

select * from finish();
rollback;
