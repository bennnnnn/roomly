import { supabase } from '../../../lib/supabaseClient';

import type { ListingUpdate } from '@roomly/db-types';
import type { ListingType } from '@roomly/lib';

export interface ListingDraftPayload {
  type: ListingType;
  title: string;
  description: string;
  priceCents: number;
  depositCents: number | null;
  availableFrom: string;
  minMonths: number;
  areaLabel: string;
  addressLine: string;
  lat: number;
  lng: number;
  hasOwnBath: boolean;
  hasSharedBath: boolean;
  noSmoking: boolean;
  petsAllowed: boolean;
  furnished: boolean;
  utilitiesIncluded: boolean;
  hasParking: boolean;
  hasLaundry: boolean;
}

/** Creates an empty draft row owned by the current user. */
export async function createListingDraft(ownerId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('listings')
    .insert({
      owner_id: ownerId,
      type: 'single_bedroom',
      title: 'Draft listing',
      description: 'Draft description placeholder text here.',
      price_cents: 10000,
      available_from: today,
      area_label: 'Area',
      lat: 0,
      lng: 0,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export type ListingDraftUpdate = Partial<ListingDraftPayload>;

export async function upsertListingDraft(
  listingId: string,
  payload: ListingDraftUpdate,
): Promise<void> {
  const row: ListingUpdate = {};

  if (payload.type !== undefined) row.type = payload.type;
  if (payload.title !== undefined) row.title = payload.title;
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.priceCents !== undefined) row.price_cents = payload.priceCents;
  if (payload.depositCents !== undefined) row.deposit_cents = payload.depositCents;
  if (payload.availableFrom !== undefined) row.available_from = payload.availableFrom;
  if (payload.minMonths !== undefined) row.min_months = payload.minMonths;
  if (payload.areaLabel !== undefined) row.area_label = payload.areaLabel;
  if (payload.lat !== undefined) row.lat = payload.lat;
  if (payload.lng !== undefined) row.lng = payload.lng;
  if (payload.hasOwnBath !== undefined) row.has_own_bath = payload.hasOwnBath;
  if (payload.hasSharedBath !== undefined) row.has_shared_bath = payload.hasSharedBath;
  if (payload.noSmoking !== undefined) row.no_smoking = payload.noSmoking;
  if (payload.petsAllowed !== undefined) row.pets_allowed = payload.petsAllowed;
  if (payload.furnished !== undefined) row.furnished = payload.furnished;
  if (payload.utilitiesIncluded !== undefined) row.utilities_included = payload.utilitiesIncluded;
  if (payload.hasParking !== undefined) row.has_parking = payload.hasParking;
  if (payload.hasLaundry !== undefined) row.has_laundry = payload.hasLaundry;

  if (Object.keys(row).length > 0) {
    const { error: listingError } = await supabase.from('listings').update(row).eq('id', listingId);
    if (listingError) throw listingError;
  }

  if (payload.addressLine !== undefined) {
    const { error: locError } = await supabase.from('listing_private_location').upsert({
      listing_id: listingId,
      address_line: payload.addressLine,
    });
    if (locError) throw locError;
  }
}

export async function fetchOwnerListingDraft(listingId: string): Promise<{
  payload: ListingDraftPayload;
  photoCount: number;
} | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `type, title, description, price_cents, deposit_cents, available_from, min_months,
       area_label, lat, lng,
       has_own_bath, has_shared_bath, no_smoking, pets_allowed, furnished,
       utilities_included, has_parking, has_laundry,
       listing_private_location (address_line),
       listing_photos (id)`,
    )
    .eq('id', listingId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const locRaw = data.listing_private_location as
    | { address_line: string }
    | { address_line: string }[]
    | null;
  const loc = Array.isArray(locRaw) ? locRaw[0] : locRaw;
  const address = loc?.address_line ?? '';

  return {
    payload: {
      type: data.type,
      title: data.title,
      description: data.description,
      priceCents: data.price_cents,
      depositCents: data.deposit_cents,
      availableFrom: data.available_from,
      minMonths: data.min_months,
      areaLabel: data.area_label,
      addressLine: address,
      lat: data.lat,
      lng: data.lng,
      hasOwnBath: data.has_own_bath,
      hasSharedBath: data.has_shared_bath,
      noSmoking: data.no_smoking,
      petsAllowed: data.pets_allowed,
      furnished: data.furnished,
      utilitiesIncluded: data.utilities_included,
      hasParking: data.has_parking,
      hasLaundry: data.has_laundry,
    },
    photoCount: data.listing_photos?.length ?? 0,
  };
}
