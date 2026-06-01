import { supabase } from '../../../lib/supabaseClient';

import { signListingPhotoPaths } from './photoUrls';

import type { ListingDetail } from '../types';

export async function fetchListingDetail(
  id: string,
  viewerId: string | null,
): Promise<ListingDetail> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `id, owner_id, title, description, price_cents, deposit_cents, type, area_label,
       available_from, min_months, lat, lng, status, view_count,
       has_own_bath, has_shared_bath, no_smoking, pets_allowed, furnished,
       utilities_included, has_parking, has_laundry,
       listing_photos (id, storage_path, sort_order, is_cover)`,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Listing not found');

  const photos = [...(data.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const signed = await signListingPhotoPaths(photos.map((p) => p.storage_path));

  let isFavorite = false;
  if (viewerId) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('listing_id', id)
      .eq('user_id', viewerId)
      .maybeSingle();
    isFavorite = Boolean(fav);
  }

  const coverPath = photos.find((p) => p.is_cover)?.storage_path ?? photos[0]?.storage_path ?? null;

  return {
    id: data.id,
    ownerId: data.owner_id,
    title: data.title,
    description: data.description,
    priceCents: data.price_cents,
    depositCents: data.deposit_cents,
    type: data.type,
    areaLabel: data.area_label,
    availableFrom: data.available_from,
    minMonths: data.min_months,
    lat: data.lat,
    lng: data.lng,
    status: data.status,
    viewCount: data.view_count,
    hasOwnBath: data.has_own_bath,
    hasSharedBath: data.has_shared_bath,
    noSmoking: data.no_smoking,
    petsAllowed: data.pets_allowed,
    furnished: data.furnished,
    utilitiesIncluded: data.utilities_included,
    hasParking: data.has_parking,
    hasLaundry: data.has_laundry,
    coverPhotoUrl: coverPath ? (signed.get(coverPath) ?? null) : null,
    isFavorite,
    isOwner: viewerId !== null && data.owner_id === viewerId,
    photos: photos.map((p) => ({
      id: p.id,
      storagePath: p.storage_path,
      sortOrder: p.sort_order,
      isCover: p.is_cover,
      signedUrl: signed.get(p.storage_path) ?? null,
    })),
  };
}
