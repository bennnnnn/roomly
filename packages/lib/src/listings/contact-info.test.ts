import { detectContactInfo, hasContactInfo, maskContactInfo } from './contact-info';

describe('detectContactInfo', () => {
  it('flags email addresses', () => {
    expect(hasContactInfo('Email me at host@example.com please')).toBe(true);
  });

  it('flags phone-like sequences', () => {
    expect(hasContactInfo('Call 555-123-4567')).toBe(true);
    expect(detectContactInfo('5551234567')[0]?.kind).toBe('phone');
  });

  it('flags URLs', () => {
    expect(hasContactInfo('See https://example.com/listing')).toBe(true);
  });

  it('returns empty for clean copy', () => {
    expect(detectContactInfo('Bright room near campus, utilities included.')).toEqual([]);
  });

  it('flags social handles', () => {
    expect(hasContactInfo('DM me @hostname')).toBe(true);
  });

  it('masks detected contact info', () => {
    expect(maskContactInfo('Email host@example.com')).toBe('Email [contact info removed]');
  });

  it('classifies match kinds', () => {
    const email = detectContactInfo('host@example.com');
    expect(email[0]?.kind).toBe('email');
    const url = detectContactInfo('see www.example.com');
    expect(url.some((m) => m.kind === 'url')).toBe(true);
    const handle = detectContactInfo('reach @hosthandle');
    expect(handle.some((m) => m.kind === 'handle')).toBe(true);
  });
});
