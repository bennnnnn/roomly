-- 20260602140000_profiles_staff_role.sql
-- Purpose: admin/moderator roles for admin web (Slice 7).
-- Rollback: drop column, enum, function; restore owner update policy.

begin;

create type public.staff_role as enum ('user', 'moderator', 'admin');

alter table public.profiles
  add column staff_role public.staff_role not null default 'user';

-- Owners may update profile fields but not elevate staff_role (promotions are service-role only).
drop policy if exists "profiles: owner update" on public.profiles;

create policy "profiles: owner update"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and staff_role = (
      select p.staff_role
      from public.profiles p
      where p.id = profiles.id
    )
  );

create or replace function public.is_staff(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_uid
      and staff_role in ('admin'::public.staff_role, 'moderator'::public.staff_role)
  );
$$;

comment on function public.is_staff is
  'True when the user is an admin or moderator (admin web access).';

-- Staff may read pricing_tiers (ADR-0008 admin UI).
create policy "pricing_tiers: staff read"
  on public.pricing_tiers for select
  to authenticated
  using (public.is_staff());

commit;
