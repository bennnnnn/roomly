# ADR-0007 — Dependency pins

- **Status**: accepted, **living document** — append a new row whenever a dependency is added or bumped.
- **Date**: 2026-05-31

## Rule

Every dependency is **web-verified at the moment it is added**. Pin the exact version (no `^`, no `~` for the initial add). Record the version, date, and source URL below.

When bumping, append a new row with the reason for the bump. Never edit a prior row.

## Why

Memory-based version recall has caused production regressions in adjacent projects. The retrospective showed multiple deprecated APIs being added because "I thought that was the current way". The cost of a 30-second web search before each install is dwarfed by the cost of debugging a deprecation surprise in CI.

---

## Verified at project start (2026-05-31)

| Package                          | Version    | Verified date | Source                                                               | Notes                                                              |
| -------------------------------- | ---------- | ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `expo`                           | `^56.0.0`  | 2026-05-31    | https://expo.dev/changelog/sdk-56                                    | SDK 56 stable May 21 2026; RN 0.85, React 19.2                     |
| `react-native`                   | `0.85.x`   | 2026-05-31    | bundled with Expo SDK 56                                             | Use `npx expo install` to pin the correct minor                    |
| `@supabase/supabase-js`          | `2.106.2`  | 2026-05-31    | https://www.npmjs.com/package/@supabase/supabase-js                  | Requires Node 20+; v3 still next.* preview                          |
| `@stripe/stripe-react-native`    | `0.66.0`   | 2026-05-31    | https://github.com/stripe/stripe-react-native/releases/tag/v0.66.0   | Use `expo install` for SDK alignment                                |
| `nativewind`                     | `4.2.4`    | 2026-05-31    | https://www.npmjs.com/package/nativewind                             | v5 in preview only; stay on 4.2.x                                   |
| `tailwindcss`                    | `^3.4.0`   | 2026-05-31    | NativeWind v4 requires Tailwind v3                                   |                                                                     |

## To verify at Slice 0 install time

| Package                                | Action                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `next`                                 | Web-search "Next.js latest 2026 stable"; pin                                                  |
| `@supabase/ssr`                        | Web-search latest; pin                                                                        |
| `@tanstack/react-query`                | Web-search latest; pin                                                                        |
| `zustand`                              | Web-search latest; pin                                                                        |
| `@sentry/react-native` + `@sentry/nextjs` | Web-search latest; verify Expo SDK 56 compatibility                                        |
| `posthog-react-native`                 | Web-search latest                                                                             |
| `expo-router`, `expo-notifications`, `expo-secure-store` | Use `npx expo install` to pick the Expo SDK 56-aligned versions             |
| `eslint`, `@typescript-eslint/*`, `prettier`, `jest`, `react-native-testing-library` | Web-search latest stable                              |
| `pnpm`                                 | Use Corepack-pinned version                                                                   |
| `turbo`                                | Web-search latest                                                                             |

## Bump log

_(append rows here when bumping a dep; include version old → new, date, reason, PR link)_
