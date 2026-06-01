import { supabase } from '../../../lib/supabaseClient';
import { signListingPhotoPaths } from '../../listings/api/photoUrls';

export interface PublicProfile {
  id: string;
  displayName: string;
  accountType: 'individual' | 'company';
  companyName: string | null;
  isVerified: boolean;
  memberSince: string;
  listings: {
    id: string;
    title: string;
    priceCents: number;
    areaLabel: string;
    coverPhotoUrl: string | null;
  }[];
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, account_type, company_name, is_verified, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error('Profile not found');

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select(
      `id, title, price_cents, area_label,
       listing_photos (storage_path, is_cover, sort_order)`,
    )
    .eq('owner_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (listingsError) throw listingsError;

  const rows = listings ?? [];
  const allPaths = rows.flatMap((row) => (row.listing_photos ?? []).map((p) => p.storage_path));
  const signed = await signListingPhotoPaths(allPaths);

  const listingItems = rows.map((row) => {
    const photos = [...(row.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const coverPath =
      photos.find((p) => p.is_cover)?.storage_path ?? photos[0]?.storage_path ?? null;

    return {
      id: row.id,
      title: row.title,
      priceCents: row.price_cents,
      areaLabel: row.area_label,
      coverPhotoUrl: coverPath ? (signed.get(coverPath) ?? null) : null,
    };
  });

  return {
    id: profile.id,
    displayName: profile.display_name,
    accountType: profile.account_type,
    companyName: profile.company_name,
    isVerified: profile.is_verified,
    memberSince: profile.created_at,
    listings: listingItems,
  };
}
