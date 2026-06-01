import { TIMINGS, getTiming } from './timings';

describe('TIMINGS', () => {
  it('exposes presence heartbeat at 60 s', () => {
    expect(TIMINGS.presenceHeartbeatMs).toBe(60_000);
  });

  it('has a typing TTL of exactly 3 s (no per-screen drift, per retro §3)', () => {
    expect(TIMINGS.typingTtlMs).toBe(3_000);
  });

  it('returns positive integers for every key', () => {
    for (const value of Object.values(TIMINGS)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('getTiming', () => {
  it('returns the value for a known key', () => {
    expect(getTiming('signedUrlTtlSeconds')).toBe(TIMINGS.signedUrlTtlSeconds);
  });

  it('round-trips through every key', () => {
    for (const key of Object.keys(TIMINGS) as (keyof typeof TIMINGS)[]) {
      expect(getTiming(key)).toBe(TIMINGS[key]);
    }
  });
});
