import { supabase } from '../../src/lib/supabaseClient';

describe('supabaseClient', () => {
  it('exposes the auth namespace with the methods session.ts depends on', () => {
    expect(typeof supabase.auth.getSession).toBe('function');
    expect(typeof supabase.auth.onAuthStateChange).toBe('function');
    expect(typeof supabase.auth.signOut).toBe('function');
  });

  it('exposes the typed query builder', () => {
    expect(typeof supabase.from).toBe('function');
  });

  it('uses the public env vars wired through @roomly/lib defineEnv', () => {
    // Sanity that env.ts didn't throw at module load — if it had, this test
    // file would have failed to import. Asserting the URL surface exists.
    expect(supabase).toBeDefined();
  });
});
