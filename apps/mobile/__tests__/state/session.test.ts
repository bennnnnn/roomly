// jest.mock factories cannot reference out-of-scope identifiers (even ones
// that get erased like type aliases — jest's hoist plugin operates on the
// AST before TS erasure). Everything below is declared inline.
jest.mock('../../src/lib/supabaseClient', () => {
  const listeners: ((event: string, session: unknown) => void)[] = [];
  const unsubscribe = jest.fn(() => {
    listeners.length = 0;
  });
  let getSessionResult: { data: { session: unknown }; error: null } = {
    data: { session: null },
    error: null,
  };
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve(getSessionResult)),
        onAuthStateChange: jest.fn((cb: (event: string, session: unknown) => void) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe } } };
        }),
      },
      __test: {
        listeners,
        unsubscribe,
        setGetSessionResult: (r: { data: { session: unknown }; error: null }): void => {
          getSessionResult = r;
        },
        emit: (event: string, session: unknown): void => {
          for (const l of listeners) l(event, session);
        },
      },
    },
  };
});

import { supabase } from '../../src/lib/supabaseClient';
import { __resetForTests, bootstrapSession, useSessionStore } from '../../src/state/session';

import type { Session, User } from '@supabase/supabase-js';

type Listener = (event: string, session: Session | null) => void;

type MockSupabase = typeof supabase & {
  __test: {
    listeners: Listener[];
    unsubscribe: jest.Mock;
    setGetSessionResult: (r: { data: { session: Session | null }; error: null }) => void;
    emit: (event: string, session: Session | null) => void;
  };
};

const mocked = supabase as MockSupabase;

// jest mocks are functions, not methods on an auth object — the
// unbound-method rule's reasoning doesn't apply here. Cast through a flat
// shape so it doesn't fire on every `.mockClear()` call.
const authMocks = mocked.auth as unknown as {
  getSession: jest.Mock;
  onAuthStateChange: jest.Mock;
};

function fakeSession(): Session {
  return {
    access_token: 'at',
    refresh_token: 'rt',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: { id: 'user-1', email: 'a@b.com' } as User,
  };
}

describe('session store', () => {
  beforeEach(() => {
    __resetForTests();
    mocked.__test.setGetSessionResult({
      data: { session: null },
      error: null,
    });
    authMocks.getSession.mockClear();
    authMocks.onAuthStateChange.mockClear();
    mocked.__test.unsubscribe.mockClear();
  });

  it('starts in "loading" status', () => {
    expect(useSessionStore.getState().status).toBe('loading');
  });

  it('bootstraps from getSession + flips to anonymous when no session', async () => {
    bootstrapSession();
    await Promise.resolve();
    await Promise.resolve();
    expect(useSessionStore.getState().status).toBe('anonymous');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('bootstraps with an existing session → authenticated', async () => {
    const s = fakeSession();
    mocked.__test.setGetSessionResult({ data: { session: s }, error: null });
    bootstrapSession();
    await Promise.resolve();
    await Promise.resolve();
    const state = useSessionStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.id).toBe('user-1');
  });

  it('subscribes exactly once even when bootstrap is called twice (retro §1)', () => {
    bootstrapSession();
    bootstrapSession();
    bootstrapSession();
    expect(authMocks.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('returns the same unsubscribe handle from repeat bootstrap calls', () => {
    const a = bootstrapSession();
    const b = bootstrapSession();
    expect(a).toBe(b);
  });

  it('updates the store when supabase emits a SIGNED_IN event', async () => {
    bootstrapSession();
    await Promise.resolve();
    mocked.__test.emit('SIGNED_IN', fakeSession());
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user?.id).toBe('user-1');
  });

  it('updates the store to anonymous on SIGNED_OUT', async () => {
    mocked.__test.setGetSessionResult({
      data: { session: fakeSession() },
      error: null,
    });
    bootstrapSession();
    await Promise.resolve();
    await Promise.resolve();
    mocked.__test.emit('SIGNED_OUT', null);
    expect(useSessionStore.getState().status).toBe('anonymous');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('unsubscribes on cleanup and lets a fresh bootstrap re-subscribe', () => {
    const cleanup = bootstrapSession();
    cleanup();
    expect(mocked.__test.unsubscribe).toHaveBeenCalledTimes(1);
    bootstrapSession();
    expect(authMocks.onAuthStateChange).toHaveBeenCalledTimes(2);
  });
});
