# Contributing to Roomly

Roomly is a **production** application. Every change ships through the same gates whether it's authored by a human or an agent.

## Required reading

Before your first PR:

1. `AGENTS.md` — the engineering contract.
2. `docs/PRD.md` — the product spec.
3. `docs/lessons-from-prior-codebase.md` — concrete failure patterns to avoid.
4. The relevant `.cursor/rules/*.mdc` — auto-loaded by Cursor.
5. The relevant `docs/adr/*.md`.

## Local setup

```bash
# Node 20+ (Supabase JS requires it)
nvm use 20
corepack enable
pnpm install
supabase start            # local Postgres + Edge runtime
pnpm dev                  # mobile + admin in parallel via Turborepo
```

## The quality gate

```bash
pnpm gate                 # typecheck + lint + test + db-test + fn-test + reset-check + audit
```

The gate must be green before commit. The `beforeShellExecution` hook blocks `--no-verify` and other bypasses.

## Workflow

1. **Branch** from `main` using `slice-<n>/<short-summary>` or `fix/<area>-<short-summary>`.
2. **Plan** if the change touches >1 file. List files, tests, migrations.
3. **Test-first** for `packages/lib`, Edge Functions, and RPCs.
4. **Implement** the smallest change.
5. **`pnpm gate`** locally. Fix until green.
6. **Conventional commit**: `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`, `docs(scope): ...`.
7. **PR description** answers: what / why / how-tested / links to PRD section and ADRs.

## Dependency policy

- **Web-search before adding any dependency.** Pin the exact version. Record the version, date, and source URL in `docs/adr/0007-dependency-pins.md`.
- No deprecated APIs. If memory says one thing and the docs say another, the docs win.
- `pnpm audit --prod` runs in CI; high/critical block merge.

## File size

- **Hard cap: 600 lines** per file (ESLint `max-lines`).
- Soft targets: screens ≤300, hooks ≤200, stores ≤400.
- Splitting strategy: ADR-0003.

## SQL changes

- Author via the `migration-author` Cursor skill.
- Apply via the `plugin-supabase-supabase` MCP `apply_migration` — never `psql` direct.
- Ship a pgTAP test with every policy / RPC change.

## Edge Functions

- Author via the `edge-function-author` Cursor skill.
- JWT pinned, idempotent webhooks, zod-validated inputs, escape HTML for email.
- Deno tests required: happy path, missing JWT, mismatched sub, idempotent replay.

## Screens

- Author via the `screen-author` Cursor skill.
- Thin: ≤300 lines, no business logic, no inline styles.
- RNTL tests required.

## Code review checklist

- [ ] PRD section linked
- [ ] Lessons-learned section relevant to the area was re-read
- [ ] Tests cover happy path + at least one failure mode
- [ ] No `any`, no `console.*`, no inline styles, no unfiltered Realtime subscriptions
- [ ] RLS on any new table; block-aware SELECT
- [ ] Edge Function JWT-pinned; amounts/state server-computed
- [ ] File size under cap
- [ ] CI green
