// Fails when an optional member of a type in the library source is not declared `| undefined`, so an
// app with `exactOptionalPropertyTypes` can always write `prop={condition ? value : undefined}`
// (plan/decisions/07-customisation.md). `npm run lint` runs it; `--fix` rewrites the declarations
// (run `npm run format` after).
//
// The compiler flag in tsconfig.json only reports the places where the library itself passes
// `undefined`; this reads every declaration. It is syntactic: the `| undefined` must be written on
// the member itself (`unknown` and `any` hold it already), not hidden in a type alias.
// ponytail: `Partial<...>` and other utility types are not looked into; check the type checker's
// view of each property instead if they come into use in public types.
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
      (ts.isPropertySignature(node) && node.questionToken) ||
      (ts.isMappedTypeNode(node) && node.questionToken?.kind !== K.MinusToken && node.questionToken);
    if (optional && node.type && !holdsUndefined(node.type)) {
      if (fix) edits.push(node.type);
      else report(node, `optional \`${node.name?.getText() ?? 'mapped member'}\` has no \`| undefined\``);
    }
    if (ts.isMethodSignature(node) && node.questionToken)
      report(node, `optional method \`${node.name.getText()}\`: write it as a property, \`| undefined\``);
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

if (fix) console.log(`check-optional-props: added \`| undefined\` to ${fixed} members`);
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(
    `\n${problems.length} optional members do not accept an explicit undefined. Run: node scripts/check-optional-props.mjs --fix && npm run format`,
  );
  process.exitCode = 1;
} else if (!fix) console.log('check-optional-props: every optional member accepts an explicit undefined');
