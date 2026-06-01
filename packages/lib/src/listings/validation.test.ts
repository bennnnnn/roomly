import {
  dollarsToCents,
  formatUsdFromCents,
  isAvailableFromValid,
  validateListingStep,
} from './validation';

describe('isAvailableFromValid', () => {
  it('accepts today and future dates', () => {
    const now = new Date('2026-06-01T12:00:00Z');
    expect(isAvailableFromValid('2026-06-01', now)).toBe(true);
    expect(isAvailableFromValid('2026-07-01', now)).toBe(true);
  });

  it('rejects past dates', () => {
    const now = new Date('2026-06-01T12:00:00Z');
    expect(isAvailableFromValid('2026-05-31', now)).toBe(false);
  });

  it('rejects unparseable dates', () => {
    expect(isAvailableFromValid('not-a-date')).toBe(false);
  });
});

describe('validateListingStep', () => {
  const now = new Date('2026-06-01T12:00:00Z');

  it('requires property type on step 1', () => {
    expect(validateListingStep(1, {}, now)).toEqual([
      { field: 'type', message: 'Choose a property type.' },
    ]);
    expect(validateListingStep(1, { type: 'single_bedroom' })).toEqual([]);
  });

  it('requires at least one photo on step 2', () => {
    expect(validateListingStep(2, { photoCount: 0 }, now)).toEqual([
      { field: 'photos', message: 'Add at least one photo.' },
    ]);
  });

  it('rejects more than eight photos on step 2', () => {
    expect(validateListingStep(2, { photoCount: 9 }, now)[0]?.field).toBe('photos');
  });

  it('requires location fields on step 3', () => {
    const issues = validateListingStep(3, {}, now);
    expect(issues.map((i) => i.field)).toEqual(
      expect.arrayContaining(['areaLabel', 'addressLine', 'lat', 'lng']),
    );
  });

  it('validates price and availability on step 4', () => {
    const issues = validateListingStep(
      4,
      { priceCents: 0, availableFrom: '2026-05-01', minMonths: 0 },
      now,
    );
    expect(issues.map((i) => i.field)).toEqual(
      expect.arrayContaining(['priceCents', 'availableFrom', 'minMonths']),
    );
  });

  it('rejects excessive rent and invalid deposit on step 4', () => {
    const issues = validateListingStep(
      4,
      {
        priceCents: 6_000_000,
        depositCents: -1,
        availableFrom: '2026-07-01',
        minMonths: 2,
      },
      now,
    );
    expect(issues.map((i) => i.field)).toEqual(
      expect.arrayContaining(['priceCents', 'depositCents']),
    );
  });

  it('validates title and description on step 6', () => {
    expect(validateListingStep(6, { title: '', description: 'short' }, now).length).toBeGreaterThan(
      0,
    );
    expect(
      validateListingStep(6, { title: '   ', description: 'A long enough description.' }, now),
    ).toEqual([{ field: 'title', message: 'Title is required (max 60 characters).' }]);
    expect(validateListingStep(6, { title: 'Valid title', description: undefined }, now)).toEqual([
      {
        field: 'description',
        message: 'Description must be at least 20 characters.',
      },
    ]);
    expect(validateListingStep(6, { description: 'A long enough description here.' }, now)).toEqual(
      [{ field: 'title', message: 'Title is required (max 60 characters).' }],
    );
  });

  it('rejects an overlong title on step 6', () => {
    const issues = validateListingStep(
      6,
      { title: 'x'.repeat(61), description: 'x'.repeat(20) },
      now,
    );
    expect(issues.some((i) => i.field === 'title')).toBe(true);
  });
});

describe('dollarsToCents', () => {
  it('rounds to integer cents', () => {
    expect(dollarsToCents(9.99)).toBe(999);
    expect(formatUsdFromCents(999)).toBe('$9.99');
  });

  it('returns zero for non-finite input', () => {
    expect(dollarsToCents(Number.NaN)).toBe(0);
  });
});

describe('validateListingStep happy paths', () => {
  const now = new Date('2026-06-01T12:00:00Z');
  const valid = {
    type: 'single_bedroom' as const,
    photoCount: 2,
    areaLabel: 'Downtown',
    addressLine: '1 Main St',
    lat: 40,
    lng: -74,
    priceCents: 150000,
    depositCents: null,
    availableFrom: '2026-07-01',
    minMonths: 3,
    title: 'Nice room',
    description: 'A comfortable room with natural light and desk space.',
  };

  it('returns no issues when step fields are valid', () => {
    expect(validateListingStep(1, valid, now)).toEqual([]);
    expect(validateListingStep(2, valid, now)).toEqual([]);
    expect(validateListingStep(2, { photoCount: undefined }, now)).toEqual([
      { field: 'photos', message: 'Add at least one photo.' },
    ]);
    expect(validateListingStep(3, valid, now)).toEqual([]);
    expect(validateListingStep(4, valid, now)).toEqual([]);
    expect(validateListingStep(5, valid, now)).toEqual([]);
    expect(validateListingStep(6, valid, now)).toEqual([]);
    expect(
      validateListingStep(6, { title: 'A', description: 'A valid description here.' }, now),
    ).toEqual([]);
  });

  it('flags out-of-range coordinates', () => {
    expect(validateListingStep(3, { ...valid, lat: 95 }, now).some((i) => i.field === 'lat')).toBe(
      true,
    );
    expect(validateListingStep(3, { ...valid, lng: 200 }, now).some((i) => i.field === 'lng')).toBe(
      true,
    );
  });
});
