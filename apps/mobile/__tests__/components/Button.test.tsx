import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../../src/components/Button';

describe('Button', () => {
  it('renders the label and exposes it as the accessibility label', () => {
    render(<Button label="Tap me" onPress={() => undefined} testID="btn" />);
    const btn = screen.getByTestId('btn');
    expect(btn).toBeOnTheScreen();
    expect(btn.props.accessibilityLabel).toBe('Tap me');
    expect(screen.getByText('Tap me')).toBeOnTheScreen();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Tap" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('swaps label for a spinner and ignores presses while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Tap" onPress={onPress} loading testID="btn" />);
    expect(screen.getByTestId('btn-spinner')).toBeOnTheScreen();
    expect(screen.queryByText('Tap')).toBeNull();
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('btn').props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
  });

  it('ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Tap" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
