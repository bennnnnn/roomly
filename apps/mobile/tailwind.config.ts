import nativewindPreset from 'nativewind/preset';

import { tailwindTheme } from '@roomly/ui-tokens/tailwind';

import type { Config } from 'tailwindcss';

const config: Config = {
  // NativeWind walks these globs at build time and inlines any class it sees.
  // Keep this in sync with the Expo Router app/ and any source directories.
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [nativewindPreset],
  theme: tailwindTheme,
  darkMode: 'class',
  plugins: [],
};

export default config;
