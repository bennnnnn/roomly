import { formatUsdFromCents } from '@roomly/lib';

import { supabase } from '../../../lib/supabaseClient';

import { signListingPhotoPaths } from './photoUrls';

import type { BrowseListingItem } from '../types';
import type { ListingType } from '@roomly/lib';

interface ListingRow {
  id: string;
  title: string;
  price_cents: number;
  type: ListingType;
  area_label: string;
  available_from: string;
  has_own_bath: boolean;
  has_shared_bath: boolean;
  pets_allowed: boolean;
  furnished: boolean;
  listing_photos: { storage_path: string; is_cover: boolean; sort_order: number }[];
}

export async function fetchBrowseListings(): Promise<BrowseListingItem[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `id, title, price_cents, type, area_label, available_from,
       has_own_bath, has_shared_bath, pets_allowed, furnished,
       listing_photos (storage_path, is_cover, sort_order)`,
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) throw error;
  const rows = (data ?? []) as ListingRow[];

  const coverPaths = rows
    .map((row) => pickCoverPath(row.listing_photos))
    .filter(Boolean) as string[];
  const signed = await signListingPhotoPaths(coverPaths);

  return rows.map((row) => {
    const coverPath = pickCoverPath(row.listing_photos);
    return {
      id: row.id,
      title: row.title,
      priceCents: row.price_cents,
      type: row.type,
      areaLabel: row.area_label,
      availableFrom: row.available_from,
      hasOwnBath: row.has_own_bath,
      hasSharedBath: row.has_shared_bath,
      petsAllowed: row.pets_allowed,
      furnished: row.furnished,
      coverPhotoUrl: coverPath ? (signed.get(coverPath) ?? null) : null,
    };
  });
}

export function formatListingPrice(cents: number): string {
  return `${formatUsdFromCents(cents)}/mo`;
}

function pickCoverPath(
  photos: { storage_path: string; is_cover: boolean; sort_order: number }[],
): string | null {
  if (photos.length === 0) return null;
  const cover = photos.find((p) => p.is_cover);
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
  return (cover ?? sorted[0])?.storage_path ?? null;
}
