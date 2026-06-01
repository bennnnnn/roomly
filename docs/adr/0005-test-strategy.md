# ADR-0005 — Test strategy

- **Status**: accepted
- **Date**: 2026-05-31

## Context

The prior codebase shipped to production with **zero tests**. Regressions were caught by users.

## Options

1. Aim for 80%+ coverage everywhere.
2. **Tier tests by risk: 100% on pure logic, integration tests on SQL/RPCs and Edge Functions, behavior tests on hooks, smoke tests on screens.**
3. Manual QA only.

## Decision

Option **2**.

| Layer                                | Tool                          | Required tests                                                                    | Coverage gate    |
| ------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| `packages/lib/**`                    | Jest                          | Unit tests for every exported function                                            | **100% lines**   |
| `supabase/migrations/*` (RLS, RPC)   | pgTAP or `supabase test db`   | Positive + negative case per policy and per RPC                                   | per-file present |
| `supabase/functions/*`               | Deno `Deno.test`              | Happy path + missing JWT + mismatched sub + idempotent replay + downstream failure| per-file present |
| `apps/mobile/src/features/**/hooks/` | Jest + RNTL `renderHook`      | Behavior per hook                                                                 | per-file present |
| `apps/mobile/app/**` (screens)       | Jest + RNTL                   | Loading, error retry, primary interaction                                         | smoke only       |
| `apps/admin/app/**`                  | Vitest or Jest + Playwright   | Component + smoke                                                                 | smoke only       |

### Conventions

- Test next to the file it covers, in `__tests__/` or `*.test.ts(x)`.
- Fixtures in `__fixtures__/` next to the test. No global mocks.
- One assertion-per-behavior; no kitchen sinks.
- `it.skip` / `xit` requires a linked issue.

### CI

- `pnpm gate` runs typecheck + lint + Jest + `supabase test db` + Deno test + `supabase db reset` + `pnpm audit --prod`.
- Coverage delta on `packages/lib` reported on every PR; merge blocked on regression.

## Consequences

- **+** Pure logic protected by 100% coverage.
- **+** SQL/RPC changes can't ship a broken policy.
- **+** Edge Functions can't ship missing auth checks.
- **−** Initial slice (Slice 0) front-loads test infra cost; pays off from Slice 1.
