# Roomly

A native mobile app (iOS + Android) for listing and finding rooms / houses to rent. Listing service only — no leases, no rent collection.

> Production-grade. Read **[`AGENTS.md`](./AGENTS.md)** before you touch anything.
> (`CLAUDE.md` is a symlink to the same file.)

## What is here

- `apps/mobile/` — Expo SDK 56 mobile app (planned)
- `apps/admin/` — Next.js admin web (planned)
- `packages/` — shared TS libraries, DB types, design tokens (planned)
- `supabase/` — migrations, Edge Functions, SQL tests (planned)
- `docs/` — PRD, ADRs, retrospective from a prior codebase, open questions
- `.cursor/` — rules, hooks, project-specific skills for coding agents

## Quick links

| Doc                                                                          | What it is                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| [AGENTS.md](./AGENTS.md)                                                     | The engineering contract — read first                  |
| [docs/PRD.md](./docs/PRD.md)                                                 | Product spec                                           |
| [docs/lessons-from-prior-codebase.md](./docs/lessons-from-prior-codebase.md) | Concrete traps to avoid                                |
| [docs/OPEN_QUESTIONS.md](./docs/OPEN_QUESTIONS.md)                           | Unknowns that block launch                             |
| [docs/adr/](./docs/adr/)                                                     | Architecture Decision Records                          |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                                         | How to contribute, the quality gate, dependency policy |

## Current status

**Slice 0 — Foundations & rails** is in progress. Project governance, rules, hooks, skills, docs, and ADRs are in place. App + Supabase scaffolding has **not yet started**; the next step is to install dependencies (each web-verified at install time per ADR-0007) and stand up the CI gate on an empty shell.
