# ADR-0006 — RLS policy baseline

- **Status**: accepted
- **Date**: 2026-05-31

## Context

The prior codebase shipped multiple `using (true)` policies, including on `profiles`. The "block" feature was advertised but not enforced at the database level — a blocked user could still fetch the blocker's profile by UUID. `messages` DELETE allowed either participant to delete the other's messages.

## Options

1. Per-table policies, hand-reviewed.
2. **Per-table policies plus a CI gate that fails if any user-facing table lacks at least one policy of each operation type, and an explicit block-awareness contract.**
3. Service-role everywhere, "trust the API layer".

## Decision

Option **2**.

### Baseline contract (every user-facing table)

1. **RLS enabled** in the same migration that creates the table.
2. **Owner-write policy** scoped to `auth.uid()`.
3. **Public-read policy** that explicitly excludes rows where the viewer is blocked by or has blocked the owner.
4. **No `using (true)`** for non-public reads (rare exceptions documented in this ADR with rationale).
5. **DELETE policies** scoped to the actor (`sender_id = auth.uid()` for messages, `owner_id = auth.uid()` for listings, etc.). Soft-delete via SECURITY DEFINER RPC for "delete for me" semantics.
6. **Audit log** entries are append-only; no UPDATE/DELETE policies.
7. **Server-write only** for `payments`, `webhook_events`, `audit_log`.

### CI gate

`supabase/tests/_rls-coverage.sql` queries `pg_class`/`pg_policy` and fails the gate if any table in `public` schema is missing any of: RLS enabled, ≥1 SELECT policy, ≥1 INSERT/UPDATE policy or an explicit service-role-only marker.

### Block-awareness helper

A reusable expression in `supabase/migrations/_shared/block_filter.sql`:

```sql
not exists (
  select 1 from public.blocks b
  where (b.blocker_id = <owner_col> and b.blocked_id = (select auth.uid()))
     or (b.blocker_id = (select auth.uid()) and b.blocked_id = <owner_col>)
)
```

Every user-facing SELECT policy uses this expression.

## Consequences

- **+** "Block" is enforced at the DB layer; cannot be bypassed by a custom client.
- **+** Forgetting RLS on a new table fails CI.
- **+** Mistakes that leaked `last_seen`, profile data, and chat history in the prior codebase are structurally prevented.
- **−** Slightly more SQL boilerplate per table; the shared expression mitigates this.
