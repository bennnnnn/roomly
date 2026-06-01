import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

let _serviceClient: SupabaseClient | null = null;

/** Returns a Supabase client scoped to the caller's JWT. */
export function createUserClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    // Return an unauthenticated client; the caller must check auth.
    return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  }
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
}

/** Returns a Supabase client with the service_role key. Cached per cold start. */
export function createServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }
  return _serviceClient;
}
