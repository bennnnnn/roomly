# ADR-0009 — Env vars and secret boundaries

- **Status**: accepted
- **Date**: 2026-05-31

## Context

The prior codebase had two bugs in this area:

1. A server-only key (Supabase service role JWT) was once committed under an `EXPO_PUBLIC_*` name. Because Expo only inlines `EXPO_PUBLIC_*` vars, it shipped in the mobile bundle and was readable from any device. Rotation took 3 days.
2. Some screens read `process.env.FOO` directly. When `FOO` wasn't inlined, the code silently received `undefined` and produced cryptic 401s at first request.

We need a structurally unambiguous boundary between "safe to ship in the client" and "must stay server-side".

## Decision

### 1. Three concentric secret rings

| Ring               | Location                                                                                                                         | Examples                                                                                                                         | Who can read                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Public client**  | `EXPO_PUBLIC_*` (mobile), `NEXT_PUBLIC_*` (admin), set in `.env.local` and EAS/Vercel project env                                | Supabase URL, Supabase **anon** key, PostHog public project key, Sentry DSN                                                      | Anyone who downloads the binary. Treat as world-readable.             |
| **Server runtime** | Supabase Edge Function secrets (`supabase secrets set`); the admin app's server runtime (Vercel server env, not `NEXT_PUBLIC_*`) | Supabase **service role** key, Stripe **secret** key, Stripe webhook signing secret, Resend API key, PostHog **private** API key | Only the server runtime that needs it. Never reachable from a client. |
| **Build-time**     | GitHub Actions secrets, EAS Build secrets                                                                                        | Apple/Google signing certs, EAS API token, Supabase service role (for `db push` in migrations CI), Sentry auth token             | Only CI workflows. Never written to `.env*`.                          |

### 2. Enforcement — `@roomly/lib/defineEnv`

Every app's env reader goes through `defineEnv` (see `packages/lib/src/env.ts`). Each declared var carries `{ required, visibility }` and the call site specifies `{ runtime: 'client' | 'server', publicPrefix }`. `defineEnv` will refuse to:

- Register a `visibility: 'server'` var when `runtime: 'client'` — catches "I accidentally read SUPABASE_SERVICE_ROLE_KEY from RN code".
- Register a `visibility: 'public'` var whose name doesn't start with `publicPrefix` — catches "I named it SUPABASE_URL and Expo didn't inline it".
- Boot when a required var is missing — preferred over a mystery 401 at first request.

A misuse is impossible to commit because:

1. The schema is the only legal entry point (no raw `process.env.X` in app code; ESLint rule lands in Slice 1D).
2. The schema typechecks against the visibility marker.
3. The call site explicitly declares its runtime.

### 3. File layout

| File                       | Tracked in git           | Purpose                                                                         |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `apps/mobile/.env.example` | yes                      | Documents every `EXPO_PUBLIC_*` var needed. Copied to `.env.local` by each dev. |
| `apps/mobile/.env.local`   | **no** (in `.gitignore`) | Per-dev real values.                                                            |
| `apps/admin/.env.example`  | yes (lands Slice 7)      | Documents every `NEXT_PUBLIC_*` and server-runtime var.                         |
| `apps/admin/.env.local`    | **no**                   | Per-dev real values for admin.                                                  |
| `supabase/.env.example`    | yes (lands Slice 1D)     | Documents every Edge Function secret.                                           |
| EAS Build secrets          | n/a                      | Set via `eas secret:create`.                                                    |
| Vercel project env         | n/a                      | Set in Vercel dashboard.                                                        |
| GitHub Actions secrets     | n/a                      | Set in repo settings.                                                           |

### 4. Stripe boundary (cross-ref ADR-0008)

The pricing architecture in ADR-0008 has a direct env-var consequence:

- **Mobile bundle**: only `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publishable key is designed to be public).
- **Edge Function**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SIGNING_SECRET` only. Never elsewhere.
- **Admin bundle**: nothing Stripe-related. The admin reads `pricing_tiers` from Postgres + makes Edge-Function-mediated Stripe Price lookups; it never holds a Stripe key itself.

A Stripe secret key appearing in any `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` slot is a P0 rotation event.

## Consequences

- **+** Server-only secrets cannot be loaded by client code — the type system rejects it AND the boot validator rejects it.
- **+** "Why is this var undefined at runtime?" disappears: required vars throw a named error at boot.
- **+** New env vars require a docs touch (`.env.example` + this ADR's table). No ghost vars.
- **+** Stripe-secret leakage path from ADR-0008 is closed at the env layer too.
- **−** A small amount of ceremony per new var (schema entry + ADR row). Acceptable given the prior-codebase damage from skipping it.

## Open follow-ups

- Slice 1D: add an ESLint rule that bans `process.env.*` access outside the `defineEnv` call site. Until then, code review enforces.
- Slice 1D: `supabase/.env.example` lands when the first Edge Function does.
- Slice 7: admin counterpart (`NEXT_PUBLIC_*` schema + server-runtime schema, both via `defineEnv`).
