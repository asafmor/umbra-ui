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
      // One file per source module. Bundlers drop a whole unused module (package.json marks the JS as
      // free of side effects), but they cannot drop one component out of a single file: the block
      // assignments (`DataTable.Root = Root`) are statements esbuild has to keep. The CSS stays one sheet.
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
      external: (id) => external.some((name) => id === name || id.startsWith(name + '/')),
    },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'], passWithNoTests: true },
});
