# Getting started

From an empty Vite app to a full-window screen in six steps.

## 1. Install

```sh
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install umbra-ui
npm install @fontsource/figtree @fontsource/barlow-condensed lucide-react
```

<!-- pre-release: remove at 0.1.0 -->

> **Not on npm yet.** Until `0.1.0` is published, the third line is
> `npm install github:asafmor/umbra-ui`. It downloads the repository and builds the package on your machine,
> so it takes a few minutes.

<!-- /pre-release -->

- React 19 or later, in a current browser ([browser support](#browser-support)).
- The package is ESM only and ships its types.
- The two fonts are yours to load. Any way of loading Figtree and Barlow Condensed works; without them
  the text falls back to system fonts.
- `lucide-react` is the icon set the library uses inside. Install it to use the same icons in your own
  buttons and cards, as the samples do. Any icon set works: an icon prop takes any node.

## 2. Load the stylesheet and fonts, once

Replace `src/main.tsx` with this, and delete the template's `index.css` and `App.css`: their colours
and centring fight the library's.

```tsx
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
import 'umbra-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Nothing else is needed in the page: no reset, no sizes on `html` or `body`. The shell fixes itself to
the window.

## 3. Wrap the app in the provider

Replace `src/App.tsx`. Every umbra-ui component must be inside one `UmbraProvider`.

```tsx
import { AppShell, Card, Page, TopBar, UmbraProvider } from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider brand="#2a2f8f" context="violet" density="default">
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Hello">This card fills the page. The page never scrolls.</Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

`npm run dev` now shows a brand-coloured bar and one card that fills the rest of the window.

| Prop            | Values                                            | Effect                                                                            |
| --------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `brand`         | a hex or `rgb()` colour                           | The colour of the top bar. Text on it is light or dark, whichever contrasts more. |
| `context`       | `violet`, `teal`, `green`, `slate`, or any colour | The tint of the page background and of tinted cards.                              |
| `density`       | `compact`, `default`, `spacious`                  | Spacing, row heights and text sizes.                                              |
| `tokens`        | `{ 'radius-card': '12px' }`                       | Overrides single tokens (CSS variables, without the `--umbra-` prefix).           |
| `icons`         | `{ search: <MyIcon /> }`                          | Replaces built-in icons by name.                                                  |
| `shortcuts`     | `[{ id, keys: 'Mod+S', label, action }]`          | Your key bindings. `Mod` is Command on macOS, Ctrl elsewhere.                     |
| `reducedMotion` | `system`, `always`, `never`                       | `system` follows the operating system.                                            |
| `locale`        | `en-GB`                                           | Language, number format and text direction.                                       |

Selected things and the primary action follow the brand: violet and magenta by default, and derived
from your `brand` when you set one. `interaction` and `action` set them directly, and `surfaceOpacity`
makes cards translucent over the app background. [Theming](theming.md) has the rest.

## 4. Build the frame

```tsx
import { Bell, CircleHelp, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  AppShell,
  Card,
  Columns,
  CommandPalette,
  ContextBlock,
  EntitySwitcher,
  IconButton,
  Page,
  PrimaryAction,
  PrimaryNav,
  ShortcutsSheet,
  SubNav,
  TopBar,
  UmbraProvider,
  type NavItem,
} from 'umbra-ui';

const sections: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'reports', label: 'Reports', items: [{ id: 'monthly', label: 'Monthly' }] },
];
const pages: NavItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'activity', label: 'Activity' },
];
const regions = ['North', 'South', 'West'].map((label) => ({ id: label, label }));

export function App() {
  const [section, setSection] = useState('overview');
  const [page, setPage] = useState('summary');
  const [region, setRegion] = useState('North');

  return (
    <UmbraProvider brand="#2a2f8f">
      <AppShell
        topBar={
          <TopBar
            logo="U"
            history
            nav={<PrimaryNav items={sections} value={section} onChange={setSection} />}
            commandPalette={
              <CommandPalette
                commands={sections.map((s) => ({
                  id: s.id,
                  label: String(s.label),
                  section: 'Go to',
                  onRun: () => setSection(s.id),
                }))}
              />
            }
            actions={
              <>
                <IconButton icon={<Bell />} label="Notifications" badge={3} />
                <ShortcutsSheet trigger={<IconButton icon={<CircleHelp />} label="Keyboard shortcuts" />} />
              </>
            }
            context={<ContextBlock primary={`Region ${region}`} secondary="Quarter close in 6 days" live />}
            primaryAction={<PrimaryAction label="New order" icon={<Plus />} />}
          />
        }
        subNav={
          <SubNav
            start={<EntitySwitcher aria-label="Region" items={regions} value={region} onChange={setRegion} />}
            label="Overview"
            items={pages}
            value={page}
            onChange={setPage}
          />
        }
      >
        <Page>
          <Columns>
            <Card title="Inbox">A long list scrolls inside its card.</Card>
            <Card title={`${section} / ${page}`} size={2}>
              Twice the width of its sibling.
            </Card>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- `AppShell` is exactly the size of the window and never scrolls.
- Navigation items are `{ id, label, href?, icon?, items?, disabled? }`. `items` makes a dropdown.
- `history` adds back and forward buttons. `commandPalette` adds the search trigger; `Mod+K` opens it.
- `context` is the status at the end of the bar. `ContextBlock` gives it two lines and a chip: `live`
  makes the chip a clock, `time` shows one moment, `chip` any short value.
- `start` of the `SubNav` is the place for an `EntitySwitcher`: the thing the whole page is about, with
  steps to the one before and after it and a picker with a search.
- A mounted `ShortcutsSheet` lists every shortcut that has a label, and `?` opens it
  ([recipe](recipes.md#17-a-tour-and-the-sheet-of-shortcuts)).
- With a router, give the items `href` and pass `renderLink` to the navs
  ([recipe](recipes.md#11-the-shell-with-a-router)).
- As the window narrows the bars shed content in a fixed order; nothing wraps or overflows.
- A `Page` holds one `Columns`, `Stack` or `Card`. [Layout](layout.md) explains how they share the space.

## 5. Change one part of the screen

`UmbraScope` takes the same `context`, `density`, `brand` and `tokens` for one subtree:

```tsx
<UmbraScope density="compact" context="teal">
  <Card title="Dense table" />
</UmbraScope>
```

A `Page` also takes `context`, and the frame around it follows.

## 6. Customise a component

Try these in order and stop at the first that is enough.

| Layer  | For                       | Example                                                                       |
| ------ | ------------------------- | ----------------------------------------------------------------------------- |
| Tokens | The look                  | `tokens={{ 'card-radius': '0px' }}` or `--umbra-card-radius: 0` in your CSS   |
| Props  | Variants and behaviour    | `<Card title="Budget" tone="neutral" collapsible />`                          |
| Parts  | Replace or hide one piece | `<Card parts={{ footer: <Card.Footer>12 items</Card.Footer> }} />`            |
| Blocks | Build your own version    | `<Card.Root><Card.Header>…</Card.Header><Card.Body>…</Card.Body></Card.Root>` |

A part takes a node (replace it), `null` (hide it) or a function that receives the default part's props.
[Customisation](customisation.md) takes one example through all four.

## What is in the box

| Group    | Components                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout   | `AppShell`, `Page`, `Columns`, `Stack`, `Slot`, `Card`, `SectionTitle`, `ScrollArea`, `Accordion`, `WidgetBoard`, `HorizontalScroller`                                                                         |
| Shell    | `TopBar`, `PrimaryNav`, `SubNav`, `VerticalNav`, `PageHeader`, `PrimaryAction`, `HistoryButtons`, `ShortcutBar`, `ContextBlock`, `EntitySwitcher`                                                              |
| Data     | `List`, `ListItem`, `DataTable`, `KeyValue`, `StatValue`, `SummaryTile`, `Tag`, `Badge`, `ValuePill`, `Avatar`, `MediaCard`, `Comparison`, and more                                                            |
| Time     | `Planner`, `WeekStrip`, `ScheduleSlot`, `DateChip`                                                                                                                                                             |
| Meters   | `ProgressBar`, `LevelMeter`, `PieIndicator`, `DivergingMeter`                                                                                                                                                  |
| Charts   | `LineChart`, `BarChart`, `DonutChart`, `RadarChart`, `Sparkline`, `Heatmap`, `Scatter`, from `umbra-ui/charts`                                                                                                 |
| Inputs   | `Button`, `IconButton`, `TextField`, `SearchField`, `Select`, `Checkbox`, `RadioGroup`, `Toggle`, `FormField`, `Tabs`, `SegmentedFilter`, `Slider`, `Stepper`, `StarRating`, `SplitButton`, `ColorScaleEditor` |
| Overlays | `Modal`, `ConfirmDialog`, `Popover`, `Menu`, `Tooltip`, `CommandPalette`, `ActionBar`, `Spotlight`, `ShortcutsSheet`                                                                                           |

The [README](../README.md#components) has one line on each.

## Browser support

The stylesheet relies on current CSS and has no fallbacks for older browsers.

| Browser         | Minimum | Set by                                          |
| --------------- | ------- | ----------------------------------------------- |
| Chrome and Edge | 117     | subgrid                                         |
| Firefox         | 125     | The Popover API                                 |
| Safari          | 17.0    | The Popover API, `contain-intrinsic-block-size` |

| Feature                               | Used for                                                         | Without it                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `color-mix()` in `oklab`              | Tints, hover and pressed colours, borders                        | Required: those colours are missing                                                                                        |
| `:has()`                              | States that depend on a child (a hovered trigger)                | Required                                                                                                                   |
| Container queries                     | Showing less as a component narrows                              | Required: content is cut instead                                                                                           |
| `dvh` and `dvw` units                 | The shell is exactly the window                                  | Required                                                                                                                   |
| Subgrid                               | One label column for every row of a `KeyValueList`               | Degrades: each row sizes its own label. Chrome 111 is enough.                                                              |
| `transition-behavior: allow-discrete` | Hiding the scrollbar while an `Accordion` panel opens            | Degrades: the scrollbar shows during the transition                                                                        |
| `scrollbar-color`, `scrollbar-width`  | Thin scrollbars in Firefox                                       | Degrades: Chrome before 121 and Safari take the `::-webkit-scrollbar` rules; Firefox 153 and 154 show their own scrollbars |
| `lh` unit                             | Centring a checkbox, a radio or one line of text on its row      | Required (Safari 16.4): a few pixels off                                                                                   |
| `contain-intrinsic-block-size`        | The 240px of a chart that has no height to fill                  | Required (Safari 17): the chart has no height                                                                              |
| `rx` in CSS                           | The corner radius of the bars of a `BarChart`                    | Safari before 17.4: 2px, whatever `--umbra-chart-bar-radius` says                                                          |
| Navigation API                        | `HistoryButtons` disable back or forward at the end of history   | Firefox before 147, Safari before 26.2: both stay enabled                                                                  |
| `safe` alignment                      | An `EmptyState` taller than its slot stays readable from the top | Safari before 17.6: centred by a fallback, cut at both ends when too tall                                                  |
| Popover API                           | The chart tooltip, above everything                              | Required (Firefox 125, Safari 17): a clipping ancestor can cut the tooltip                                                 |

- `npm run lint` fails when the stylesheet or the code uses a feature newer than the minimums without a
  fallback (`scripts/check-browsers.mjs` holds the list, with the version of each browser that ships it).
- The automated tests run in Chromium only. Firefox and Safari are supported from the versions above
  and looked at by hand before a release ([the checklist](browser-checks.md)).
- Right to left needs `dir="rtl"` on the page or a right-to-left `locale` on the provider; it does not
  depend on `lang`.
- React 19.0 or later. No React 18.
- Some parts load on demand, with a dynamic `import()`: the overflow menu of `Card`, `SectionTitle`,
  `PageHeader`, `TopBar` and `GroupHeader`, and the popover of a card that its stack collapsed. Vite and
  Rollup make a chunk of each without setup. esbuild keeps everything in one file unless
  `splitting: true` is set; with it, the shared code is a chunk that loads first.
- Node 20 or later, when you render on the server. In the browser the package needs a bundler (Vite,
  webpack, Next.js): it is ESM, and it imports its dependencies by name.

## Server rendering

- Every component renders with `renderToString` and hydrates without warnings. Nothing touches `window`
  or `document` while rendering.
- They are client components: they use state, effects and context. With React Server Components (the
  Next.js App Router), import them from a file that starts with `'use client'`, and render that file from
  your server components.
- What depends on measured sizes (which cards of a stack collapse, which nav items move to the "more"
  menu) is settled in the browser, after hydration.
- Import `umbra-ui/styles.css` once, in the root layout.

## Debugging

What the package ships, so that an error inside a component can be read:

- **Readable modules.** One JavaScript file per source file, not minified: `dist/layout/Card.js` is
  `Card.tsx` without its types. Your bundler minifies your build.
- **Source maps with the source inside.** Every module has a `.js.map` that holds its `.tsx` file, so a
  stack frame can be shown as a line of the original source. The package does not hold `src/`.
- **Names.** React DevTools and component stacks show `Card`, `Card.Header`, `DataTable.Root`.

What DevTools shows for a frame inside the library depends on whether your bundler reads the package's
maps. Checked with the versions in the table:

| Bundler                               | Without setup                    | To see the `.tsx` lines                                 |
| ------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| Vite 8.3, development server          | The built module, `dist/**/*.js` | Keep the library out of the pre-bundle (below)          |
| webpack 5.111                         | The built module                 | `source-map-loader` 5 (below)                           |
| Next.js 16.4 (Turbopack, the default) | The `.tsx` lines                 | Nothing                                                 |
| Next.js 16.4 with `--webpack`         | The built module                 | `source-map-loader`, added in `webpack()` of the config |

- The built module is close to the source: same names, same order, comments kept. Most errors can be read
  from it, so the setup below is optional.
- In Next.js, `transpilePackages` is not needed for the library and does not change what the maps show.
  Every module starts with `'use client'`, so a Server Component can import a component directly
  ([Server rendering](#server-rendering)).

**Vite.** Vite bundles each dependency before serving it, and that bundle's map stops at the built
modules. Excluded from the pre-bundle, the library is served module by module with its own maps. Its
dependencies must stay in: some hold CommonJS, which a browser cannot load as it is.

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['umbra-ui'],
    include: ['react-aria-components', '@tanstack/react-table', 'd3-scale', 'd3-shape', 'lucide-react'].map(
      (name) => `umbra-ui > ${name}`,
    ),
  },
});
```

The development server then makes one request per module of the library that the page uses. This
changes the development server only, not `vite build`.

**webpack.** Install `source-map-loader` and run it before the other loaders, for the library only:

```js
// webpack.config.js
export default {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        include: /node_modules[\\/]umbra-ui/,
        use: ['source-map-loader'],
      },
    ],
  },
};
```

In Next.js with `--webpack`, push the same rule onto `config.module.rules` in the `webpack(config)`
function of `next.config.js`.

## Next

| Guide                                           | Read it for                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| [Layout](layout.md)                             | How space is shared, and what happens as it shrinks                |
| [Theming](theming.md)                           | Brand, context, density, tokens, fonts, icons, direction           |
| [Customisation](customisation.md)               | The four layers, router links, translating built-in strings        |
| [Recipes](recipes.md)                           | Nineteen whole screens, from a first page to a planner and a board |
| [Customisation tables](customisation-tables.md) | Every component's tokens, props, parts and blocks                  |

And three apps to copy from: `examples/basic`, `examples/dashboard` and `examples/advanced`.
