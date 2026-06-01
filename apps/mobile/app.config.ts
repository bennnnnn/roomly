import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Roomly',
  slug: 'roomly',
  scheme: 'roomly',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  // New Architecture is on by default in SDK 56 — no explicit flag needed.
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: 'com.roomly.app',
    supportsTablet: false,
  },
  android: {
    package: 'com.roomly.app',
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
};

export default config;
