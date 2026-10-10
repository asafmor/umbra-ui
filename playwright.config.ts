import { defineConfig } from '@playwright/test';

// Visual tests run against the built Storybook (npm run test:visual builds it first).
// UMBRA_TEST_PORT lets several checkouts run their tests at the same time.
const port = Number(process.env.UMBRA_TEST_PORT ?? 6007);

export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  // A test that passes on a second try is reported as flaky, not hidden.
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}`, browserName: 'chromium' },
  // Strict on purpose: with the default colour threshold, a dark border that moves on a dark page passes.
  expect: { toHaveScreenshot: { threshold: 0.05, maxDiffPixelRatio: 0.0002 } },
  webServer: {
    command: `npx vite preview --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}/index.json`,
    reuseExistingServer: true,
  },
});
