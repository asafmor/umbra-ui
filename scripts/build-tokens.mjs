// Generates src/styles/tokens.css and src/styles/tokens.generated.ts from plan/tokens.json,
// so the tokens have one source. Run by `npm run tokens` (and on install, build and Storybook start).
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const t = JSON.parse(readFileSync(new URL('plan/tokens.json', root), 'utf8'));

const kebab = (s) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const px = (n) => (n === 0 ? '0' : `${n}px`);
const entries = (o) => Object.entries(o).filter(([k]) => !k.startsWith('$'));
const block = (selector, decls) =>
  `${selector} {\n${decls.map(([k, v]) => `  --umbra-${k}: ${v};`).join('\n')}\n}\n`;
const densityDecls = (level) => entries(t.density[level]).map(([k, v]) => [`density-${kebab(k)}`, px(v)]);

// Plain values. Declared on :root so an app can override any of them in its own CSS.
const base = [
  ...['fixed', 'base', 'semantic'].flatMap((g) =>
    entries(t.color[g]).map(([k, v]) => [`color-${g}-${kebab(k)}`, v]),
  ),
  ...entries(t.color.valueRamp).map(([k, v]) => [`color-value-ramp-${k}`, v]),
  ['color-brand', t.color.brand.default],
  ['context', t.color.context.presets.violet],
  ...entries(t.font.family).map(([k, v]) => [`font-family-${k}`, v]),
  ...entries(t.space).map(([k, v]) => [`space-${k}`, px(v)]),
  ...entries(t.radius).map(([k, v]) => [`radius-${k}`, px(v)]),
  ['border-width', px(t.border.width)],
  ...entries(t.elevation).map(([k, v]) => [`elevation-${k}`, v]),
  ...entries(t.size).map(([k, v]) => [`size-${kebab(k)}`, px(v)]),
  ...entries(t.motion.duration).map(([k, v]) => [`motion-duration-${k}`, `${v}ms`]),
  ...entries(t.motion.easing).map(([k, v]) => [`motion-easing-${k}`, v]),
  ['state-disabled-opacity', t.state.disabledOpacity],
  ['state-focus-ring-width', px(t.state.focusRingWidth)],
  ...densityDecls('default'),
];

// Values computed from other variables. A custom property is resolved where it is declared, so these
// are declared again on every provider or scope element to follow a changed context or density.
const densitySized = { body: 'body-size', label: 'label-size', tableCell: 'label-size' };
const derived = [
  ...entries(t.color.context.derive).map(([k, v]) => [
    `context-${kebab(k)}`,
    v.replace('<input>', 'var(--umbra-context)'),
  ]),
  ...entries(t.font.role).flatMap(([k, r]) => {
    const size = densitySized[k] ? `var(--umbra-density-${densitySized[k]})` : px(r.size);
    const lineHeight = +(r.lineHeight / r.size).toFixed(3);
    return [
      [`font-${kebab(k)}`, `${r.weight} ${size}/${lineHeight} var(--umbra-font-family-${r.family})`],
      ...(r.transform ? [[`font-${kebab(k)}-transform`, r.transform]] : []),
    ];
  }),
];

const css = [
  '/* Generated from plan/tokens.json by scripts/build-tokens.mjs. Do not edit. */\n',
  block(':root', base),
  block(':root,\n[data-umbra-scope]', derived),
  ...Object.keys(t.density)
    .filter((k) => !k.startsWith('$'))
    .map((level) => block(`[data-umbra-density='${level}']`, densityDecls(level))),
  ...entries(t.color.context.presets).map(([name, v]) =>
    block(`[data-umbra-context='${name}']`, [['context', v]]),
  ),
].join('\n');
writeFileSync(new URL('src/styles/tokens.css', root), css);

const list = (o) =>
  entries(o)
    .map(([k]) => `'${k}'`)
    .join(', ');
writeFileSync(
  new URL('src/styles/tokens.generated.ts', root),
  `// Generated from plan/tokens.json by scripts/build-tokens.mjs. Do not edit.
export const densities = [${list(t.density)}] as const;
export const spaces = [${entries(t.space)
    .map(([k]) => k)
    .join(', ')}] as const;
export const contextPresets = [${list(t.color.context.presets)}] as const;
export type TokenName =
${[...base, ...derived].map(([k]) => `  | '${k}'`).join('\n')};
export const minWindow = { width: ${t.size.minWindowWidth}, height: ${t.size.minWindowHeight} } as const;
`,
);
