/**
 * Placeholder so the mobile package has at least one source file that
 * typechecks and lints cleanly. Real Expo Router routes land in Slice 1.
 */

import { TIMINGS } from '@roomly/lib';

export const MOBILE_BOOT_TIMESTAMP_MS = Date.now();

export function getPresenceHeartbeatMs(): number {
  return TIMINGS.presenceHeartbeatMs;
}
