import { defineEnv } from '@roomly/lib';

const getter = (key: string): string | undefined => {
  const raw: unknown = process.env[key];
  return typeof raw === 'string' ? raw : undefined;
};

export const publicEnv = defineEnv(
  {
    NEXT_PUBLIC_SUPABASE_URL: { required: true, visibility: 'public' },
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: { required: true, visibility: 'public' },
  },
  {
    runtime: 'client',
    publicPrefix: 'NEXT_PUBLIC_',
    getter,
  },
);

export const serverEnv = defineEnv(
  {
    SUPABASE_SERVICE_ROLE_KEY: { required: true, visibility: 'server' },
  },
  {
    runtime: 'server',
    getter,
  },
);

export function getPublicSupabaseEnv(): { url: string; publishableKey: string } {
  return {
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getServiceRoleKey(): string {
  return serverEnv.SUPABASE_SERVICE_ROLE_KEY;
}
