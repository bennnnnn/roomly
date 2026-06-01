import { create } from 'zustand';

import type { ListingType } from '@roomly/lib';

export interface WizardPhoto {
  id: string;
  localUri?: string | undefined;
  storagePath?: string | undefined;
}

export interface ListingWizardState {
  listingId: string | null;
  step: number;
  type: ListingType | null;
  photos: WizardPhoto[];
  areaLabel: string;
  addressLine: string;
  lat: string;
  lng: string;
  priceDollars: string;
  depositDollars: string;
  availableFrom: string;
  minMonths: string;
  hasOwnBath: boolean;
  hasSharedBath: boolean;
  noSmoking: boolean;
  petsAllowed: boolean;
  furnished: boolean;
  utilitiesIncluded: boolean;
  hasParking: boolean;
  hasLaundry: boolean;
  title: string;
  description: string;
  setListingId: (id: string) => void;
  setStep: (step: number) => void;
  patch: (
    partial: Partial<Omit<ListingWizardState, 'setListingId' | 'setStep' | 'patch' | 'reset'>>,
  ) => void;
  reset: () => void;
}

const initialState = {
  listingId: null,
  step: 1,
  type: null as ListingType | null,
  photos: [] as WizardPhoto[],
  areaLabel: '',
  addressLine: '',
  lat: '',
  lng: '',
  priceDollars: '',
  depositDollars: '',
  availableFrom: new Date().toISOString().slice(0, 10),
  minMonths: '1',
  hasOwnBath: false,
  hasSharedBath: false,
  noSmoking: false,
  petsAllowed: false,
  furnished: false,
  utilitiesIncluded: false,
  hasParking: false,
  hasLaundry: false,
  title: '',
  description: '',
};

export const useListingWizardStore = create<ListingWizardState>((set) => ({
  ...initialState,
  setListingId: (id) => set({ listingId: id }),
  setStep: (step) => set({ step }),
  patch: (partial) => set(partial),
  reset: () => set(initialState),
}));
