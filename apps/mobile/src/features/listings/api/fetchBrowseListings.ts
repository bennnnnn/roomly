import { formatUsdFromCents } from '@roomly/lib';

import { supabase } from '../../../lib/supabaseClient';

import { signListingPhotoPaths } from './photoUrls';

import type { BrowseListingItem, ListingFilters } from '../types';
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

export interface BrowseQueryParams {
  filters: ListingFilters;
  favoriteIds?: Set<string> | undefined;
  pageSize?: number;
  cursor?: string | undefined;
}

export interface BrowseResult {
  items: BrowseListingItem[];
  nextCursor: string | null;
}

/**
 * Fetches active listings with optional filters, sorts, and pagination.
 * When `favoriteIds` is provided, each item's `isFavorite` flag is populated.
 */
export async function fetchBrowseListings(params: BrowseQueryParams): Promise<BrowseResult> {
  const { filters, favoriteIds, pageSize = 24, cursor } = params;

  let query = supabase
    .from('listings')
    .select(
      `id, title, price_cents, type, area_label, available_from,
       has_own_bath, has_shared_bath, pets_allowed, furnished,
       listing_photos (storage_path, is_cover, sort_order)`,
      { count: 'exact' },
    )
    .eq('status', 'active')
    .limit(pageSize + 1); // fetch one extra to detect if there's a next page

  // Property type filter
  if (filters.types.length > 0) {
    query = query.in('type', filters.types);
  }

  // Price range
  if (filters.priceMin !== null) {
    query = query.gte('price_cents', filters.priceMin);
  }
  if (filters.priceMax !== null) {
    query = query.lte('price_cents', filters.priceMax);
  }

  // Bath filter
  if (filters.bath === 'own') {
    query = query.eq('has_own_bath', true);
  } else if (filters.bath === 'shared') {
    query = query.eq('has_shared_bath', true);
  }

  // Furnished
  if (filters.furnished !== null) {
    query = query.eq('furnished', filters.furnished);
  }

  // Pets
  if (filters.pets !== null) {
    query = query.eq('pets_allowed', filters.pets);
  }

  // Availability
  if (filters.availableAfter) {
    query = query.gte('available_from', filters.availableAfter);
  }

  // Cursor pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Sort
  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price_cents', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_cents', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) throw error;
  const rows = (data ?? []) as ListingRow[];

  const hasNextPage = rows.length > pageSize;
  const pageRows = hasNextPage ? rows.slice(0, pageSize) : rows;
  const nextCursor = hasNextPage ? (pageRows[pageRows.length - 1]?.id ?? null) : null;

  const coverPaths = pageRows
    .map((row) => pickCoverPath(row.listing_photos))
    .filter(Boolean) as string[];
  const signed = await signListingPhotoPaths(coverPaths);

  const items: BrowseListingItem[] = pageRows.map((row) => {
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
      isFavorite: favoriteIds?.has(row.id) ?? false,
    };
  });

  return { items, nextCursor };
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
