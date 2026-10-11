// Generates docs/customisation-tables.md from the source: for every exported component, its tokens
// (CSS variables), props, parts and blocks. `--check` fails when the file on disk is out of date.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'docs/customisation-tables.md');
// Both package entries: `umbra-ui` and `umbra-ui/charts`.
const entries = ['src/index.ts', 'src/charts/index.ts'].map((file) => resolve(root, file));

const config = ts.parseJsonConfigFileContent(
  ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile).config,
  ts.sys,
  root,
);
const program = ts.createProgram(entries, config.options);
const checker = program.getTypeChecker();
const exported = entries.flatMap((entry) =>
  checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry))),
);
const resolveAlias = (s) => (s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s);

const cell = (text) => text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const doc = (symbol) => cell(ts.displayPartsToString(symbol.getDocumentationComment(checker)));
const typeText = (symbol, node) =>
  checker
    .typeToString(checker.getTypeOfSymbolAtLocation(symbol, node), node, ts.TypeFormatFlags.NoTruncation)
    // A type from another file prints as import("./file").Name: the name alone reads better.
    .replace(/import\("[^"]*"\)\./g, '')
    .replace(/ \| undefined$/, '');

/** Names a file gives a default text to, as in `{ clearLabel = 'Clear' }`. */
const defaults = new Map();
function hasDefault(prop) {
  const file = prop.declarations?.[0]?.getSourceFile();
  if (!file) return false;
  if (!defaults.has(file)) {
    const names = new Set();
    const visit = (n) => {
      if (ts.isBindingElement(n) && n.initializer && ts.isIdentifier(n.name)) {
        const init = n.initializer;
        if (ts.isStringLiteralLike(init) || ts.isTemplateExpression(init) || ts.isArrowFunction(init))
          names.add(n.name.text);
      }
      ts.forEachChild(n, visit);
    };
    visit(file);
    defaults.set(file, names);
  }
  return defaults.get(file).has(prop.name);
}
/**
 * A prop that holds one of the library's own words: translate these. See docs/customisation.md.
 * It is optional, a string or a function, and named `…Label` or `…Hint`; a `label`, `placeholder` or
 * `…Name` counts only when the component gives it a default (elsewhere those are the app's own text).
 */
function isText(prop, node) {
  if (!(prop.flags & ts.SymbolFlags.Optional) || prop.name === 'className') return false;
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, node));
  const plain = (type.isUnion() ? type.types : [type]).every(
    (t) => t.flags & ts.TypeFlags.StringLike || t.getCallSignatures().length,
  );
  if (!plain) return false;
  return (
    /(Label|Hint)$/.test(prop.name) || (/^label$|[pP]laceholder$|Name$/.test(prop.name) && hasDefault(prop))
  );
}
/** `moreLabel(count)` when the prop is, or can be, a function of the things it describes. */
function textProp(prop, node) {
  const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, node));
  const signature = (type.isUnion() ? type.types : [type]).flatMap((t) => t.getCallSignatures())[0];
  const params = signature ? `(${signature.parameters.map((p) => p.name).join(', ')})` : '';
  return `\`${prop.name}${params}\``;
}

/** CSS variables a file reads with a fallback, in its stylesheet or in its own code: those are the component's own tokens. */
const reads = (text) => [...text.matchAll(/var\(\s*(--umbra-[a-z0-9-]+)\s*,/g)].map(([, name]) => name);
function tokensOf(sourceFile, seen = new Set()) {
  if (seen.has(sourceFile.fileName)) return [];
  seen.add(sourceFile.fileName);
  const dir = dirname(sourceFile.fileName);
  // A token can also be read in the code, for example a colour given to an SVG attribute.
  const found = reads(sourceFile.text);
  for (const [, spec] of sourceFile.text.matchAll(/from '(\.\/[^']+)'/g)) {
    if (spec.endsWith('.module.css')) {
      found.push(...reads(readFileSync(resolve(dir, spec), 'utf8')));
    } else if (/^\.\/[a-z]/.test(spec)) {
      // A lower-case sibling is a helper shared by components (for example nav.tsx), not a component.
      const helper = ['.tsx', '.ts'].map((ext) => resolve(dir, spec + ext)).find(existsSync);
      const file = helper && program.getSourceFile(helper);
      if (file) found.push(...tokensOf(file, seen));
    }
  }
  // Global tokens that happen to be read with a fallback are not component tokens.
  return [...new Set(found)]
    .filter((n) => !/^--umbra-(color|density|font|space|size|context)-/.test(n))
    .sort();
}

const sections = [];
const strings = [];
for (const symbol of exported) {
  const target = resolveAlias(symbol);
  const node = target.valueDeclaration;
  if (!node || !/^[A-Z]/.test(symbol.name)) continue; // types only, or not a component
  const name = symbol.name;
  const lines = [`## ${name}`, '', doc(target), ''];

  const tokens = tokensOf(node.getSourceFile());
  lines.push(
    '**Tokens**: ' + (tokens.length ? tokens.map((t) => `\`${t}\``).join(', ') : 'none of its own') + '.',
    '',
  );

  const propsSymbol = exported.find((s) => s.name === `${name}Props`);
  const props = propsSymbol ? checker.getDeclaredTypeOfSymbol(resolveAlias(propsSymbol)).getProperties() : [];
  const texts = props.filter((prop) => isText(prop, node)).map((prop) => textProp(prop, node));
  if (texts.length) strings.push(`| [\`${name}\`](#${name.toLowerCase()}) | ${texts.join(', ')} |`);
  if (props.length) {
    lines.push('| Prop | Type | Purpose |', '|---|---|---|');
    for (const prop of props) {
      const optional = prop.flags & ts.SymbolFlags.Optional ? '' : ' (required)';
      const type = prop.name === 'parts' ? 'see Parts' : cell(typeText(prop, node));
      lines.push(`| \`${prop.name}\`${optional} | \`${type}\` | ${doc(prop)} |`);
    }
    lines.push('');
  }

  const partsProp = props.find((p) => p.name === 'parts');
  const parts = partsProp
    ? checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(partsProp, node)).getProperties()
    : [];
  lines.push(
    '**Parts**: ' + (parts.length ? parts.map((p) => `\`${p.name}\``).join(', ') : 'none') + '.',
    '',
  );

  const blocks = checker
    .getTypeOfSymbolAtLocation(target, node)
    .getProperties()
    .filter((p) => /^[A-Z]/.test(p.name));
  lines.push(
    '**Blocks**: ' + (blocks.length ? blocks.map((b) => `\`${name}.${b.name}\``).join(', ') : 'none') + '.',
    '',
  );
  sections.push({ name, text: lines.join('\n') });
}

sections.sort((a, b) => a.name.localeCompare(b.name));
const text = [
  '# Customisation tables',
  '',
  'Generated from the source by `npm run docs:tables`. Do not edit.',
  '',
  'Every component is customised through the same four layers: tokens, props, parts and blocks.',
  'A token is a CSS variable: set it in CSS on any ancestor, or through the `tokens` prop of',
  '`UmbraProvider` or `UmbraScope` (without the `--umbra-` prefix). Every component also accepts',
  '`className` and `style` on its root.',
  '',
  '## Built-in strings',
  '',
  "Every prop that holds one of the library's own words, with an English default. Pass your own to",
  'translate a component. A name followed by brackets can also be a function of what it describes.',
  '',
  '| Component | Text props |',
  '|---|---|',
  ...strings.sort((a, b) => a.localeCompare(b)),
  '',
  sections.map((s) => s.text).join('\n'),
].join('\n');

if (process.argv.includes('--check')) {
  if (!existsSync(out) || readFileSync(out, 'utf8') !== text) {
    console.error(`${relative(root, out)} is out of date. Run: npm run docs:tables`);
    process.exit(1);
  }
} else {
  writeFileSync(out, text);
  console.log(`${relative(root, out)}: ${sections.length} components`);
}
