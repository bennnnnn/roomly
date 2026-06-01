import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '../../../lib/supabaseClient';

export interface UploadedListingPhoto {
  id: string;
  storagePath: string;
  sortOrder: number;
}

/**
 * Compress (≤1080px, q=0.8 per PRD) and upload to the private listing-photos bucket.
 */
export async function uploadListingPhoto(
  ownerId: string,
  listingId: string,
  localUri: string,
  sortOrder: number,
  isCover: boolean,
): Promise<UploadedListingPhoto> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1080 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  const photoId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  const storagePath = `${ownerId}/${listingId}/${photoId}.jpg`;

  const response = await fetch(manipulated.uri);
  const bytes = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('listing-photos')
    .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: false });

  if (uploadError) throw uploadError;

  const { data, error: rowError } = await supabase
    .from('listing_photos')
    .insert({
      listing_id: listingId,
      storage_path: storagePath,
      sort_order: sortOrder,
      is_cover: isCover,
    })
    .select('id')
    .single();

  if (rowError) throw rowError;

  return { id: data.id, storagePath, sortOrder };
}
