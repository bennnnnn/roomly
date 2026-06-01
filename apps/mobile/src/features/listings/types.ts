import type { ListingType } from '@roomly/lib';

export type { ListingType };

export interface ListingPhotoMeta {
  id: string;
  storagePath: string;
  sortOrder: number;
  isCover: boolean;
  signedUrl: string | null;
}

export interface BrowseListingItem {
  id: string;
  title: string;
  priceCents: number;
  type: ListingType;
  areaLabel: string;
  /** Public area coordinates (map uses fuzzy offset). */
  lat: number;
  lng: number;
  availableFrom: string;
  hasOwnBath: boolean;
  hasSharedBath: boolean;
  petsAllowed: boolean;
  furnished: boolean;
  coverPhotoUrl: string | null;
  isFavorite: boolean;
}

export interface ListingDetail extends BrowseListingItem {
  description: string;
  depositCents: number | null;
  minMonths: number;
  lat: number;
  lng: number;
  status: string;
  viewCount: number;
  ownerId: string;
  noSmoking: boolean;
  utilitiesIncluded: boolean;
  hasParking: boolean;
  hasLaundry: boolean;
  photos: ListingPhotoMeta[];
  isOwner: boolean;
}

/** Available sort orders for the browse feed. */
export type BrowseSort = 'newest' | 'price_asc' | 'price_desc';

/** Bath filter values. */
export type BathFilter = 'any' | 'own' | 'shared';

/** Filters applied to the browse feed. */
export interface ListingFilters {
  types: ListingType[];
  priceMin: number | null;
  priceMax: number | null;
  bath: BathFilter;
  furnished: boolean | null;
  pets: boolean | null;
  availableAfter: string | null;
  sort: BrowseSort;
}

export const DEFAULT_FILTERS: ListingFilters = {
  types: [],
  priceMin: null,
  priceMax: null,
  bath: 'any',
  furnished: null,
  pets: null,
  availableAfter: null,
  sort: 'newest',
};
