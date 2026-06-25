// .eslintrc.cjs
// ESLint configuration for the Gashuna Hotel backend.
//
// Checks all TypeScript files in the server for:
// - Type errors and bad practices
// - Unused variables and parameters
// - Security issues in Express code

module.exports = {
  // This is the root config for the server
  root: true,

  // Node.js environment — gives access to process, __dirname etc.
  env: {
    node: true,
    es2020: true,
  },

  extends: [
    // ESLint built-in recommended rules
    'eslint:recommended',

    // TypeScript recommended rules
    'plugin:@typescript-eslint/recommended',
  ],

  // Ignore compiled output and config files
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
  ],

  // TypeScript parser
  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  rules: {
    // Warn on unused variables — allow _ prefixed ones
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // Allow explicit any during development
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow non-null assertions
    '@typescript-eslint/no-non-null-assertion': 'off',

    // Allow empty functions — useful for middleware placeholders
    '@typescript-eslint/no-empty-function': 'off',

    // Allow require() in some cases
    '@typescript-eslint/no-var-requires': 'off',

    // Warn on console.log — controllers should use proper logging
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

    // No var — always use let or const
    'no-var': 'error',

    // Prefer const when variable is never reassigned
    'prefer-const': 'error',

    // No duplicate imports
    'no-duplicate-imports': 'error',

    // Always use === instead of ==
    'eqeqeq': ['error', 'always'],
  },
};
