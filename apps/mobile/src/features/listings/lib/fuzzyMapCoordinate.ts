/** Slight offset so map pins are approximate, not exact (PRD §2.4). */
export function fuzzyMapCoordinate(
  listingId: string,
  lat: number,
  lng: number,
): { latitude: number; longitude: number } {
  const hash = listingId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const delta = 0.008;
  return {
    latitude: lat + ((hash % 100) / 100 - 0.5) * delta,
    longitude: lng + (((hash >> 4) % 100) / 100 - 0.5) * delta,
  };
}
