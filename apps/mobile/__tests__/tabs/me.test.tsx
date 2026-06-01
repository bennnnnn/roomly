jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() =>
        Promise.resolve({ count: 0, error: null, data: null, status: 200, statusText: 'OK' }),
      ),
    })),
  },
}));

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import Me from '../../app/(tabs)/me';
import { supabase } from '../../src/lib/supabaseClient';
import { QueryProvider } from '../../src/providers/QueryProvider';
import { __resetForTests, useSessionStore } from '../../src/state/session';

const signOut = (supabase.auth as unknown as { signOut: jest.Mock }).signOut;

function renderMe() {
  return render(
    <QueryProvider>
      <Me />
    </QueryProvider>,
  );
}

describe('Me tab', () => {
  beforeEach(() => {
    __resetForTests();
    signOut.mockReset();
    signOut.mockResolvedValue({ error: null });
  });

  it('renders the heading and a sign-out button', () => {
    renderMe();
    expect(screen.getByText('Me')).toBeOnTheScreen();
    expect(screen.getByTestId('me-sign-out')).toBeOnTheScreen();
  });

  it('shows the signed-in user email from the session store', () => {
    useSessionStore.setState({
      status: 'authenticated',
      session: null,
      user: { id: 'u1', email: 'me@example.com' } as never,
    });
    renderMe();
    expect(screen.getByTestId('me-email')).toHaveTextContent('me@example.com');
  });

  it('falls back to "unknown" when no user is on the store', () => {
    renderMe();
    expect(screen.getByTestId('me-email')).toHaveTextContent('unknown');
  });

  it('calls supabase.auth.signOut on press', async () => {
    renderMe();
    await act(async () => {
      fireEvent.press(screen.getByTestId('me-sign-out'));
      await Promise.resolve();
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
