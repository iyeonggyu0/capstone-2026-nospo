// eslint.config.js
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { createNodeResolver, importX } from 'eslint-plugin-import-x'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

const SRC = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'import-x': importX,
    },
    settings: {
      'import-x/resolver-next': [
        createNodeResolver({
          extensions: ['.js', '.jsx', '.json'],
          alias: {
            '@': [SRC],
          },
        }),
      ],
    },
    rules: {
      'import-x/no-unresolved': 'error',
    },
  },

  {
    files: ['src/routes/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  prettier,
])
