import { fireEvent, render, screen } from '@testing-library/react-native';

import { Input } from '../../src/components/Input';

describe('Input', () => {
  it('renders the label as both visible text and accessibility label', () => {
    render(<Input label="Email" testID="email" />);
    expect(screen.getByText('Email')).toBeOnTheScreen();
    expect(screen.getByTestId('email').props.accessibilityLabel).toBe('Email');
  });

  it('calls onChangeText when typed into', () => {
    const onChangeText = jest.fn();
    render(<Input label="Email" onChangeText={onChangeText} testID="email" />);
    fireEvent.changeText(screen.getByTestId('email'), 'a@b.com');
    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('renders an error message and marks the input invalid', () => {
    render(<Input label="Email" errorMessage="Email is required" testID="email" />);
    expect(screen.getByTestId('email-error')).toBeOnTheScreen();
    expect(screen.getByText('Email is required')).toBeOnTheScreen();
    expect(screen.getByTestId('email').props['aria-invalid']).toBe(true);
  });

  it('reports editable=false via accessibilityState.disabled', () => {
    render(<Input label="Email" editable={false} testID="email" />);
    expect(screen.getByTestId('email').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});
