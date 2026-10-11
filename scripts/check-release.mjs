// Checks that a release can be made. `npm run release:check`; CI runs it, so the release flow
// cannot break unnoticed. Run `npm run build` first. Nothing here publishes or changes the repository.
//
// 1. Rehearses `changeset version` on a copy of package.json and .changeset/ in a temporary folder:
//    the pending changesets must produce a new version and a CHANGELOG.md.
// 2. Checks the tarball `npm pack` would make: every `exports` target is in it, and nothing but
//    dist/ and the standard files is.
//
// `--final` is what `npm run release` runs just before publishing: the version must already be
// bumped (no pending changesets), and CHANGELOG.md must have its section.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
console.log(`release check: the package holds ${paths.size} files, ${(size / 1024).toFixed(0)} kB packed`);
