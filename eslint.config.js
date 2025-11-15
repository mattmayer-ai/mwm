import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const tsFiles = ['**/*.ts', '**/*.tsx'];
const relaxedRules = {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  'prefer-const': 'off',
  'react-hooks/exhaustive-deps': 'off',
  'react-refresh/only-export-components': 'off',
};

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      'functions/lib',
      '.firebase',
      'eslint.config.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      ...relaxedRules,
    },
  },
  {
    files: ['functions/**/*.ts', 'functions/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./functions/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: relaxedRules,
  },
  {
    files: ['scripts/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: relaxedRules,
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: relaxedRules,
  },
];

