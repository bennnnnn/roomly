import { supabase } from '../../../lib/supabaseClient';

import type { ListingStatus } from '@roomly/db-types';

export interface OwnerListingRow {
  id: string;
  title: string;
  price_cents: number;
  status: ListingStatus;
  area_label: string;
  created_at: string;
  view_count: number;
  expires_at: string | null;
}

export async function fetchOwnerListings(): Promise<OwnerListingRow[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price_cents, status, area_label, created_at, view_count, expires_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateOwnerListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', listingId);

  if (error) throw error;
}

export async function deleteOwnerListing(listingId: string): Promise<void> {
  const { error } = await supabase.from('listings').delete().eq('id', listingId);
  if (error) throw error;
}
