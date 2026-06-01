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
  availableFrom: string;
  hasOwnBath: boolean;
  hasSharedBath: boolean;
  petsAllowed: boolean;
  furnished: boolean;
  coverPhotoUrl: string | null;
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
  isFavorite: boolean;
  isOwner: boolean;
}
