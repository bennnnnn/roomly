# ADR-0003 — 600-line per-file hard cap

- **Status**: accepted
- **Date**: 2026-05-31

## Context

The prior codebase had one screen at 2,662 lines with 39 hooks. Refactoring became fearful; testing impossible. The team had already started extracting smaller files from the chat screen and was still at 944 lines.

## Options

1. No cap; rely on review.
2. **Hard cap 600 lines (ESLint `max-lines`); soft targets per file type.**
3. Hard cap 300 lines (very strict).

## Decision

Option **2**.

- **Hard cap**: 600 lines per file, enforced by ESLint `max-lines: ["error", { max: 600, skipBlankLines: true, skipComments: true }]`. Pre-commit and CI both run lint.
- **Soft targets** (warnings):
  - Screens (`apps/*/app/**`): 300
  - Hooks (`use-*.ts`, `**/hooks/*.ts`): 200
  - Stores (`*.store.ts`): 400
  - Modules (everything else): 400
- The `afterFileEdit` hook warns when soft caps are hit so the author can split early.
- Markdown, JSON, lockfiles, and snapshots are exempt.

### How to split

| Pattern in growing file              | Extract to                                           |
| ------------------------------------ | ---------------------------------------------------- |
| Multiple `useEffect` per concern     | one custom hook per concern in `…/hooks/`            |
| Multiple JSX subtrees (>50 lines)    | a `<Subcomponent />` in `…/components/`              |
| Pure helper functions                | `packages/lib/` (with tests)                         |
| Repeated styling chunks              | NativeWind component variants                        |
| Long switch / mapping table          | a `…-config.ts` module                               |
| Multiple Zustand slices in one store | split into per-concern stores; cross-imports allowed |

## Consequences

- **+** Files stay reviewable and testable.
- **+** Encourages composition over kitchen-sink components.
- **−** Some natural cohesion gets split. Acceptable trade-off; soft targets give early warning before the hard cap forces a rushed split.
