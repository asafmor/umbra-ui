// Installs and builds the example apps in place, against the built package: `npm run examples`
// (all three) or `npm run examples -- dashboard`. Run `npm run build` first.
//
// The examples are plain folders, not npm workspaces, so each is a complete app that can be copied
// out as a template. Each one's `.npmrc` makes npm install `umbra-ui` (file:../..) as a copy of what
// would be published, with its own dependencies, instead of a link into this repository. npm does not
// refresh that copy by itself, so it is removed here before every install.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
if (!existsSync(root + 'dist/index.js')) {
  console.error('dist/ is missing. Run: npm run build');
  process.exit(1);
}

const all = readdirSync(root + 'examples').filter((name) =>
  existsSync(`${root}examples/${name}/package.json`),
);
const names = process.argv.slice(2);
for (const name of names.length ? names : all) {
  const cwd = `${root}examples/${name}`;
  if (!all.includes(name)) throw new Error(`No example named "${name}". There are: ${all.join(', ')}`);
  const run = (...args) =>
    execFileSync('npm', args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  // The copy of the library, and Vite's cache of it for `npm run dev`.
  rmSync(`${cwd}/node_modules/umbra-ui`, { recursive: true, force: true });
  rmSync(`${cwd}/node_modules/.vite`, { recursive: true, force: true });
  // The cache of the second development server of tests/examples/source-maps.spec.ts.
  rmSync(`${cwd}/node_modules/.vite-source-maps`, { recursive: true, force: true });
  // --ignore-scripts: the library is already built; without it npm rebuilds it for every example.
  run('install', '--ignore-scripts', '--no-audit', '--no-fund');
  run('run', 'build');
}
