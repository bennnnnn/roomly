import { render, screen } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';

import WelcomeScreen from '../src/screens/WelcomeScreen';

describe('WelcomeScreen', () => {
  // Reset NativeWind's color-scheme state between tests so dark-mode leakage
  // can't cause order-dependent flakes.
  afterEach(() => {
    colorScheme.set('light');
  });

  it('renders the welcome heading', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Welcome to Roomly')).toBeOnTheScreen();
  });

  it('displays the shared heartbeat timing from @roomly/lib', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/Presence heartbeat: 60000 ms/)).toBeOnTheScreen();
  });

  it('exposes a stable testID for downstream e2e tests', () => {
    render(<WelcomeScreen />);
    expect(screen.getByTestId('welcome-screen')).toBeOnTheScreen();
  });

  it('renders without crashing under NativeWind dark mode', () => {
    colorScheme.set('dark');
    render(<WelcomeScreen />);
    expect(screen.getByText('Welcome to Roomly')).toBeOnTheScreen();
    expect(screen.getByTestId('welcome-screen')).toBeOnTheScreen();
  });
});
