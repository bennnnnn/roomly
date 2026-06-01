# ADR-0002 — Realtime over polling, with server-side filters always

- **Status**: accepted
- **Date**: 2026-05-31

## Context

The prior codebase polled `conversations` every 4 seconds. ~45 round trips per minute per user, plus a per-tick SQLite write storm, plus a redundant Realtime channel doing the same thing. Subscriptions were unfiltered (`event: 'UPDATE', schema: 'public', table: 'profiles'` with no `filter:`), so every connected client received every other user's heartbeat globally.

## Options

1. Keep polling as a "safety net" alongside Realtime.
2. **Realtime only, with server-side filters always; manual refetch on focus and on `CHANNEL_ERROR`.**
3. Move away from Supabase Realtime entirely (e.g. self-hosted WebSocket).

## Decision

Option **2**.

- **No polling anywhere.** A `useFocusEffect` refetch on tab focus + `AppState 'active'` is the only fallback. Plus a single refetch on Realtime `CHANNEL_ERROR` / `TIMED_OUT`.
- **Every `.on('postgres_changes', …)` must include a server-side `filter:` clause** scoped to the current user or visible resource set. CI lint check planned (`packages/lib/lint-rules/no-unfiltered-realtime.ts`).
- Realtime channel teardown is centralized in `lib/realtime.ts` and called from `signOut`.

## Consequences

- **+** ~95% reduction in inbox bandwidth vs the prior codebase.
- **+** Server-side filters cap fan-out to the actual audience.
- **+** Single place to enforce teardown.
- **−** Reliance on Realtime uptime; mitigated by the focus-triggered refetch.
- **−** Custom lint rule is non-trivial; if it slips, an ADR follow-up will codify the runtime check instead.
