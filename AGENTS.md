# AGENTS.md — Roomly engineering guide

> **Read this file in full before writing any code.**
> This document is the contract every coding agent (and human contributor) follows in this repository.
> `CLAUDE.md` is a symlink to this file; they are the same document.

Roomly is a **production** mobile + admin application for room/house listings.
We treat correctness, security, performance, and maintainability as non-negotiable.

---

## 0. The ten ground rules

These rules are absolute. A change that breaks any of them does not ship.

1. **No network blocking on the UI thread.** Every screen renders from cache first, then hydrates. Writes are optimistic. Lists paginate server-side. No polling — Realtime + focused refetch only.
2. **Security-first.** RLS on every table from migration #1. No `using (true)` for non-public reads. All amounts and state changes are server-computed (Edge Functions or DB RPCs). Buckets are private by default; signed URLs for anything sensitive. JWT-pinned Edge Functions.
3. **Speed everywhere.** Cold start <3 s on a mid-range device. Feed first paint <1.5 s. Chat send <100 ms perceived. Images compressed (≤1080 px, q=0.8), lazy-loaded, prefetched with capped concurrency. No inline `style={{}}` object literals.
4. **No deprecated tools.** Every dependency is verified current via web search **at the moment it is added**. Versions are pinned exactly in `package.json`. Re-verified at the start of each Slice.
5. **No guessing.** Before adopting any API, config flag, or pattern, search official docs from the last 6 months. If the docs disagree with memory, the docs win. Decisions are recorded in `docs/adr/`.
6. **All code is tested and passing.** No PR merges without: `tsc --noEmit` green, `eslint --max-warnings 0` green, Jest + RNTL green, pgTAP / `supabase test` green for SQL/RPCs, Deno test green for Edge Functions, migrations apply cleanly on a fresh `supabase db reset`. Pure-function libraries require 100% line coverage.
7. **Uniform code & test practice — no random rules.** A single `eslint.config.ts`, a single `tsconfig.base.json`, a single `prettier.config.js`, a single Jest preset. Any new rule requires an ADR. No personal `// eslint-disable` lines without a linked issue.
8. **600-line hard cap per file.** Enforced via ESLint `max-lines`. Soft targets: screens ≤300, hooks ≤200, stores ≤400. Splitting strategy in `docs/adr/0003-file-size-cap.md`.
9. **Industry standards.** TypeScript `strict: true` + `noUncheckedIndexedAccess`; `@typescript-eslint` strict-type-checked; `eslint-plugin-security`, `eslint-plugin-react-hooks`, `eslint-plugin-import` ordered. Conventional Commits. SemVer. Trunk-based, PR review required.
10. **MCP-first tooling.** Use MCP servers (Supabase, Cursor App/Backend Control, Datadog when wired) instead of bespoke scripts when capabilities overlap. Document any new MCP in `docs/mcp.md`.

---

## 1. What this repository is

A pnpm + Turborepo monorepo containing:

```
apps/
  mobile/      Expo (React Native + TypeScript + Expo Router)
  admin/       Next.js App Router (server components, role-gated)
packages/
  lib/         Pure TS shared between mobile, admin, and Edge Functions
  db-types/    Generated Postgres types
  ui-tokens/   Design tokens (colors, spacing, radii, fonts)
supabase/
  migrations/  Sole source of schema truth
  functions/   Edge Functions (Deno)
  tests/       pgTAP / SQL fixtures
docs/
  PRD.md, adr/, lessons-from-prior-codebase.md, OPEN_QUESTIONS.md
.cursor/
  rules/       Persistent agent guidance (per-glob)
  hooks.json   Project hooks (pre/post tool, shell, file edit)
  skills/      Project-specific workflows (migrations, screens, edge functions, gates)
```

Product spec lives in `docs/PRD.md`. Retrospective lessons from a prior codebase live in `docs/lessons-from-prior-codebase.md` — mine them whenever you design a new feature.

---

## 2. Required reading order for any task

1. `docs/PRD.md` — the relevant section for the feature you are touching.
2. The matching `docs/adr/*.md` if one exists.
3. `docs/lessons-from-prior-codebase.md` — the section relevant to your feature (auth, listings, messaging, payments, etc.). Many traps are documented there.
4. The relevant `.cursor/rules/*.mdc` — these are auto-loaded by Cursor based on the files you open.

---

## 3. Workflow for every change

1. **Restate the task** in your own words. If ambiguous, ask before coding.
2. **Plan** for any task touching >1 file: list the files, the tests, the migrations.
3. **Write the test first** when adding a pure function or RPC. Skipping tests is not an option for `packages/lib`, `supabase/functions`, or `supabase/migrations`.
4. **Implement** the smallest change that makes the test pass.
5. **Run the quality gate locally** (`pnpm gate` — runs typecheck + lint + test + supabase reset). Commit only when green.
6. **Conventional Commit** the change (`feat(scope): …`, `fix(scope): …`, `chore(scope): …`).
7. **PR description** answers: what changed, why, what was tested, links to PRD/ADR sections.

---

## 4. Tooling: prefer MCPs over hand-rolled scripts

- **Supabase** schema changes → `plugin-supabase-supabase` MCP `apply_migration`. Never hand-edit applied migrations.
- **Inspect logs** → Supabase MCP `get_logs`. Don't shell into the dashboard.
- **Security/perf advisors** → Supabase MCP `get_advisors` before opening a PR that touches SQL or RLS.
- **Workspace moves / project creation** → `cursor-app-control` MCP.
- **Open files/terminals/URLs for the user** → `cursor-app-control` MCP `open_resource`.
- **Production observability** (once wired) → `plugin-datadog-datadog` MCP.

If an MCP cannot do what you need, document the gap in `docs/mcp-gaps.md` and only then fall back to a script.

---

## 5. Tech stack (verified May 31, 2026)

| Layer        | Choice                                                  | Pinned at start of work |
| ------------ | ------------------------------------------------------- | ----------------------- |
| Mobile       | Expo SDK 56 (RN 0.85, React 19.2), Expo Router          | yes                     |
| Admin        | Next.js (latest stable, verify before adding)           | yes                     |
| Language     | TypeScript strict, `noUncheckedIndexedAccess`           | yes                     |
| Styling      | NativeWind 4.2.x (mobile), Tailwind v3 (admin)          | yes                     |
| State        | Zustand (UI/session) + TanStack Query (server)          | yes                     |
| Backend      | Supabase (Postgres + Auth + Storage + Realtime)         | yes                     |
| DB types     | `supabase gen types typescript`                         | yes                     |
| Payments     | `@stripe/stripe-react-native` 0.66.x                    | yes                     |
| Email        | Resend via Edge Function                                | yes                     |
| Push         | Expo Notifications                                      | yes                     |
| Maps         | `react-native-maps`                                     | yes                     |
| Monitoring   | Sentry + PostHog (wrapped in `lib/logger.ts`)           | yes                     |
| Tests        | Jest + React Native Testing Library + Deno test + pgTAP | yes                     |
| Lint/format  | ESLint (strict-type-checked) + Prettier                 | yes                     |
| Monorepo     | pnpm workspaces + Turborepo                             | yes                     |
| CI           | GitHub Actions                                          | yes                     |
| Builds       | EAS Build + Submit                                      | yes                     |
| Node runtime | 22 LTS (pnpm 11 requirement; Supabase JS / Next 16 OK)  | yes                     |

Exact versions are pinned in `package.json` and recorded with citations in `docs/adr/0007-dependency-pins.md` at the moment of install.

---

## 6. Coding standards (summary; full rules in `.cursor/rules/`)

- **TypeScript.** No `any` (use `unknown` + narrowing). Prefer `interface` for public shapes, `type` for unions/utility. Discriminated unions over boolean flag spaghetti.
- **React Native.** Functional components. Memoize list items. Use `FlatList`/`FlashList` with `keyExtractor` and `getItemLayout` where possible. No inline styles.
- **Errors.** Throw typed errors. Map Postgres errors via `packages/lib/pg-errors.ts` (SQLSTATE-driven, never English substring matching).
- **Logging.** Use `lib/logger.ts`, never `console.*` directly in app code. In production, the logger routes to Sentry/PostHog.
- **State.** One concern per Zustand store. Module-level mutable caches are forbidden — they leak across users on sign-out (see retrospective).
- **Realtime.** Every Supabase channel subscription **must** include a server-side `filter:` clause scoped to the current user or the visible resource set.
- **SQL.** Every new table: RLS enabled, owner-write policy, public-read policy that respects blocks. Every migration is idempotent and reversible.
- **Edge Functions.** JWT pinned to `auth.uid()`. Amounts and state transitions computed server-side. HTML escaped before email send. Idempotency keys on webhooks.

---

## 7. Test policy (full text in `docs/adr/0005-test-strategy.md`)

| Layer                                | Required tests                                                    |
| ------------------------------------ | ----------------------------------------------------------------- |
| `packages/lib/*`                     | Unit tests, 100% line coverage                                    |
| `supabase/migrations/*` (RLS, RPC)   | pgTAP or `supabase test db` SQL fixtures                          |
| `supabase/functions/*`               | Deno `Deno.test` covering happy path + auth failure + idempotency |
| `apps/mobile/src/features/*` (hooks) | RNTL `renderHook` + integration tests for stores                  |
| `apps/admin/app/*`                   | Vitest or Jest component tests + Playwright smoke                 |
| Screens (mobile + admin)             | Snapshot + key interaction tests; no business logic in screens    |

CI fails on coverage regression for `packages/lib`.

---

## 8. Performance budgets

- Cold start <3 s on a 2022 mid-tier device.
- Feed first paint <1.5 s after token refresh.
- Chat send perceived <100 ms (optimistic UI).
- `<= 6` round trips for chat cold open. `<= 2` for sending a message. `<= 1` for liking. `<= 1` per discover page.
- Bundle size budget per slice — recorded in `docs/perf-budgets.md`.

If a change blows a budget, add a perf test and either fix it or open an ADR with mitigation.

---

## 9. Security baseline

- RLS on every table — checked in CI by an SQL test that fails if `pg_class` shows any user-facing table without policies.
- Every `SELECT` policy honors `blocks` and `show_in_discover`.
- Edge Functions verify JWT and pin caller identity to `auth.uid()`. No client-supplied `senderId`.
- HTML escape every user-controlled string in emails.
- Buckets default private; signed URLs for selfies and listing photos.
- Secrets only in Edge Function env vars; never in client bundles or migration files.
- `pnpm audit --prod` runs in CI; high/critical vulns block merge.

---

## 10. Delivery slices

Slice gates are enforced — no slice ends until its exit criteria are met.

| Slice | Theme                         | Exit criteria                                                                                 |
| ----- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| 0     | Foundations & rails           | Monorepo, ESLint, TS, Jest, CI green on empty shell, all governance files in place            |
| 1     | Auth + profile                | Apple/Google/Email, verify-email deep link, deletion incl. Apple, all helper libs at 100% cov |
| 2     | Listings core (no payment)    | Wizard, photos, detail screen, owner edit, drafts persisted                                   |
| 3     | Browse & filter               | Feed, filters, map, location, saved                                                           |
| 4     | Payments                      | Stripe PaymentSheet, server-driven pricing, webhook, receipts, renew                          |
| 5     | Messaging + push              | Realtime chat, conversation_hidden, contact-info detection, block/report, notifications       |
| 6     | Profile/settings/billing/mine | All settings screens, my-listings management, billing history                                 |
| 7     | Admin web + hardening         | Admin Next.js app shipped, RLS audit pass, a11y audit pass, EAS build to TestFlight/Internal  |

---

## 11. What to do when stuck

1. Re-read the relevant PRD section and ADR.
2. Search the codebase (`Grep`/`SemanticSearch`) for prior art.
3. Web-search the official docs (last 6 months) — never rely on memory for SDK APIs.
4. Ask the user via `AskQuestion` with concrete options.

Never silently invent a workaround. Surface the blocker.

---

## 12. Files that are off-limits without explicit approval

- `supabase/migrations/*` after it has been applied to remote → write a new migration instead.
- `package.json` version bumps without a corresponding ADR entry.
- `.cursor/hooks.json` and `.cursor/rules/*.mdc` outside of an ADR change.
- Any file containing real secrets (`.env`, `*.pem`, `*.key`).

---

## 13. Glossary

- **Slice** — a vertical, demoable increment of the product, with its own exit criteria.
- **ADR** — Architecture Decision Record, in `docs/adr/`.
- **MCP** — Model Context Protocol server. Tools we call instead of writing scripts.
- **RLS** — Postgres row-level security.
- **Edge Function** — Deno-based Supabase function, JWT-checked.
- **Quality gate** — the `pnpm gate` command (`typecheck && lint && test && supabase test`).

---

_When in doubt, prefer the option that is more secure, more tested, and easier to delete than the one that is faster to write. We are building Roomly to last._
