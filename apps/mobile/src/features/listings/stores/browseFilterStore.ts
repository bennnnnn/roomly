import { create } from 'zustand';

import { DEFAULT_FILTERS } from '../types';

import type { BathFilter, BrowseSort, ListingFilters, ListingType } from '../types';

interface BrowseFilterState {
  filters: ListingFilters;
  location: { lat: number; lng: number; label: string } | null;

  setTypes: (types: ListingType[]) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setBath: (bath: BathFilter) => void;
  setFurnished: (furnished: boolean | null) => void;
  setPets: (pets: boolean | null) => void;
  setAvailableAfter: (date: string | null) => void;
  setSort: (sort: BrowseSort) => void;
  setLocation: (location: { lat: number; lng: number; label: string } | null) => void;
  resetFilters: () => void;
  /** Count of active (non-default) filters. */
  activeFilterCount: () => number;
}

export const useBrowseFilterStore = create<BrowseFilterState>((set, get) => ({
  filters: { ...DEFAULT_FILTERS },
  location: null,

  setTypes: (types) => set((s) => ({ filters: { ...s.filters, types } })),

  setPriceRange: (min, max) =>
    set((s) => ({ filters: { ...s.filters, priceMin: min, priceMax: max } })),

  setBath: (bath) => set((s) => ({ filters: { ...s.filters, bath } })),

  setFurnished: (furnished) => set((s) => ({ filters: { ...s.filters, furnished } })),

  setPets: (pets) => set((s) => ({ filters: { ...s.filters, pets } })),

  setAvailableAfter: (date) => set((s) => ({ filters: { ...s.filters, availableAfter: date } })),

  setSort: (sort) => set((s) => ({ filters: { ...s.filters, sort } })),

  setLocation: (location) => set({ location }),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  activeFilterCount: () => {
    const f = get().filters;
    let count = 0;
    if (f.types.length > 0) count++;
    if (f.priceMin !== null || f.priceMax !== null) count++;
    if (f.bath !== 'any') count++;
    if (f.furnished !== null) count++;
    if (f.pets !== null) count++;
    if (f.availableAfter !== null) count++;
    if (f.sort !== 'newest') count++;
    return count;
  },
}));
