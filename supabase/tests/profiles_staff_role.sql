-- pgTAP: staff_role cannot be self-elevated; is_staff helper.
begin;

select plan(3);

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-000000000030', 'user@example.com', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000031', 'mod@example.com', 'authenticated', 'authenticated');

set local role = service_role;

update public.profiles
set staff_role = 'moderator'
where id = '00000000-0000-0000-0000-000000000031';

set local role = authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000030';

select throws_like(
  $$ update public.profiles set staff_role = 'admin' where id = '00000000-0000-0000-0000-000000000030' $$,
  'violates row-level security%',
  'regular user cannot self-promote to admin'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000031';

select ok(
  public.is_staff('00000000-0000-0000-0000-000000000031'),
  'moderator is staff'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000030';

select ok(
  not public.is_staff('00000000-0000-0000-0000-000000000030'),
  'regular user is not staff'
);

select * from finish();
rollback;
