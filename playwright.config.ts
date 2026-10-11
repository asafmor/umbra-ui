import { defineConfig } from '@playwright/test';

// Visual tests run against the built Storybook (npm run test:visual builds it first).
// UMBRA_TEST_PORT lets several checkouts run their tests at the same time.
const port = Number(process.env.UMBRA_TEST_PORT ?? 6007);

export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  // No retries, in CI either: a retry hides a flaky test. The interaction specs passed five repeats in
  // a row (1950 of 1950) on 2026-10-11, so a failure is a failure.
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}`, browserName: 'chromium' },
  // Strict on purpose. With the default colour threshold a dark border that moves on a dark page passes,
  // and with a looser one a small badge that changes from magenta to violet did.
  expect: { toHaveScreenshot: { threshold: 0.01, maxDiffPixels: 20 } },
  webServer: {
    command: `npx vite preview --outDir storybook-static --port ${port} --strictPort`,
    url: `http://localhost:${port}/index.json`,
    reuseExistingServer: true,
  },
});
