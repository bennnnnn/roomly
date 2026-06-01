import type { ListingType } from '@roomly/lib';

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  single_bedroom: 'Single bedroom',
  shared_bedroom: 'Shared bedroom',
  basement: 'Basement',
  full_unit: 'Full house / apartment',
  extra_house: 'Extra house',
};

export const WIZARD_STEP_COUNT = 7;
