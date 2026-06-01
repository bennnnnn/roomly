/** @type {import("lint-staged").Configuration} */
export default {
  '*.{ts,tsx}': ['eslint --max-warnings 0 --fix', 'prettier --write'],
  '*.{js,mjs,cjs,json,md,yml,yaml}': ['prettier --write'],
};
