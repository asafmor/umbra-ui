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
// The tables are a denylist: they find only what somebody thought of. So, for CSS, there is also the
// other way round (`known`, below the tables): every at-rule, pseudo-class, pseudo-element, function,
// property, unit and query feature the stylesheets use must be on a list of names that were looked
// up. A name that is not on it fails, whatever it is, until a person looks its versions up and adds
// it. JavaScript has the denylist only (see the note above its table).
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
    'paint-order on HTML text',
    'css.properties.paint-order',
    [123, 60, 11],
    prop('paint-order'),
    'Used on SVG text only (the labels drawn on chart marks), where Chrome has had it since 35. Chrome before 123 ignores it on HTML text, where the library does not use it.',
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
  ['@function', 'css.at-rules.function', [139, no, no], /@function\b/],
  ['@view-transition', 'css.at-rules.view-transition', [126, no, 18.2], /@view-transition\b/],
  ['@position-try', 'css.at-rules.position-try', [125, 147, 26], /@position-try\b/],
  ['corner-shape', 'css.properties.corner-shape', [139, no, no], prop('corner(?:-[a-z-]+)?-shape')],
  [
    'sibling-index() and sibling-count()',
    'css.types.sibling-index',
    [138, 154, 26.2],
    /\bsibling-(?:index|count)\(/,
  ],
  ['if()', 'css.types.if', [137, no, no], /[:\s,(]if\(/],
  [
    'scroll-state() container queries',
    'css.at-rules.container.scroll-state_queries',
    [133, no, no],
    /\bscroll-state\(|container-type\s*:[^;}]*scroll-state/,
  ],
  ['::details-content', 'css.selectors.details-content', [131, 143, 18.4], /::details-content/],
  [':open', 'css.selectors.open', [133, 136, 26.5], /:open\b/],
  [
    'reading-flow and reading-order',
    'css.properties.reading-flow',
    [137, no, no],
    prop('reading-(?:flow|order)'),
  ],
  [
    'text-wrap: pretty',
    'css.properties.text-wrap.pretty',
    [117, no, 26],
    /text-wrap(?:-style)?\s*:\s*pretty\b/,
  ],
  [
    'text-wrap: balance',
    'css.properties.text-wrap.balance',
    [114, 121, 17.5],
    /text-wrap(?:-style)?\s*:\s*balance\b/,
  ],
  ['overlay', 'css.properties.overlay', [117, no, no], prop('overlay')],
  ['interactivity', 'css.properties.interactivity', [135, no, no], prop('interactivity')],
  ['text-autospace', 'css.properties.text-autospace', [140, 145, 18.4], prop('text-autospace')],
  ['margin-trim', 'css.properties.margin-trim', [155, no, 16.4], prop('margin-trim')],
  [
    'box-decoration-break',
    'css.properties.box-decoration-break',
    [130, 32, no],
    prop('box-decoration-break'),
  ],
  [
    'white-space-collapse',
    'css.properties.white-space-collapse',
    [114, 124, 17.4],
    prop('white-space-collapse'),
  ],
  // `attr(name)` in `content` is as old as CSS 2; a fallback or a type after the name is not.
  ['attr() with a fallback', 'css.types.attr.fallback', [133, 119, 18.4], /\battr\(\s*[\w-]+\s*,/],
  ['attr() with a type', 'css.types.attr.type_function', [133, 155, no], /\battr\(\s*[\w-]+\s+[\w%]/],
  ['progress()', 'css.types.progress', [138, 155, 26], /[:\s,(]progress\(/],
  ['random()', 'css.types.random', [156, no, 26.2], /[:\s,(]random\(/],
  ['contrast-color()', 'css.types.color.contrast-color', [147, 146, 26], /\bcontrast-color\(/],
  ['abs() and sign()', 'css.types.abs', [138, 118, 15.4], /[:\s,(](?:abs|sign)\(/],
  [
    'pow(), sqrt(), hypot(), log() and exp()',
    'css.types.exp',
    [120, 118, 15.4],
    /[:\s,(](?:pow|sqrt|hypot|log|exp)\(/,
  ],
  ['linear() easing', 'css.types.easing-function.linear-function', [113, 112, 17.2], /[:\s,]linear\(/],
  ['cap and rcap units', 'css.types.length.cap', [118, 97, 17.2], /\dr?cap\b/],
  ['rex and rch units', 'css.types.length.rex', [111, 147, 17.2], /\dr(?:ex|ch)\b/],
  [
    'prefers-reduced-transparency',
    'css.at-rules.media.prefers-reduced-transparency',
    [118, no, no],
    /prefers-reduced-transparency/,
  ],
  [
    'scroll markers and buttons',
    'css.selectors.scroll-marker',
    [135, no, no],
    /::scroll-(?:marker|button)|scroll-marker-group\s*:/,
  ],
  [
    'customisable select',
    'css.selectors.picker',
    [135, no, 27],
    /::picker\(|::picker-icon|::checkmark|appearance\s*:\s*base-select/,
  ],
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
  [
    'scroll-driven animation ranges',
    'css.properties.animation-range',
    [115, no, 26],
    /\banimation-range(?:-start|-end)?\s*:|\btimeline-scope\s*:/,
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

// ponytail: a denylist only. Listing every member name the modules use, as `known` does for CSS,
// would put some two thousand names of React, React Aria and the library's own objects on a list
// nobody reads. The names below are what shipped in a browser after the minimums and that a
// component could plausibly reach for; the manual run in Firefox and Safari is the other guard.
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
  [
    // `map`, `filter`, `take` and the rest, called on an iterator. An iterator cannot be told from an
    // array by a pattern in general: what is found is a call on what `values()`, `keys()`,
    // `entries()` or `matchAll()` returns (not `Object.keys()` and its like, which return arrays),
    // `Iterator.from`, `Iterator.prototype` and `toArray()` (not React's `Children.toArray`).
    'Iterator helpers',
    'javascript.builtins.Iterator.map',
    [122, 131, 18.4],
    /\bIterator\.(?:from|prototype|concat|zip)\b|(?<!Object)\.(?:values|keys|entries|matchAll)\([^()]*\)\s*\.(?:map|filter|take|drop|flatMap|reduce|toArray|forEach|some|every|find)\(|(?<!Children)\.toArray\(/,
  ],
  ['Node.moveBefore', 'api.Element.moveBefore', [133, 144, no], /\.moveBefore\(/],
  [
    'popover="hint"',
    'html.global_attributes.popover.hint',
    [151, 153, no],
    /popover\s*[=:]\s*\{?\s*["'`]hint/,
  ],
  ['dialog.requestClose', 'api.HTMLDialogElement.requestClose', [134, 139, 18.4], /\.requestClose\(/],
  ['dialog closedby', 'api.HTMLDialogElement.closedBy', [134, 141, no], /\bclosedby\b|\bclosedBy\b/],
  [
    'command and commandfor',
    'html.elements.button.commandfor',
    [135, 144, 26.2],
    /\bcommandfor\b|\bcommandFor(?:Element)?\b|\bCommandEvent\b/,
  ],
  [
    'Map and WeakMap getOrInsert',
    'javascript.builtins.Map.getOrInsert',
    [145, 144, 26.2],
    /\.getOrInsert(?:Computed)?\(/,
  ],
  ['Math.sumPrecise', 'javascript.builtins.Math.sumPrecise', [147, 137, 26.2], /Math\.sumPrecise\(/],
  ['Error.isError', 'javascript.builtins.Error.isError', [134, 138, no], /Error\.isError\(/],
  [
    'Uint8Array base64 and hex',
    'javascript.builtins.Uint8Array.fromBase64',
    [140, 133, 18.2],
    /\.(?:fromBase64|toBase64|fromHex|toHex)\(/,
  ],
  [
    'explicit resource management',
    'javascript.statements.using',
    [134, 141, no],
    /^\s*(?:await\s+)?using\s+\w+\s*=|Symbol\.(?:async)?[dD]ispose|DisposableStack/m,
  ],
  ['URL.parse', 'api.URL.parse_static', [126, 126, 18], /\bURL\.parse\(/],
  [
    'Element.getHTML and setHTMLUnsafe',
    'api.Element.getHTML',
    [125, 128, 18],
    /\.getHTML\(|\.setHTMLUnsafe\(|parseHTMLUnsafe/,
  ],
  ['Element.ariaNotify', 'api.Element.ariaNotify', [141, 150, 27], /\.ariaNotify\(/],
  [
    'ARIA element reflection',
    'api.Element.ariaLabelledByElements',
    [135, 136, 16.4],
    /\.aria[A-Z]\w*Elements?\b/,
  ],
  [
    'caretPositionFromPoint',
    'api.Document.caretPositionFromPoint',
    [128, 20, 26.2],
    /caretPositionFromPoint/,
  ],
  ['hidden="until-found"', 'api.Element.beforematch_event', [102, 139, 26.2], /until-found|beforematch/],
  [
    'IntersectionObserver scrollMargin',
    'api.IntersectionObserver.scrollMargin',
    [120, 141, 26],
    /\bscrollMargin\s*:/,
  ],
  ['Selection.getComposedRanges', 'api.Selection.getComposedRanges', [137, 142, 17], /getComposedRanges/],
  [
    'Intl.Locale week info',
    'javascript.builtins.Intl.Locale.getWeekInfo',
    [130, 153, 17],
    /\.getWeekInfo\b|\.weekInfo\b/,
  ],
  ['Float16Array', 'javascript.builtins.Float16Array', [135, 129, 18.2], /Float16Array|Math\.f16round/],
  ['select.showPicker', 'api.HTMLSelectElement.showPicker', [121, 122, no], /\.showPicker\(/],
  [
    'document.activeViewTransition',
    'api.Document.activeViewTransition',
    [142, 147, 26.2],
    /activeViewTransition/,
  ],
  ['EditContext', 'api.EditContext', [121, no, no], /\bEditContext\b/],
  [
    'Document Picture-in-Picture',
    'api.Window.documentPictureInPicture',
    [116, 151, no],
    /documentPictureInPicture/,
  ],
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
 * What the stylesheets are known to use: every name here was looked up (browser-compat-data 8.1.5,
 * on 2026-10-12) and is within the minimums, or is newer and has a row with a note in the table
 * above. A name the stylesheets use that is not here fails. To add one: look up its first versions;
 * within the minimums, add the name here; newer, give it a fallback and a row with a note above,
 * then add it here. `node scripts/check-browsers.mjs --dist --known` prints what is used now, in
 * this shape. A name nothing uses any more fails too (with `--dist`), so the list stays true.
 *
 * ponytail: names only. The keyword values of a known property (`text-wrap: pretty`, `width:
 * stretch`) are found by the rows above and by nothing else.
 */
const known = {
  // `import` in the source only: the build inlines it.
  'at-rule': 'container import keyframes media supports',
  // `after` and `before` with one colon are what the minifier writes for the pseudo-elements.
  // `global` is CSS Modules' own, gone from the built stylesheet.
  'pseudo-class':
    'active after before disabled empty enabled first-child first-of-type focus focus-visible focus-within global has hover is last-child last-of-type not nth-child root where',
  // The `-webkit-` ones style what only Chrome and Safari draw (spin buttons, the search field's
  // own button, the scrollbars before `scrollbar-width`): Firefox skips the rules.
  'pseudo-element':
    '-webkit-inner-spin-button -webkit-outer-spin-button -webkit-scrollbar -webkit-scrollbar-corner -webkit-scrollbar-thumb -webkit-search-cancel-button -webkit-search-decoration after before placeholder',
  function:
    'attr brightness calc color-mix counter cubic-bezier fit-content inset linear-gradient max min minmax oklab polygon radial-gradient repeat repeating-linear-gradient rgba selector var',
  // The `-webkit-` ones: twins the build adds (checked below), the two halves of the line clamp
  // every browser reads, and font smoothing, which only macOS browsers read. `composes` is CSS
  // Modules' own, gone from the built stylesheet.
  property:
    '-webkit-backdrop-filter -webkit-box-orient -webkit-font-smoothing -webkit-line-clamp -webkit-mask -webkit-mask-image -webkit-text-decoration -webkit-user-select align-content align-items align-self animation animation-name appearance aspect-ratio backdrop-filter background background-clip background-color block-size border border-block border-block-end border-block-start border-bottom border-bottom-color border-collapse border-color border-end-end-radius border-end-start-radius border-inline border-inline-end border-inline-start border-inline-start-color border-inline-start-width border-inline-width border-radius border-spacing border-start-end-radius border-start-start-radius border-style border-top border-width bottom box-shadow box-sizing break-inside clip-path color column-gap column-width composes contain contain-intrinsic-block-size contain-intrinsic-inline-size container container-type content counter-increment counter-reset cursor direction display fill fill-opacity filter flex flex-basis flex-direction flex-flow flex-shrink flex-wrap font font-size font-variant-numeric font-weight gap grid-area grid-auto-columns grid-auto-flow grid-column grid-row grid-template grid-template-columns grid-template-rows height inline-size inset inset-block inset-block-end inset-block-start inset-inline inset-inline-end inset-inline-start isolation justify-content justify-items justify-self left letter-spacing line-clamp line-height list-style margin margin-block margin-block-end margin-block-start margin-bottom margin-inline margin-inline-end margin-inline-start margin-top mask mask-image max-block-size max-height max-inline-size max-width min-block-size min-height min-inline-size min-width object-fit opacity order outline outline-color outline-offset overflow overflow-wrap overflow-x overflow-y padding padding-block padding-block-end padding-block-start padding-bottom padding-inline padding-inline-end padding-inline-start padding-top paint-order place-content place-items pointer-events position resize rotate row-gap rx scale scroll-margin scroll-margin-top scroll-snap-align scroll-snap-type scrollbar-color scrollbar-width shape-rendering stroke stroke-dasharray stroke-linecap stroke-linejoin stroke-width table-layout text-align text-decoration text-overflow text-transform text-underline-offset top touch-action transform-box transform-origin transition transition-behavior transition-delay transition-timing-function translate user-select vector-effect vertical-align visibility white-space width z-index',
  unit: '% ch cqi deg dvh dvw em fr lh ms px rem s vh vmax vw',
  // Of `@media` and `@container`.
  'query feature': 'height max-height max-width prefers-reduced-motion width',
};

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
const codeComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ');
const source = walk(join(root, 'src'));
// Stories, samples and tests are not published (`npm run check:package` checks that).
const published = (path) =>
  !/[/\\]stories[/\\]|\.stories\.|\.test\.|[/\\](?:samples|story)[^/\\]*$/.test(path);

// Strings and the content of `url()` are emptied: a data URL holds `;` and `:` of its own.
const noComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""')
    .replace(/url\([^)]*\)/g, 'url()');
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
  .map((path) => [relative(root, path), codeComments(read(path)).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')]);

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

// What the stylesheets use, by name, against `known`.
const featuresOf = (text) => {
  const found = Object.fromEntries(Object.keys(known).map((kind) => [kind, new Set()]));
  const inValue = (value) => {
    for (const [, name] of value.matchAll(/(?<![\w-])(-?[a-z][a-z0-9-]*)\(/gi))
      found.function.add(name.toLowerCase());
    // Not a hex colour (`#1e1e2a`), not the `e` of an exponent (`5.9e-8`).
    for (const [, unit] of value
      .replace(/#[0-9a-f]{3,8}\b/gi, '')
      .matchAll(/(?<![\w#-])(?:\d*\.)?\d+(?:e[+-]?\d+)?([a-z%]+)/gi))
      if (unit !== 'e') found.unit.add(unit.toLowerCase());
  };
  // What stands before a `{`: a selector, or an at-rule with its condition.
  for (const [, prelude] of text.matchAll(/(?:^|[{};])([^{};]+)(?=\{)/g)) {
    const at = /^\s*@([a-z-]+)/i.exec(prelude);
    if (!at) {
      for (const [, name] of prelude.matchAll(/::([a-z-]+)/gi)) found['pseudo-element'].add(name);
      for (const [, name] of prelude.matchAll(/(?<!:):([a-z-]+)/gi)) found['pseudo-class'].add(name);
      continue;
    }
    found['at-rule'].add(at[1]);
    inValue(prelude.replace(/^\s*@[a-z-]+/i, ''));
    if (/^(?:media|container)$/.test(at[1]))
      for (const [, name] of prelude.matchAll(/\(\s*([a-z-]+)\s*(?=[:<>=)])/gi))
        found['query feature'].add(name);
  }
  // An at-rule without a block (`@import`).
  for (const [, at] of text.matchAll(/(?:^|[{};])\s*@([a-z-]+)[^{};]*;/gi)) found['at-rule'].add(at);
  for (const [, name, value] of text.matchAll(/[{;]\s*(-?-?[a-z][\w-]*)\s*:([^;{}]*)(?=[;}])/gi)) {
    if (!name.startsWith('--')) found.property.add(name.toLowerCase());
    inValue(value);
  }
  return found;
};
const usedNames = Object.fromEntries(Object.keys(known).map((kind) => [kind, new Map()]));
for (const [path, text] of sheets)
  for (const [kind, names] of Object.entries(featuresOf(text)))
    for (const name of names) usedNames[kind].set(name, [...(usedNames[kind].get(name) ?? []), path]);
if (process.argv.includes('--known')) {
  for (const [kind, names] of Object.entries(usedNames))
    console.log(`  '${kind}': '${[...names.keys()].sort().join(' ')}',`);
  process.exit(0);
}
for (const [kind, names] of Object.entries(usedNames)) {
  const list = new Set(known[kind].split(' '));
  for (const [name, paths] of names)
    if (!list.has(name))
      failures.push(
        `CSS: the ${kind} \`${name}\` is not on the list of what the stylesheets are known to use (in ${paths.slice(0, 3).join(', ')}).\n` +
          `    Look up the first Chrome, Firefox and Safari that ship it (MDN browser-compat-data). Within Chrome ${MINIMUM.chrome}, Firefox ${MINIMUM.firefox}, Safari ${MINIMUM.safari}: add it to \`known\` in scripts/check-browsers.mjs. Newer: a fallback, and a row with a note, first.`,
      );
  if (withDist)
    for (const name of list)
      if (!names.has(name))
        failures.push(
          `CSS: \`known\` lists the ${kind} \`${name}\`, which no stylesheet uses any more. Remove it.`,
        );
}
// `align-content` on a block container (Chrome 123, Safari 17.4; css.properties.align-content.context_block)
// reads the same as on a flex or grid container, which every browser has: the rule must be one.
for (const [path, text] of sheets)
  for (const rule of path === 'dist/styles.css' ? [] : (text.match(/\{[^{}]*\}/g) ?? []))
    if (
      /(?:^|[{;\s])(?:align|place)-content\s*:/.test(rule) &&
      !/display\s*:\s*(?:inline-)?(?:flex|grid)\b/.test(rule)
    )
      failures.push(
        `CSS: ${path} sets align-content in a rule that is not \`display: flex\` or \`grid\`. On a block it needs Chrome 123 and Safari 17.4 (css.properties.align-content.context_block): set the display in the same rule, or centre another way.`,
      );

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
