-- Migration: profiles + the shared block_filter helper.
--
-- Implements ADR-0006 baseline: RLS on, owner-write policies, public-read
-- with block-awareness. Profiles row is created automatically on auth user
-- creation via the trigger below — clients never INSERT here directly.
--
-- Slice 1E: profiles only. listings/messages/etc land in later slices.

-- ============================================================================
-- 1. Shared block-filter SQL fragment (referenced by every user-facing SELECT
--    policy from now on). See ADR-0006.
-- ============================================================================

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

comment on function public.is_blocked_between is
  'True when either user has blocked the other. SECURITY DEFINER so RLS on blocks does not recurse.';

-- ============================================================================
-- 2. blocks table — referenced by the helper, must exist first.
-- ============================================================================

create table public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks: actor can read own"
  on public.blocks for select
  to authenticated
  using (blocker_id = (select auth.uid()) or blocked_id = (select auth.uid()));

create policy "blocks: actor can insert own"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "blocks: actor can delete own"
  on public.blocks for delete
  to authenticated
  using (blocker_id = (select auth.uid()));

-- ============================================================================
-- 3. profiles table.
-- ============================================================================

create type public.account_type as enum ('individual', 'company');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  account_type public.account_type not null default 'individual',
  company_name text check (char_length(company_name) <= 120),
  company_logo_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Companies must declare a name; individuals must not.
  constraint profiles_company_name_iff_company check (
    (account_type = 'company' and company_name is not null)
    or (account_type = 'individual' and company_name is null)
  )
);

create index profiles_account_type_idx on public.profiles (account_type);

alter table public.profiles enable row level security;

-- Public-read with block-awareness: any authenticated viewer can read any
-- profile, except where a block exists between them.
create policy "profiles: public read with block filter"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or not public.is_blocked_between(id, (select auth.uid()))
  );

-- Owner-only update. No INSERT policy — profiles are created via the trigger
-- on auth.users below. No DELETE policy — cascade from auth.users handles it.
create policy "profiles: owner update"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ============================================================================
-- 4. Auto-create profile on auth.users INSERT.
--    Default display_name = email's local part; the user updates it in
--    ProfileCreate after the magic-link sign-in.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_name text;
begin
  default_name := coalesce(split_part(new.email, '@', 1), 'New user');
  -- Cap to the constraint (1..60) defensively.
  default_name := substr(default_name, 1, 60);

  insert into public.profiles (id, display_name)
  values (new.id, default_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 5. updated_at maintenance.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
