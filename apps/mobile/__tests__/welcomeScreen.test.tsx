import { render, screen } from '@testing-library/react-native';

import WelcomeScreen from '../src/screens/WelcomeScreen';

describe('WelcomeScreen', () => {
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
});
