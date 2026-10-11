// Typechecks every ```tsx sample in README.md and docs/*.md against the library source, so a sample
// that stops compiling fails `npm run lint` (and CI). Run by `npm run docs:check`.
//
// - 'umbra-ui' and 'umbra-ui/charts' resolve to src/index.ts and src/charts/index.ts.
// - A sample may be a fragment. A name it uses but does not define is imported for it: from the
//   library when the library exports it, otherwise from scripts/check-docs-prelude.ts. Declare there
//   the app's own values a sample refers to (`rows`, `openSearch`, a router's `Link`).
// - A sample that is partial on purpose opts out with `<!-- docs-check: skip -->` on the line above
//   its fence. Use it sparingly: a skipped sample is not checked at all.
// - docs/customisation-tables.md is generated, and has no samples.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const abs = (path) => root + path;
const skipMarker = '<!-- docs-check: skip -->';

const files = [
  'README.md',
  ...readdirSync(abs('docs'))
    .filter((name) => name.endsWith('.md') && name !== 'customisation-tables.md')
    .map((name) => `docs/${name}`),
];

/** Every tsx sample: where it is, and its text padded so line numbers match the Markdown file. */
const samples = [];
let skipped = 0;
for (const file of files) {
  const lines = readFileSync(abs(file), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^```tsx\s*$/.test(lines[i])) continue;
    const end = lines.indexOf('```', i + 1);
    if (end < 0) throw new Error(`${file}:${i + 1}: the sample is not closed`);
    if (lines[i - 1]?.trim() === skipMarker || lines[i - 2]?.trim() === skipMarker) skipped++;
    else
      samples.push({
        file,
        name: abs(`.docs-check/${file.replace(/\W/g, '_')}_${i + 1}.tsx`),
        text: '\n'.repeat(i + 1) + lines.slice(i + 1, end).join('\n') + '\n',
      });
    i = end;
  }
}
if (samples.length === 0) throw new Error('No tsx samples found: the extraction is broken.');

const { config } = ts.readConfigFile(abs('tsconfig.json'), ts.sys.readFile);
const { options } = ts.convertCompilerOptionsFromJson(config.compilerOptions, root);
const prelude = abs('scripts/check-docs-prelude.ts');
Object.assign(options, {
  noEmit: true,
  // The strictest setting an app may have: a sample that passes `undefined` to an optional prop must
  // compile there too.
  exactOptionalPropertyTypes: true,
  paths: {
    'umbra-ui': [abs('src/index.ts')],
    'umbra-ui/charts': [abs('src/charts/index.ts')],
    'umbra-ui/styles.css': [abs('src/styles/index.css')],
    // Samples that show a router import its link from the prelude, so the docs need no router installed.
    'react-router-dom': [prelude],
  },
});

function check(extra) {
  const virtual = new Map(samples.map((s) => [s.name, `${s.text}${extra.get(s.name) ?? ''}export {};\n`]));
  // A sample of an entry file imports the app from './App'.
  virtual.set(abs('.docs-check/App.tsx'), `export { App } from '${prelude.replace(/\.ts$/, '')}';\n`);
  const host = ts.createCompilerHost(options);
  const { fileExists, readFile, getSourceFile, directoryExists } = host;
  host.directoryExists = (name) => name === abs('.docs-check') || directoryExists(name);
  host.fileExists = (name) => virtual.has(name) || fileExists(name);
  host.readFile = (name) => virtual.get(name) ?? readFile(name);
  host.getSourceFile = (name, ...rest) =>
    virtual.has(name)
      ? ts.createSourceFile(name, virtual.get(name), rest[0], true, ts.ScriptKind.TSX)
      : getSourceFile(name, ...rest);
  // The entries and the prelude are roots too, so their exports are known even when no sample imports them.
  const entries = [abs('src/index.ts'), abs('src/charts/index.ts'), prelude];
  const program = ts.createProgram([...virtual.keys(), ...entries], options, host);
  const exportsOf = (path) => {
    const symbol = program.getTypeChecker().getSymbolAtLocation(program.getSourceFile(path));
    return new Set(
      program
        .getTypeChecker()
        .getExportsOfModule(symbol)
        .map((s) => s.name),
    );
  };
  return {
    diagnostics: ts.getPreEmitDiagnostics(program).filter((d) => d.file && virtual.has(d.file.fileName)),
    sources: [
      ['umbra-ui', exportsOf(abs('src/index.ts'))],
      ['umbra-ui/charts', exportsOf(abs('src/charts/index.ts'))],
      [prelude.replace(/\.ts$/, ''), exportsOf(prelude)],
    ],
  };
}

// First pass: find the names each sample uses without defining them, and import those that exist.
// 2304 and 2552 are "Cannot find name"; 18004 is the same for a shorthand property.
const missing = /^Cannot find name '([^']+)'|^No value exists in scope for the shorthand property '([^']+)'/;
const first = check(new Map());
const imports = new Map();
for (const d of first.diagnostics) {
  const match = missing.exec(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  const name = match?.[1] ?? match?.[2];
  const source = name && first.sources.find(([, names]) => names.has(name))?.[0];
  if (!source) continue;
  const line = `import { ${name} } from '${source}';\n`;
  const text = imports.get(d.file.fileName) ?? '';
  if (!text.includes(line)) imports.set(d.file.fileName, text + line);
}

const { diagnostics } = imports.size ? check(imports) : first;
const byName = new Map(samples.map((s) => [s.name, s]));
for (const d of diagnostics) {
  const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
  const message = ts.flattenDiagnosticMessageText(d.messageText, '\n  ');
  console.error(`${byName.get(d.file.fileName).file}:${line + 1} TS${d.code}: ${message}`);
}
const note = skipped ? ` (${skipped} skipped)` : '';
if (diagnostics.length) {
  console.error(`\n${diagnostics.length} error(s) in the documentation samples${note}.`);
  process.exit(1);
}
console.log(`docs: ${samples.length} tsx samples in ${files.length} files compile${note}.`);
