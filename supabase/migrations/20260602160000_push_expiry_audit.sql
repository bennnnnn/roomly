-- 20260602160000_push_expiry_audit.sql
-- Purpose: push tokens, notification prefs, listing expiry + audit log (Slice 5/7).
-- Rollback: drop objects in reverse order (dev only).

begin;

-- ============================================================================
-- push_tokens — Expo push device tokens per user
-- ============================================================================

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  updated_at timestamptz not null default now(),
  unique (expo_push_token)
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push_tokens: owner all"
  on public.push_tokens for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================================================================
-- notification_preferences — per-user toggles (PRD §3.14)
-- ============================================================================

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  new_message_push boolean not null default true,
  listing_expiring_push boolean not null default true,
  payment_receipt_email boolean not null default true,
  marketing_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences: owner all"
  on public.notification_preferences for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Default prefs row when profile is created.
create or replace function public.handle_new_user_notification_prefs()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_notification_prefs
  after insert on auth.users
  for each row execute function public.handle_new_user_notification_prefs();

insert into public.notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ============================================================================
-- audit_log — moderator actions (append-only for staff via service role)
-- ============================================================================

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log: staff read"
  on public.audit_log for select
  to authenticated
  using (public.is_staff());

-- No insert/update/delete for authenticated — service role only.

-- ============================================================================
-- expire_due_listings — cron / Edge Function (Slice 4 renew flow)
-- ============================================================================

create or replace function public.expire_due_listings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.listings
  set status = 'expired'::public.listing_status,
      updated_at = now()
  where status = 'active'::public.listing_status
    and expires_at is not null
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.expire_due_listings is
  'Marks active listings past expires_at as expired. Invoke from scheduled Edge Function.';

-- ============================================================================
-- unpublish_listing — refund/chargeback path (server-only)
-- ============================================================================

create or replace function public.unpublish_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listings
  set status = 'expired'::public.listing_status,
      updated_at = now()
  where id = p_listing_id
    and status = 'active'::public.listing_status;
end;
$$;

commit;
