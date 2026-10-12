// Fails when an optional member of a type in the library source is not declared `| undefined`, so an
// app with `exactOptionalPropertyTypes` can always write `prop={condition ? value : undefined}`
// (plan/decisions/07-customisation.md). `npm run lint` runs it; `--fix` rewrites the declarations
// (run `npm run format` after).
//
// The compiler flag in tsconfig.json only reports the places where the library itself passes
// `undefined`. Two passes here:
//
// 1. Syntactic, over every declaration under src/, internal types included: the `| undefined` must
//    be written on the member itself (`unknown` and `any` hold it already). Cheap, and it can fix.
// 2. By type, over the public surface: every export of src/index.ts and src/charts/index.ts, and
//    from there every property the type checker sees, through props, parts, blocks, items, option
//    types, callbacks and tuples. An optional property fails when `undefined` is not assignable to
//    it, however it was made optional: `Partial<…>`, a mapped type, an intersection, a generic, a
//    class, a re-export. The planted file at the end proves on every run that each of these is seen.
// 3. The other type rule of decision 07, with the same program: a callback prop is called with the
//    arguments its type declares, and no event object leaks into `onPress: () => void`.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const fix = process.argv.includes('--fix');
// Story and test code is not published.
const skipped = /\.stories\.tsx$|\.test\.tsx?$|\.d\.ts$|\.generated\.ts$|[/\\](samples|story\w*)\.tsx?$/;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'stories' ? [] : walk(path);
    return /\.tsx?$/.test(name) && !skipped.test(path) ? [path] : [];
  });

const K = ts.SyntaxKind;
const holdsUndefined = (type) =>
  [K.UndefinedKeyword, K.UnknownKeyword, K.AnyKeyword].includes(type.kind) ||
  (ts.isParenthesizedTypeNode(type) && holdsUndefined(type.type)) ||
  (ts.isUnionTypeNode(type) && type.types.some(holdsUndefined));
// `() => void | undefined` would change the return type: these need brackets first.
const needsBrackets = (type) =>
  [K.FunctionType, K.ConstructorType, K.ConditionalType, K.TypeOperator, K.InferType].includes(type.kind);

const problems = [];
let fixed = 0;
for (const file of walk(join(root, 'src'))) {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const edits = [];
  const report = (node, what) => {
    const { line, character } = source.getLineAndCharacterOfPosition(node.getStart());
    problems.push(`${relative(root, file)}:${line + 1}:${character + 1}  ${what}`);
  };
  const visit = (node) => {
    const optional =
      ((ts.isPropertySignature(node) || ts.isPropertyDeclaration(node) || ts.isNamedTupleMember(node)) &&
        node.questionToken) ||
      (ts.isMappedTypeNode(node) && node.questionToken?.kind !== K.MinusToken && node.questionToken);
    if (optional && node.type && !holdsUndefined(node.type)) {
      if (fix) edits.push(node.type);
      else report(node, `optional \`${node.name?.getText() ?? 'mapped member'}\` has no \`| undefined\``);
    }
    if (ts.isMethodSignature(node) && node.questionToken)
      report(node, `optional method \`${node.name.getText()}\`: write it as a property, \`| undefined\``);
    if (ts.isOptionalTypeNode(node) && !holdsUndefined(node.type))
      report(node, 'optional tuple member has no `| undefined`');
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!edits.length) continue;
  // Inner types first and from the end of the file, so no edit moves another.
  const inserts = edits.flatMap((type) =>
    needsBrackets(type)
      ? [
          { at: type.getStart(), order: 1, add: '(' },
          { at: type.getEnd(), order: 0, add: ') | undefined' },
        ]
      : [{ at: type.getEnd(), order: 0, add: ' | undefined' }],
  );
  inserts.sort((a, b) => b.at - a.at || b.order - a.order);
  let out = text;
  for (const { at, add } of inserts) out = out.slice(0, at) + add + out.slice(at);
  writeFileSync(file, out);
  fixed += edits.length;
}

// --- 2. By type, over the public surface ---

// One example of each way to hide an optional member from the first pass, and two that are fine.
// Each `Bad…` export must be reported and no `Fine…` export may be: the check checks itself.
const plantedFile = join(root, 'src/__planted__.ts').replaceAll('\\', '/');
const planted = `
type Inner = { a: string; b: number };
export type BadPartial = Partial<Inner>;
export type BadRecord = { labels: Partial<Record<'x' | 'y', string>> };
export type BadTuple = { range: [from: number, to?: number] };
export class BadClass { size?: number; }
export type BadIntersection = { id: string } & Partial<Pick<Inner, 'a'>>;
export type BadMapped = { [K in keyof Inner]?: Inner[K] };
export type BadGeneric<T> = { items: T[]; options: Partial<{ render: (item: T) => string }> };
export type BadCallback = { onChange: (detail: Partial<Inner>) => void };
export type BadReturn = { read: () => Partial<{ c: string }> };
export declare const BadComponent: ((props: { title: string } & Partial<Inner>) => null) & { Root: (props: Partial<Inner>) => null };
type Hidden = Partial<Inner>;
export type { Hidden as BadReExport };
export type FineMapped = { [K in keyof Inner]?: Inner[K] | undefined };
export type FineRequired = Required<{ a?: string | undefined }> & { range: [from: number, to?: number | undefined] };
`;
const entries = ['src/index.ts', 'src/charts/index.ts'].map((file) => join(root, file));
const config = ts.getParsedCommandLineOfConfigFile(
  join(root, 'tsconfig.json'),
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    },
  },
);
const options = { ...config.options, exactOptionalPropertyTypes: true };
const host = ts.createCompilerHost(options);
const isPlanted = (file) => file.replaceAll('\\', '/') === plantedFile;
const { fileExists, readFile, getSourceFile } = host;
host.fileExists = (file) => isPlanted(file) || fileExists(file);
host.readFile = (file) => (isPlanted(file) ? planted : readFile(file));
host.getSourceFile = (file, ...rest) =>
  isPlanted(file)
    ? ts.createSourceFile(file, planted, ts.ScriptTarget.Latest, true)
    : getSourceFile(file, ...rest);
const program = ts.createProgram([...entries, plantedFile], options, host);
const checker = program.getTypeChecker();
const undefinedType = checker.getUndefinedType();
// Not an assignability test: with `exactOptionalPropertyTypes` the type of `a?: string` is
// `string | missing`, and the checker's plain relation lets `undefined` into "missing" (the
// mismatch is reported one level up, on the property). The written `undefined` is another type.
const takesUndefined = (type) =>
  !!(type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) ||
  type === undefinedType ||
  (type.isUnion() && type.types.includes(undefinedType));
const src = join(root, 'src').replaceAll('\\', '/') + '/';
const isOurs = (symbol) =>
  symbol?.declarations?.some((d) => d.getSourceFile().fileName.startsWith(src)) ?? false;
const where = (symbol) => {
  const d = symbol.declarations?.find((d) => d.getSourceFile().fileName.startsWith(src));
  if (!d) return '';
  const { line } = d.getSourceFile().getLineAndCharacterOfPosition(d.getStart());
  return ` (${relative(root, d.getSourceFile().fileName)}:${line + 1})`;
};

const publicProblems = new Map();
const seen = new Set();
const walkType = (type, path) => {
  if (!type || seen.has(type)) return;
  seen.add(type);
  if (type.isUnion()) return type.types.forEach((member) => walkType(member, path));
  if (!(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection))) return;
  if (checker.isTupleType(type)) {
    const members = checker.getTypeArguments(type);
    type.target.elementFlags.forEach((flags, i) => {
      if (flags & ts.ElementFlags.Optional && !takesUndefined(members[i]))
        publicProblems.set(`${path}[${i}]`, `optional tuple member ${i} of \`${path}\``);
    });
    return members.forEach((member, i) => walkType(member, `${path}[${i}]`));
  }
  if (checker.isArrayType(type))
    return checker.getTypeArguments(type).forEach((t) => walkType(t, `${path}[]`));
  // What a function takes and gives: props, the argument of a callback, what a hook returns.
  for (const signature of type.getCallSignatures()) {
    for (const parameter of signature.getParameters())
      walkType(checker.getTypeOfSymbol(parameter), `${path}(${parameter.name})`);
    walkType(signature.getReturnType(), `${path}()`);
  }
  // Not into the types of React, the DOM or the standard library (a ReactNode, an element, a Date):
  // a mapped type (`Partial`, `Pick`, `Omit`) is declared there too, and is ours when it is applied
  // to our type, so it goes on.
  const mapped = type.flags & ts.TypeFlags.Object && type.objectFlags & ts.ObjectFlags.Mapped;
  if (!mapped && !type.isIntersection() && type.symbol && !isOurs(type.symbol)) return;
  for (const property of checker.getPropertiesOfType(type)) {
    const propertyType = checker.getTypeOfSymbol(property);
    const at = `${path}.${property.name}`;
    if (property.flags & ts.SymbolFlags.Optional && !takesUndefined(propertyType))
      publicProblems.set(at + where(property), `optional \`${at}\`${where(property)}`);
    // A property React or the DOM declares (\`style\`, \`ref\`) is checked, and not gone into.
    if (isOurs(property) || !property.declarations?.length) walkType(propertyType, at);
  }
};
for (const entry of [...entries, plantedFile]) {
  const module = checker.getSymbolAtLocation(program.getSourceFile(entry));
  for (const exported of checker.getExportsOfModule(module)) {
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const name = isPlanted(entry) ? `planted:${exported.name}` : exported.name;
    if (symbol.flags & ts.SymbolFlags.Type) walkType(checker.getDeclaredTypeOfSymbol(symbol), name);
    if (symbol.flags & ts.SymbolFlags.Value) walkType(checker.getTypeOfSymbol(symbol), name);
  }
}
const reported = [...publicProblems.values()];
const names = [...planted.matchAll(/\b(?:Bad|Fine)\w+/g)].map(([name]) => name);
for (const name of new Set(names)) {
  const found = reported.some((problem) => problem.includes(`\`planted:${name}`));
  if (found !== name.startsWith('Bad'))
    problems.push(
      `check-optional-props is broken: the planted \`${name}\` ${found ? 'is' : 'is not'} reported`,
    );
}
for (const problem of reported)
  if (!problem.includes('`planted:')) problems.push(`public type: ${problem} does not accept undefined`);

// --- 3. A callback of the app is called with what its type says ---

// `onPress: () => void` is called with nothing (plan/decisions/07-customisation.md): handing the
// prop itself to a native `onClick`, or to React Aria's `onPress`, would call it with the event,
// and an app that passes `onPress={setOpen}` or a function with an optional parameter would get an
// event object where it expects its own value. The same for any callback: a function that came in
// as a prop is never handed to a handler that passes more arguments than the prop declares. Write
// `onClick={() => onPress()}`.
const fromProps = (symbol) =>
  symbol?.declarations?.some((d) => {
    let node = d;
    while (ts.isBindingElement(node) || ts.isObjectBindingPattern(node)) node = node.parent;
    return ts.isParameter(node) || ts.isPropertySignature(d) || ts.isPropertyDeclaration(d);
  }) ?? false;
const signatureOf = (type) => type && checker.getNonNullableType(type).getCallSignatures()[0];
const handed = (expression, visitHanded) => {
  if (ts.isParenthesizedExpression(expression)) return handed(expression.expression, visitHanded);
  if (ts.isBinaryExpression(expression)) return handed(expression.right, visitHanded);
  if (ts.isConditionalExpression(expression))
    return [expression.whenTrue, expression.whenFalse].forEach((e) => handed(e, visitHanded));
  if (ts.isIdentifier(expression) || ts.isPropertyAccessExpression(expression)) visitHanded(expression);
};
for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.fileName.startsWith(src) || isPlanted(sourceFile.fileName)) continue;
  const visit = (node) => {
    const named =
      (ts.isJsxAttribute(node) || ts.isPropertyAssignment(node)) && /^on[A-Z]/.test(node.name.getText());
    const value = named && (ts.isJsxAttribute(node) ? node.initializer?.expression : node.initializer);
    if (value)
      handed(value, (expression) => {
        if (!fromProps(checker.getSymbolAtLocation(expression))) return;
        const given = signatureOf(checker.getTypeAtLocation(expression));
        const wanted = signatureOf(checker.getContextualType(expression));
        if (!given || !wanted || given.parameters.length >= wanted.parameters.length) return;
        if (given.declaration?.parameters.some((parameter) => parameter.dotDotDotToken)) return;
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        problems.push(
          `${relative(root, sourceFile.fileName)}:${line + 1}:${character + 1}  \`${node.name.getText()}\` is handed the prop \`${expression.getText()}\`, which declares ${given.parameters.length} parameter(s) and would be called with ${wanted.parameters.length}. Wrap it: \`(…) => ${expression.getText()}(…)\`.`,
        );
      });
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

if (fix) console.log(`check-optional-props: added \`| undefined\` to ${fixed} members`);
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} optional members do not accept an explicit undefined. Run: node scripts/check-optional-props.mjs --fix && npm run format`,
  );
  process.exitCode = 1;
} else if (!fix)
  console.log(
    `check-optional-props: every optional member accepts an explicit undefined (${seen.size} public types walked)`,
  );
