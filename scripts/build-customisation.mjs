// Generates docs/customisation-tables.md from the source: for every exported component, its tokens
// (CSS variables), props, parts and blocks. `--check` fails when the file on disk is out of date.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
    // Every optional member is declared `| undefined` (scripts/check-optional-props.mjs). The table and
    // the `?` already say optional, so it is left out here: at the end, and on the members inside.
    .replace(/ \| undefined$/, '')
    .replace(/(\?: [^;{}]*?) \| undefined(?=;)/g, '$1');

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

// --- Tokens ---

/** The global tokens and their values: the generated tokens, and what the base stylesheet declares. */
const globals = new Map();
for (const file of ['src/styles/tokens.css', 'src/styles/index.css'])
  for (const [, name, value] of readFileSync(resolve(root, file), 'utf8').matchAll(
    /^\s*(--umbra-[a-z0-9-]+):\s*([^;]+);/gm,
  ))
    if (!globals.has(name)) globals.set(name, value.trim());
// Global tokens that happen to be read with a fallback are not component tokens.
const isGlobal = (name) =>
  globals.has(name) || /^--umbra-(color|density|font|space|size|context)-/.test(name);

/** `var(--name, fallback)` when the whole expression is one `var()`; the fallback may be missing. */
function oneVar(expression) {
  const start = /^var\(\s*(--[a-z0-9-]+)\s*(,)?/.exec(expression);
  if (!start || !expression.endsWith(')')) return null;
  let depth = 0;
  for (let i = 3; i < expression.length - 1; i++) {
    depth += expression[i] === '(' ? 1 : expression[i] === ')' ? -1 : 0;
    if (depth === 0) return null; // the first bracket closes before the end: more than one term
  }
  return { name: start[1], fallback: start[2] ? expression.slice(start[0].length, -1).trim() : undefined };
}
/**
 * The default of a token as a reader can use it. A private property (no `umbra-` prefix) says
 * nothing outside the file: `var(--private, x)` is `x` (the private one is a container's default for
 * what is inside it), and a bare `var(--private)` is its value where the file declares it once.
 * A global token is named with its value: one level, no further.
 */
function readable(expression, privates) {
  for (let step = oneVar(expression), looked = false; step && !step.name.startsWith('--umbra-');) {
    if (step.fallback !== undefined) expression = step.fallback;
    else if (!looked && privates.get(step.name)?.size === 1) {
      [expression] = privates.get(step.name);
      looked = true;
    } else break;
    step = oneVar(expression);
  }
  const token = oneVar(expression);
  if (!token || token.fallback !== undefined || !globals.has(token.name)) return `\`${expression}\``;
  const value = globals.get(token.name);
  if (value.includes('var(')) return `\`${token.name}\``;
  const density = token.name.startsWith('--umbra-density-') ? ' at the default density' : '';
  return `\`${token.name}\` (${value}${density})`;
}
/** Every `var(--umbra-name, fallback)` of a file, in its stylesheet or in its code: `[name, default]`. */
function reads(text) {
  const privates = new Map();
  for (const [, name, value] of text.matchAll(/(?:^|[{;])\s*(--(?!umbra-)[a-z0-9-]+)\s*:\s*([^;{}]+);/gm)) {
    if (!privates.has(name)) privates.set(name, new Set());
    privates.get(name).add(value.replace(/\s+/g, ' ').trim());
  }
  const found = [];
  const start = /var\(\s*(--umbra-[a-z0-9-]+)\s*,/g;
  for (let match; (match = start.exec(text));) {
    let end = start.lastIndex;
    for (let depth = 1; end < text.length && depth; end++)
      depth += text[end] === '(' ? 1 : text[end] === ')' ? -1 : 0;
    const fallback = text
      .slice(start.lastIndex, end - 1)
      .replace(/\s+/g, ' ')
      .replace(/\( /g, '(')
      .replace(/ \)/g, ')')
      .trim();
    if (!isGlobal(match[1])) found.push([match[1], readable(fallback, privates)]);
  }
  return found;
}
/** What a component reads: its own file, its stylesheet, and the helpers they share. */
function readsOf(sourceFile, seen = new Set()) {
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
      if (file) found.push(...readsOf(file, seen));
    }
  }
  return found;
}

const components = exported.filter((s) => resolveAlias(s).valueDeclaration && /^[A-Z]/.test(s.name));
/**
 * A token belongs to the component whose name it carries: `--umbra-icon-button-badge-size` to
 * `IconButton`, wherever it is read. The name is the component's in kebab case, or in one word
 * (`topbar`), or one of the short names below; the longest match wins.
 */
const shortNames = { table: 'DataTable', shell: 'AppShell', scroll: 'ScrollArea', section: 'SectionTitle' };
const prefixes = [
  ...components.flatMap(({ name }) => {
    const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    return [
      [kebab, name],
      [kebab.replaceAll('-', ''), name],
    ];
  }),
  ...Object.entries(shortNames),
].sort((a, b) => b[0].length - a[0].length);
const ownerOf = (token) =>
  prefixes.find(([prefix]) => token === `--umbra-${prefix}` || token.startsWith(`--umbra-${prefix}-`))?.[1];

/** Every read in the library, by token: a component's token can be read in another component's file. */
const everyRead = new Map();
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)],
  );
for (const file of walk(resolve(root, 'src')).sort()) {
  if (!/\.(module\.css|tsx?)$/.test(file) || /\.(stories|test)\.tsx?$|[/\\]stories[/\\]/.test(file)) continue;
  for (const [name, value] of reads(readFileSync(file, 'utf8'))) {
    if (!everyRead.has(name)) everyRead.set(name, new Set());
    everyRead.get(name).add(value);
  }
}

/** The token table of a component, and the components whose tokens it also reads. */
function tokensOf(name, sourceFile) {
  const rows = new Map();
  for (const [token, defaults] of everyRead) if (ownerOf(token) === name) rows.set(token, defaults);
  const others = new Set();
  for (const [token, value] of readsOf(sourceFile)) {
    const owner = ownerOf(token);
    if (owner === name) continue;
    if (owner) others.add(owner);
    // A shared token, which no component's name is on: listed with the default it has here.
    else rows.set(token, (rows.get(token) ?? new Set()).add(value));
  }
  return { rows: [...rows].sort(([a], [b]) => a.localeCompare(b)), others: [...others].sort() };
}

const sections = [];
const strings = [];
for (const symbol of exported) {
  const target = resolveAlias(symbol);
  const node = target.valueDeclaration;
  if (!node || !/^[A-Z]/.test(symbol.name)) continue; // types only, or not a component
  const name = symbol.name;
  const lines = [`## ${name}`, '', doc(target), ''];

  const { rows, others } = tokensOf(name, node.getSourceFile());
  const also = others.length
    ? ` It also reads the tokens of ${others.map((o) => `[\`${o}\`](#${o.toLowerCase()})`).join(', ')}.`
    : '';
  lines.push(`**Tokens**: ${rows.length ? 'each with its default' : 'none of its own'}.${also}`, '');
  if (rows.length) {
    lines.push('| Token | Default |', '|---|---|');
    for (const [token, defaults] of rows)
      lines.push(`| \`${token}\` | ${cell([...defaults].join(defaults.size > 2 ? '; ' : ' or '))} |`);
    lines.push('');
  }

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
  'A token is listed under the component whose name it carries, with its default: the value it has',
  'until you set it. A default that names a global token shows that token and its value. A name',
  'without `--umbra-` is a value the component works out from its variant or state. Where two',
  'defaults are given, the token is read in more than one place (a size per `size`, for example).',
  'A token no component is named in (`--umbra-focus-color`, `--umbra-chart-*`) is shared: it is',
  'listed under every component that reads it.',
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
