// Checks the built package the way an app meets it. Run after `npm run build` (`npm run check:package`).
//
// 1. Size: what one import costs, bundled with esbuild and with Vite, minified, React external.
//    A small component must stay small, and no import may carry code it does not use.
// 2. Production: the development warnings are gone from a production bundle.
// 3. The tarball: no story, sample or test file; every declaration is reachable and resolvable.
// 4. Names: components keep their names, blocks have a displayName, and every module starts with
//    "use client".
// 4b. Source maps: every module has one, with every source embedded and under src/, and the name of
//    every function and every `throw` in the built files resolves to its line of the source.
// 5. Server rendering: a page renders with react-dom/server in Node, without a window.
// 6. Types: a consumer project type-checks against the tarball under `bundler`, `node16` and
//    `nodenext` with `skipLibCheck: false`, and a wrong prop is an error under each.
import { build as esbuild } from 'esbuild';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { SourceMap } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build as vite } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
// UMBRA_DIST points the size check at another build, to compare two build shapes.
const dist = process.env.UMBRA_DIST ?? join(root, 'dist');
const sizesOnly = Boolean(process.env.UMBRA_DIST);
// Inside the repository, so the bundlers and TypeScript find react and the other dependencies.
const work = join(root, 'node_modules/.cache/umbra-check');
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const failures = [];
const fail = (message) => failures.push(message);
const kb = (n) => (n / 1024).toFixed(1);

// --- 1. Size ----------------------------------------------------------------------------------------

// Strings that only exist in the named code. Minifiers keep string literals and property names.
const marks = {
  DataTable: ['aria-rowcount'],
  'the table engine': ['getSortedRowModel', 'getCoreRowModel'],
  d3: ['curveMonotoneX', 'rangeRound'],
  charts: ['bar-chart', 'donut-chart'],
  // The library's own Menu. (A Button holds React Aria's menu item: it is drawn as one in an overflow menu.)
  menus: ['data-umbra":"menu"', '"data-umbra": "menu"', 'data-umbra":`menu`'],
};
const all = Object.keys(marks);
/**
 * What an app imports, the most it may weigh (KB, minified and gzipped, by the larger of the two
 * bundlers) and what it must not contain. The ceilings are about a quarter above the measured sizes:
 * they catch a component that starts to drag in another, not a few added lines.
 */
const cases = [
  { name: 'Skeleton', from: 'index', use: 'Skeleton', gzip: 3, without: all },
  { name: 'Tag', from: 'index', use: 'Tag', gzip: 16, without: all },
  { name: 'Button', from: 'index', use: 'Button', gzip: 45, without: all },
  {
    name: 'Card',
    from: 'index',
    use: 'Card',
    gzip: 95,
    without: ['DataTable', 'the table engine', 'd3', 'charts'],
  },
  {
    name: 'shell + layout',
    from: 'index',
    use: 'UmbraProvider, AppShell, TopBar, PrimaryNav, SubNav, Page, Columns, Stack, Card',
    gzip: 110,
    without: ['DataTable', 'the table engine', 'd3', 'charts'],
  },
  { name: 'DataTable', from: 'index', use: 'DataTable', gzip: 130, without: ['d3', 'charts'] },
  { name: 'BarChart', from: 'charts', use: 'BarChart', gzip: 95, without: ['DataTable', 'the table engine'] },
];
const external = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'];
const production = { 'process.env.NODE_ENV': '"production"' };

const bundle = async (entry) => {
  const es = await esbuild({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    external,
    define: production,
    loader: { '.css': 'empty' },
    logLevel: 'silent',
  });
  const out = await vite({
    root: work,
    configFile: false,
    logLevel: 'silent',
    define: production,
    build: { write: false, minify: true, lib: { entry, formats: ['es'] }, rollupOptions: { external } },
  });
  const chunks = (Array.isArray(out) ? out : [out]).flatMap((o) => o.output);
  return {
    esbuild: es.outputFiles[0].text,
    vite: chunks
      .filter((c) => c.type === 'chunk')
      .map((c) => c.code)
      .join('\n'),
  };
};

const rows = [];
for (const c of cases) {
  const entry = join(work, `${c.name.replace(/\W+/g, '-')}.js`);
  const names = c.use.split(', ');
  // The components are used, so the bundlers cannot drop the import itself.
  writeFileSync(
    entry,
    `import { ${c.use} } from ${JSON.stringify(join(dist, `${c.from}.js`))};\nglobalThis.app = [${names.join(', ')}];\n`,
  );
  const out = await bundle(entry);
  const row = { import: c.name };
  for (const [bundler, code] of Object.entries(out)) {
    const gzip = gzipSync(code).length;
    row[`${bundler} min KB`] = kb(code.length);
    row[`${bundler} gzip KB`] = kb(gzip);
    if (sizesOnly) continue;
    if (!code.includes('data-umbra'))
      fail(`${c.name} (${bundler}): the bundle holds no component; is it empty?`);
    if (gzip > c.gzip * 1024)
      fail(`${c.name} (${bundler}): ${kb(gzip)} KB gzip, over its ceiling of ${c.gzip} KB`);
    for (const what of c.without) {
      const found = marks[what].filter((mark) => code.includes(mark));
      if (found.length) fail(`${c.name} (${bundler}): contains ${what} (${found.join(', ')})`);
    }
    // --- 2. The development warnings are dropped in production.
    if (code.includes('[umbra-ui]'))
      fail(`${c.name} (${bundler}): development warnings are in a production bundle`);
  }
  rows.push(row);
}
console.table(rows);
for (const file of ['index.js', 'charts.js', 'styles.css']) {
  const code = readFileSync(join(dist, file));
  console.log(`dist/${file}: ${kb(code.length)} KB, ${kb(gzipSync(code).length)} KB gzip`);
}

if (!sizesOnly) {
  // --- 3. The tarball -------------------------------------------------------------------------------

  const tarball = join(
    work,
    execFileSync('npm', ['pack', '--ignore-scripts', '--silent', '--pack-destination', work], { cwd: root })
      .toString()
      .trim()
      .split('\n')
      .pop(),
  );
  const consumer = join(work, 'consumer');
  const installed = join(consumer, 'node_modules/umbra-ui');
  mkdirSync(installed, { recursive: true });
  execFileSync('tar', ['-xzf', tarball, '-C', installed, '--strip-components=1']);

  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  const packed = walk(installed).map((f) => relative(installed, f));
  console.log(`tarball: ${packed.length} files, ${kb(statSync(tarball).size)} KB`);
  const unwanted = /(^|[/.])(samples|storyKit|storyParts|stories|placeholders)\b|\.stories\.|\.test\./i;
  for (const file of packed) {
    if (unwanted.test(file)) fail(`${file}: story or test code is published`);
    if (file.endsWith('.js') && !packed.includes(`${file}.map`)) {
      // The two entries have no map, and need none while they hold nothing but imports and exports.
      const code = readFileSync(join(installed, file), 'utf8').replace(/\/\*.*?\*\//g, '');
      const onlyExports =
        /^(\s*(['"]use client['"];|import\s[^;]+;|export\s*\{[^}]*\}(\s*from\s*['"][^'"]+['"])?;))*\s*$/;
      if (!/^dist\/(index|charts)\.js$/.test(file) || !onlyExports.test(code)) fail(`${file}: no source map`);
    }
    if (!file.endsWith('.d.ts')) continue;
    const text = readFileSync(join(installed, file), 'utf8');
    if (/@tanstack|react-aria|d3-/.test(text)) fail(`${file}: a third-party type is in the public types`);
    if (/\.css['"]/.test(text)) fail(`${file}: imports a stylesheet`);
    const bare = text.match(/(?:from\s+|import\s*\(\s*)['"]\.{1,2}\/[^'"]*(?<!\.js)['"]/);
    if (bare) fail(`${file}: a relative import has no extension (${bare[0]})`);
  }

  // --- 4. Names, source maps, "use client" -----------------------------------------------------------

  for (const file of packed.filter((f) => f.endsWith('.js'))) {
    if (!/^['"]use client['"];/.test(readFileSync(join(installed, file), 'utf8')))
      fail(`${file}: does not start with "use client"`);
  }
  // --- 4b. Source maps -----------------------------------------------------------------------------

  // What a developer gets from a map: a frame of an error stack, or a breakpoint, lands on the line of
  // the `.tsx` it came from. Checked at every position that can be recognised in both files without
  // parsing: the name of each top-level function, and each `throw`.
  const known = [
    [/^(?:export )?(?:async )?function (\w+?)(?:\$\d+)?\(/, (name) => new RegExp(`\\bfunction ${name}\\b`)],
    [/\b(throw) /, () => /\bthrow\b/],
  ];
  let positions = 0;
  const located = new Set();
  for (const file of packed.filter((f) => f.endsWith('.js.map'))) {
    const js = file.slice(0, -'.map'.length);
    if (!packed.includes(js)) {
      fail(`${file}: a map without its module`);
      continue;
    }
    const code = readFileSync(join(installed, js), 'utf8');
    if (!code.trimEnd().endsWith(`//# sourceMappingURL=${file.split('/').pop()}`))
      fail(`${js}: does not end with a sourceMappingURL for its map`);
    const map = JSON.parse(readFileSync(join(installed, file), 'utf8'));
    if (!map.sources?.length) fail(`${file}: names no source`);
    const sources = (map.sources ?? []).map((source, i) => {
      const path = relative(installed, resolve(dirname(join(installed, file)), source));
      const text = map.sourcesContent?.[i];
      if (isAbsolute(source) || /^\w+:/.test(source))
        fail(`${file}: the source path is absolute (${source})`);
      else if (!path.startsWith('src/') || path.includes('node_modules'))
        fail(`${file}: a source is outside src/ (${source})`);
      else if (unwanted.test(path)) fail(`${file}: maps story or test code (${source})`);
      if (typeof text !== 'string' || !text) fail(`${file}: the source of ${source} is not embedded`);
      // The embedded source is the file in the repository, so a line number is a line a developer can open.
      else if (
        path.startsWith('src/') &&
        (!existsSync(join(root, path)) || text !== readFileSync(join(root, path), 'utf8'))
      )
        fail(`${file}: the embedded source is not ${path} as it is now. Run "npm run build".`);
      return { path, lines: (text ?? '').split('\n') };
    });
    // A CSS module is a list of class names: nothing in it to map.
    if (/\.module\.js$/.test(js)) continue;
    const mappings = new SourceMap(map);
    code.split('\n').forEach((line, i) => {
      for (const [pattern, original] of known) {
        const match = pattern.exec(line);
        if (!match) continue;
        const entry = mappings.findEntry(i, line.indexOf(match[1], match.index));
        const source = sources[map.sources.indexOf(entry.originalSource)] ?? sources[0];
        positions++;
        located.add(js);
        if (!original(match[1]).test(source.lines[entry.originalLine] ?? ''))
          fail(
            `${js}:${i + 1} (${match[1]}) maps to ${source.path}:${entry.originalLine + 1}, which is another line: ` +
              JSON.stringify((source.lines[entry.originalLine] ?? '').trim().slice(0, 60)),
          );
      }
    });
  }
  console.log(`source maps: ${positions} positions in ${located.size} modules resolve to their source line`);
  // So that a changed build output cannot make the check pass by recognising nothing.
  if (positions < 300 || located.size < 60)
    fail(`source maps: only ${positions} positions in ${located.size} modules were checked`);

  const lib = await import(pathToFileURL(join(installed, 'dist/index.js')).href);
  const charts = await import(pathToFileURL(join(installed, 'dist/charts.js')).href);
  for (const name of ['Card', 'Button', 'DataTable', 'AppShell', 'List']) {
    // The bundler may rename a function that shares its name with an import (`Button$1`); displayName is what DevTools shows.
    const shown = lib[name]?.displayName ?? lib[name]?.name;
    if (shown !== name) fail(`${name}: React DevTools would show "${shown}"`);
  }
  for (const [name, block] of [
    ['Card.Header', lib.Card.Header],
    ['DataTable.Root', lib.DataTable.Root],
    ['Tag.Root', lib.Tag.Root],
  ]) {
    if (block?.displayName !== name) fail(`${name}: displayName is "${block?.displayName}"`);
  }

  // --- 5. Server rendering ---------------------------------------------------------------------------

  if (typeof window !== 'undefined' || typeof document !== 'undefined')
    fail('the check must run without a DOM');
  const { createElement: h } = await import('react');
  const { renderToString } = await import('react-dom/server');
  try {
    const html = renderToString(
      h(
        lib.UmbraProvider,
        null,
        h(
          lib.AppShell,
          { topBar: h(lib.TopBar, { title: 'App' }) },
          h(
            lib.Page,
            null,
            h(
              lib.Card,
              { title: 'Orders' },
              h(lib.DataTable, {
                'aria-label': 'Orders',
                columns: [
                  { id: 'name', header: 'Name', accessor: 'name' },
                  { id: 'amount', header: 'Amount', accessor: 'amount' },
                ],
                data: [
                  { id: 'a', name: 'Item 1', amount: 3 },
                  { id: 'b', name: 'Item 2', amount: 5 },
                ],
                getRowId: (row) => row.id,
              }),
            ),
            h(
              lib.Card,
              { title: 'Chart' },
              h(charts.BarChart, {
                'aria-label': 'Orders by region',
                categories: ['Q1', 'Q2'],
                series: [{ id: 'r1', label: 'Region 1', values: [4, 7] }],
              }),
            ),
          ),
        ),
      ),
    );
    for (const mark of ['data-umbra="app-shell"', 'data-umbra="card"', 'data-umbra="data-table"', 'Item 2'])
      if (!html.includes(mark)) fail(`server rendering: the markup has no ${mark}`);
    console.log(`server rendering: ${kb(html.length)} KB of markup, no window`);
  } catch (error) {
    fail(`server rendering threw: ${error.stack}`);
  }

  // --- 6. A consumer's type check --------------------------------------------------------------------

  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' }),
  );
  const good = `import { Button, Card, DataTable, type DataTableColumn } from 'umbra-ui';
import { BarChart } from 'umbra-ui/charts';
type Row = { id: string; name: string };
const columns: DataTableColumn<Row>[] = [{ id: 'name', header: 'Name', accessor: 'name' }];
export const App = () => (
  <Card title="Orders">
    <Button variant="primary" onPress={() => {}}>Save</Button>
    <Card.Body><DataTable aria-label="Orders" columns={columns} data={[{ id: 'a', name: 'Item 1' }]} getRowId={(row) => row.id} /></Card.Body>
    <BarChart aria-label="Orders" categories={['Q1']} series={[{ id: 'r1', label: 'Region 1', values: [4] }]} />
  </Card>
);
`;
  writeFileSync(join(consumer, 'good.tsx'), good);
  // The same file with one wrong prop. It must not compile: types that resolve to `any` would let it.
  writeFileSync(join(consumer, 'bad.tsx'), good.replace('variant="primary"', 'variant="no-such-variant"'));
  const tsc = join(root, 'node_modules/typescript/bin/tsc');
  for (const [module, moduleResolution] of [
    ['esnext', 'bundler'],
    ['node16', 'node16'],
    ['nodenext', 'nodenext'],
  ]) {
    const check = (file) => {
      const config = join(consumer, `tsconfig.${moduleResolution}.${file}.json`);
      writeFileSync(
        config,
        JSON.stringify({
          compilerOptions: {
            target: 'es2022',
            lib: ['es2023', 'dom', 'dom.iterable'],
            module,
            moduleResolution,
            jsx: 'react-jsx',
            strict: true,
            noEmit: true,
            skipLibCheck: false,
            types: [],
          },
          files: [`${file}.tsx`],
        }),
      );
      const run = spawnSync(process.execPath, [tsc, '-p', config], { cwd: consumer, encoding: 'utf8' });
      return { ok: run.status === 0, errors: (run.stdout + run.stderr).trim().split('\n').filter(Boolean) };
    };
    const [right, wrong] = [check('good'), check('bad')];
    if (!right.ok)
      fail(`types (${moduleResolution}): a correct file does not compile:\n  ${right.errors.join('\n  ')}`);
    const expected = wrong.errors.length === 1 && /^bad\.tsx.*TS2322/.test(wrong.errors[0]);
    if (!expected)
      fail(
        `types (${moduleResolution}): a wrong prop must be the one error, got:\n  ${wrong.errors.join('\n  ') || 'none'}`,
      );
    console.log(`types (${moduleResolution}): a correct file compiles, a wrong prop is an error`);
  }
}

rmSync(work, { recursive: true, force: true });
if (failures.length) {
  console.error(failures.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(sizesOnly ? 'sizes only: nothing was asserted' : 'check:package: all checks passed');
