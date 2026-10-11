// Checks that a release can be made. `npm run release:check`; CI runs it, so the release flow
// cannot break unnoticed. Run `npm run build` first. Nothing here publishes or changes the repository.
//
// 1. Rehearses `changeset version` on a copy of package.json and .changeset/ in a temporary folder:
//    the pending changesets must produce a new version and a CHANGELOG.md.
// 2. Checks the tarball `npm pack` would make: every `exports` target is in it, and nothing but
//    dist/ and the standard files is.
// 3. Prints how much of the package is source maps, and fails when the packed package is over its limit.
//
// `--final` is what `npm run release` runs just before publishing: the version must already be
// bumped (no pending changesets), and CHANGELOG.md must have its section.
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const final = process.argv.includes('--final');
const shell = process.platform === 'win32';
const fail = (message) => {
  console.error(`release check: ${message}`);
  process.exit(1);
};
const readPkg = (dir) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

const pkg = readPkg(root);
const pending = readdirSync(root + '.changeset').filter(
  (name) => name.endsWith('.md') && name !== 'README.md',
);

if (final) {
  if (pending.length)
    fail(`${pending.length} pending changeset(s). Run "npm run version", review and commit first.`);
  if (pkg.version === '0.0.0') fail('the version is still 0.0.0. Run "npm run version" first.');
  const changelog = existsSync(root + 'CHANGELOG.md') ? readFileSync(root + 'CHANGELOG.md', 'utf8') : '';
  if (!changelog.includes(`## ${pkg.version}\n`)) fail(`CHANGELOG.md has no section for ${pkg.version}.`);
} else if (pending.length) {
  const tmp = mkdtempSync(join(tmpdir(), 'umbra-release-'));
  try {
    cpSync(root + 'package.json', join(tmp, 'package.json'));
    cpSync(root + '.changeset', join(tmp, '.changeset'), { recursive: true });
    try {
      execFileSync(root + 'node_modules/.bin/changeset', ['version'], { cwd: tmp, stdio: 'pipe', shell });
    } catch (error) {
      fail(`"changeset version" failed:\n${error.stdout}${error.stderr}`);
    }
    const next = readPkg(tmp).version;
    if (next === pkg.version) fail(`"changeset version" left the version at ${next}.`);
    // Until the first release, the pending changesets must add up to exactly 0.1.0.
    if (pkg.version === '0.0.0' && next !== '0.1.0') fail(`the first release must be 0.1.0, not ${next}.`);
    if (!readFileSync(join(tmp, 'CHANGELOG.md'), 'utf8').includes(`## ${next}\n`))
      fail(`"changeset version" wrote no CHANGELOG.md section for ${next}.`);
    console.log(
      `release check: ${pending.length} changeset(s) would release ${pkg.name} ${pkg.version} -> ${next}`,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
} else {
  console.log('release check: no pending changesets, nothing to release');
}

// --ignore-scripts: list the dist/ that is there, without building again.
const [{ files, size }] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
    shell,
  }),
);
const paths = new Set(files.map((file) => file.path));
const targets = Object.values(pkg.exports).flatMap((entry) =>
  typeof entry === 'string' ? [entry] : Object.values(entry),
);
for (const target of targets)
  if (!paths.has(target.replace(/^\.\//, '')))
    fail(`${target} is in "exports" but not in the package. Run "npm run build".`);
const stray = [...paths].filter(
  (path) => !/^(dist\/|package\.json$|README\.md$|LICENSE$|CHANGELOG\.md$)/.test(path),
);
if (stray.length) fail(`files outside dist/ would be published: ${stray.join(', ')}`);

/**
 * The most the packed package may weigh, in kB as npm prints them (1 kB = 1024 bytes). It is install
 * size, not an app's bundle (`npm run check:package` limits that), and it is here so the package
 * cannot grow unnoticed.
 *
 * Measured 2026-10-11, with the 43 components of Milestone 1: 669 kB packed, 2.5 MB unpacked, of which
 * the source maps with their embedded source are 58% packed and 56% unpacked.
 * Milestone 2 brings the count to 66. At the same size per component that is 669 * 66 / 43 = 1027 kB;
 * a quarter of headroom on top gives 1284, rounded to 1300.
 * Review it when Milestone 2 is built: lower it to the measured size plus a quarter.
 */
const PACKED_LIMIT_KB = 1300;

const kb = (bytes) => (bytes / 1024).toFixed(0);
const isMap = (file) => file.path.endsWith('.map');
const unpacked = files.reduce((sum, file) => sum + file.size, 0);
const unpackedMaps = files.filter(isMap).reduce((sum, file) => sum + file.size, 0);
// What the maps add to the tarball: the files compressed together as npm does, with and without them.
const gzipped = (list) =>
  gzipSync(Buffer.concat(list.map((file) => readFileSync(root + file.path))), { level: 9 }).length;
const share = (part, whole) => `${((100 * part) / whole).toFixed(0)}%`;
const mapShare = 1 - gzipped(files.filter((file) => !isMap(file))) / gzipped(files);
console.log(
  `release check: the package holds ${paths.size} files, ${kb(size)} kB packed (limit ${PACKED_LIMIT_KB} kB), ${kb(unpacked)} kB unpacked`,
);
console.log(
  `release check: source maps are about ${kb(size * mapShare)} kB packed (${share(mapShare, 1)}) and ${kb(unpackedMaps)} kB unpacked (${share(unpackedMaps, unpacked)})`,
);
if (size > PACKED_LIMIT_KB * 1024)
  fail(
    `the package is ${kb(size)} kB packed, over the limit of ${PACKED_LIMIT_KB} kB (PACKED_LIMIT_KB in scripts/check-release.mjs). ` +
      'Find what grew before raising it.',
  );
