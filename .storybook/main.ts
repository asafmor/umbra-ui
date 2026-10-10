import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx', '../docs/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // The library build settings in vite.config.ts do not apply to the Storybook app.
  viteFinal: (config) => ({ ...config, build: { ...config.build, lib: false, rollupOptions: {} } }),
};

export default config;
