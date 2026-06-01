/**
 * Roomly design tokens.
 *
 * Single source of truth for colors, spacing, radii, and fonts. Consumed by
 * the mobile NativeWind config and the admin Tailwind config so the two apps
 * share an identical palette.
 *
 * Update tokens here, then run `pnpm dev` in either app to see the change.
 */

export const COLORS = {
  accent: {
    50: '#E6F4F1',
    100: '#C2E5DE',
    500: '#0E8A7D',
    700: '#0A6359',
    900: '#073E37',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F7F8F8',
    100: '#ECEEEF',
    300: '#C7CBCE',
    500: '#7C8388',
    700: '#3F4448',
    900: '#0F1112',
  },
  semantic: {
    success: '#1E9F5B',
    warning: '#D9923B',
    danger: '#D34A4A',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const FONT_SIZES = {
  caption: 12,
  body: 14,
  bodyLg: 16,
  title: 20,
  heading: 24,
  display: 32,
} as const;

export type ColorToken = keyof typeof COLORS;
export type SpacingToken = keyof typeof SPACING;
export type RadiusToken = keyof typeof RADII;
export type FontSizeToken = keyof typeof FONT_SIZES;
