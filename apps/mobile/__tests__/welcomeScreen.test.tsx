jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { colorScheme } from 'nativewind';

import WelcomeScreen from '../src/screens/WelcomeScreen';

const pushMock = jest.fn();

describe('WelcomeScreen', () => {
  beforeEach(() => {
    pushMock.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  afterEach(() => {
    colorScheme.set('light');
  });

  it('renders the Roomly brand', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Roomly')).toBeOnTheScreen();
  });

  it('routes to /sign-in when "Continue with email" is pressed', () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByTestId('welcome-continue'));
    expect(pushMock).toHaveBeenCalledWith('/sign-in');
  });

  it('exposes the stable welcome-screen testID', () => {
    render(<WelcomeScreen />);
    expect(screen.getByTestId('welcome-screen')).toBeOnTheScreen();
  });

  it('renders without crashing under NativeWind dark mode', () => {
    colorScheme.set('dark');
    render(<WelcomeScreen />);
    expect(screen.getByText('Roomly')).toBeOnTheScreen();
    expect(screen.getByTestId('welcome-screen')).toBeOnTheScreen();
  });
});
