jest.mock('../../src/lib/supabaseClient', () => {
  const signInWithOtp = jest.fn();
  return {
    supabase: {
      auth: {
        signInWithOtp,
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
    },
  };
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { supabase } from '../../src/lib/supabaseClient';
import SignInScreen from '../../src/screens/SignInScreen';

// Bypass unbound-method lint: jest mocks aren't methods of an auth instance.
const otp = (supabase.auth as unknown as { signInWithOtp: jest.Mock }).signInWithOtp;

async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('SignInScreen', () => {
  beforeEach(() => {
    otp.mockReset();
  });

  it('disables the submit button until a plausibly-formatted email is entered', () => {
    render(<SignInScreen />);
    expect(screen.getByTestId('sign-in-submit').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'not-an-email');
    expect(screen.getByTestId('sign-in-submit').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'me@example.com');
    expect(screen.getByTestId('sign-in-submit').props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it('sends the magic link and shows the sent banner on success', async () => {
    otp.mockResolvedValueOnce({ data: {}, error: null });
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'me@example.com');
    fireEvent.press(screen.getByTestId('sign-in-submit'));
    await flushPromises();
    expect(otp).toHaveBeenCalledWith({
      email: 'me@example.com',
      options: { emailRedirectTo: 'roomly://auth/callback' },
    });
    expect(screen.getByTestId('sign-in-sent-banner')).toBeOnTheScreen();
    // The email input is replaced by the banner — make sure it's gone.
    expect(screen.queryByTestId('sign-in-email')).toBeNull();
  });

  it('surfaces the Supabase error message inline', async () => {
    otp.mockResolvedValueOnce({
      data: {},
      error: { message: 'rate limit', code: 'over_email_send_rate_limit' },
    });
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'me@example.com');
    fireEvent.press(screen.getByTestId('sign-in-submit'));
    await flushPromises();
    expect(screen.getByText('rate limit')).toBeOnTheScreen();
    // Banner not shown on error.
    expect(screen.queryByTestId('sign-in-sent-banner')).toBeNull();
  });

  it('surfaces a friendly error when the call throws', async () => {
    otp.mockRejectedValueOnce(new Error('network down'));
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByTestId('sign-in-email'), 'me@example.com');
    fireEvent.press(screen.getByTestId('sign-in-submit'));
    await flushPromises();
    expect(
      screen.getByText(/Could not reach Roomly. Check your connection and try again./),
    ).toBeOnTheScreen();
  });

  it('trims whitespace from the email before sending', async () => {
    otp.mockResolvedValueOnce({ data: {}, error: null });
    render(<SignInScreen />);
    fireEvent.changeText(screen.getByTestId('sign-in-email'), '  me@example.com  ');
    fireEvent.press(screen.getByTestId('sign-in-submit'));
    await flushPromises();
    expect(otp).toHaveBeenCalledWith(expect.objectContaining({ email: 'me@example.com' }));
  });
});
