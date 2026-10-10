import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      'storybook-static',
      'src/styles/tokens.generated.ts',
      'plan',
      'screenshots',
      '.claude',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  storybook.configs['flat/recommended'],
  {
    // The layout system measures the DOM in layout effects and then sets state (stack collapse, overflow
    // menus). These two rules, written for the React Compiler, reject that pattern.
    rules: { 'react-hooks/set-state-in-effect': 'off', 'react-hooks/preserve-manual-memoization': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}'],
    rules: {
      // Sample data and names must stay domain-neutral (AGENTS.md).
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['scripts/**', '*.config.{js,ts}'],
    languageOptions: { globals: { process: 'readonly', URL: 'readonly', console: 'readonly' } },
  },
);
