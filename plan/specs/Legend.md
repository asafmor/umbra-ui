# Legend

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

The key for a chart or any colour-coded data: one marker and one label per series. It can also switch series on and off and report which one is pointed at.

## Not for

- A colour scale with a low and a high end (heat maps): a later chart component.
- Choosing one option among several: use `SegmentedFilter` or `Tabs`.
- A list of name and value pairs without colour coding: use `KeyValue`.
- Labels drawn on the chart itself: the chart does that.

## Evidence

Coloured bar and label, three in a row under a table, explaining the row edge colours (1, 19, 24, 32, 33); horizontal dots with labels in an outlined box (23); vertical list of six dots with labels, the last one dimmed (23); icon and label pairs in a header (5, 29); two team colours under a chart (36). No source legend is interactive or shows values; those are the library's own additions.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `item` | one series: marker, label, value | one per entry of `items` |
| `marker` | the series marker | a dot in the series colour |
| `label` | the series name | shown; truncates |
| `value` | a number or text for the series | shown when the item has a `value` |
| `more` | button for the items that did not fit | shown when a horizontal legend runs out of rows |
| `skeleton` | placeholder items | shown while `loading` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `orientation` | `horizontal` (default), `vertical` | Vertical shows `value` as a right-aligned column |
| `align` | `start` (default), `center`, `end` | A vertical legend with values always fills its width |
| `marker` | `dot` (default), `square`, `line`, `dashed`, `stripes`, `dots` | The first four are shapes filled with the colour; `stripes` and `dots` are outlined swatches with a pattern, the cue that does not depend on colour. Per legend, or per item. |
| `interactive` | boolean | Items become toggle buttons |

States: item switched off (struck-through label, faded marker), item disabled, hover, pressed, focus, loading. A legend without items renders nothing.

### The series palette

`color.series.1`–`8` in `plan/tokens.json` (`--umbra-color-series-1` … `-8`). An item without a `color` takes the palette by its position in `items`. Past eight items the colours repeat and the default marker changes to `stripes`, then `dots`, so a repeated colour still looks different.

Contrast against the card background, on each context tint (default card / tinted card), the neutral card and the popover surface. The requirement is 3:1; the lowest value is 4.80.

| # | Colour | Violet | Teal | Green | Slate | Neutral | Popover | Lowest |
|---|---|---|---|---|---|---|---|---|
| 1 | `#4a94e8` blue | 6.22 / 5.79 | 6.16 / 5.54 | 6.15 / 5.47 | 6.21 / 5.75 | 5.57 | 5.71 | 5.47 |
| 2 | `#e0703a` orange | 6.09 / 5.67 | 6.03 / 5.42 | 6.01 / 5.36 | 6.08 / 5.63 | 5.45 | 5.59 | 5.36 |
| 3 | `#1fa88c` teal | 6.54 / 6.09 | 6.48 / 5.82 | 6.46 / 5.76 | 6.53 / 6.05 | 5.86 | 6.01 | 5.76 |
| 4 | `#bb880e` ochre | 6.17 / 5.75 | 6.11 / 5.49 | 6.10 / 5.43 | 6.16 / 5.71 | 5.53 | 5.67 | 5.43 |
| 5 | `#dd5f96` pink | 5.72 / 5.32 | 5.66 / 5.09 | 5.65 / 5.03 | 5.71 / 5.29 | 5.12 | 5.25 | 5.03 |
| 6 | `#3f9a2e` green | 5.46 / 5.08 | 5.41 / 4.86 | 5.39 / 4.80 | 5.45 / 5.05 | 4.89 | 5.01 | 4.80 |
| 7 | `#8f7ce8` violet | 5.78 / 5.38 | 5.72 / 5.14 | 5.71 / 5.09 | 5.77 / 5.34 | 5.18 | 5.30 | 5.09 |
| 8 | `#e2605a` red | 5.63 / 5.24 | 5.57 / 5.01 | 5.56 / 4.95 | 5.62 / 5.20 | 5.04 | 5.17 | 4.95 |

The surfaces were computed from the tint presets with the same `oklab` mixing the stylesheet uses. `src/internal/SeriesMarker.test.ts` repeats the check on every run.

Colour-vision deficiencies: each colour was compared with its neighbours in the order above under simulated protan, deutan and tritan vision. Distances are in OKLab × 100; under 8 is hard to tell apart.

| Check | Worst pair | Distance |
|---|---|---|
| Neighbours, protan and deutan | 5 pink ↔ 6 green (deutan) | 11.1 |
| Neighbours, tritan | — | 8.5 |
| Neighbours, full colour vision | 3 teal ↔ 4 ochre | 18.3 |

Pairs that are not neighbours can be close (1 blue ↔ 7 violet is 0.5 for deutan vision; 2 orange ↔ 8 red is 5.6 with full colour vision). No eight-colour palette on a dark surface separates every pair. So: the order is fixed, the label always names the series, and a chart with many series should set different markers.

## Customisation

### 1. Tokens

`--umbra-legend-fg`, `--umbra-legend-value-fg`, `--umbra-legend-font`, `--umbra-legend-gap`, `--umbra-legend-row-height` (follows the density level), `--umbra-legend-row-gap`, `--umbra-legend-item-radius`, `--umbra-legend-focus-offset` (the ring offset of the items and the more button, inwards by default because the legend clips), `--umbra-series-marker-size`. The palette is the global `--umbra-color-series-1` … `-8`.

`--umbra-legend-focus-offset` is the default offset of the rings inside (inwards, because it clips), passed on as the private `--focus-offset`: `--umbra-focus-offset` set by the app on any ancestor wins over it (2026-10-11).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `{ id, label, color?, value?, marker?, disabled? }[]` | required | The series |
| `orientation` | see above | `horizontal` | |
| `align` | see above | `start` | |
| `marker` | see above | `dot` | Marker of every item that does not set its own |
| `interactive` | boolean | `false` | Items become toggle buttons |
| `hiddenIds` / `defaultHiddenIds` / `onHiddenChange` | string[] / string[] / function | — / `[]` / — | Controlled or uncontrolled set of switched-off items |
| `onHighlight` | `(id \| null) => void` | — | The item under the pointer or with focus |
| `maxRows` | number | `2` | Rows a horizontal legend may wrap to |
| `loading` / `empty` / `error` / `onRetry` / `retryLabel` | the shared data states (`src/internal/dataState.tsx`) | empty text "No items"; `retryLabel` "Try again" | Placeholder items while loading; the empty and error states on one line (`EmptyState`, `inline`) |
| `skeletonRows` | number | `3` | Number of placeholders |
| `moreLabel` | `(count) => string` | "+N more" | Text of the more button |
| `allLabel` | string | "All items" | Accessible name of the popover with the full list |
| `aria-label` | string | "Legend" | Accessible name of the legend |

### 3. Parts

`item`, `marker`, `label`, `value`, `more`, `skeleton`, `state` (the empty or error state). Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`Legend.Root`, `Legend.Item`, `Legend.Marker`, `Legend.More`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Horizontal: the items are wider than the legend | They wrap, up to `maxRows` rows |
| 2 | Horizontal: they need more than `maxRows` rows | Items are hidden from the end, and a "+N more" button takes their place. It opens the full list, vertical, in a popover. When the legend grows, items come back. |
| 3 | An item is wider than the legend | Its label truncates with an ellipsis, and the whole text is shown in the library tooltip: on hover, and when its toggle button has keyboard focus (interactive). The marker and the value keep their size. |

A vertical legend is as tall as its items; a parent that is too short scrolls it (a `Card` body does).

## Interaction and accessibility

- Not interactive: a list (`ul`) named by `aria-label`. Hovering an item calls `onHighlight`.
- Interactive: a toolbar named by `aria-label`, with one tab stop. Left and right arrows move between items (up and down in a vertical legend), and reach the more button; `Tab` leaves, and `Shift+Tab` comes back to the same item.
- Each item is a toggle button with `aria-pressed`; pressed means the series is shown. `Space` and `Enter` toggle it.
- A switched-off item is struck through and its marker fades, so the state does not depend on colour.
- Hover and focus call `onHighlight(id)`; leaving calls `onHighlight(null)`. Disabled items do neither.
- A disabled item keeps readable text (muted, at least 4.5:1) because it still names a series; only its marker fades.
- Markers are decorative (`aria-hidden`); the label carries the name.
- The more button opens a dialog named by `allLabel`; `Escape` closes it and returns focus to the button. The list in it shows and changes the same switched-off set.
- Focus rings are drawn inwards, because the legend clips to its rows.
- Loading sets `aria-busy`; the placeholders are hidden from assistive technology (`aria-hidden`), so the legend is announced as busy and not as a list of empty items.
- The error state has `role="alert"`. The legend is one element through error, loading and data, so after Retry the focus stays in it (plan/interaction.md, "Loading, empty, error").
- In a legend that is not interactive an item cannot take the focus, so a truncated label's tooltip is for the pointer only there; assistive technology reads the whole label either way.
- In a right-to-left page the left arrow moves to the next item.

## Open questions

None.

Resolved 2026-10-11 (review fixes):

- **Empty and error states** (review A1/B8; revisits the decision below). A legend holds a data set, so by the rule in plan/interaction.md it has all three states through the shared helper. With no items it now shows "No items" where it rendered nothing; an app that wants nothing does not render the legend. The charts are not affected: they do not draw their legend while they are empty or in error.
- The placeholders and the states are children of the element the items will be in (the list, or the toolbar when `interactive`), so the root is never replaced.
- The label's native `title` is replaced by the library tooltip (review B16).
- The more button's wrapper carries `data-part="more"`, and each placeholder `data-part="skeleton"`.
- Hover and press use the global mix steps. The callback stays `onHiddenChange` (plan/decisions/07-customisation.md).

Resolved 2026-10-11:

- `loadingCount` is now `skeletonRows`, the name `List`, `DataTable` and `KeyValueList` use for the number of placeholder rows.

Resolved 2026-10-10:

- The palette is umbra-ui's own eight colours, ordered so that neighbours differ for common colour-vision deficiencies. It is one palette for all four tints.
- Past eight series the colour repeats with a pattern marker, instead of generating more hues.
- The marker drawing is `src/internal/SeriesMarker.tsx` (`seriesShapes`, `seriesPatterns`, `seriesColour`, `seriesMarker`), not exported from the package. Charts in a later batch use the same definitions. `Legend.Marker` is the public way to draw one.
- Pressed means shown. The app receives the switched-off ids, because that is the list a chart filters by.
- Interactive items form a toolbar, not a listbox: each is an independent on/off switch.
- `value` is shown in both orientations; it is a column only when vertical.
- `maxRows` defaults to 2. Only a horizontal legend collapses.
- The more popover is the internal one; the public `Popover` replaces it in a later batch.
- A `loading` state exists (a chart's legend loads with it). ~~There is no empty or error state of its own: with no items it renders nothing.~~ Replaced 2026-10-11, see above.
- Labels are in the secondary text colour, never in the series colour, so they keep their contrast.
- No built-in dimming of the other items on highlight: the app decides what a highlight means and can style items by `id`.
