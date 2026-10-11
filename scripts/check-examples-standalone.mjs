// Proves that every example works as a starting template: copies each one out of the repository,
// points `umbra-ui` at the tarball `npm pack` makes (what the registry would serve), and runs
// `npm install && npm run build` there. Run `npm run build` first. `npm run examples:standalone`.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
if (!existsSync(root + 'dist/index.js')) {
  console.error('dist/ is missing. Run: npm run build');
  process.exit(1);
}
const npm = (cwd, ...args) =>
  execFileSync('npm', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });

const tmp = mkdtempSync(join(tmpdir(), 'umbra-examples-'));
try {
  // --ignore-scripts: pack the dist/ that is there, without building again.
  const [{ filename }] = JSON.parse(
    npm(root, 'pack', '--json', '--ignore-scripts', '--pack-destination', tmp),
  );
  const tarball = join(tmp, basename(filename));

  const names = readdirSync(root + 'examples').filter((name) =>
    existsSync(`${root}examples/${name}/package.json`),
  );
  for (const name of names) {
    const dir = join(tmp, name);
    const skip = new Set(['node_modules', 'dist', 'package-lock.json']);
    cpSync(`${root}examples/${name}`, dir, { recursive: true, filter: (from) => !skip.has(basename(from)) });

    const tsconfig = JSON.parse(readFileSync(join(dir, 'tsconfig.json'), 'utf8'));
    if (tsconfig.extends)
      throw new Error(`examples/${name}/tsconfig.json extends ${tsconfig.extends}: it must stand alone`);
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    for (const script of ['dev', 'build', 'preview'])
      if (!pkg.scripts?.[script]) throw new Error(`examples/${name}/package.json has no "${script}" script`);
    pkg.dependencies['umbra-ui'] = `file:${tarball}`;
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

    npm(dir, 'install', '--no-audit', '--no-fund');
    npm(dir, 'run', 'build');
    if (!existsSync(join(dir, 'dist/index.html')))
      throw new Error(`examples/${name}: the build left no dist/index.html`);
    console.log(`examples/${name}: installs and builds outside the repository`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
