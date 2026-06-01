import { createLogger } from '@roomly/lib';

import { getEnabledAdapters } from './observability';

/**
 * App-wide logger instance.
 *
 * The adapter selection is one-shot at module load (see `observability.ts`).
 * Slice 7 swaps the stub adapters for real Sentry / PostHog wrappers; this
 * file does not change.
 */
export const logger = createLogger({
  adapters: getEnabledAdapters(),
  minLevel: __DEV__ ? 'debug' : 'info',
});
