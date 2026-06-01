---
name: migration-author
description: Author a Supabase migration for Roomly with RLS, indexes, and a pgTAP test. Use whenever a task requires creating or modifying a Postgres table, view, function, RPC, or row-level security policy under supabase/migrations/.
---

# Migration author (Roomly)

Use this skill to add a new migration. Every migration ships with RLS, indexes, and at least one pgTAP test.

## Checklist (copy into your scratchpad)

```
- [ ] 1. Decide the change. Open docs/PRD.md §4 (data model) and confirm the new shape.
- [ ] 2. Generate a timestamped filename: YYYYMMDDHHMMSS_short_snake_summary.sql.
- [ ] 3. Write the migration following the template below.
- [ ] 4. Enable RLS in the same migration. Add owner-write + public-read policies.
- [ ] 5. Block-aware reads: filter out rows where the viewer is blocked.
- [ ] 6. Add indexes for every column used in where/order/foreign-key.
- [ ] 7. Add a pgTAP test under supabase/tests/ covering positive + negative cases.
- [ ] 8. Apply via the plugin-supabase-supabase MCP `apply_migration` (NOT psql).
- [ ] 9. Run `pnpm test:db` locally and confirm green.
- [ ] 10. Append a short note to docs/data-model.md.
```

## Migration template

```sql
-- {timestamp}_{summary}.sql
-- Purpose: <one-line>
-- Author: <name>
-- Related PRD section: <section number>
-- Rollback: <how, or "irreversible — see comment block">

begin;

create table if not exists public.{table} (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  -- ... columns
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_{table}_owner on public.{table}(owner_id);
-- additional indexes as needed

alter table public.{table} enable row level security;

drop policy if exists "{table}_owner_write" on public.{table};
create policy "{table}_owner_write"
  on public.{table}
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "{table}_public_read" on public.{table};
create policy "{table}_public_read"
  on public.{table}
  for select
  to authenticated
  using (
    status = 'active'
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = {table}.owner_id and b.blocked_id = (select auth.uid()))
         or (b.blocker_id = (select auth.uid()) and b.blocked_id = {table}.owner_id)
    )
  );

commit;
```

## pgTAP test template

```sql
-- supabase/tests/{table}_rls.sql
begin;
select plan(4);

-- Setup: create two users via auth.users, then sign in as user A.
-- See supabase/tests/_helpers.sql for helpers.

select lives_ok(
  $$ insert into public.{table}(owner_id, ...) values (current_user_id(), ...) $$,
  'owner can insert their own row'
);

select throws_ok(
  $$ insert into public.{table}(owner_id, ...) values (other_user_id(), ...) $$,
  '42501',
  null,
  'cannot insert a row for another owner'
);

-- ... block-aware read tests

select * from finish();
rollback;
```

## Do not

- Do not edit a migration after it has been applied to a remote environment. Write a new one.
- Do not use `psql` against the remote DB. Use the MCP.
- Do not skip the pgTAP test "because the change is simple". Simple changes get simple tests.
