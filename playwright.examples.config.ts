import { defineConfig } from '@playwright/test';

// The example apps are tested as a user would run them: each one's production build, served by
// `vite preview` (npm run test:examples builds the package and the examples first).
// UMBRA_EXAMPLES_PORT is the first of three ports, so several checkouts can run at the same time.
const first = Number(process.env.UMBRA_EXAMPLES_PORT ?? 6017);
export const examples = ['basic', 'dashboard', 'advanced'] as const;
export type ExampleName = (typeof examples)[number];
export const exampleUrl = (name: ExampleName) => `http://localhost:${first + examples.indexOf(name)}/`;

export default defineConfig({
  testDir: 'tests/examples',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: { browserName: 'chromium' },
  webServer: examples.map((name) => ({
    command: `npx vite preview --outDir examples/${name}/dist --port ${first + examples.indexOf(name)} --strictPort`,
    url: exampleUrl(name),
    reuseExistingServer: true,
  })),
});
