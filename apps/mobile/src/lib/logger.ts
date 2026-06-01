import { consoleAdapter, createLogger, type LogAdapter } from '@roomly/lib';

/**
 * App-wide logger instance.
 *
 * Slice 1C: no real transports yet. We use the console adapter in dev (so
 * info/warn/error show up in Metro) and a no-op in production (no PII leak
 * to the device log).
 *
 * Slice 1D will plug in Sentry (warn/error) and PostHog (info/debug events).
 * Adapters are pure data — adding one is a one-line change here, never a
 * sweep of every screen.
 */

const isDev = __DEV__;

const adapters: LogAdapter[] = isDev ? [consoleAdapter] : [];

export const logger = createLogger({
  adapters,
  minLevel: isDev ? 'debug' : 'info',
});
