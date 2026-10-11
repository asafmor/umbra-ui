import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

/**
 * Names the blocks for React DevTools and error stacks: after `Card.Header = Header`, the function
 * gets `displayName = 'Card.Header'`, and an exported component gets its own name. Only for the library build.
 */
const blockNames = (): Plugin => ({
  name: 'umbra-block-names',
  apply: 'build',
  transform(code, id) {
    if (!/\/src\/.*\.tsx$/.test(id) || /\.(stories|test)\.tsx$/.test(id)) return null;
    // On the same line, never on a new one: the source map of the module is kept as it is (`map: null`),
    // so an added line would move every line below it in the map (`npm run check:package` checks them).
    let named = code.replace(
      /^([A-Z]\w*)\.([A-Z]\w*) = ([A-Z]\w*);$/gm,
      (line, owner, member, fn) => `${line} ${fn}.displayName ??= '${owner}.${member}';`,
    );
    // A component whose name is also an import of its module (`Button as AriaButton`) is renamed by
    // the bundler (`Button$1`), so it states its name. Only those: a statement at the top of a module
    // keeps its function in every bundle that loads the module.
    for (const [, name] of code.matchAll(/^export function ([A-Z]\w*)\s*[(<]/gm))
      if (new RegExp(`\\b${name} as \\w+`).test(code)) named += `\n${name}.displayName ??= '${name}';`;
    return named === code ? null : { code: named, map: null };
  },
});

export default defineConfig({
  plugins: [react(), blockNames()],
  build: {
    // The minimum browsers of the README. Lightning CSS, which minifies the stylesheet, adds prefixes
    // and merges rules for these versions, and rewrites what they lack: scripts/check-browsers.mjs
    // holds the same versions, and fails when they differ or when a rewrite reached the stylesheet.
    cssTarget: ['chrome117', 'edge117', 'firefox125', 'safari17'],
    lib: {
      entry: { index: 'src/index.ts', charts: 'src/charts/index.ts' },
      formats: ['es'],
      cssFileName: 'styles',
    },
    // The app's bundler minifies. Readable names and source maps keep DevTools and stacks usable.
    minify: false,
    cssMinify: true,
    sourcemap: true,
    rollupOptions: {
      // One file per source module. Bundlers drop a whole unused module (package.json marks the JS as
      // free of side effects), but they cannot drop one component out of a single file: the block
      // assignments (`DataTable.Root = Root`) are statements esbuild has to keep. The CSS stays one sheet.
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // Every module uses hooks or is used by one that does, so React Server Components frameworks
        // must treat the package as client code (plan/decisions/05-packaging.md).
        banner: "'use client';",
      },
      external: (id) => external.some((name) => id === name || id.startsWith(name + '/')),
    },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'], passWithNoTests: true },
});
