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

## Audit policy

The `gate` script runs `pnpm audit --prod --audit-level=high`. **Moderate** findings are printed but do not block merges. Rationale: most moderate findings in our tree come from build-time-only chains (e.g. `xcode` → `uuid` in `@expo/cli`, only invoked by `expo prebuild` / EAS Build) that never execute in the shipped app. We re-evaluate every moderate finding manually when it appears and either bump the dep, suppress with rationale here, or open an issue tracking the upstream fix.

Outstanding moderate findings (re-check at each Slice exit):

| GHSA                | Package | Path                                                    | Why we accept it                                                                                                                                                                                            | Re-check when                              |
| ------------------- | ------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| GHSA-w5hq-g745-h8pq | uuid    | `@expo/cli` → `@expo/config-plugins` → `xcode` → `uuid` | Build-only chain; `xcode` (Cordova-era iOS project tweaker) runs at `expo prebuild` / EAS Build, never at runtime. Patched in `uuid >=11.1.1`, but Expo's pinned `xcode` package depends on the older line. | Expo SDK 57 or any `@expo/cli` minor bump. |

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

- Local Node is `v26.0.0` (Homebrew). CI uses Node **22 LTS** (pnpm 11 dropped Node 20; see `.github/workflows/ci.yml` and [pnpm 11 release notes](https://github.com/pnpm/pnpm/releases/tag/v11.0.0)).
- `engines.node` in root `package.json` is `>=22.0.0` so `pnpm install` refuses to run on older Node.
- `corepack` is **not** present in this Homebrew Node 26 install, so pnpm is installed globally via `npm i -g pnpm@11.4.0`. The `packageManager` field in root `package.json` still pins `pnpm@11.4.0` so `pnpm install` rejects mismatched versions.
- `pnpm install` produced one postinstall script (`unrs-resolver`, native dep of `eslint-plugin-import-x`). Explicitly allowed in `pnpm-workspace.yaml#allowBuilds`; nothing else runs at install.

### Notes on Next.js 16 (relevant for Slice 7)

Critical changes from the May 7 2026 security release we will need to honor:

- Middleware file renamed `middleware.ts` → `proxy.ts` (Node.js runtime).
- `next lint` removed — use ESLint 9/10 flat config directly.
- `params` and `searchParams` are now async (required, not just a warning).
- Minimum Node bumped to 20.9.0.
- Turbopack is the default bundler in dev **and** prod.

## Verified at Slice 1A install (2026-05-31)

Tooling pins added when scaffolding the Expo mobile shell.

| Package                          | Version   | Source                                                                     | Notes                                                                                  |
| -------------------------------- | --------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `expo`                           | `56.0.8`  | `npm view expo version`                                                    | SDK 56, released May 2026; new arch on by default                                      |
| `expo-router`                    | `56.2.8`  | https://github.com/expo/expo/blob/sdk-56/packages/expo-router/CHANGELOG.md | Forked from React Navigation in SDK 56 — do NOT add `@react-navigation/*`              |
| `expo-status-bar`                | `56.0.4`  | `npm view`                                                                 |                                                                                        |
| `expo-constants`                 | `56.0.16` | `npm view`                                                                 |                                                                                        |
| `expo-linking`                   | `56.0.13` | `npm view`                                                                 |                                                                                        |
| `expo-system-ui`                 | `56.0.5`  | `npm view`                                                                 |                                                                                        |
| `@expo/metro-runtime`            | `56.0.13` | `npm view`                                                                 | Required by Expo Router for web                                                        |
| `react-native`                   | `0.85.3`  | `npm view`                                                                 | Aligned with Expo SDK 56                                                               |
| `react-native-safe-area-context` | `5.8.0`   | `npm view`                                                                 |                                                                                        |
| `react-native-screens`           | `4.25.2`  | `npm view`                                                                 |                                                                                        |
| `react-native-gesture-handler`   | `3.0.0`   | `npm view`                                                                 |                                                                                        |
| `@babel/core`                    | `7.29.7`  | `npm view`                                                                 |                                                                                        |
| `babel-preset-expo`              | `56.0.14` | `npm view`                                                                 |                                                                                        |
| `jest-expo`                      | `56.0.4`  | `npm view`                                                                 | **Pins us to Jest 29**; jest-expo 56 still depends on `@jest/globals@^29.2.1` etc.     |
| `@testing-library/react-native`  | `13.3.3`  | `npm view`                                                                 | RNTL v13; matchers register via the package's own side-effect import (no jest-native)  |
| `react-test-renderer`            | `19.2.6`  | `npm view`                                                                 | Required peer of RNTL                                                                  |
| `@types/react`                   | `19.2.15` | `npm view`                                                                 |                                                                                        |
| `globals`                        | `17.6.0`  | `npm view`                                                                 | Provides Node globals for ESLint's flat config (replaces legacy `env: { node: true }`) |

### Downgrades since Slice 0

| Package       | Slice 0  | Slice 1A  | Reason                                                                                                                                                                  |
| ------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jest`        | `30.4.2` | `29.7.0`  | `jest-expo@56` depends on `@jest/globals@^29.2.1`; mixing Jest 30 binary with 29 internals broke 5/5 tests. Re-evaluate when `jest-expo` ships a 30-compatible release. |
| `@types/jest` | `30.0.0` | `29.5.14` | Matches the jest 29.7.0 runtime above.                                                                                                                                  |

## Verified at Slice 1B install (2026-05-31)

NativeWind 4.2 + the Reanimated 4 + worklets chain it now requires. Tailwind v3 is forced (NativeWind v5 is still preview as of 5.0.0-preview.4, published May 15 2026; upstream explicitly says "use v4.1 for production").

| Package                   | Version  | Source                                     | Notes                                                                                                                                                   |
| ------------------------- | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nativewind`              | `4.2.4`  | `npm view nativewind version`              | v5 is `preview` tag only — `npm view nativewind dist-tags` confirms `latest: 4.2.4, preview: 5.0.0-preview.4`. Revisit when v5 hits `latest`.           |
| `tailwindcss`             | `3.4.19` | `npm view tailwindcss@^3 version`          | Tailwind v3 required by NativeWind 4.x; v4.x is a hard incompat (different PostCSS-first pipeline used only by NativeWind v5).                          |
| `react-native-reanimated` | `4.4.0`  | `npm view react-native-reanimated version` | NativeWind 4.2 ships a Reanimated-4-only worklet path (see [nativewind#1574](https://github.com/nativewind/nativewind/issues/1574)). Requires New Arch. |
| `react-native-worklets`   | `0.9.1`  | `npm view react-native-worklets version`   | Reanimated 4 dropped its bundled babel plugin in favor of this package's plugin. `react-native-worklets/plugin` must be **last** in `babel.config.js`.  |

### Config flow

```
packages/ui-tokens/src/index.ts       ← single source of truth (COLORS, SPACING, RADII, FONT_SIZES)
                ↓
packages/ui-tokens/src/tailwind.ts    ← tailwind-theme projection (pxifies SPACING/RADII/FONT_SIZES; colors pass through)
                ↓
apps/mobile/tailwind.config.ts        ← `theme: tailwindTheme` + `presets: [nativewindPreset]`
                ↓
apps/mobile/global.css                ← `@tailwind base/components/utilities` — processed by Metro via `withNativeWind(config, { input: './global.css' })`
                ↓
className="bg-accent-500 p-md"        ← consumed at runtime by nativewind/jsx-runtime (enabled via `babel-preset-expo`'s `jsxImportSource: 'nativewind'`)
```

The admin Tailwind config (Slice 7) will import the same `@roomly/ui-tokens/tailwind` so the two apps cannot drift apart on tokens.

### Known quirks captured during install

- `nativewind/preset` ships an **empty** `dist/tailwind/index.d.ts`, so TypeScript reports "is not a module" if you `import` it. Worked around with an ambient `declare module 'nativewind/preset'` in `apps/mobile/nativewind-env.d.ts`. Track upstream — remove the declaration when fixed.
- `declare module '*.css'` is also needed in the same file so `import '../global.css'` typechecks. This is a TS hygiene fix, not a runtime concern.

## Bump log

_(append rows here when bumping a dep; include version old → new, date, reason, PR link)_

| Date       | Package     | Old    | New     | Reason                                           | PR  |
| ---------- | ----------- | ------ | ------- | ------------------------------------------------ | --- |
| 2026-05-31 | jest        | 30.4.2 | 29.7.0  | jest-expo 56 peer-deps require Jest 29 internals | TBD |
| 2026-05-31 | @types/jest | 30.0.0 | 29.5.14 | Match jest 29 downgrade                          | TBD |
