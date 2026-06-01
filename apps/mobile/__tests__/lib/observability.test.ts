/**
 * Verifies the adapter-selection logic in observability.ts.
 *
 * The function reads `env` at call time (not at module load), so to test
 * each branch we mock the env module's getter via jest.resetModules + re-import.
 */

const realEnv = process.env;

afterEach(() => {
  process.env = realEnv;
  jest.resetModules();
});

import type * as ObservabilityModule from '../../src/lib/observability';

function loadObservabilityWith(envOverrides: Record<string, string>): typeof ObservabilityModule {
  jest.resetModules();
  process.env = { ...realEnv, ...envOverrides };
  return require('../../src/lib/observability') as typeof ObservabilityModule;
}

describe('getEnabledAdapters', () => {
  it('returns the console adapter in dev with no DSNs set', () => {
    const { getEnabledAdapters } = loadObservabilityWith({});
    const adapters = getEnabledAdapters();
    // Exactly 1 adapter (console-only) because __DEV__ is true under jest.
    expect(adapters).toHaveLength(1);
  });

  it('adds the Sentry stub adapter when EXPO_PUBLIC_SENTRY_DSN is set', () => {
    const { getEnabledAdapters } = loadObservabilityWith({
      EXPO_PUBLIC_SENTRY_DSN: 'https://x@sentry.io/1',
    });
    expect(getEnabledAdapters()).toHaveLength(2);
  });

  it('adds the PostHog stub adapter when EXPO_PUBLIC_POSTHOG_API_KEY is set', () => {
    const { getEnabledAdapters } = loadObservabilityWith({
      EXPO_PUBLIC_POSTHOG_API_KEY: 'phc_xxx',
    });
    expect(getEnabledAdapters()).toHaveLength(2);
  });

  it('adds both when both DSNs are set', () => {
    const { getEnabledAdapters } = loadObservabilityWith({
      EXPO_PUBLIC_SENTRY_DSN: 'https://x@sentry.io/1',
      EXPO_PUBLIC_POSTHOG_API_KEY: 'phc_xxx',
    });
    expect(getEnabledAdapters()).toHaveLength(3);
  });

  it('treats empty-string env vars as absent', () => {
    const { getEnabledAdapters } = loadObservabilityWith({
      EXPO_PUBLIC_SENTRY_DSN: '',
      EXPO_PUBLIC_POSTHOG_API_KEY: '',
    });
    expect(getEnabledAdapters()).toHaveLength(1);
  });
});
