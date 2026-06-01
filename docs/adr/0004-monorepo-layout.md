# ADR-0004 — pnpm + Turborepo monorepo with apps/ and packages/

- **Status**: accepted
- **Date**: 2026-05-31

## Context

Roomly has two front-ends (Expo mobile, Next.js admin) and a shared backend (Supabase migrations + Edge Functions). Logic like price computation, contact-info detection, pg-error mapping, and validation belongs to both apps and to the Edge Functions.

## Options

1. Separate repos per app + a private npm package for shared lib.
2. **Monorepo (pnpm workspaces + Turborepo)** with apps/_ and packages/_.
3. Single Expo + Next.js mixed repo with relative imports.

## Decision

Option **2**.

```
apps/
  mobile/     # Expo SDK 56
  admin/      # Next.js App Router
packages/
  lib/        # pure TS, fully tested; consumed by mobile, admin, Edge Functions
  db-types/   # supabase gen types typescript output
  ui-tokens/  # design tokens
supabase/
  migrations/
  functions/
  tests/
```

- **pnpm workspaces** for dependency hoisting + workspace `:` protocol.
- **Turborepo** for incremental task graphs (`turbo run gate`) and remote caching when we wire it.
- Edge Functions import from `packages/lib` via the Deno → npm bridge.

## Consequences

- **+** Single source of truth for pure logic, exercised by Jest and Deno alike.
- **+** Atomic PRs across mobile + admin + DB.
- **+** Turbo's task graph keeps CI fast.
- **−** Slightly higher onboarding cost; documented in `CONTRIBUTING.md`.
- **−** Deno ↔ npm interop has edge cases; mitigated by keeping `packages/lib` pure (no Node/Web-only APIs).
