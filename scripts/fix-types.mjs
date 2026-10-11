// Run after `tsc -p tsconfig.build.json`. Makes the emitted declarations fit for publishing:
// 1. relative imports get their file extension, so they resolve under `node16` and `nodenext` as
//    well as `bundler` (tsc writes specifiers as they are in the source, without one);
// 2. imports of stylesheets are removed (the CSS is one file, `umbra-ui/styles.css`);
// 3. declarations that the entries do not reach are deleted.
import { existsSync, readdirSync, readFileSync, rmSync, rmdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const entries = ['index.d.ts', 'charts/index.d.ts'].map((f) => join(dist, f));

/** `./x` to `./x.js` or `./x/index.js`, whichever declaration exists. */
const withExtension = (from, specifier) => {
  if (/\.(js|json)$/.test(specifier)) return specifier;
  const base = join(dirname(from), specifier);
  if (existsSync(`${base}.d.ts`)) return `${specifier}.js`;
  if (existsSync(join(base, 'index.d.ts'))) return `${specifier}/index.js`;
  throw new Error(`${relative(dist, from)}: cannot resolve "${specifier}"`);
};

const reached = new Set();
const visit = (file) => {
  if (reached.has(file)) return;
  reached.add(file);
  let text = readFileSync(file, 'utf8').replace(/^import\s+['"][^'"]+\.css['"];?\r?\n/gm, '');
  // `from './x'`, `import './x'` and `import('./x')`.
  text = text.replace(
    /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]+)\2/g,
    (_, lead, quote, spec) => {
      const fixed = withExtension(file, spec);
      visit(join(dirname(file), fixed.replace(/\.js$/, '.d.ts')));
      return `${lead}${quote}${fixed}${quote}`;
    },
  );
  writeFileSync(file, text);
};
entries.forEach(visit);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
let removed = 0;
for (const file of walk(dist)) {
  if (file.endsWith('.d.ts') && !reached.has(file)) {
    rmSync(file);
    removed++;
    // A folder that held only unreachable declarations goes too.
    for (let dir = dirname(file); dir !== dist && readdirSync(dir).length === 0; dir = dirname(dir))
      rmdirSync(dir);
  }
}
console.log(`fix-types: ${reached.size} declarations kept, ${removed} unreachable removed`);
