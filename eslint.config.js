import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        WebSocket: 'readonly',
        HTMLElement: 'readonly',
        MSApp: 'readonly',
        queueMicrotask: 'readonly',
        reportError: 'readonly',
        IS_REACT_ACT_ENVIRONMENT: 'readonly',
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        Headers: 'readonly',
        Response: 'readonly',
        expect: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'off', // Turn off since we have globals
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];