import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Card } from '../../src/components/Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card testID="card">
        <Text>Hello inside card</Text>
      </Card>,
    );
    expect(screen.getByTestId('card')).toBeOnTheScreen();
    expect(screen.getByText('Hello inside card')).toBeOnTheScreen();
  });

  it('forwards extra className without dropping the base classes', () => {
    render(
      <Card testID="card" className="mt-xl">
        <Text>x</Text>
      </Card>,
    );
    const node = screen.getByTestId('card');
    expect(typeof node.props.className).toBe('string');
    expect(node.props.className).toContain('mt-xl');
    expect(node.props.className).toContain('rounded-lg');
  });
});
