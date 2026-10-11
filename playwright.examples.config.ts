import { defineConfig } from '@playwright/test';

// The example apps are tested as a user would run them: each one's production build, served by
// `vite preview` (npm run test:examples builds the package and the examples first).
// UMBRA_EXAMPLES_PORT is the first of five ports, so several checkouts can run at the same time.
const first = Number(process.env.UMBRA_EXAMPLES_PORT ?? 6017);
export const examples = ['basic', 'dashboard', 'advanced'] as const;
export type ExampleName = (typeof examples)[number];
export const exampleUrl = (name: ExampleName) => `http://localhost:${first + examples.indexOf(name)}/`;

// One example also runs in the Vite development server, where a developer debugs: as it is, and with
// the library kept out of Vite's pre-bundling (source-maps.spec.ts). Two more servers that start in
// about a second each; the other tests do not touch them.
const dev = { prebundled: first + 3, excluded: first + 4 } as const;
export const devUrl = (mode: keyof typeof dev) => `http://localhost:${dev[mode]}/`;

export default defineConfig({
  testDir: 'tests/examples',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: { browserName: 'chromium' },
  webServer: [
    ...examples.map((name) => ({
      command: `npx vite preview --outDir examples/${name}/dist --port ${first + examples.indexOf(name)} --strictPort`,
      url: exampleUrl(name),
      reuseExistingServer: true,
    })),
    {
      command: `npx vite examples/basic --port ${dev.prebundled} --strictPort`,
      url: devUrl('prebundled'),
      reuseExistingServer: true,
    },
    {
      command: `npx vite examples/basic --config tests/examples/vite.maps.config.ts --port ${dev.excluded} --strictPort`,
      url: devUrl('excluded'),
      reuseExistingServer: true,
    },
  ],
});
