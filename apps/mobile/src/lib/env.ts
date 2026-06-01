import { defineEnv } from '@roomly/lib';

/**
 * Public env-var contract for the mobile bundle.
 *
 * Every var MUST start with `EXPO_PUBLIC_` — Expo only inlines those into the
 * shipped bundle. Anything else is unreadable here at runtime.
 *
 * Server-only secrets (Stripe secret, service-role JWT, Resend API key, etc.)
 * are explicitly off-limits in this file. They live in Edge Function env vars,
 * EAS secrets, or GitHub Actions secrets per ADR-0009. `defineEnv` will
 * refuse to even register them with `runtime: 'client'`.
 *
 * If you need a new env var here, add it to `.env.example` first, document
 * it in ADR-0009's table, then add it below.
 */
// The single legal site for `process.env` access in apps/mobile/src. The
// `no-restricted-syntax` rule in `eslint.config.mjs` flags this anywhere
// else; this file is on the allowlist.
const getter = (key: string): string | undefined => process.env[key];

export const env = defineEnv(
  {
    EXPO_PUBLIC_SUPABASE_URL: { required: true, visibility: 'public' },
    // Supabase's "new API keys" (post-2025). Format: `sb_publishable_...`.
    // The legacy `anon` JWT still works until end-of-2026 but new code uses
    // the new format. See supabase.com/docs/guides/getting-started/api-keys.
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: { required: true, visibility: 'public' },
    // Optional observability vars — when absent, adapters are not registered
    // and the logger remains a no-op (safe for tests/CI/pre-DSN dev).
    EXPO_PUBLIC_SENTRY_DSN: { required: false, visibility: 'public' },
    EXPO_PUBLIC_POSTHOG_API_KEY: { required: false, visibility: 'public' },
    EXPO_PUBLIC_POSTHOG_HOST: { required: false, visibility: 'public' },
  },
  {
    runtime: 'client',
    publicPrefix: 'EXPO_PUBLIC_',
    getter,
  },
);
