/**
 * Pure validation for listing wizard fields (Slice 2).
 * Server-side validation lands in Edge Functions / CHECK constraints; this
 * mirrors rules for fast client feedback.
 */

export const LISTING_TITLE_MAX = 60;
export const LISTING_DESCRIPTION_MIN = 20;
export const LISTING_PRICE_MAX_CENTS = 5_000_000;
export const LISTING_PHOTO_MAX = 8;

export type ListingType =
  | 'single_bedroom'
  | 'shared_bedroom'
  | 'basement'
  | 'full_unit'
  | 'extra_house';

export const LISTING_TYPES: readonly ListingType[] = [
  'single_bedroom',
  'shared_bedroom',
  'basement',
  'full_unit',
  'extra_house',
] as const;

export interface ListingDraftFields {
  type?: ListingType | undefined;
  title?: string | undefined;
  description?: string | undefined;
  priceCents?: number | undefined;
  depositCents?: number | null | undefined;
  availableFrom?: string | undefined;
  minMonths?: number | undefined;
  areaLabel?: string | undefined;
  addressLine?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
  photoCount?: number | undefined;
}

export interface ValidationIssue {
  field: keyof ListingDraftFields | 'photos';
  message: string;
}

function parseIsoDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** True when `date` is today (UTC) or later. */
export function isAvailableFromValid(dateIso: string, now: Date = new Date()): boolean {
  const parsed = parseIsoDate(dateIso);
  if (!parsed) return false;
  return startOfUtcDay(parsed).getTime() >= startOfUtcDay(now).getTime();
}

export function validateListingStep(
  step: 1 | 2 | 3 | 4 | 5 | 6,
  fields: ListingDraftFields,
  now: Date = new Date(),
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (step === 1) {
    if (!fields.type || !LISTING_TYPES.includes(fields.type)) {
      issues.push({ field: 'type', message: 'Choose a property type.' });
    }
  }

  if (step === 2) {
    const count = fields.photoCount ?? 0;
    if (count < 1) {
      issues.push({ field: 'photos', message: 'Add at least one photo.' });
    }
    if (count > LISTING_PHOTO_MAX) {
      issues.push({ field: 'photos', message: `Maximum ${String(LISTING_PHOTO_MAX)} photos.` });
    }
  }

  if (step === 3) {
    const label = fields.areaLabel?.trim() ?? '';
    if (label.length < 1) {
      issues.push({ field: 'areaLabel', message: 'Area label is required.' });
    }
    const addr = fields.addressLine?.trim() ?? '';
    if (addr.length < 1) {
      issues.push({ field: 'addressLine', message: 'Address is required (kept private).' });
    }
    if (fields.lat === undefined || fields.lat < -90 || fields.lat > 90) {
      issues.push({ field: 'lat', message: 'Latitude is required.' });
    }
    if (fields.lng === undefined || fields.lng < -180 || fields.lng > 180) {
      issues.push({ field: 'lng', message: 'Longitude is required.' });
    }
  }

  if (step === 4) {
    const price = fields.priceCents;
    if (price === undefined || !Number.isInteger(price) || price <= 0) {
      issues.push({ field: 'priceCents', message: 'Enter a valid monthly rent.' });
    } else if (price > LISTING_PRICE_MAX_CENTS) {
      issues.push({ field: 'priceCents', message: 'Rent exceeds the allowed maximum.' });
    }
    const deposit = fields.depositCents;
    if (deposit != null && (!Number.isInteger(deposit) || deposit < 0)) {
      issues.push({ field: 'depositCents', message: 'Deposit must be zero or a positive amount.' });
    }
    if (!fields.availableFrom || !isAvailableFromValid(fields.availableFrom, now)) {
      issues.push({
        field: 'availableFrom',
        message: 'Available-from must be today or later.',
      });
    }
    const months = fields.minMonths;
    if (months === undefined || months < 1 || months > 12) {
      issues.push({ field: 'minMonths', message: 'Minimum stay is 1–12 months.' });
    }
  }

  if (step === 6) {
    const title = fields.title?.trim() ?? '';
    if (title.length < 1 || title.length > LISTING_TITLE_MAX) {
      issues.push({
        field: 'title',
        message: `Title is required (max ${String(LISTING_TITLE_MAX)} characters).`,
      });
    }
    const desc = fields.description?.trim() ?? '';
    if (desc.length < LISTING_DESCRIPTION_MIN) {
      issues.push({
        field: 'description',
        message: `Description must be at least ${String(LISTING_DESCRIPTION_MIN)} characters.`,
      });
    }
  }

  return issues;
}

/** Dollars from user input → integer cents (rounded). */
export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

/** Format cents as USD for display (no Intl dependency for test stability). */
export function formatUsdFromCents(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}
