import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      },
      globals: {
        window: true,
        document: true,
        localStorage: true,
        sessionStorage: true,
        Storage: true,
        console: true,
        setTimeout: true,
        clearTimeout: true,
        fetch: true
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
      'warn', 
      { 
        vars: 'all', 
        args: 'after-used', 
        varsIgnorePattern: '^_', 
        argsIgnorePattern: '^_', 
        ignoreRestSiblings: true,
        caughtErrorsIgnorePattern: '^_'
      }],
      'react/prop-types': 'off'
    },
    settings: {
      react: { version: 'detect' }
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        jest: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        setTimeout: true,
        clearTimeout: true,
        window: true,
        document: true,
        Storage: true
      }
    },
    rules: {}
  },
  prettier
];
