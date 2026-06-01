import { supabase } from '../../../lib/supabaseClient';

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

export async function upsertListingDraft(
  listingId: string,
  payload: ListingDraftPayload,
): Promise<void> {
  const { error: listingError } = await supabase
    .from('listings')
    .update({
      type: payload.type,
      title: payload.title,
      description: payload.description,
      price_cents: payload.priceCents,
      deposit_cents: payload.depositCents,
      available_from: payload.availableFrom,
      min_months: payload.minMonths,
      area_label: payload.areaLabel,
      lat: payload.lat,
      lng: payload.lng,
      has_own_bath: payload.hasOwnBath,
      has_shared_bath: payload.hasSharedBath,
      no_smoking: payload.noSmoking,
      pets_allowed: payload.petsAllowed,
      furnished: payload.furnished,
      utilities_included: payload.utilitiesIncluded,
      has_parking: payload.hasParking,
      has_laundry: payload.hasLaundry,
      status: 'draft',
    })
    .eq('id', listingId);

  if (listingError) throw listingError;

  const { error: locError } = await supabase.from('listing_private_location').upsert({
    listing_id: listingId,
    address_line: payload.addressLine,
  });

  if (locError) throw locError;
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
