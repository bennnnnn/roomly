/**
 * Tailwind-shaped projection of the Roomly design tokens.
 *
 * The mobile (NativeWind) and admin (Tailwind v3) configs both consume this
 * file so the two apps cannot drift apart on colors, spacing, radii, or
 * type scale. Token numbers (px) are converted to Tailwind's string + unit
 * form here so the rest of the system stays unitless.
 */

import { COLORS, FONT_SIZES, RADII, SPACING } from './index';

type PxRecord<T extends Record<string, number>> = { [K in keyof T]: string };

function pxify<T extends Record<string, number>>(record: T): PxRecord<T> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = `${value}px`;
  }
  return out as PxRecord<T>;
}

function pxifyFontSizes<T extends Record<string, number>>(
  record: T,
): { [K in keyof T]: [string, { lineHeight: string }] } {
  const out: Record<string, [string, { lineHeight: string }]> = {};
  for (const [key, value] of Object.entries(record)) {
    // 1.4x base line height — readable for the body text scale and tight for headings.
    out[key] = [`${value}px`, { lineHeight: `${Math.round(value * 1.4)}px` }];
  }
  return out as { [K in keyof T]: [string, { lineHeight: string }] };
}

export const tailwindTheme = {
  extend: {
    colors: COLORS,
    spacing: pxify(SPACING),
    borderRadius: pxify(RADII),
    fontSize: pxifyFontSizes(FONT_SIZES),
  },
} as const;
