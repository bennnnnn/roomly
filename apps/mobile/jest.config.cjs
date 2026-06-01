// CJS on purpose: jest-expo loads this via CommonJS.
//
// RNTL's matcher registration (`toBeOnTheScreen`, etc.) is wired by
// importing `@testing-library/react-native` in any test file — the
// package's main entry does `import './matchers/extend-expect'` as a
// side effect, and the type augmentation rides along via .d.ts. So no
// setupFilesAfterEach is required for the simple case.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // setupFiles runs BEFORE the test framework — needed so env stubs are in
  // place before apps/mobile/src/lib/env.ts is module-evaluated by any
  // import chain.
  setupFiles: ['<rootDir>/jest.setup-env.ts'],
  // jest-expo's transformIgnorePatterns already knows about pnpm's `.pnpm/`
  // layout and the RN / Expo families, so we keep its defaults intact and
  // only add what's specific to Roomly.
  //
  // Workspace packages (@roomly/*) live OUTSIDE node_modules so they're
  // transformed by babel-jest automatically — the moduleNameMapper below
  // just points the bare imports at the source files.
  moduleNameMapper: {
    '^@roomly/lib$': '<rootDir>/../../packages/lib/src/index.ts',
    '^@roomly/lib/(.*)$': '<rootDir>/../../packages/lib/src/$1',
    '^@roomly/ui-tokens$': '<rootDir>/../../packages/ui-tokens/src/index.ts',
    '^@roomly/ui-tokens/(.*)$': '<rootDir>/../../packages/ui-tokens/src/$1',
    '^@roomly/db-types$': '<rootDir>/../../packages/db-types/src/index.ts',
  },
};
