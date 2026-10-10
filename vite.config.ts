import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: { index: 'src/index.ts', charts: 'src/charts/index.ts' },
      formats: ['es'],
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: (id) => external.some((name) => id === name || id.startsWith(name + '/')),
    },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'], passWithNoTests: true },
});
