// .eslintrc.cjs
// ESLint configuration for the Gashuna Hotel frontend.
//
// ESLint checks your TypeScript and React code for:
// - Type errors and bad practices
// - Incorrect use of React hooks
// - Code that would break React Fast Refresh (hot reload)
//
// This file uses .cjs extension because the client
// package.json has "type": "module" — ESLint config
// must be CommonJS format so it uses .cjs

module.exports = {
  // This is the root ESLint config — do not look further up
  root: true,

  // Define the environment — browser globals like window, document
  env: {
    browser: true,
    es2020: true,
    node: true,
  },

  // Extend recommended rule sets
  extends: [
    // ESLint built-in recommended rules
    'eslint:recommended',

    // TypeScript-specific recommended rules
    'plugin:@typescript-eslint/recommended',

    // React hooks rules — enforces rules of hooks
    'plugin:react-hooks/recommended',
  ],

  // Tell ESLint to ignore these files
  ignorePatterns: [
    'dist',
    'build',
    '.eslintrc.cjs',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
  ],

  // Use TypeScript parser so ESLint understands TypeScript
  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  // Plugins used
  plugins: [
    'react-refresh',
  ],

  // Custom rules
  rules: {
    // Allow components and hooks to be exported together
    // Required for React Fast Refresh to work correctly
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // Warn on unused variables but allow _ prefixed ones
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // Allow explicit any in some cases during development
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow non-null assertions with !
    '@typescript-eslint/no-non-null-assertion': 'off',

    // Allow empty functions
    '@typescript-eslint/no-empty-function': 'off',

    // Warn on console.log — use console.error for real errors
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // Enforce consistent return
    'consistent-return': 'off',

    // Allow prefer const
    'prefer-const': 'error',

    // No var — use let or const
    'no-var': 'error',
  },
};
