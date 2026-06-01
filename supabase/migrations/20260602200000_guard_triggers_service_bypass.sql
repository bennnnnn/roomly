-- 20260602200000_guard_triggers_service_bypass.sql
-- Purpose: allow service_role to bypass staff_role and publish guards.
-- Rollback: restore prior trigger bodies (dev only).

begin;

create or replace function public.profiles_guard_staff_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if new.staff_role is distinct from old.staff_role then
    raise exception 'staff_role is read-only' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.listings_guard_self_activate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if old.status is distinct from 'active'::public.listing_status
     and new.status = 'active'::public.listing_status then
    raise exception 'listing activation is server-only' using errcode = '42501';
  end if;
  return new;
end;
$$;

commit;
