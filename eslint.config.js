/** @type {import('eslint').Linter.FlatConfig} */
module.exports = [
    {
      languageOptions: {
        globals: {
          browser: true,
          es2021: true,
          commonjs: true,
          mocha: true,
        },
        parser: '@typescript-eslint/parser', // Use TypeScript parser
        parserOptions: {
          ecmaVersion: 12,
          sourceType: 'module', // Allows ES Modules
          project: ['./tsconfig.json', './tsconfig.test.json'], // TypeScript project configuration
        },
      },
      extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended', // TypeScript support
        'plugin:prettier/recommended', // Ensure compatibility with Prettier
      ],
      plugins: [
        '@typescript-eslint', // TypeScript linting plugin
      ],
      rules: {
        'no-bitwise': 'off', // Disable no-bitwise rule
        '@typescript-eslint/no-unused-vars': 'error', // Error on unused vars
        'import/extensions': 'off', // Allow omitting file extensions
        'import/no-unresolved': 'off', // Don't check unresolved imports
        'no-console': 'warn', // Warn on console statements
        'no-shadow': 'off', // Disable shadowed variable checks
        '@typescript-eslint/no-shadow': ['error'], // Use TS rule for shadowing
        'prettier/prettier': 'error', // Prettier rules as ESLint errors
        'no-restricted-syntax': 'off',
      },
    },
  ];
  