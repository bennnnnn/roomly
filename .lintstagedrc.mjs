/** @type {import("lint-staged").Configuration} */
export default {
  // --no-warn-ignored silences "File ignored because no matching configuration"
  // for files like app.config.ts that ESLint intentionally skips.
  '*.{ts,tsx}': ['eslint --max-warnings 0 --no-warn-ignored --fix', 'prettier --write'],
  '*.{js,mjs,cjs,json,md,yml,yaml}': ['prettier --write'],
};
