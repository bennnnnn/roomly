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

| Package                       | Version   | Verified date | Source                                                             | Notes                                           |
| ----------------------------- | --------- | ------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `expo`                        | `^56.0.0` | 2026-05-31    | https://expo.dev/changelog/sdk-56                                  | SDK 56 stable May 21 2026; RN 0.85, React 19.2  |
| `react-native`                | `0.85.x`  | 2026-05-31    | bundled with Expo SDK 56                                           | Use `npx expo install` to pin the correct minor |
| `@supabase/supabase-js`       | `2.106.2` | 2026-05-31    | https://www.npmjs.com/package/@supabase/supabase-js                | Requires Node 20+; v3 still next.\* preview     |
| `@stripe/stripe-react-native` | `0.66.0`  | 2026-05-31    | https://github.com/stripe/stripe-react-native/releases/tag/v0.66.0 | Use `expo install` for SDK alignment            |
| `nativewind`                  | `4.2.4`   | 2026-05-31    | https://www.npmjs.com/package/nativewind                           | v5 in preview only; stay on 4.2.x               |
| `tailwindcss`                 | `^3.4.0`  | 2026-05-31    | NativeWind v4 requires Tailwind v3                                 |                                                 |

## Verified at Slice 0 install (2026-05-31)

Tooling pins for the monorepo. All resolved via `npm view <pkg> version` or release notes on the publish date below.

| Package                  | Version   | Verified date | Source                                                         | Notes                                                                                 |
| ------------------------ | --------- | ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm`                   | `11.4.0`  | 2026-05-31    | https://github.com/pnpm/pnpm/releases/tag/v11.4.0              | Installed globally via `npm i -g pnpm@11.4.0` (Corepack absent on local Node 26)      |
| `turbo`                  | `2.9.16`  | 2026-05-31    | https://registry.npmjs.org/turbo                               | Latest stable; 2.9.17 still canary                                                    |
| `typescript`             | `6.0.3`   | 2026-05-31    | `npm view typescript version`                                  | TS 6 supported by typescript-eslint 8.58+                                             |
| `eslint`                 | `10.4.1`  | 2026-05-31    | `npm view eslint version`                                      | ESLint 10 — flat config is the only path                                              |
| `@eslint/js`             | `10.0.1`  | 2026-05-31    | `npm view @eslint/js version`                                  | Paired with ESLint 10                                                                 |
| `typescript-eslint`      | `8.59.4`  | 2026-05-31    | https://www.npmjs.com/package/@typescript-eslint/eslint-plugin | Unified package; use `tseslint.config()` builder (deprecated `tseslint.config` proxy) |
| `eslint-plugin-import-x` | `4.16.2`  | 2026-05-31    | https://www.npmjs.com/package/eslint-plugin-import-x           | Modern fork of `eslint-plugin-import` with flat-config-native support                 |
| `eslint-config-prettier` | `10.1.8`  | 2026-05-31    | `npm view eslint-config-prettier version`                      | Disables stylistic rules that fight Prettier                                          |
| `prettier`               | `3.8.3`   | 2026-05-31    | https://www.npmjs.com/package/prettier                         | Published Apr 15 2026                                                                 |
| `jest`                   | `30.4.2`  | 2026-05-31    | https://www.npmjs.com/package/jest                             | Published May 9 2026                                                                  |
| `ts-jest`                | `29.4.11` | 2026-05-31    | `npm view ts-jest version`                                     | Compatible with Jest 30 via ESM preset                                                |
| `@types/jest`            | `30.0.0`  | 2026-05-31    | `npm view @types/jest version`                                 |                                                                                       |
| `@types/node`            | `25.9.1`  | 2026-05-31    | `npm view @types/node version`                                 | Tracks Node 22+; works on Node 20 LTS in CI                                           |
| `husky`                  | `9.1.7`   | 2026-05-31    | `npm view husky version`                                       | v9 init via `pnpm exec husky init`                                                    |
| `lint-staged`            | `17.0.7`  | 2026-05-31    | `npm view lint-staged version`                                 | Excluded from pnpm minimumReleaseAge gate (workspace.yaml)                            |

### Frameworks (verified, not yet installed)

These are pinned in this ADR but their packages are added only when their respective slices begin. Verifying now so the slice can install in one shot.

| Package                 | Version    | Verified date | Source                                                         | Slice   |
| ----------------------- | ---------- | ------------- | -------------------------------------------------------------- | ------- |
| `next`                  | `16.2.6`   | 2026-05-31    | https://vercel.com/changelog/next-js-may-2026-security-release | Slice 7 |
| `react`                 | `19.2.6`   | 2026-05-31    | Paired with Next 16.2.6                                        | Slice 7 |
| `react-dom`             | `19.2.6`   | 2026-05-31    | Paired with Next 16.2.6                                        | Slice 7 |
| `@supabase/ssr`         | `0.10.3`   | 2026-05-31    | https://www.npmjs.com/package/@supabase/ssr                    | Slice 7 |
| `@tanstack/react-query` | `5.100.14` | 2026-05-31    | https://github.com/tanstack/query/releases                     | Slice 1 |
| `zustand`               | `5.0.14`   | 2026-05-31    | https://github.com/pmndrs/zustand/releases/tag/v5.0.14         | Slice 1 |

### Local environment notes

- Local Node is `v26.0.0` (Homebrew). CI uses Node 20 LTS for stability (see `.github/workflows/ci.yml`).
- `corepack` is **not** present in this Homebrew Node 26 install, so pnpm is installed globally via `npm i -g pnpm@11.4.0`. The `packageManager` field in root `package.json` still pins `pnpm@11.4.0` so `pnpm install` rejects mismatched versions.
- `pnpm install` produced one postinstall script (`unrs-resolver`, native dep of `eslint-plugin-import-x`). Explicitly allowed in `pnpm-workspace.yaml#allowBuilds`; nothing else runs at install.

### Notes on Next.js 16 (relevant for Slice 7)

Critical changes from the May 7 2026 security release we will need to honor:

- Middleware file renamed `middleware.ts` → `proxy.ts` (Node.js runtime).
- `next lint` removed — use ESLint 9/10 flat config directly.
- `params` and `searchParams` are now async (required, not just a warning).
- Minimum Node bumped to 20.9.0.
- Turbopack is the default bundler in dev **and** prod.

## Bump log

_(append rows here when bumping a dep; include version old → new, date, reason, PR link)_
