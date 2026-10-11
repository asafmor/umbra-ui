// The rules about tokens (plan/decisions/07-customisation.md, "Tokens"). `npm run lint` runs it.
//
// 1. A component never declares a public `--umbra-*` property: not in its stylesheet, not in a
//    `style` object. A value declared on a component beats the one an app set on an ancestor. A
//    container that needs another default sets a private property (`--icon-size`), and the reader
//    falls back through it: `var(--umbra-icon-size, var(--icon-size, 1.25em))`.
// 2. Every token of plan/tokens.json is read somewhere in the library: a token nothing reads is a
//    promise the library does not keep.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const rel = (path) => relative(root, path).replaceAll('\\', '/');
// Story code plays the app, which may set any token. Tests are not published.
const isStory = (file) =>
  /\.stories\.tsx$|\.test\.tsx?$|^src\/stories\/|\/(samples|story\w*)\.tsx?$/.test(file);
const files = walk(src)
  .map((path) => ({ file: rel(path), text: readFileSync(path, 'utf8') }))
  .filter(({ file }) => /\.(css|tsx?)$/.test(file));
const problems = [];

// --- 1. Declarations ---

// The allowed setters: the provider and the scope (setting tokens is their job), the base stylesheet,
// and the generated tokens.
const setters = /^src\/(provider|styles)\//;
// `file: property`, each with the reason it does not break the rule.
const allowedDeclarations = new Set([
  // The minimum height a layout child declares for the Stack around it. It is reset on every layout
  // child (src/styles/index.css), so it is never inherited: there is no ancestor's value to beat.
  'src/layout/Card.module.css: --umbra-slot-min-height',
  'src/data/SummaryTile.module.css: --umbra-slot-min-height',
  // The same property, from the `minHeight` prop of the element itself.
  'src/layout/useSlot.tsx: --umbra-slot-min-height',
  // The component's own tokens, set on its own root from its own prop (`bandColor`). A prop is the
  // app's value for this one element, so it is meant to beat the value set on an ancestor.
  'src/layout/Card.tsx: --umbra-card-header-bg',
  'src/layout/Card.tsx: --umbra-card-header-fg',
  'src/shell/PageHeader.tsx: --umbra-page-header-bg',
  'src/shell/PageHeader.tsx: --umbra-page-header-fg',
]);

const usedAllowances = new Set();
for (const { file, text } of files) {
  if (setters.test(file) || isStory(file)) continue;
  const declared = file.endsWith('.css')
    ? // A declaration: the property at the start of a line, or after `{` or `;`.
      [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|[{;])\s*(--umbra-[a-z0-9-]+)\s*:/gm)]
    : // A key of a style object (`'--umbra-x': …`, `['--umbra-x' as string]: …`), or setProperty.
      [
        ...text.matchAll(/\[?['"`](--umbra-[a-z0-9-]+)['"`](?:\s+as\s+string)?\s*\]?\s*:/g),
        ...text.matchAll(/setProperty\(\s*['"`](--umbra-[a-z0-9-]+)['"`]/g),
      ];
  for (const [, name] of declared) {
    const key = `${file}: ${name}`;
    if (allowedDeclarations.has(key)) usedAllowances.add(key);
    else problems.push(`${file} declares ${name}. Set a private property (--${name.slice(8)}) instead.`);
  }
}
for (const key of allowedDeclarations)
  if (!usedAllowances.has(key)) problems.push(`The allowlist names "${key}", which is no longer declared.`);

// --- 2. Every token is read ---

// The generated stylesheet holds every token of plan/tokens.json (`npm run tokens` writes it).
const names = new Set(
  [...readFileSync(join(src, 'styles/tokens.css'), 'utf8').matchAll(/^\s*--umbra-([a-z0-9-]+):/gm)].map(
    ([, name]) => name,
  ),
);
// Not tokens.generated.ts, which names every token. tokens.css stays: a token can be read by another
// token (`--umbra-context` by the colours derived from it).
const library = files.filter(({ file }) => !isStory(file) && file !== 'src/styles/tokens.generated.ts');
const all = library.map(({ text }) => text).join('\n');
// Read as a variable, in a stylesheet or in code: `var(--umbra-x)`, `var(--umbra-x, …)`,
// `getPropertyValue('--umbra-x')`.
const read = new Set(
  [...all.matchAll(/(?:var\(\s*|getPropertyValue\(\s*['"`])--umbra-([a-z0-9-]+)\s*[,)'"`]/g)].map(
    ([, name]) => name,
  ),
);
// Read through a template in code: `var(--umbra-space-${gap})` reads the whole scale.
const scales = [...all.matchAll(/--umbra-([a-z0-9-]+-)\$\{/g)].map(([, prefix]) => prefix);
// Read through a constant of src/styles/tokens.generated.ts, where CSS cannot read a variable (a
// media query): the token, and the generated export that carries its value.
const throughCode = new Map([
  ['size-min-window-width', 'minWindow'],
  ['size-min-window-height', 'minWindow'],
]);
// Tokens that exist only for apps to read, each with the reason. The library must not read them.
const forApps = new Map([
  // (none)
]);
const isRead = (name) =>
  read.has(name) ||
  scales.some((prefix) => name.startsWith(prefix)) ||
  (throughCode.has(name) && new RegExp(`\\b${throughCode.get(name)}\\b`).test(all));
for (const name of names) {
  if (forApps.has(name) === isRead(name))
    problems.push(
      forApps.has(name)
        ? `--umbra-${name} is listed as "for apps only", and the library reads it. Remove it from the list.`
        : `--umbra-${name} (plan/tokens.json) is never read under src/. Use it, or remove the token.`,
    );
}
for (const name of [...throughCode.keys(), ...forApps.keys()])
  if (!names.has(name)) problems.push(`check-tokens names --umbra-${name}, which is not a token.`);

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} token problem(s). The rules: plan/decisions/07-customisation.md.`);
  process.exit(1);
}
console.log(`Tokens: no component declares a public token; all ${names.size} tokens are read.`);
