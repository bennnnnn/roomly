// @ts-check
//
// Roomly ESLint flat config.
// Single source of lint truth for the whole monorepo (AGENTS.md §0 rule 7).
//
// Versions verified 2026-05-31:
//   eslint                 10.4.1
//   @eslint/js             10.0.1
//   typescript-eslint      8.59.4
//   eslint-plugin-import-x 4.16.2
//   eslint-config-prettier 10.1.8

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // === Global ignores ===
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.turbo/**',
      'packages/db-types/src/generated/**',
    ],
  },

  // === JS baseline (applies to everything) ===
  js.configs.recommended,

  // === Type-aware TS rules — only for .ts/.tsx inside a workspace ===
  // The glob covers Expo Router's `app/` directory and the conventional `src/`
  // tree, plus colocated `__tests__/` folders. Root config files (.mjs/.cjs)
  // are intentionally excluded; they're handled by the override below.
  {
    files: ['{apps,packages}/**/*.{ts,tsx}'],
    ignores: ['**/*.config.{ts,mts}'],
    extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'import-x': importX },
    rules: {
      // === Hard caps (AGENTS.md §0 rule 8) ===
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }],

      // === Type safety ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // === Logging ===
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // === Import hygiene ===
      // Workspace packages (@roomly/*) live in the "internal" group so they
      // get a blank-line separator from third-party imports like react-native.
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [{ pattern: '@roomly/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-cycle': ['error', { maxDepth: 5 }],
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',

      // === General correctness ===
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-debugger': 'error',
      'no-throw-literal': 'error',

      // === Env-var safety (ADR-0009) ===
      // Raw `process.env.*` access is banned outside the per-app `env.ts`
      // files. All env reads must go through `defineEnv` so the visibility
      // check + boot-time validation runs. The allowlist below carves out
      // the env modules themselves.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Raw process.env access is banned (ADR-0009). Route every env read through @roomly/lib defineEnv and the per-app env.ts.',
        },
      ],
    },
  },

  // === Allowlist: the per-app env.ts files MAY touch process.env directly ===
  {
    files: ['apps/*/src/lib/env.ts', 'packages/lib/src/env.ts', 'apps/*/jest.setup-env.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // === Test files: same parser settings, looser caps ===
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // Tests legitimately manipulate process.env to drive env-dependent
      // code paths, and the jest.resetModules pattern needs require().
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // === Config files (.js / .mjs / .cjs): no typed linting, Node globals on ===
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
      parserOptions: { projectService: false },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // === Tell ESLint these specific configs are CommonJS, so `module` / `require` / `__dirname` are valid. ===
  {
    files: ['**/*.cjs', 'apps/mobile/babel.config.js', 'apps/mobile/metro.config.js'],
    languageOptions: { sourceType: 'commonjs' },
  },

  // === Prettier: must be last; disables stylistic rules that fight the formatter ===
  prettier,
);
