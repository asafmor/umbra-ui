import { defineConfig } from '@playwright/test';

// Visual tests run against the built Storybook (npm run test:visual builds it first).
export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:6007', browserName: 'chromium' },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001 } },
  webServer: {
    command: 'npx vite preview --outDir storybook-static --port 6007 --strictPort',
    url: 'http://localhost:6007/index.json',
    reuseExistingServer: true,
  },
});
