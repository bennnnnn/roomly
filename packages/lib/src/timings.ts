/**
 * Single source of truth for every timeout, interval, and TTL used in Roomly.
 *
 * The prior codebase had two different typing-TTL values in two files (3000 ms
 * vs 3500 ms), which produced an inconsistency bug. Everything time-related
 * lives here so it can be reviewed and changed in one place.
 *
 * See ADR-0002 and `docs/lessons-from-prior-codebase.md` §3.
 */

export const TIMINGS = {
  presenceHeartbeatMs: 60_000,
  onlineRefreshMs: 30_000,
  typingTtlMs: 3_000,
  realtimeRefreshDebounceMs: 200,
  countRefreshDebounceMs: 240,
  inboxFocusRefetchMinIntervalMs: 5_000,
  signedUrlTtlSeconds: 3_600,
} as const;

export type TimingKey = keyof typeof TIMINGS;

/**
 * Returns the named timing value in milliseconds (or seconds for *Seconds keys).
 * Provided as a function so call-sites read consistently and so we can later
 * add per-environment overrides (e.g. test-time speedups) without changing
 * every call-site.
 */
export function getTiming(key: TimingKey): number {
  return TIMINGS[key];
}
