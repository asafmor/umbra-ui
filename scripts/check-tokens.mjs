// The rules about tokens (plan/decisions/07-customisation.md, "Tokens"). `npm run lint` runs it.
//
// 1. A component never declares a public `--umbra-*` property: not in its stylesheet, not in a
//    `style` object. A value declared on a component beats the one an app set on an ancestor. A
//    container that needs another default sets a private property (`--icon-size`), and the reader
//    falls back through it: `var(--umbra-icon-size, var(--icon-size, 1.25em))`.
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

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} token problem(s). The rules: plan/decisions/07-customisation.md.`);
  process.exit(1);
}
console.log('Tokens: no component declares a public token.');
