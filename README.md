# umbra-ui

[![CI](https://github.com/asafmor/umbra-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/asafmor/umbra-ui/actions/workflows/ci.yml)

React components for full-window, data-dense applications: dashboards, consoles, back-office tools.

- **The page never scrolls.** The app fills the window; only regions inside cards scroll.
- **Components fill their slot** and show less as space shrinks, instead of overflowing.
- **Its own dark look**, with a brand colour and a context tint set by your app.
- **Three density levels**, set once.
- **Customisable in four layers**, the same for every component: tokens, props, parts, blocks.

## Install

```sh
npm install umbra-ui
```

<!-- pre-release: remove at 0.1.0 -->

> **Not on npm yet.** Until `0.1.0` is published, install from GitHub instead:
> `npm install github:asafmor/umbra-ui`. That clones the whole repository and builds the package on your
> machine, so it is slow; it is meant for trying the library before the release only.

<!-- /pre-release -->

It needs React 19 or later ([browser support](#browser-support)). The fonts are loaded by your app, not
shipped by the library:

```sh
npm install @fontsource/figtree @fontsource/barlow-condensed
```

| Import                | Content                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `umbra-ui`            | The provider, layout, shell and every component that is not a chart |
| `umbra-ui/charts`     | `LineChart`, `BarChart`, `DonutChart`, `RadarChart`                 |
| `umbra-ui/styles.css` | The stylesheet. Import it once.                                     |

## A first full-window page

In a fresh Vite app, replace `src/App.tsx` with this, import it in `main.tsx` as `{ App }`, and remove the
template's own `index.css` and `App.css` (their colours and centring fight the library's).

```tsx
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
import 'umbra-ui/styles.css';
import { AppShell, Card, Columns, Page, Stack, TopBar, UmbraProvider } from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider brand="#2a2f8f" context="violet" density="default">
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns>
            <Card title="Inbox">A long list scrolls inside its card.</Card>
            <Card title="Summary" size={2}>
              Twice the width of its siblings.
            </Card>
            <Stack label="Status">
              <Card title="Budget" priority={1}>
                Stays open longest.
              </Card>
              <Card title="Schedule">Collapses to its header first, when the stack runs out of room.</Card>
            </Stack>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

That page fills any window from 1024 x 600 up, and never scrolls. When a stack holds more cards than
fit at their minimum height, the lowest-priority ones collapse to their headers (two cards always fit,
so add a few to see it). Below 1024 x 600 the columns become tabs, labelled by each card's title or the
stack's `label`.

## Learn more

|                                                      |                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)           | Install, the provider, the frame                                        |
| [Layout](docs/layout.md)                             | How space is shared, and what happens as it shrinks                     |
| [Theming](docs/theming.md)                           | Brand, context, density, tokens, fonts, icons, direction                |
| [Customisation](docs/customisation.md)               | The four layers, router links, translating built-in strings             |
| [Recipes](docs/recipes.md)                           | Thirteen whole screens, from a first page to a table with bulk actions  |
| [Customisation tables](docs/customisation-tables.md) | Every component's tokens, props, parts and blocks (generated)           |
| [Changelog](CHANGELOG.md)                            | What each release changed                                               |
| Storybook                                            | `npm run storybook`: every component, variant and state, and the guides |

## Examples

Three small apps that import the built package. Each is a complete Vite app: copy one out as a starting
template (its README says how).

| App                                        | Shows                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`examples/basic`](examples/basic)         | The bars, a three-column page, a stack that collapses, a density switch                                                                                                            |
| [`examples/dashboard`](examples/dashboard) | An overview of many cards: stats with meters and trends, charts, a list, a table; density and context switchers; a command palette                                                 |
| [`examples/advanced`](examples/advanced)   | A back-office app on a small hash router: list and detail, a table with bulk actions and a modal form, settings, shortcuts, a theme per section, and a component built from blocks |

```sh
npm install && npm run build         # the library
npm run examples -- dashboard        # installs the example against that build
npm run dev --prefix examples/dashboard
```

## Components

**Foundation**

| Component       | For                                                             |
| --------------- | --------------------------------------------------------------- |
| `UmbraProvider` | Wraps the app once: theme, density, icon map, shortcut registry |
| `UmbraScope`    | The same theme, density and tokens for one subtree              |

**Layout**

| Component      | For                                                                         |
| -------------- | --------------------------------------------------------------------------- |
| `AppShell`     | The outermost frame: exactly the window, never scrolls                      |
| `Page`         | The area under the bars, with an optional fixed header and footer           |
| `Columns`      | Shares its width among its children; tabs below the minimum window          |
| `Stack`        | Shares its height; collapses the lowest-priority cards when they do not fit |
| `Slot`         | Puts any element of yours into a `Columns` or `Stack`                       |
| `Card`         | The container for one unit of content; scrolls its own body                 |
| `SectionTitle` | A heading for one section inside a card, with controls on the same line     |
| `ScrollArea`   | A region that scrolls inside its slot                                       |
| `Accordion`    | Sections that open and close                                                |

**Shell**

| Component        | For                                                                   |
| ---------------- | --------------------------------------------------------------------- |
| `TopBar`         | The brand-coloured bar: sections, search, actions, the primary action |
| `PrimaryNav`     | The top-level sections, inside the `TopBar`                           |
| `SubNav`         | The second bar: the pages of the current section                      |
| `VerticalNav`    | Side navigation for a modal, a settings screen or a column            |
| `PageHeader`     | The header of a page or a detail pane: title, facts, actions          |
| `PrimaryAction`  | The one primary action of the app, at the end of the `TopBar`         |
| `HistoryButtons` | Back and forward, on the browser history or your router's             |
| `ShortcutBar`    | The user's pinned shortcuts, at the end of the `SubNav`               |

**Data**

| Component                  | For                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `DataTable`                | Rows and columns: sorting, selection, groups, pinned columns, columns that hide by priority |
| `List`, `ListItem`         | A list of rows with groups, selection and row actions                                       |
| `GroupHeader`              | A header row for one group of rows                                                          |
| `KeyValue`, `KeyValueList` | Labels with their values, in rows, columns or a grid                                        |
| `StatValue`                | A large value with its label, unit, trend and meter                                         |
| `SummaryTile`              | A compact tile for one thing; can be a link or a button                                     |
| `TrendArrow`               | The direction of a change                                                                   |
| `ValuePill`                | A value coloured by where it falls on a five-step ramp                                      |
| `StatusIndicator`          | A status as a dot or icon with a label                                                      |
| `Tag`, `Badge`             | A small label chip; a count or a dot                                                        |
| `Avatar`, `AvatarGroup`    | A person or entity: image, initials or silhouette                                           |
| `EntityIcon`               | A small mark for an entity, with an optional name                                           |
| `Banner`                   | A message band inside a card or page                                                        |
| `EmptyState`               | Nothing to show, or failed to load, and what to do about it                                 |
| `Legend`                   | The key for a chart or any colour-coded data                                                |
| `Link`                     | A text link                                                                                 |

**Meters and charts**

| Component     | For                                                       |
| ------------- | --------------------------------------------------------- |
| `ProgressBar` | A bar that fills: progress of a task, or a measured level |
| `LevelMeter`  | A strip of ticks with a marker on a scale                 |
| `LineChart`   | Series over categories, numbers or time                   |
| `BarChart`    | Values across categories: grouped, stacked or diverging   |
| `DonutChart`  | One value against a total, or how a total splits          |
| `RadarChart`  | Series across several axes that share a centre            |

**Inputs**

| Component                   | For                                                        |
| --------------------------- | ---------------------------------------------------------- |
| `Button`, `IconButton`      | Triggers an action                                         |
| `TextField`                 | One line of text, or several                               |
| `SearchField`               | A search box, with suggestions and recent searches         |
| `Select`                    | One option, or several, from a list that opens             |
| `Checkbox`, `CheckboxGroup` | One yes-or-no choice, or several                           |
| `RadioGroup`, `Radio`       | One option among a few, all visible                        |
| `Toggle`                    | A switch for a setting that takes effect at once           |
| `FormField`                 | Pairs a label, a description and an error with one control |
| `Tabs`                      | Switches between views of the same area                    |
| `SegmentedFilter`           | Joined segments that filter the content below              |
| `Skeleton`                  | A placeholder in the shape of content that is loading      |

**Overlays**

| Component                | For                                                                |
| ------------------------ | ------------------------------------------------------------------ |
| `Modal`, `ConfirmDialog` | A panel over a dimmed page; the confirm step before a final action |
| `Popover`                | An anchored panel; the page behind stays usable                    |
| `Menu`                   | Actions or links that open from a control                          |
| `Tooltip`                | A short description of a control                                   |
| `CommandPalette`         | A search over everything the app can do or open                    |
| `ActionBar`              | Status and actions at the bottom of a page, card or modal          |

Every data component has `loading`, `empty` and `error` states. Every one is checked for keyboard use,
screen-reader names and contrast on every tint.

## Browser support

The stylesheet relies on current CSS, with no fallbacks for older browsers.

| Browser         | Minimum | Set by                   |
| --------------- | ------- | ------------------------ |
| Chrome and Edge | 117     | subgrid                  |
| Firefox         | 121     | `:has()`                 |
| Safari          | 16.2    | `color-mix()` in `oklab` |

- **Required**: `:has()`, `color-mix()`, container queries and the `dvh` units. Without them colours,
  states and the rules that shed detail as space shrinks do not work.
- **Degrade gracefully**: subgrid (the rows of a `KeyValueList` stop sharing one label column; Chrome 111
  is enough without it), `transition-behavior: allow-discrete` (a scrollbar shows while an `Accordion`
  section opens) and `scrollbar-color`.
- **Tested** in Chromium only, by the automated tests. Firefox and Safari are expected to work from the
  versions above and are not tested yet; please report what you find.
- **React** 19.0 or later. **Node** 20 or later to render on the server; the package is ESM only.
- **Server rendering**: every component renders with `renderToString` and hydrates without warnings.
  They are client components (they use state, effects and context): with React Server Components, as in
  the Next.js App Router, import them from a file that starts with `'use client'`.

## Status and roadmap

- **Now**: the core is complete (layout, shell, data, inputs, overlays, table, meters, charts), with
  five guides and three example apps. Versions below `1.0` may change props between minor releases; the
  [changelog](CHANGELOG.md) says what changed.
- **Next**: the extended set (tier 2): planner and schedule views, sparklines and heatmaps, sliders and
  steppers, a widget board and more. The order follows demand:
  [open an issue](https://github.com/asafmor/umbra-ui/issues) for what you need.
- The plan and the design decisions are in [`plan/roadmap.md`](plan/roadmap.md).

## Develop

```sh
npm install
npm run storybook      # workshop and docs, port 6006
npm run lint && npm run typecheck && npm test
npm run test:visual    # every story at three window sizes and three densities
npm run test:examples  # the three example apps, built and driven in a browser
npm run build
```

`npm run lint` also typechecks every code sample in this file and in `docs/` (`npm run docs:check`).

[`CONTRIBUTING.md`](CONTRIBUTING.md) says how to set up and what a change needs.
[`AGENTS.md`](AGENTS.md) describes the project for contributors and coding agents; the design decisions
are in [`plan/`](plan). Security reports: [`SECURITY.md`](SECURITY.md).

## Licence

MIT
