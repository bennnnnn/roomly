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
export const env = defineEnv(
  {
    EXPO_PUBLIC_SUPABASE_URL: { required: true, visibility: 'public' },
    EXPO_PUBLIC_SUPABASE_ANON_KEY: { required: true, visibility: 'public' },
  },
  {
    runtime: 'client',
    publicPrefix: 'EXPO_PUBLIC_',
    getter: (key) => process.env[key] as string | undefined,
  },
);
