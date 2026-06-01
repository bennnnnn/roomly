-- 20260602190000_rls_guard_triggers.sql
-- Purpose: replace recursive RLS subqueries with BEFORE UPDATE triggers.
-- Rollback: drop triggers/functions; restore prior policies (dev only).

begin;

-- ============================================================================
-- profiles.staff_role — self-promotion blocked via trigger (not RLS subquery)
-- ============================================================================

create or replace function public.profiles_guard_staff_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.staff_role is distinct from old.staff_role then
    raise exception 'staff_role is read-only' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_staff_role_guard on public.profiles;

create trigger profiles_staff_role_guard
  before update on public.profiles
  for each row execute function public.profiles_guard_staff_role();

drop policy if exists "profiles: owner update" on public.profiles;

create policy "profiles: owner update"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ============================================================================
-- listings.status — client cannot draft/expired → active (server publish only)
-- ============================================================================

create or replace function public.listings_guard_self_activate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status is distinct from 'active'::public.listing_status
     and new.status = 'active'::public.listing_status then
    raise exception 'listing activation is server-only' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_self_activate_guard on public.listings;

create trigger listings_self_activate_guard
  before update on public.listings
  for each row execute function public.listings_guard_self_activate();

drop policy if exists "listings: owner update" on public.listings;

create policy "listings: owner update"
  on public.listings for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

commit;
