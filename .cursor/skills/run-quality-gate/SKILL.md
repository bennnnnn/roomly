---
name: run-quality-gate
description: Run Roomly's full quality gate (typecheck + lint + unit tests + DB tests + Edge Function tests + migration apply) before committing. Use whenever a task is "done" and needs verification, or whenever the user asks to run tests or the gate.
---

# Run the quality gate

This skill verifies a change is mergeable. Never commit without it green.

## One command

```bash
pnpm gate
```

That runs all the steps below in order. If any step fails, the gate fails.

## Steps (in order)

```
1. pnpm typecheck       # tsc --noEmit across all packages
2. pnpm lint            # eslint --max-warnings 0
3. pnpm test            # Jest + RNTL across packages/* and apps/*
4. pnpm test:db         # supabase test db (pgTAP)
5. pnpm test:fn         # supabase functions test (Deno test)
6. pnpm db:reset:check  # supabase db reset --local; ensures migrations apply on a clean DB
7. pnpm audit:prod      # pnpm audit --prod; high/critical fail the gate
```

## When a step fails

| Step                  | First places to look                                                |
| --------------------- | ------------------------------------------------------------------- |
| typecheck             | Inspect the failing file; do not add `// @ts-ignore`. Fix the type. |
| lint (max-lines)      | Split the file per `docs/adr/0003-file-size-cap.md`.                |
| lint (no-explicit-any)| Replace `any` with `unknown` and narrow, or define the proper type. |
| test                  | Re-run the single test with `pnpm test -- -t "<name>"`.             |
| test:db (pgTAP)       | RLS regression most likely. Inspect with `supabase test db -d`.     |
| test:fn (Deno)        | Most common: JWT pinning or zod schema mismatch.                    |
| db:reset:check        | A migration is non-idempotent or out of order. Rename / fix.        |
| audit:prod            | Run `pnpm audit --prod --json` and bump the flagged dep.            |

## What never to do

- Do not commit with `--no-verify`. The hook blocks this.
- Do not `it.skip` a failing test. Fix it or open an issue with the skip linked.
- Do not relax an ESLint rule to make the gate pass. Update the code or open an ADR proposing the rule change.
