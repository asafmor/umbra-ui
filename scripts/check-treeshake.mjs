// Checks the built package (run after `npm run build`):
// 1. An app that imports only `Button` must not carry the table engine, the chart code or DataTable,
//    bundled with esbuild and with Rollup (what Vite uses), minified, with React external.
// 2. dist/ holds no story, sample, story kit or test file.
import { build as esbuild } from 'esbuild';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as vite } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const failures = [];

// Strings that only exist in the code that must be left out. Minifiers keep string literals and
// property names, so these survive in a bundle that still carries the code.
const forbidden = {
  DataTable: ['data-table', 'aria-rowcount'],
  'TanStack Table': ['getSortedRowModel', 'getCoreRowModel', 'columnVisibility'],
  d3: ['d3-scale', 'd3-shape', 'curveMonotoneX', 'rangeRound'],
  charts: ['bar-chart', 'donut-chart'],
};
// Proves the bundle is the real thing and not an empty file.
const required = ['data-umbra', 'button'];

const dir = mkdtempSync(join(tmpdir(), 'umbra-treeshake-'));
const entry = join(dir, 'app.jsx');
writeFileSync(
  entry,
  `import { Button } from ${JSON.stringify(join(dist, 'index.js'))};\n` +
    `import { createRoot } from 'react-dom/client';\n` +
    `createRoot(document.body).render(<Button onPress={() => {}}>Save</Button>);\n`,
);
const external = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'];

const check = (bundler, code) => {
  for (const word of required)
    if (!code.includes(word))
      failures.push(`${bundler}: the bundle does not contain "${word}"; is it empty?`);
  for (const [what, words] of Object.entries(forbidden)) {
    const found = words.filter((w) => code.includes(w));
    if (found.length) failures.push(`${bundler}: a Button-only app contains ${what} (${found.join(', ')})`);
  }
  console.log(`${bundler}: Button-only bundle ${(code.length / 1024).toFixed(0)} KB`);
};

try {
  const es = await esbuild({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    external,
    jsx: 'automatic',
    loader: { '.css': 'empty' },
    nodePaths: [join(root, 'node_modules')],
    logLevel: 'silent',
  });
  check('esbuild', es.outputFiles[0].text);

  const out = await vite({
    root: dir,
    configFile: false,
    logLevel: 'silent',
    resolve: { modules: [join(root, 'node_modules')] },
    esbuild: { jsx: 'automatic' },
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ['es'] },
      rollupOptions: { external },
    },
  });
  const chunks = (Array.isArray(out) ? out : [out]).flatMap((o) => o.output);
  check(
    'vite',
    chunks
      .filter((c) => c.type === 'chunk')
      .map((c) => c.code)
      .join('\n'),
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// Nothing that only serves the stories or the tests is published.
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
  );
const unwanted = /(^|[/.])(samples|storyKit|storyParts|stories)\b|\.stories\.|\.test\./i;
for (const file of walk(dist).map((f) => relative(dist, f))) {
  if (unwanted.test(file)) failures.push(`dist/${file}: story or test code is published`);
}
// Internal modules are bundled into the entries: no public declaration may import one that is missing.
for (const file of walk(dist).filter((f) => f.endsWith('.d.ts'))) {
  const text = readFileSync(file, 'utf8');
  if (/@tanstack|react-aria/.test(text))
    failures.push(`dist/${relative(dist, file)}: a third-party type is in the public types`);
}

if (failures.length) {
  console.error(failures.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log('check-treeshake: the package tree-shakes and dist/ is clean');
