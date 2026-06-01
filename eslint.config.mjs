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

  // === Type-aware TS rules — only for .ts/.tsx in workspace src/ ===
  {
    files: ['**/src/**/*.{ts,tsx}'],
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
    },
  },

  // === Config files (.js / .mjs / .cjs): no typed linting ===
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { projectService: false },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // === Prettier: must be last; disables stylistic rules that fight the formatter ===
  prettier,
);
