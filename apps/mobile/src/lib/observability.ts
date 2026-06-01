import { consoleAdapter, type LogAdapter } from '@roomly/lib';

import { env } from './env';

/**
 * Resolves the set of log adapters this build should use.
 *
 * Decision matrix (mirrors ADR-0009 §4):
 *   - DEV (__DEV__): always include the console adapter so Metro shows logs.
 *   - SENTRY_DSN set: include the Sentry adapter (warn + error).
 *   - POSTHOG_API_KEY set: include the PostHog adapter (info + debug as events).
 *
 * In Slice 1D the Sentry/PostHog SDKs are NOT installed — adding them now
 * would bloat the bundle by ~15 native deps with no DSN to send to. The
 * factories below return adapter shells that route to the console adapter
 * when DSN is present (i.e. "Sentry would have captured: ..."). They are
 * swapped for the real SDK adapters in Slice 7 hardening; the consumers in
 * `logger.ts` do not change.
 *
 * The seam, not the SDK, is what we lock in here. Apps never import
 * Sentry/PostHog directly — only through this file.
 */
export function getEnabledAdapters(): LogAdapter[] {
  const isDev = __DEV__;
  const out: LogAdapter[] = [];

  if (isDev) {
    out.push(consoleAdapter);
  }

  if (env.EXPO_PUBLIC_SENTRY_DSN) {
    out.push(makeSentryStubAdapter());
  }

  if (env.EXPO_PUBLIC_POSTHOG_API_KEY) {
    out.push(makePostHogStubAdapter());
  }

  return out;
}

/**
 * Sentry-shaped stub. Routes warn+error to a tagged console emit so dev
 * surfaces the call site. Slice 7: replace with a thin wrapper around
 * `@sentry/react-native`'s `captureMessage` / `captureException`.
 */
function makeSentryStubAdapter(): LogAdapter {
  return {
    log(level, message, context) {
      if (level !== 'warn' && level !== 'error') return;
      consoleAdapter.log(level, `[sentry-stub] ${message}`, context);
    },
  };
}

/**
 * PostHog-shaped stub. Routes info+debug to a tagged console emit. Slice 7:
 * replace with a thin wrapper around `posthog-react-native`'s `capture`.
 */
function makePostHogStubAdapter(): LogAdapter {
  return {
    log(level, message, context) {
      if (level !== 'info' && level !== 'debug') return;
      consoleAdapter.log(level, `[posthog-stub] ${message}`, context);
    },
  };
}
