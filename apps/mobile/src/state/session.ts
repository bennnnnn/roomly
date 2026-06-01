import { create } from 'zustand';

import { logger } from '../lib/logger';
import { supabase } from '../lib/supabaseClient';

import type { Session, User } from '@supabase/supabase-js';

/**
 * Auth/session state for the mobile app.
 *
 * Lifecycle (retro §1 — leaked Supabase auth listener):
 *   - `bootstrapSession()` must be called exactly once at app start.
 *     It hydrates from AsyncStorage and starts ONE `onAuthStateChange`
 *     subscription. It returns the unsubscribe handle so the caller (the
 *     RootLayout `useEffect`) can clean it up on unmount — even though in
 *     practice the root layout never unmounts, the contract keeps tests
 *     and Fast Refresh sane.
 *   - Calling `bootstrapSession()` twice is a no-op (returns the existing
 *     unsubscribe handle). We use a module-level guard so accidental
 *     double-mount (Strict Mode, Fast Refresh) cannot stack listeners.
 */

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

export interface SessionState {
  status: SessionStatus;
  session: Session | null;
  user: User | null;
  setFromAuth: (session: Session | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  setFromAuth: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? 'authenticated' : 'anonymous',
    }),
}));

/** Selector helpers — prefer these over `useSessionStore.getState()` in components. */
export const useSession = (): Session | null => useSessionStore((s) => s.session);
export const useUser = (): User | null => useSessionStore((s) => s.user);
export const useSessionStatus = (): SessionStatus => useSessionStore((s) => s.status);

let unsubscribe: (() => void) | null = null;

export function bootstrapSession(): () => void {
  if (unsubscribe) {
    return unsubscribe;
  }

  void supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        logger.error('session.getSession failed', { error: error.message });
      }
      useSessionStore.getState().setFromAuth(data.session ?? null);
    })
    .catch((e: unknown) => {
      logger.error('session.getSession threw', {
        error: e instanceof Error ? e.message : String(e),
      });
      useSessionStore.getState().setFromAuth(null);
    });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSessionStore.getState().setFromAuth(session);
  });

  unsubscribe = () => {
    data.subscription.unsubscribe();
    unsubscribe = null;
  };

  return unsubscribe;
}

/** Test-only: reset the module-level subscription guard. */
export function __resetForTests(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  useSessionStore.setState({
    status: 'loading',
    session: null,
    user: null,
  });
}
