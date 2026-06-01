-- pgTAP: push_tokens + notification_preferences RLS.

begin;

select plan(4);

select ok(
  (select relrowsecurity from pg_class where relname = 'push_tokens' and relnamespace = 'public'::regnamespace),
  'push_tokens has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'notification_preferences' and relnamespace = 'public'::regnamespace),
  'notification_preferences has RLS enabled'
);

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-000000000020', 'push-a@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000021', 'push-b@example.com', 'authenticated', 'authenticated');

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000020';

insert into public.push_tokens (user_id, expo_push_token, platform)
values ('00000000-0000-0000-0000-000000000020', 'ExponentPushToken[test-a]', 'ios');

select ok(
  (select count(*)::int from public.push_tokens where user_id = '00000000-0000-0000-0000-000000000020'),
  1,
  'owner can insert own push token'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000021';

select is(
  (select count(*)::int from public.push_tokens where expo_push_token = 'ExponentPushToken[test-a]'),
  0,
  'other user cannot read peer push token'
);

select * from finish();
rollback;
