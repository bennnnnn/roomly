import { fireEvent, render, screen } from '@testing-library/react-native';

import { ListingCard } from '../../src/features/listings/components/ListingCard';

import type { BrowseListingItem } from '../../src/features/listings/types';

const listing: BrowseListingItem = {
  id: 'l1',
  title: 'Bright room',
  priceCents: 120000,
  type: 'single_bedroom',
  areaLabel: 'Mission',
  lat: 37.76,
  lng: -122.42,
  availableFrom: '2026-07-01',
  hasOwnBath: true,
  hasSharedBath: false,
  petsAllowed: false,
  furnished: true,
  coverPhotoUrl: null,
  isFavorite: false,
};

describe('ListingCard', () => {
  it('renders price and area', () => {
    const onPress = jest.fn();
    render(<ListingCard listing={listing} onPress={onPress} testID="card" />);
    expect(screen.getByText('$1200.00/mo')).toBeOnTheScreen();
    expect(screen.getByText(/Mission/)).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
