-- 20260601160000_messaging.sql
-- Purpose: conversations, messages, conversation_hidden (Slice 5).
-- PRD: §4 data model, §3.7-3.8 messaging.
-- Rollback: drop tables in reverse order.

begin;

-- ============================================================================
-- conversations
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index conversations_last_message_idx
  on public.conversations (last_message_at desc);

alter table public.conversations enable row level security;

-- ============================================================================
-- conversation_participants
-- ============================================================================

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index conv_parts_user_id_idx
  on public.conversation_participants (user_id, conversation_id);

alter table public.conversation_participants enable row level security;

-- ============================================================================
-- conversation_hidden — per-user soft-hide for "delete chat"
-- ============================================================================

create table public.conversation_hidden (
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

alter table public.conversation_hidden enable row level security;

-- ============================================================================
-- messages
-- ============================================================================

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  flagged boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

-- Realtime requires publication; enables it for the messages table.
alter publication supabase_realtime add table public.messages;

-- ============================================================================
-- RLS: conversation_participants
-- ============================================================================

create policy "conv_parts: self select"
  on public.conversation_participants for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "conv_parts: participant insert"
  on public.conversation_participants for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- ============================================================================
-- RLS: conversations
-- ============================================================================

create policy "conversations: participant select"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id
        and cp.user_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.conversation_hidden ch
      where ch.conversation_id = id
        and ch.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS: conversation_hidden
-- ============================================================================

create policy "conv_hidden: self all"
  on public.conversation_hidden for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================================================================
-- RLS: messages
-- ============================================================================

create policy "messages: participant select"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "messages: participant insert"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = (select auth.uid())
    )
    -- Blocked users cannot send messages.
    and not exists (
      select 1
      from public.conversation_participants cp2
      join public.blocks b on
        (b.blocker_id = cp2.user_id and b.blocked_id = (select auth.uid()))
        or (b.blocker_id = (select auth.uid()) and b.blocked_id = cp2.user_id)
      where cp2.conversation_id = messages.conversation_id
        and cp2.user_id <> (select auth.uid())
    )
  );

-- Participating user soft-deletes their own message (sender-scoped).
create policy "messages: sender soft-delete"
  on public.messages for update
  to authenticated
  using (sender_id = (select auth.uid()))
  with check (
    sender_id = (select auth.uid())
    and deleted_at is not null
  );

-- ============================================================================
-- create_conversation RPC — safely creates a conversation between two users
-- for a given listing. Ensures exactly two participants (the caller is one).
-- ============================================================================

create or replace function public.create_conversation(
  p_listing_id uuid,
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv_id uuid;
  v_my_id uuid;
begin
  v_my_id := (select auth.uid());
  if v_my_id is null then
    raise exception 'authentication required';
  end if;

  -- Verify the other user is the listing owner and not blocked.
  if not exists (
    select 1 from public.listings l
    where l.id = p_listing_id
      and l.owner_id = p_other_user_id
      and l.status = 'active'
      and not public.is_blocked_between(v_my_id, p_other_user_id)
  ) then
    raise exception 'listing not found or unavailable';
  end if;

  -- Check if a conversation already exists between these users for this listing.
  select cp.conversation_id into v_conv_id
  from public.conversation_participants cp
  where cp.user_id = v_my_id
    and cp.conversation_id in (
      select cp2.conversation_id
      from public.conversation_participants cp2
      where cp2.user_id = p_other_user_id
    )
    and cp.conversation_id in (
      select c.id from public.conversations c where c.listing_id = p_listing_id
    )
  limit 1;

  if v_conv_id is not null then
    return v_conv_id;
  end if;

  -- Create new conversation.
  insert into public.conversations (listing_id)
  values (p_listing_id)
  returning id into v_conv_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (v_conv_id, v_my_id),
    (v_conv_id, p_other_user_id);

  return v_conv_id;
end;
$$;

commit;
