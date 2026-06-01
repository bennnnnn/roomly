import { useLocalSearchParams } from 'expo-router';

import ListingWizardScreen from '../../../src/features/listings/screens/ListingWizardScreen';

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListingWizardScreen mode="edit" listingId={id} />;
}
