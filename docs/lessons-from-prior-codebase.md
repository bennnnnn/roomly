# Lessons from a prior codebase

These are concrete failure patterns observed in a prior production app. **Treat this file as a checklist — when you start a feature in the same area, re-read the relevant section first.**

Severity levels: **P0** = security/data loss; **P1** = correctness/UX; **P2** = perf/scale; **P3** = nits.

---

## 1. Architecture / structure

- **God screens** (P1). Files of 800–2,600 lines with 30+ hooks in one component. Symptoms: testing impossible, refactors fearful. Mitigation: 600-line hard cap (ESLint `max-lines`), soft target 300 for screens, 200 for hooks. Extract every clear responsibility into a feature subfolder.
- **Module-level mutable state** (P1). `let _cachedX = …` at module scope leaks across users on sign-out, breaks tests, hides race conditions. Mitigation: store all caches inside Zustand or a class instance; call `resetAllStores()` on `signOut`.
- **Mixed styling** (P3). Repo advertised NativeWind but 27 files used `StyleSheet.create`. New contributors stalled on "which way?". Mitigation: one styling system (NativeWind), enforced by lint rules. ADR-0001.
- **Three sources of schema truth** (P1). Two hand-maintained SQL files drifted from the canonical migrations folder. Mitigation: `supabase/migrations/` is the **sole** source; CI fails if other SQL exists outside `supabase/`.
- **Magic numbers scattered** (P2). Two different typing-TTL values (3 s vs 3.5 s) in two files — an actual inconsistency bug. Mitigation: `packages/lib/timings.ts` is the only place that defines timeouts.
- **Single-responsibility violations** (P1). `auth.store.ts` doing auth + profile + settings + normalization; `_layout.tsx` doing 7 different subscriptions in one `useEffect`. Mitigation: providers per concern (`<AuthProvider>`, `<PresenceProvider>`, etc.).

## 2. Type safety / errors

- **String-matched error blobs** (P0/P1). Client matched English substrings in PostgREST error messages. Any DB message tweak silently broke UX. Mitigation: SQLSTATE-driven `lib/pg-errors.ts`; raise structured `ERRCODE` + `DETAIL` from DB.
- **Hooks with too many parameters** (P3). 11 props passed to one custom hook because the hook didn't read from the store itself. Mitigation: hooks read shared state directly; only event-shape data is passed in.
- **`any` casts** (P2). `useRef<any>(null)` and realtime payload `as any`. Mitigation: ESLint `no-explicit-any: error`. Strict type-checked rules.

## 3. Realtime / performance

- **The 4-second poll** (P2/P0 cost). 45 round trips per minute per user just for the inbox, with a per-tick SQLite write storm. Mitigation: no polling; Realtime + focus-triggered refetch only.
- **Unfiltered global subscriptions** (P0 scale). Every connected client received every profile update for every user globally. Mitigation: every `.on('postgres_changes', …)` must include a server-side `filter:`. Lint check planned.
- **Heartbeat writes every 60 s to `profiles`** (P0 scale). Each write fired a BEFORE-UPDATE trigger that re-read `user_settings`. Mitigation: separate `presence(user_id, last_seen)` table with no triggers and no realtime publication, or use Supabase Realtime presence channels.
- **Pre-flight RT before every write** (P2). `select accepts_messages`, `select blocked`, then the insert — three RTs to send one message. Mitigation: rely on DB triggers + `pg-errors` mapping; one RT per intent.
- **No index on `last_seen`** (P2). Used as sort + freshness filter. Mitigation: partial index `(show_in_discover, last_seen DESC) WHERE avatar_url IS NOT NULL`.
- **Blocked-IDs sent in URL** (P0 scale). 36 KB query strings for power users with 1k+ blocks. Mitigation: SECURITY DEFINER RPC for feed, blocks joined server-side.
- **Auth bootstrap fires `fetchProfile`+`fetchSettings` 2–3× per login** (P2). And again on every `TOKEN_REFRESHED`. Mitigation: one `AuthProvider` owning the fetch; gate on `INITIAL_SESSION` / `SIGNED_IN` only.

## 4. Security & RLS

- **`profiles` SELECT policy was `using (true)`** (P0). Every authed user could enumerate the entire member directory plus `last_seen`. "Hide profile" wasn't actually hiding anything. Mitigation: SELECT policy honors blocks and `show_in_discover`.
- **Edge Function accepted client-supplied `senderId`** (P0). Anyone signed in could send notifications "from" anyone. Mitigation: JWT-pinned; identity always derived from `auth.uid()`, never from request body.
- **Activity email HTML not escaped** (P0). User-controlled `full_name` interpolated raw into HTML. Mitigation: `_shared/html.escapeHtml` is the only path to compose email HTML; ESLint rule blocks template literals with user data.
- **`conversations.participant_ids` had no integrity constraints** (P1). Allowed `[a,a]`, `[a,b,c]`, and double-tap races created duplicate conversations. Mitigation: normalized `conversation_participants` table with composite PK + unique pair.
- **`messages` DELETE RLS was scoped to "any participant"** (P0). Either party could DELETE any message via a custom client. Mitigation: DELETE scoped to `sender_id = auth.uid()`; "delete for me" goes through a SECURITY DEFINER RPC.
- **`delete_user()` hard-deleted recipients' messages** (P1). Other party's chat history vanished. Mitigation: tombstone (`sender_id → sentinel`, `content → '[deleted]'`).
- **Public storage buckets containing verification selfies** (P0). Anyone with the URL had it. Mitigation: bucket privacy by default; signed URLs for sensitive content.
- **Email enumeration on register** (P1). "An account with this email already exists" leaked membership. Mitigation: generic copy + "Forgot password?" link.
- **`validatePassword` allowed 6-char passwords** (P1). Mitigation: 8-char minimum, 12 ideal.
- **Foreground notification listener auto-navigated** (P3). Yanked users out of whatever they were doing. Mitigation: navigate only on tap (response listener), banner in foreground.

## 5. Block / report / safety flows

- **Block didn't actually hide the profile** (P0). RLS allowed anyone to fetch any profile by UUID. Mitigation: block-aware SELECT policy.
- **Block didn't archive the conversation** (P1). Thread stayed in inbox with disabled composer. Mitigation: on block, insert into `conversation_hidden`.
- **Report didn't auto-block** (P1). Reported user could still message reporter. Mitigation: report flow includes default-on "block this person" checkbox.
- **Two shadowban triggers fired per report** (P3). Old trigger never dropped. Mitigation: every trigger replacement migration drops the prior trigger by name.
- **Hard-delete of conversation removed it for both parties** (P0 UX). Mitigation: `conversation_hidden` per-user soft-hide.

## 6. Test & observability

- **Zero tests** (P0 maintainability). Mitigation: tests are merge-blocking; `packages/lib` requires 100% coverage; new RPC/RLS/Edge Function ships with tests.
- **No central logging** (P1). 39 `console.error` calls vanished in production. Mitigation: `lib/logger.ts` routes to Sentry/PostHog.

## 7. Misc traps

- **Photo "delete" left storage objects orphan** (P1 cost + privacy). Mitigation: every delete-from-array also calls `storage.remove([path])`.
- **Profile-photo array accepted arbitrary URLs** (P0). User-controllable strings. Mitigation: CHECK constraint or trigger that allowed URLs must match the project storage prefix.
- **Face validation only client-side** (P1). Custom clients bypassed. Mitigation: server-side Edge Function re-validates.
- **Notification prefs missed `notify_favourites`** (P3). Fell back to `notify_likes`. Mitigation: one column per event; or rebrand consolidated toggles.

---

When designing a feature, **grep this file** for the area you're touching (`auth`, `realtime`, `block`, `report`, `payment`, `message`, `delete`) before writing the first line.
