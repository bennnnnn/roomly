import { TIMINGS } from '@roomly/lib';

import { supabase } from '../../../lib/supabaseClient';

/** Batch-sign storage paths for display (private bucket). */
export async function signListingPhotoPaths(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;

  const { data, error } = await supabase.storage
    .from('listing-photos')
    .createSignedUrls(paths, TIMINGS.signedUrlTtlSeconds);

  if (error || !data) return out;

  for (const row of data) {
    if (row.path && row.signedUrl) {
      out.set(row.path, row.signedUrl);
    }
  }
  return out;
}
