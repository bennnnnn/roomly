import { supabase } from '../../../lib/supabaseClient';

/** Returns the set of listing IDs favorited by the current user. */
export async function fetchFavoriteIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from('favorites').select('listing_id');

  if (error) throw error;

  return new Set((data ?? []).map((row: { listing_id: string }) => row.listing_id));
}

/** Adds or removes a favorite. Returns the new favorite state. */
export async function toggleFavorite(
  listingId: string,
  isCurrentlyFavorite: boolean,
): Promise<boolean> {
  if (isCurrentlyFavorite) {
    const { error } = await supabase.from('favorites').delete().eq('listing_id', listingId);

    if (error) throw error;
    return false;
  }

  // RLS-derived user_id; Supabase insert types require the field.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to save listings');

  const { error } = await supabase
    .from('favorites')
    .insert({ listing_id: listingId, user_id: user.id });

  if (error) throw error;
  return true;
}
