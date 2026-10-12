// Keeps the stated minimum browsers true. `npm run lint` runs it on the source; `npm run check:package`
// runs it with `--dist`, on the built stylesheet too (run `npm run build` first).
//
// Firefox and Safari are supported without automated tests (plan/decisions/06-docs-and-testing.md), so
// the support rests on two things: nothing newer than the minimums is used without a fallback (this
// script), and a person looks before a release (docs/browser-checks.md).
//
// How it works: every row of the tables below is one CSS or JavaScript feature, the first version of
// each browser that ships it, and a pattern that finds it. A feature that is found and is newer than a
// minimum fails, unless its row has a note that says what happens without it. A note on a feature
// that is not used, or that is not newer, fails too, so the table stays what the docs can quote.
//
// Versions: MDN browser-compat-data 8.1.5 (2026-10-08), by the key in each row
// (https://github.com/mdn/browser-compat-data; the same data as the tables on MDN and caniuse.com).
// Edge follows Chrome. `no` is "not shipped". To add a feature: look its key up there, add a row.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const withDist = process.argv.includes('--dist');

/**
 * The minimum versions (raised 2026-10-11: plan/decisions/06-docs-and-testing.md). README.md,
 * docs/getting-started.md and `cssTarget` in vite.config.ts state the same.
 */
const MINIMUM = { chrome: 117, firefox: 125, safari: 17 };

const no = Infinity;
/** A CSS property at the start of a declaration (so `user-select` is not found in `-webkit-user-select`). */
const prop = (names) => new RegExp(`(?:^|[{;\\s])(?:${names})\\s*:`, 'm');

// name, MDN key, [Chrome, Firefox, Safari], pattern, note (what happens without it)
const css = [
  // --- Used, and what the minimums are made of.
  ['container queries', 'css.at-rules.container', [105, 110, 16], /@container\b/],
  // The minifier writes `(max-width: 20em)` as `(width<=20em)`. No MDN key of its own: "the same range syntax
  // that's been part of Container Queries from its beginning" (webkit.org/blog/13966, on Safari 16.4).
  ['range syntax in @container', 'css.at-rules.container', [105, 110, 16], /@container[^{]*[<>]/],
  [
    'container query units',
    'css.types.length.container_query_length_units',
    [105, 110, 16],
    /[\d.]cq(?:[whib]|min|max)\b/,
  ],
  [':has()', 'css.selectors.has', [105, 121, 15.4], /:has\(/],
  ['color-mix()', 'css.types.color.color-mix', [111, 113, 16.2], /\bcolor-mix\(/],
  ['oklab() and oklch()', 'css.types.color.oklab', [111, 113, 15.4], /\bokl(?:ab|ch)\(/],
  [
    'dvh, svh and lvh units',
    'css.types.length.viewport_percentage_units_dynamic',
    [108, 101, 15.4],
    /[\d.][dsl]v(?:[hwbi]|min|max)\b/,
  ],
  ['subgrid', 'css.properties.grid-template-columns.subgrid', [117, 71, 16], /\bsubgrid\b/],
  [':focus-visible', 'css.selectors.focus-visible', [86, 85, 15.4], /:focus-visible/],
  [':is() and :where()', 'css.selectors.is', [88, 78, 14], /:(?:is|where)\(/],
  [
    'inset and its logical forms',
    'css.properties.inset',
    [87, 66, 14.1],
    prop('inset(?:-inline|-block)?(?:-start|-end)?'),
  ],
  [
    'logical margin, padding and border',
    'css.properties.margin-inline',
    [87, 66, 14.1],
    prop('(?:margin|padding|border)-(?:inline|block)(?:-[a-z-]+)?'),
  ],
  [
    'logical corner radius',
    'css.properties.border-start-start-radius',
    [89, 66, 15],
    prop('border-(?:start|end)-(?:start|end)-radius'),
  ],
  ['aspect-ratio', 'css.properties.aspect-ratio', [88, 89, 15], prop('aspect-ratio')],
  [
    'rotate, scale and translate properties',
    'css.properties.rotate',
    [104, 72, 14.1],
    prop('rotate|scale|translate'),
  ],
  [
    'overflow: clip',
    'css.properties.overflow.clip',
    [90, 81, 16],
    /overflow(?:-[xy]|-inline|-block)?\s*:\s*clip\b/,
  ],
  ['@supports selector()', 'css.at-rules.supports.selector', [83, 69, 14.1], /@supports[^{]*selector\(/],
  ['appearance', 'css.properties.appearance', [84, 80, 15.4], prop('appearance')],
  ['contain', 'css.properties.contain', [52, 69, 15.4], prop('contain')],
  ['@layer', 'css.at-rules.layer', [99, 97, 15.4], /@layer\b/],
  ['-webkit-line-clamp', 'css.properties.line-clamp', [6, 68, 5], /-webkit-line-clamp\s*:/],
  ['lh unit', 'css.types.length.lh', [109, 120, 16.4], /[\d.]lh\b/],
  // With the Popover API below, what sets the minimum Safari: the height of a chart that has none to fill.
  [
    'contain-intrinsic-size',
    'css.properties.contain-intrinsic-block-size',
    [95, 107, 17],
    prop('contain-intrinsic-(?:block-size|inline-size|size|width|height)'),
  ],

  // --- Used, and newer than a minimum: each says what happens without it.
  [
    'safe alignment',
    'css.properties.justify-content.flex_context.safe_unsafe',
    [115, 63, 17.6],
    /(?:justify|align|place)-(?:content|items|self)\s*:\s*safe\b/,
    'Safari before 17.6: EmptyState is centred by `justify-content: center` inside `@supports not (justify-content: safe center)`; content taller than its slot is then cut at both ends instead of the bottom only.',
  ],
  [
    'transition-behavior',
    'css.properties.transition-behavior',
    [117, 129, 17.4],
    prop('transition-behavior'),
    'Firefox before 129, Safari before 17.4: the scrollbar of an Accordion panel shows while the panel opens.',
  ],
  [
    'scrollbar-width',
    'css.properties.scrollbar-width',
    [121, 64, 18.2],
    prop('scrollbar-width'),
    'Chrome before 121 and Safari before 18.2 take the `::-webkit-scrollbar` rules instead; the declaration is inside `@supports not selector(::-webkit-scrollbar)`. Firefox 153 and 154 (not later) answer that `@supports` as Safari does without drawing the rules: they show their own scrollbars.',
  ],
  [
    'scrollbar-color',
    'css.properties.scrollbar-color',
    [121, 64, 26.2],
    prop('scrollbar-color'),
    'As scrollbar-width: Chrome before 121 and Safari take the `::-webkit-scrollbar` rules.',
  ],
  [
    'rx and ry as CSS properties',
    'css.properties.rx',
    [43, 69, 17.4],
    prop('rx|ry'),
    'Safari before 17.4 reads the `rx` attribute only: the bars of a BarChart keep the 2px corners of the attribute, and `--umbra-chart-bar-radius` changes nothing there (BarChart.tsx).',
  ],
  [
    'mask and mask-image without a prefix',
    'css.properties.mask',
    [120, 53, 15.4],
    prop('mask(?:-image)?'),
    'Chrome before 120 reads `-webkit-mask`, which the build adds beside it (checked below in the built stylesheet).',
  ],
  [
    'backdrop-filter without a prefix',
    'css.properties.backdrop-filter',
    [76, 103, 18],
    prop('backdrop-filter'),
    'Safari before 18 reads `-webkit-backdrop-filter`, which the build adds beside it (checked below).',
  ],
  [
    'user-select without a prefix',
    'css.properties.user-select',
    [54, 69, no],
    prop('user-select'),
    'Safari reads `-webkit-user-select`, which the build adds beside it (checked below).',
  ],
  [
    'line-clamp without a prefix',
    'css.properties.line-clamp',
    [no, no, no],
    prop('line-clamp'),
    'No browser reads it yet. It is always written after `-webkit-line-clamp`, which every browser reads.',
  ],

  // --- Not used. Newer than a minimum, so using one fails until it has a fallback and a note here.
  [
    ':dir()',
    'css.selectors.dir',
    [120, 49, 16.4],
    /:dir\(/,
    // No note on purpose. Write `.x:is([dir='rtl'], [dir='rtl'] *)`: see src/styles/index.css.
  ],
  ['nesting', 'css.selectors.nesting', [120, 117, 17.2], /[{;]\s*&|^\s*&/m],
  ['@property', 'css.at-rules.property', [85, 128, 16.4], /@property\b/],
  ['@scope', 'css.at-rules.scope', [118, 146, 26.4], /@scope\b/],
  ['@starting-style', 'css.at-rules.starting-style', [117, 129, 17.5], /@starting-style\b/],
  ['text-wrap', 'css.properties.text-wrap', [114, 121, 17.4], prop('text-wrap(?:-mode|-style)?')],
  ['light-dark()', 'css.types.color.light-dark', [123, 120, 17.5], /\blight-dark\(/],
  [
    'relative colour syntax',
    'css.types.color.rgb.relative_syntax',
    [122, 128, 18],
    /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*from\b/,
  ],
  [
    'anchor positioning',
    'css.properties.anchor-name',
    [125, 147, 26],
    /\banchor-name\s*:|\bposition-(?:anchor|area|try[a-z-]*)\s*:|\banchor(?:-size)?\(/,
  ],
  ['field-sizing', 'css.properties.field-sizing', [123, 152, 26.2], prop('field-sizing')],
  ['view transitions', 'css.properties.view-transition-name', [111, 144, 18], /view-transition/],
  [
    'interpolate-size and calc-size()',
    'css.properties.interpolate-size',
    [129, no, no],
    /\binterpolate-size\s*:|\bcalc-size\(/,
  ],
  ['scrollbar-gutter', 'css.properties.scrollbar-gutter', [94, 97, 18.2], prop('scrollbar-gutter')],
  ['range syntax in @media', 'css.at-rules.media.range_syntax', [104, 102, 16.4], /@media[^{]*[<>]/],
  [
    'container style queries',
    'css.at-rules.container.style_queries_for_custom_properties',
    [111, 151, 18],
    /@container[^{]*style\(/,
  ],
  [':popover-open', 'css.selectors.popover-open', [114, 125, 17], /:popover-open/],
  [':user-valid and :user-invalid', 'css.selectors.user-invalid', [119, 88, 16.5], /:user-(?:in)?valid/],
  [':state()', 'css.selectors.state', [125, 126, 17.4], /:state\(/],
  ['content-visibility', 'css.properties.content-visibility', [85, 125, 18], prop('content-visibility')],
  ['text-box', 'css.properties.text-box', [133, 154, 18.2], prop('text-box(?:-trim|-edge)?')],
  [
    'stretch as a size',
    'css.properties.width.stretch',
    [138, no, 27],
    /(?:^|[{;\s])(?:min-|max-)?(?:width|height|inline-size|block-size)\s*:\s*stretch\b/m,
  ],
  ['round(), mod() and rem()', 'css.types.round', [125, 118, 15.4], /\b(?:round|mod|rem)\(/],
  ['accent-color', 'css.properties.accent-color', [93, 92, 26.2], prop('accent-color')],
  [
    'scroll-driven animations',
    'css.properties.animation-timeline',
    [115, no, 26],
    /\b(?:animation|scroll|view)-timeline(?:-[a-z]+)?\s*:/,
  ],
  ['rlh unit', 'css.types.length.rlh', [111, 120, 16.4], /[\d.]rlh\b/],
  ['zoom', 'css.properties.zoom', [1, 126, 3.1], prop('zoom')],
];

const js = [
  // --- Used.
  [
    'Array findLast and findLastIndex',
    'javascript.builtins.Array.findLast',
    [97, 104, 15.4],
    /\.findLast(?:Index)?\(/,
  ],
  [
    'Array toSorted, toReversed and toSpliced',
    'javascript.builtins.Array.toSorted',
    [110, 115, 16],
    /\.to(?:Sorted|Reversed|Spliced)\(/,
  ],
  ['structuredClone', 'api.structuredClone', [98, 94, 15.4], /\bstructuredClone\(/],
  ['inert', 'api.HTMLElement.inert', [102, 112, 15.5], /\.inert\b|\binert=/],
  ['Element.getAnimations', 'api.Element.getAnimations', [84, 75, 13.1], /\.getAnimations\(/],
  // What sets the minimum Firefox: the chart tooltip is in the top layer (charts/internal/Frame.tsx).
  [
    'Popover API',
    'api.HTMLElement.popover',
    [114, 125, 17],
    /\.(?:show|hide)Popover\(|\bpopover=["'{]|:popover-open/,
  ],
  [
    'Navigation API',
    'api.Navigation',
    [102, 147, 26.2],
    /\bnavigation\.(?:navigate|addEventListener|currentEntry)\b|\.navigation\b/,
    'HistoryButtons only, read as `window.navigation` when it exists. Firefox before 147 and Safari before 26.2 cannot say whether there is a page to go back or forward to: both buttons stay enabled.',
  ],
  [
    'Intl.Locale text direction',
    'javascript.builtins.Intl.Locale.getTextInfo',
    [130, 153, 17],
    /\.getTextInfo\b|\.textInfo\b/,
    'Firefox before 153 has neither `getTextInfo()` nor `textInfo`: the direction then comes from the script of the locale (provider/direction.ts, unit-tested).',
  ],

  // --- Not used. Chromium only, or newer than a minimum.
  ['scrollIntoViewIfNeeded', 'api.Element.scrollIntoViewIfNeeded', [1, no, 3], /scrollIntoViewIfNeeded/],
  ['navigator.userAgentData', 'api.Navigator.userAgentData', [90, no, no], /userAgentData/],
  [
    'CSS Custom Highlight API',
    'api.CSS.highlights_static',
    [105, 140, 17.2],
    /CSS\.highlights|new Highlight\(/,
  ],
  [
    'Object.groupBy and Map.groupBy',
    'javascript.builtins.Object.groupBy',
    [117, 119, 17.4],
    /\b(?:Object|Map)\.groupBy\(/,
  ],
  [
    'Promise.withResolvers',
    'javascript.builtins.Promise.withResolvers',
    [119, 121, 17.4],
    /Promise\.withResolvers\(/,
  ],
  ['Promise.try', 'javascript.builtins.Promise.try', [128, 134, 18.2], /Promise\.try\(/],
  [
    'Set methods',
    'javascript.builtins.Set.union',
    [122, 127, 17],
    /\.(?:union|intersection|difference|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\(/,
  ],
  ['Iterator helpers', 'javascript.builtins.Iterator.from', [122, 131, 18.4], /\bIterator\.from\(/],
  ['RegExp.escape', 'javascript.builtins.RegExp.escape', [136, 134, 18.2], /RegExp\.escape\(/],
  [
    'lookbehind in a regular expression',
    'javascript.regular_expressions.lookbehind_assertion',
    [62, 78, 16.4],
    /\(\?<[=!]/,
  ],
  ['requestIdleCallback', 'api.Window.requestIdleCallback', [47, 55, no], /requestIdleCallback/],
  [
    'scheduler.postTask and scheduler.yield',
    'api.Scheduler.postTask',
    [94, 142, no],
    /\bscheduler\.(?:postTask|yield)\(/,
  ],
  ['Element.checkVisibility', 'api.Element.checkVisibility', [105, 106, 17.4], /\.checkVisibility\(/],
  ['View Transitions API', 'api.Document.startViewTransition', [111, 144, 18], /startViewTransition/],
  ['scrollend event', 'api.Element.scrollend_event', [114, 109, 26.2], /\bscrollend\b/],
  [
    'ResizeObserver device-pixel-content-box',
    'api.ResizeObserverEntry.devicePixelContentBoxSize',
    [84, 108, no],
    /devicePixelContentBoxSize|device-pixel-content-box/,
  ],
  ['AbortSignal.any', 'api.AbortSignal.any_static', [116, 124, 17.4], /AbortSignal\.any\(/],
  ['Intl.Segmenter', 'javascript.builtins.Intl.Segmenter', [87, 125, 14.1], /Intl\.Segmenter/],
  [
    'Intl.DurationFormat',
    'javascript.builtins.Intl.DurationFormat',
    [129, 136, 16.4],
    /Intl\.DurationFormat/,
  ],
  ['Array.fromAsync', 'javascript.builtins.Array.fromAsync', [121, 115, 16.4], /Array\.fromAsync\(/],
  [
    'String isWellFormed and toWellFormed',
    'javascript.builtins.String.isWellFormed',
    [111, 119, 16.4],
    /\.(?:is|to)WellFormed\(/,
  ],
  ['Temporal', 'javascript.builtins.Temporal', [144, 139, no], /\bTemporal\.[A-Z]/],
  ['CloseWatcher', 'api.CloseWatcher', [126, 149, no], /\bCloseWatcher\b/],
  [
    'focus({ focusVisible })',
    'api.HTMLElement.focus.options_focusVisible_parameter',
    [145, 104, 18.4],
    /\bfocusVisible\s*:/,
  ],
  [
    'Element.computedStyleMap',
    'api.Element.computedStyleMap',
    [66, no, 16.4],
    /computedStyleMap/,
    'carryTokens (overlays/shared.ts) only, called when it exists: Chromium lists custom properties there and not in getComputedStyle. Firefox lists them in getComputedStyle, which is read as well.',
  ],
  [
    'constructable stylesheets',
    'api.Document.adoptedStyleSheets',
    [73, 101, 16.4],
    /adoptedStyleSheets|\.replaceSync\(/,
  ],
];

/**
 * A prefixed twin the built stylesheet must hold in the same rule: the source writes the standard
 * property only, and Lightning CSS adds the prefix for the `cssTarget` of vite.config.ts.
 */
const prefixed = ['mask', 'mask-image', 'backdrop-filter', 'user-select'];

// --- Reading -----------------------------------------------------------------------------------------

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const read = (path) => readFileSync(path, 'utf8');
const noComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ');
const source = walk(join(root, 'src'));
// Stories, samples and tests are not published (`npm run check:package` checks that).
const published = (path) =>
  !/[/\\]stories[/\\]|\.stories\.|\.test\.|[/\\](?:samples|story)[^/\\]*$/.test(path);

const sheets = source
  .filter((path) => path.endsWith('.css'))
  .map((path) => [relative(root, path), noComments(read(path))]);
const built = join(root, 'dist/styles.css');
if (withDist && !existsSync(built)) {
  console.error('check:browsers: dist/styles.css is missing. Run: npm run build');
  process.exit(1);
}
if (withDist) sheets.push(['dist/styles.css', noComments(read(built))]);
const scripts = source
  .filter((path) => /\.tsx?$/.test(path) && published(path) && !path.endsWith('.generated.ts'))
  // Line comments too. A `//` inside a string ends the line early, which only hides what follows it.
  .map((path) => [relative(root, path), noComments(read(path)).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')]);

// --- Checking ----------------------------------------------------------------------------------------

const failures = [];
const names = ['Chrome', 'Firefox', 'Safari'];
const minimum = [MINIMUM.chrome, MINIMUM.firefox, MINIMUM.safari];
const used = { newer: [], within: 0 };

for (const [kind, table, files] of [
  ['CSS', css, sheets],
  ['JavaScript', js, scripts],
]) {
  for (const [name, key, versions, pattern, note] of table) {
    const found = files.filter(([, text]) => pattern.test(text)).map(([path]) => path);
    const late = versions
      .map((version, i) =>
        version > minimum[i] ? `${names[i]} ${version === no ? 'never' : version}` : null,
      )
      .filter(Boolean);
    if (note && !late.length)
      failures.push(`${name}: has a note but is not newer than the minimums. Remove the note.`);
    if (note && !found.length)
      failures.push(`${name}: has a note but is not used any more. Remove the note.`);
    if (!found.length) continue;
    if (!late.length) used.within++;
    else if (note) used.newer.push([name, late.join(', '), note]);
    else
      failures.push(
        `${kind}: ${name} needs ${late.join(', ')} (${key}); the minimums are Chrome ${MINIMUM.chrome}, Firefox ${MINIMUM.firefox}, Safari ${MINIMUM.safari}.\n` +
          `    in ${found.slice(0, 6).join(', ')}${found.length > 6 ? `, and ${found.length - 6} more` : ''}\n` +
          '    Give it a fallback and a note in scripts/check-browsers.mjs, or ask the owner to raise the minimum.',
      );
  }
}

// The same versions everywhere they are stated.
const stated = {
  'README.md': [/\| Chrome and Edge\s*\| (\S+)/, /\| Firefox\s*\| (\S+)/, /\| Safari\s*\| (\S+)/],
  'docs/getting-started.md': [
    /\| Chrome and Edge\s*\| (\S+)/,
    /\| Firefox\s*\| (\S+)/,
    /\| Safari\s*\| (\S+)/,
  ],
  'vite.config.ts': [
    /cssTarget:[^\]]*'chrome([\d.]+)'[^\]]*'edge\1'/,
    /cssTarget:[^\]]*'firefox([\d.]+)'/,
    /cssTarget:[^\]]*'safari([\d.]+)'/,
  ],
};
for (const [file, patterns] of Object.entries(stated)) {
  const text = read(join(root, file));
  patterns.forEach((pattern, i) => {
    const version = pattern.exec(text)?.[1];
    if (Number(version) !== minimum[i])
      failures.push(`${file}: states ${names[i]} ${version ?? '(nothing)'}, the check holds ${minimum[i]}.`);
  });
}

if (withDist) {
  const sheet = sheets.at(-1)[1];
  // Lightning CSS rewrites a selector the targets lack. `:dir(rtl)` becomes `:lang(ar, he, …)`, which
  // misses a page that sets `dir` without such a `lang`.
  if (/:lang\(/.test(sheet))
    failures.push(
      'dist/styles.css: holds `:lang()`, which no source file writes: the minifier rewrote a selector.',
    );
  for (const rule of sheet.match(/\{[^{}]*\}/g) ?? [])
    for (const name of prefixed)
      if (prop(name).test(rule) && !rule.includes(`-webkit-${name}:`))
        failures.push(`dist/styles.css: \`${name}\` without \`-webkit-${name}\` in ${rule.slice(0, 80)}`);
}

if (failures.length) {
  console.error(failures.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(
  `check:browsers: ${sheets.length} stylesheets and ${scripts.length} modules hold to Chrome ${MINIMUM.chrome}, Firefox ${MINIMUM.firefox}, Safari ${MINIMUM.safari}` +
    ` (${used.within} features within them, ${used.newer.length} newer with a fallback or a note${withDist ? '; built stylesheet included' : ''})`,
);
if (process.argv.includes('--list'))
  for (const [name, late, note] of used.newer) console.log(`- ${name} (${late}): ${note}`);
