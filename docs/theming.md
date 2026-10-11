# Theming

umbra-ui has one look: dark, flat, dense. An app does not replace it; it sets a few inputs and the rest
follows. This guide lists the inputs, from the ones most apps set to the ones few do.

## The three colour layers

| Layer       | Set by      | What it colours                                                      | How                              |
| ----------- | ----------- | -------------------------------------------------------------------- | -------------------------------- |
| Brand       | The app     | The top bar, band headers of cards and page headers                  | `brand` on the provider          |
| Context     | The app     | The page background and the tint of cards. It can change per section | `context` on the provider, scope |
| Interaction | The library | Selected (violet), the primary action (magenta), the focus ring      | Fixed                            |

The first two say **where the user is**: whose app, and which part of it. The third says **what the user
can do**, and reads the same in every app and every section. That is why it is fixed.

Four more colours carry meaning and are shared by every component: `success`, `warning`, `danger` and
`info`. Wherever one of them carries data, an icon, a sign or a pattern carries it too.

## The provider

```tsx
import { UmbraProvider } from 'umbra-ui';

<UmbraProvider
  brand="#0f5c4d"
  context="teal"
  density="compact"
  tokens={{ 'radius-card': '4px' }}
  reducedMotion="system"
  locale="en-GB"
>
  <App />
</UmbraProvider>;
```

### `brand`

- A hex or `rgb()` colour.
- Text on it is computed: white or near-black, whichever has the higher contrast. Resting navigation
  items are a dimmed version of that colour that still reaches 4.5:1, and the focus ring on the bar
  falls back to the text colour when the pink ring would have less than 3:1.
- A brand on which neither text colour reaches 4.5:1 (a mid grey, a mid green) gives a warning in
  development. Pick a darker or a lighter one.
- Another colour syntax (`hsl()`, a named colour) still colours the bar, but the text on it stays white
  and development warns: the contrast cannot be computed.
- `TopBar` takes its own `brand` for one bar. A card header with `headerStyle="band"` and a `PageHeader`
  with `tone="band"` use the brand too, or their own `bandColor`.

### `context`

- A preset: `violet` (the default), `teal`, `green`, `slate`. Or any CSS colour.
- One input colour; the library derives the values it uses by mixing the colour into near-black:
  the page background and its gradient end, the card tint, the stronger tint of `tone="tinted"` cards,
  and a light accent.
- Because the colour is always mixed into a dark base, any input keeps the text contrast. A very dark
  or very grey input simply shows less.
- A card with `tone="neutral"` ignores the context.

```tsx
<UmbraProvider context="#b8562a">
  <App />
</UmbraProvider>
```

### `density`

`compact`, `default` or `spacious`. It sets the height of controls and rows, the gaps, the page margin,
the card padding and two text sizes. Set it once for the app; the minimum height of a card (72, 88 or
104 pixels) follows, and so does the point at which a stack starts to collapse cards.

### `tokens`

Any CSS variable of the library, without the `--umbra-` prefix. See [the token groups](#token-groups).

## One part of the screen

`UmbraScope` takes the same `brand`, `context`, `density` and `tokens` for one subtree. It adds no box
of its own, so it can wrap a child of `Columns` or `Stack` and the layout does not notice. A `Page`
takes `context` directly, and the frame around the page follows it.

```tsx
<Columns>
  <Card title="Orders" />
  <UmbraScope context="teal" density="compact" tokens={{ 'table-row-height': '20px' }}>
    <Card title="Stock" tone="tinted" />
  </UmbraScope>
</Columns>
```

Popovers, menus, tooltips and modals opened from inside a scope keep its context, density and tokens,
although they are drawn outside it.

## Worked example: a re-branded shell and one tinted section

A green brand, a slate app, squarer corners, and a "Returns" section in its own tint.

```tsx
import { useState } from 'react';
import { AppShell, Card, Columns, Page, PrimaryNav, TopBar, UmbraProvider, UmbraScope } from 'umbra-ui';

const sections = [
  { id: 'orders', label: 'Orders' },
  { id: 'returns', label: 'Returns' },
];

export function App() {
  const [section, setSection] = useState('orders');
  return (
    <UmbraProvider brand="#0f5c4d" context="slate" tokens={{ 'radius-card': '4px', 'radius-control': '2px' }}>
      <AppShell
        topBar={
          <TopBar logo="A" nav={<PrimaryNav items={sections} value={section} onChange={setSection} />} />
        }
      >
        {/* The whole section: the page background and every card follow. */}
        <Page context={section === 'returns' ? '#b8562a' : 'slate'}>
          <Columns>
            <Card title="Queue" size={2} />
            {/* One card: only this subtree changes. */}
            <UmbraScope context="green">
              <Card title="Approved today" tone="tinted" />
            </UmbraScope>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

## Token groups

Every token is a CSS variable. The global ones are generated from one file (`plan/tokens.json`) and
declared on `:root`. The `tokens` prop is typed with their names (the `TokenOverrides` type), so an editor
completes them; it also takes any other name, for the variables of single components.

| Group    | Variables (after `--umbra-`)                                                                                                                                                                          | Notes                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Brand    | `color-brand`                                                                                                                                                                                         | Use the `brand` prop instead: it also computes the text colour.             |
| Context  | `context`; derived: `context-page-background`, `context-page-background-end`, `context-card-tint`, `context-card-tint-strong`, `context-mid-accent`                                                   | Use the `context` prop. The derived values can be overridden one by one.    |
| Surfaces | `color-base-surface1`, `color-base-surface2`, `color-base-surface3`, `color-base-surface-neutral`                                                                                                     | Darkest to lightest. A `neutral` card uses `surface-neutral`.               |
| Borders  | `color-base-border-subtle`, `color-base-border-strong`, `color-base-border-control`, `color-base-border-neutral`                                                                                      | `border-control` is the outline of inputs: it must keep 3:1.                |
| Text     | `color-base-text-primary`, `color-base-text-secondary`, `color-base-text-muted`                                                                                                                       | All three keep 4.5:1 on every surface and tint.                             |
| Meaning  | `color-semantic-success`, `color-semantic-warning`, `color-semantic-danger`, `color-semantic-info`                                                                                                    |                                                                             |
| Values   | `color-value-ramp-1` to `color-value-ramp-5`                                                                                                                                                          | Low to high: `ValuePill`, and the `ramp-1` to `ramp-5` tones of the meters. |
| Series   | `color-series-1` to `color-series-8`                                                                                                                                                                  | See [the series palette](#the-series-palette).                              |
| Fonts    | `font-family-heading`, `font-family-body`; roles: `font-card-title`, `font-nav`, `font-display`, `font-title`, `font-body`, `font-label`, `font-table-cell`                                           | See [fonts](#fonts).                                                        |
| Space    | `space-1` (2px), `space-2` (4px), `space-3` (8px), `space-4` (12px), `space-5` (16px), `space-6` (20px), `space-7` (24px), `space-8` (32px), `space-9` (40px)                                         | The `gap` prop of `Columns` and `Stack` takes the step number.              |
| Shape    | `radius-control`, `radius-card`, `radius-pill`, `border-width`, `elevation-overlay`                                                                                                                   | Cards are flat; only overlays cast a shadow.                                |
| Density  | `density-control-height`, `density-table-row`, `density-list-row`, `density-gap`, `density-page-margin`, `density-card-padding`, `density-card-min-height`, `density-body-size`, `density-label-size` | Set by the `density` level. Override one with the `tokens` prop.            |
| Sizes    | `size-top-bar-height`, `size-sub-nav-height`, `size-scroll-thumb`, `size-modal-sm`, `size-modal-md`, `size-modal-lg`, `size-modal-xl`, `size-modal-nav`                                               | The bar heights do not follow the density level.                            |
| Motion   | `motion-duration-fast` (100ms), `motion-duration-base` (180ms), `motion-duration-slow` (240ms), `motion-easing-enter`, `motion-easing-exit`                                                           | See [reduced motion](#reduced-motion).                                      |
| State    | `state-disabled-opacity`, `state-focus-ring-width`                                                                                                                                                    |                                                                             |

Each component also reads its own variables, such as `--umbra-card-radius` or `--umbra-table-row-height`.
They are not declared anywhere: each falls back to a global token until you set it, so setting one
changes that component only. The [customisation tables](customisation-tables.md) list them per
component, and the [customisation guide](customisation.md) shows how they fit with props and parts.

### In CSS or through props

Both set the same variables. Use whichever is closer to the reason for the change.

```tsx
<UmbraScope tokens={{ 'card-radius': 0, 'color-base-text-secondary': '#c9c4d4' }}>
  <Card title="Budget" />
</UmbraScope>
```

```css
/* The whole app */
:root {
  --umbra-radius-card: 4px;
}

/* Every card inside one of your own elements */
.reports {
  --umbra-card-radius: 0;
  --umbra-card-padding: 8px;
}
```

|                                          | `tokens` prop | CSS                                      |
| ---------------------------------------- | ------------- | ---------------------------------------- |
| Reaches overlays opened from the subtree | Yes           | Only when set on `:root`                 |
| Can depend on app state                  | Yes           | Through a class or attribute of your own |
| Can use media and container queries      | No            | Yes                                      |
| Context, density and font-family tokens  | Yes           | See below                                |

Three kinds of token are **inputs to other tokens**: `context`, the `density-*` values and the two
`font-family-*` values. The values computed from them (the tints, the role fonts) are worked out on the
provider's element and on every scope, not on your own elements. So:

- Set `font-family-*` on `:root` or through `tokens`. Set on a `div` of yours it changes nothing.
- The provider always sets a context and a density on its own element, which wins over `:root`. Change
  them with the `context` and `density` props, and single density values with `tokens`.

## The series palette

Charts and `Legend` colour their series from `color-series-1` to `color-series-8`, in order, and start
again after the eighth. The defaults were chosen so that neighbours stay apart for the common forms of
colour blindness and each keeps 4.8:1 against a card on every preset tint.

- One series: give it a `color` in its data (`{ id, label, color: '#e0703a', … }`).
- The whole palette: override the tokens. Check the new colours the same way: neighbours apart, 3:1 or
  more against the card.
- Colour is never the only cue. Bars and donut segments alternate solid and patterned fills, lines
  alternate point shapes and dashes, and a `Legend` shows the same marker as its chart.

```tsx
<UmbraScope tokens={{ 'color-series-1': '#5fb0ff', 'color-series-2': '#ff9f5a' }}>
  <LineChart
    aria-label="Orders per week"
    series={[
      {
        id: 'new',
        label: 'New',
        data: [
          { x: 'W1', y: 12 },
          { x: 'W2', y: 18 },
        ],
      },
      {
        id: 'repeat',
        label: 'Repeat',
        data: [
          { x: 'W1', y: 30 },
          { x: 'W2', y: 27 },
        ],
      },
    ]}
  />
</UmbraScope>
```

## Colour by value: one `thresholds` list

`ValuePill`, `ProgressBar`, `LevelMeter`, `BarChart` and `DonutChart` colour a value by the band it
falls in, and all take the same `thresholds`: an ascending list where each entry runs from its `from`
up to the next one.

```tsx
import { ProgressBar, ValuePill, type Threshold } from 'umbra-ui';
import { BarChart, DonutChart } from 'umbra-ui/charts';

const bands: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Medium' },
  { from: 70, color: '#5aa9ff', label: 'High' },
  { from: 90, tone: 'ramp-5', label: 'Top' },
];

export function Scores({ score }: { score: number }) {
  return (
    <>
      <ValuePill value={score} thresholds={bands} />
      <ProgressBar label="Score" kind="meter" value={score} thresholds={bands} showValue />
      <DonutChart aria-label="Score" value={score} thresholds={bands} />
      <BarChart
        aria-label="Score by region"
        categories={['North', 'South']}
        series={[{ id: 'score', label: 'Score', values: [score, 55] }]}
        thresholds={bands}
      />
    </>
  );
}
```

- `tone` is a meaning (`neutral`, `info`, `success`, `warning`, `danger`, `accent`) or a step of the
  value ramp (`ramp-1` to `ramp-5`). `color` is any CSS colour and wins. With neither, the band keeps
  the component's own colour.
- Colour is never the only cue, also for a free `color`: each band gets a pattern by its position
  (a hatch in `ProgressBar`, a fill in `BarChart`), and its `label` joins the value in the text, the
  tooltip and for screen readers.
- Plain numbers are shorthand for boundaries on the value ramp: `thresholds={[40, 70, 90]}`. Four
  boundaries give the five steps. `ProgressBar` also takes `thresholds` alone (`true`): thirds of its
  scale, danger, warning, success.
- `lowerIsBetter` mirrors the colours for a scale where low is good; the labels stay with their bands.
- A value below the first `from` is in no band. Each component sets `data-band` (the band's position,
  from 0) for CSS.
- Your own cell or badge: `resolveThreshold(value, bands)` returns the band the components would pick.

## Fonts

The library names two families and ships neither: **the app loads them**.

| Token                 | Default          | Used for                              |
| --------------------- | ---------------- | ------------------------------------- |
| `font-family-heading` | Barlow Condensed | Card titles and navigation, uppercase |
| `font-family-body`    | Figtree          | Everything else                       |

```tsx
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
```

The weights in use are 600 and 700 of the heading family and 400, 500 and 700 of the body family. Any
way of loading them works. Without them the text falls back to a narrow system font and `system-ui`.

To change a family, load yours and set the token:

```tsx
<UmbraProvider
  tokens={{ 'font-family-heading': "'Oswald', sans-serif", 'font-family-body': "'Inter', sans-serif" }}
>
  <App />
</UmbraProvider>
```

A role font is a whole CSS `font` value (weight, size, line height, family), so one role can be changed
alone. The card title and the navigation are uppercase through two more tokens:

```tsx
<UmbraProvider tokens={{ 'font-card-title-transform': 'none', 'font-nav-transform': 'none' }}>
  <App />
</UmbraProvider>
```

The sizes of `font-body`, `font-label` and `font-table-cell` follow the density level.

## Reduced motion

Motion is short and small to begin with: fades, and slides of a few pixels. With reduced motion all
movement stops and only fades stay; an indeterminate `ProgressBar` shows a still striped fill, and a
card collapses at once.

| `reducedMotion` | Effect                                                         |
| --------------- | -------------------------------------------------------------- |
| `system`        | Follows the `prefers-reduced-motion` setting of the system     |
| `always`        | Always reduced, for an app with its own setting                |
| `never`         | Never reduced. Use only for a setting the user chose themself. |

The durations are tokens (`motion-duration-fast`, `-base`, `-slow`), should an app want everything
quicker.

## Icons

Every icon the library draws by itself comes from one map on the provider. Replace a name and it changes
everywhere. The default set is `lucide-react`.

```tsx
import { ArrowUpRight, Search } from 'lucide-react';

<UmbraProvider icons={{ search: <Search strokeWidth={3} />, externalLink: <ArrowUpRight /> }}>
  <App />
</UmbraProvider>;
```

Any node works: an icon of another set, an inline `<svg>`. It is sized by the component that shows it
(`--umbra-icon-size`, 1.25em unless a component sets it), so draw it to fill its box and use
`currentColor`.

| Name                                          | Used by                                               |
| --------------------------------------------- | ----------------------------------------------------- |
| `back`, `forward`                             | History buttons, back buttons                         |
| `chevronDown`, `chevronRight`                 | Carets of menus, cards, accordions, navigation groups |
| `close`                                       | Dismiss and clear buttons, removable tags             |
| `expand`                                      | A card the layout has collapsed                       |
| `more`                                        | Overflow menus                                        |
| `search`                                      | The top bar's search trigger, the command palette     |
| `spinner`                                     | Loading buttons                                       |
| `edit`                                        | `ShortcutBar`                                         |
| `recent`                                      | The recent searches of `SearchField`                  |
| `sortAscending`, `sortDescending`, `sortNone` | `DataTable` headers                                   |
| `check`, `indeterminate`                      | Checkbox, toggle, checked menu rows and segments      |
| `invalid`                                     | An invalid field and its error text                   |
| `info`, `success`, `warning`, `danger`        | `StatusIndicator`, `Banner`, `ActionBar` status       |
| `neutral`                                     | `StatusIndicator` `neutral`                           |
| `message`, `tip`                              | `Banner` and `ActionBar` `neutral`; `Banner` `accent` |
| `trendUp`, `trendDown`, `trendFlat`           | `TrendArrow`                                          |
| `externalLink`                                | `Link` with `external`                                |
| `user`                                        | `Avatar` without an image or a name                   |
| `panelClose`, `panelOpen`                     | The rail toggle of `VerticalNav`                      |

Keep one shape per meaning. The tone icons and the trend and sort arrows are the cue that does not
depend on colour, so two of them must never look alike.

An icon passed to a component (`icon`, `iconStart`, a part) is yours and is not looked up in the map.

## Language and direction

```tsx
<UmbraProvider locale="ar">
  <App />
</UmbraProvider>
```

- `locale` sets the language of the app's root element, the format of the numbers and dates the library
  writes itself (chart values, counts), and the text direction.
- Layout is written with logical directions throughout: `start` and `end`, never left and right. In a
  right-to-left locale the columns, bars, pinned table columns, drawers and arrow keys mirror.
- Without `locale` the browser's language is used and the direction is whatever the page has. Setting
  `dir="rtl"` on `<html>` works too.
- The library's own English strings are props. See
  [translating built-in strings](customisation.md#translating-built-in-strings).

## What is not themeable

| Not themeable                                             | Why                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A light theme                                             | Every colour, tint and contrast check assumes a dark base. A light look is a different library. |
| Violet for selected, magenta for the primary action       | They are the fixed layer: the same meaning in every app and section.                            |
| The focus ring colour, except where contrast requires it  | Focus must never be mistaken for selected, on any tint.                                         |
| The minimum window, 1024 x 600                            | Tab mode switches on it in code, and every component's shrink rules are tested against it.      |
| The number of density levels                              | Three are tested everywhere. Single density values can be changed with `tokens`.                |
| Whether the page scrolls                                  | It never does. Regions inside cards scroll.                                                     |
| The order in which a component sheds detail as it narrows | It is part of each component, not of its look.                                                  |

The fixed colours are still CSS variables (`--umbra-color-fixed-*`), so nothing stops a stylesheet from
setting them. It is not supported: the contrast of text on them is not recomputed, and the next release
may read them differently.

## Next

- [Customisation](customisation.md): the four layers for changing one component.
- [Recipes](recipes.md): worked screens, including a section with its own tint.
- [Customisation tables](customisation-tables.md): every component's own tokens.
