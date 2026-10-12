// The rules about tokens (plan/decisions/07-customisation.md, "Tokens"). `npm run lint` runs it.
//
// 1. A component never declares a public `--umbra-*` property: not in its stylesheet, not in a
//    `style` object. A value declared on a component beats the one an app set on an ancestor. A
//    container that needs another default sets a private property (`--icon-size`), and the reader
//    falls back through it: `var(--umbra-icon-size, var(--icon-size, 1.25em))`.
// 2. Every token of plan/tokens.json is read somewhere in the library: a token nothing reads is a
//    promise the library does not keep.
// 3. No stylesheet holds a literal duration: timings are motion tokens.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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
// Comments are removed first, so a token named in a comment is neither a declaration nor a read. The
// compiler removes them from code (a regular expression would trip on `//` inside a string), and
// the types with them: a type that names a token declares nothing.
const withoutComments = (file, text) =>
  file.endsWith('.css')
    ? text.replace(/\/\*[\s\S]*?\*\//g, '')
    : ts.transpileModule(text, {
        compilerOptions: { removeComments: true, jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ESNext },
      }).outputText;
const files = walk(src)
  .map(rel)
  .filter((file) => /\.(css|tsx?)$/.test(file))
  .map((file) => ({ file, text: withoutComments(file, readFileSync(join(root, file), 'utf8')) }));
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
  // An overlay drawn outside its trigger's subtree copies the tokens that reach the trigger, so the
  // app's values follow it (`carryTokens`). It tests each name against the bare prefix, and skips
  // the one property that is a layout child's own. It sets what an ancestor set, never a default.
  'src/overlays/shared.ts: --umbra-',
  'src/overlays/shared.ts: --umbra-slot-min-height',
]);

const usedAllowances = new Set();
for (const { file, text } of files) {
  if (setters.test(file) || isStory(file)) continue;
  const declared = file.endsWith('.css')
    ? // A declaration: the property at the start of a line, or after `{` or `;`.
      [...text.matchAll(/(?:^|[{;])\s*(--umbra-[a-z0-9-]+)\s*:/gm)].map(([, name]) => name)
    : // In code, every token name that is not being read: `var(--umbra-x…` and
      // `getPropertyValue('--umbra-x…` are the two ways to read one. Anything else can end up as a
      // declaration, whatever road it takes: a key of a style object, a computed key, a constant
      // or a template that builds the name, `setProperty`, `cssText`. So each needs a row above.
      [...text.matchAll(/--umbra-[a-z0-9-]*/g)]
        .filter(({ index }) => !/(?:var\(\s*|getPropertyValue\(\s*['"`])$/.test(text.slice(0, index)))
        .map(([name]) => name);
  for (const name of declared) {
    const key = `${file}: ${name}`;
    if (allowedDeclarations.has(key)) usedAllowances.add(key);
    else
      problems.push(
        `${file} names ${name} outside a read (var(), getPropertyValue). Set a private property (--${name.slice(8) || 'name'}) instead.`,
      );
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
// Read through a template in code: `var(--umbra-space-${gap})`. The members each template can build,
// from the type or the arithmetic of what it interpolates. A token of the scale that is not listed
// here must be read by its own name; a template with no row fails.
const scaleMembers = new Map([
  // `gap` of Stack: `spaces` of tokens.generated.ts.
  ['space-', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']],
  // `(index % seriesCount) + 1` (src/internal/SeriesMarker.tsx), and `series` of ScheduleSlot.
  ['color-series-', ['1', '2', '3', '4', '5', '6', '7', '8']],
  // A band's tone that starts with `ramp-` (src/inputs/bandColour.ts).
  ['color-value-', ['ramp-1', 'ramp-2', 'ramp-3', 'ramp-4', 'ramp-5']],
  // The collapse of a Card reads the easing of its direction.
  ['motion-easing-', ['enter', 'exit']],
]);
const templates = new Set([...all.matchAll(/--umbra-([a-z0-9-]+-)\$\{/g)].map(([, prefix]) => prefix));
for (const prefix of templates)
  if (!scaleMembers.has(prefix))
    problems.push(`A template builds --umbra-${prefix}…: list the members it can build in check-tokens.mjs.`);
const scales = new Set();
for (const [prefix, members] of scaleMembers) {
  if (!templates.has(prefix))
    problems.push(`check-tokens lists the scale --umbra-${prefix}…, which no template builds.`);
  for (const member of members) scales.add(prefix + member);
}
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
  scales.has(name) ||
  (throughCode.has(name) && new RegExp(`\\b${throughCode.get(name)}\\b`).test(all));
for (const name of names) {
  if (forApps.has(name) === isRead(name))
    problems.push(
      forApps.has(name)
        ? `--umbra-${name} is listed as "for apps only", and the library reads it. Remove it from the list.`
        : `--umbra-${name} (plan/tokens.json) is never read under src/. Use it, or remove the token.`,
    );
}
for (const name of [...throughCode.keys(), ...forApps.keys(), ...scales])
  if (!names.has(name)) problems.push(`check-tokens names --umbra-${name}, which is not a token.`);

// --- 3. No literal duration ---

// How long something moves is a token: `--umbra-motion-duration-*`, or a component token that falls
// back to one. Allowed: `0s` (a step with a delay), and `1ms`, the length of an animation that only
// waits for its delay (the skeleton that appears late).
for (const { file, text } of files) {
  if (!file.endsWith('.module.css') && file !== 'src/styles/index.css') continue;
  for (const [, time] of text.matchAll(/(?<![\w.#-])(\d*\.?\d+m?s)\b/g))
    if (!/^(0m?s|1ms)$/.test(time))
      problems.push(`${file}: the duration ${time} is a literal. Read a motion token instead.`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} token problem(s). The rules: plan/decisions/07-customisation.md.`);
  process.exit(1);
}
console.log(`Tokens: no component declares a public token; all ${names.size} tokens are read.`);
