# ADR-0001 — Single styling system: NativeWind v4 (mobile), Tailwind v3 (admin)

- **Status**: accepted
- **Date**: 2026-05-31
- **Owners**: founding team

## Context

The prior codebase mixed NativeWind classes with `StyleSheet.create` across 27 files. New contributors stalled on "which one do I use?". Inline `style={{}}` literals were widespread, breaking memoization and creating new object allocations per render.

## Options

1. **NativeWind 4.x** for mobile, **Tailwind 3.x** for admin. Single token source in `packages/ui-tokens`.
2. **`StyleSheet.create` only** on mobile (no NativeWind), Tailwind for admin.
3. **Tamagui** for both — universal styling system.

## Decision

Option **1**. NativeWind 4.2.x (verified May 2026: stable; v5 in preview only). Tailwind v3 because NativeWind v4 targets it. Tokens (colors, spacing, radii, fonts) live in `packages/ui-tokens` and feed both `tailwind.config.ts` files.

## Consequences

- **+** One mental model across both apps.
- **+** No inline styles allowed — caught by ESLint `react-native/no-inline-styles: error`.
- **+** Design tokens centralized; rename once, applied everywhere.
- **−** NativeWind has its own learning curve and occasional class-name limitations vs Tailwind web.
- **−** Migration to NativeWind v5 (when stable) will require a follow-up ADR.
