import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'src/styles/tokens.generated.ts', 'plan', 'screenshots'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  storybook.configs['flat/recommended'],
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
    languageOptions: { globals: { process: 'readonly', URL: 'readonly' } },
  },
);
