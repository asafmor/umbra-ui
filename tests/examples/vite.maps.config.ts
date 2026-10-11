import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The `basic` example (its config is the React plugin alone) with the setting docs/getting-started.md
// ("Debugging") gives for Vite: the library is not pre-bundled, so the development server serves its
// modules with their own source maps. Its dependencies still are: some hold CommonJS, which a browser
// cannot load as it is. Used by source-maps.spec.ts only.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['umbra-ui'],
    include: ['react-aria-components', '@tanstack/react-table', 'd3-scale', 'd3-shape', 'lucide-react'].map(
      (name) => `umbra-ui > ${name}`,
    ),
  },
  // Its own cache, next to the one of the example's own development server.
  cacheDir: 'node_modules/.vite-source-maps',
});
