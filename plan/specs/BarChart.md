# BarChart

**Tier** 1 · **Group** Meters and charts · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Compares values across categories: side by side, stacked, or on both sides of zero; upright or sideways.

## Not for

- A trend over many ordered points: use `LineChart`.
- One value against a total: use `ProgressBar` or `DonutChart`.
- A few bars inside a table cell: a later sparkline component.

## Evidence

Bars above and below a horizontal zero line, one series up and one down, over time, without y labels, with a legend below (36). Grouped, stacked, horizontal, value labels and thresholds are the library's own additions.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `grid` | a dotted line at each value tick | shown |
| `annotations` | reference lines and bands on the value axis | from `annotations` |
| `bars` | one bar per value | shown |
| `axes` | the value axis, and the category axis on the zero line | shown |
| `valueLabels` | the value at the end of each bar, or the total of each stack | shown with `labels` |
| `legend` | one item per series, with its fill | shown with more than one series |
| `tooltip` | the category, and each series' value in it | on hover and focus |
| `skeleton`, `empty`, `error` | the data states | — |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `orientation` | `vertical`, `horizontal` | Horizontal puts the categories on the left |
| `variant` | `grouped`, `stacked`, `diverging` | `diverging`: every second series is drawn on the other side of zero and all values read as positive (source: 36). Stacks put negative values below zero |
| `colorBy` | `series`, `sign` | `sign`: positive bars solid green, negative bars red and striped |
| `thresholds` | `{ from, color, marker? }[]` | Colour by value; each step also has its own fill |
| `labels` | boolean | Grouped: each value. Stacked and diverging: the total of each side. A label wider than its bar is left out |
| `annotations` | line or band | On the value axis |
| series cue | fill: solid, stripes, dots | Taken in turn by position, in the Legend's own marker kinds |

A `null` value leaves the bar out. States: hover, focus, series hidden, series dimmed, loading, empty, error.

## Customisation

### 1. Tokens

Shared by the four charts: `--umbra-chart-font`, `--umbra-chart-fg` (axis and label text), `--umbra-chart-value-fg` (value labels, hover outline), `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-grid`, `--umbra-chart-grid-width`, `--umbra-chart-grid-dash`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-area-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-track`, `--umbra-chart-value`, `--umbra-chart-positive`, `--umbra-chart-negative`, `--umbra-chart-warning`, `--umbra-chart-info`, `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-band-opacity`, `--umbra-chart-dim-opacity`, `--umbra-chart-center-font`, `--umbra-chart-gap`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-radius`. Each falls back to a global token. Series colours are the global palette `--umbra-color-series-1` … `-8`, by position. No global token was added.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `categories` | string[] | required | |
| `series` | `{ id, label, values, color?, marker? }[]` | required | One value per category |
| `orientation` | see above | `vertical` | |
| `variant` | see above | `grouped` | |
| `colorBy` | see above | `series` | |
| `thresholds` | see above | — | |
| `valueDomain` | `[min, max]` | round numbers around the data, with zero | Range of the value axis |
| `annotations` | as in `LineChart` | — | `axis` is ignored: always the value axis |
| `xTitle` / `yTitle` | string | — | Titles of the horizontal and vertical axis |
| `aria-label` / `aria-labelledby` | string | — | Accessible name; one of the two is required |
| `description` | string | generated summary | What a screen reader hears after the name |
| `legend` | boolean \| `top` \| `bottom` \| `start` \| `end` \| node | shown below when there is more than one series | The built-in `Legend`, its place, or the app's own node |
| `hiddenIds` / `defaultHiddenIds` / `onHiddenChange` | string[] / string[] / function | — / `[]` / — | Controlled or uncontrolled set of switched-off series |
| `labels` | boolean | `false` | Direct labels on the chart (see Variants) |
| `formatValue` | `(value) => string` | `Intl.NumberFormat` in the provider's locale | Text of values in labels, tooltip, names and table |
| `onPointPress` | `(point) => void` | — | Click, Enter or Space on a point. `point` is `{ seriesId, seriesLabel, index, x, value }` |
| `loading` | boolean | `false` | Shows the skeleton |
| `empty` | node | "No data" | Shown when there is no data |
| `error` | node | — | When set, shown in place of the chart |
| `onRetry` / `retryLabel` | function / string | — / "Retry" | Adds a retry button to the error state |
| `pointsLabel` / `legendLabel` | string | "Data points" / "Legend" | Accessible names of the list of points and of the legend |
| `height` | `fill`, `content`, number | `fill` | `fill` takes the height of the parent and falls back to the content's height where the parent has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content. A number is pixels. The content height of a chart is `--umbra-chart-content-height` (240px) for the plot, plus the legend. |

### 3. Parts

`legend`, `tooltip`, `skeleton`, `empty`, `error`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`BarChart.Root`, `BarChart.Grid`, `BarChart.Annotations`, `BarChart.Bars`, `BarChart.Axes`, `BarChart.ValueLabels`. Their order is the drawing order; other SVG elements may be placed between them.

## Behaviour as space shrinks

| Step | Trigger (slot width or height below) | Result |
|---|---|---|
| 1 | 360 / 240 | The legend hides |
| 2 | 280 / 190 | The value labels and annotation labels hide |
| 3 | 220 / 150 | The axis titles hide |
| 4 | 150 / 100 | The axes, tick labels and grid hide: the marks only |

At every size the tick labels thin out to what fits: a value axis asks for fewer round ticks as it gets shorter, and a category axis keeps every second, third, … label. Labels wider than their room are truncated.

Bars share the plot evenly and get narrower with it. In a horizontal chart the category labels take at most 35% of the width.

## Interaction and accessibility

- The root is a `figure` named by `aria-label` or `aria-labelledby`, and described by a visually hidden summary (`description` replaces the generated one).
- The marks are one tab stop: a `listbox` named by `pointsLabel`, whose options are the points, each with a readable name ("Actual, Q2: 141"). `aria-activedescendant` follows the arrow keys.
- Keys: left and right move along the categories, up and down between series; in a horizontal chart the two pairs swap, so the keys follow the bars. `Home` and `End` go to the first and last point of the series. `Enter` and `Space` call `onPointPress`. `Escape` clears the point (and only then takes the key, so a dialog around the chart still closes).
- With no point chosen the focus ring is on the plot, drawn inwards; with one it is on the point. A hovered point gets a light outline instead, so hover and focus differ.
- Hover or focus shows the tooltip: the group's title and one row per series at that position, the pointed one in bold. It is positioned inside the plot, above the point unless the point is in the top half, and aligned to the side of the plot the point is on; it is never wider than two thirds of the plot. It is hidden from assistive technology, which has the option names.
- **Right-to-left** (decided 2026-10-11, review C1): the plot does not mirror. Values grow to the right and upwards, time runs to the right, a sideways bar chart keeps its categories on the left, and the arrow keys follow what is drawn (`ArrowRight` is the point to the right). The drawing is laid out left to right in every page direction, so each label keeps its side and stays off the marks; a label in a right-to-left script is still drawn in its own direction. Everything around the plot is HTML and follows the page: the legend (`start` is the right side of a right-to-left page), the tooltip's content, the empty and error states and the hidden data table. Mirroring only the value axis was rejected: the same data would read differently in two languages, and screenshots could not be shared between them.
- The legend is the `Legend` component, interactive: an item hides its series (pressed means shown), and hovering or focusing one dims the other series.
- A visually hidden `table` repeats every value: one row per series, one column per position.
- Loading sets `aria-busy` and removes the list of points; the error state is an `alert`.
- Marks fade in over 180ms on the first draw and when the data changes, and bars grow from the zero line. With reduced motion the duration is 0.
- Text keeps 4.5:1; axis lines, grid dots and marks keep 3:1 against the card on every tint (checked in `src/charts/scales.test.ts` and by the series palette's own test).

## Open questions

None.

Resolved 2026-10-11:

- The accessible name is `aria-label` (it was `label`), as on the other components: `plan/decisions/07-customisation.md`, "Prop names".
- **`height`**, shared with `DataTable` and `List` (`src/internal/height.ts`). The chart used to be zero pixels tall in a parent without a height. The plot now has a content size of its own (`contain-intrinsic-block-size`), which only counts where there is no height to fill, so the fallback needs no measuring. Token: `--umbra-chart-content-height`.

Resolved 2026-10-10:

- Drawn as SVG by the library; `d3-scale` and `d3-shape` only (`plan/decisions/03-charts.md`). Ships from `umbra-ui/charts`.
- The chart measures its slot with a `ResizeObserver` (`src/charts/internal/useChartSize.ts`) and draws from that; its only size prop is `height` (2026-10-11), for a chart that has no slot height to fill. Steps are decided from the slot's width and height together: the smaller one decides.
- Label widths are measured, not estimated (revisited 2026-10-11, review C2, C3, C11): each label is measured once in the chart's own font with tabular figures (a hidden SVG text, `measurer` in `src/charts/internal/useChartSize.ts`), the width is kept, and labels are measured again when a web font has loaded. The layout is still one pass. A tick label under the plot is centred on its tick and moved in by what the edge of the chart would cut; a sideways bar chart leaves room for half of its last value. Nothing is cut at any size or density (tested at three window sizes and three densities).
- Right-to-left: the plot is not mirrored (see "Interaction and accessibility"); story `Charts/Right to left`.
- `data-part` values are camelCase, as in `parts` (decision 07): `xTicks`, `yTicks`, `xTitle`, `yTitle`, `valueLabels`, `seriesLabel`, `axisLabels`, `centerValue`, `centerLabel`, `focusRing`; the placeholder carries `skeleton`.
- Not a layout child: a chart goes inside a `Card` or `Slot`, so it takes no `size` or `priority`.
- The points are a `listbox` with `aria-activedescendant`: one tab stop, real option names, no roving DOM focus inside SVG.
- The tooltip is the chart's own element inside the plot, not a portal, so it cannot leave the slot. It is clipped if the plot is shorter than the tooltip.
- Data states are implemented in `src/charts/internal/Frame.tsx` with the agreed prop names (`loading`, `empty`, `error`, `onRetry`, `retryLabel`); `src/internal/dataState.tsx` did not exist in this checkout.
- While loading, the legend's place is held by a placeholder line, so the plot does not move when the data arrives.
- The generated summary lists the series and the range; apps that need a sentence in their own language set `description`.
- The value axis always includes zero, and the category axis line sits on zero.
- A diverging chart is a stack whose second, fourth, … series point the other way; its axis is symmetric and `onPointPress` returns the values as given.
- Stacks are labelled with totals, not per segment: text inside a coloured segment cannot keep its contrast on every colour.
- With `colorBy="sign"` or `thresholds`, the legend still lists the series; use one series, where the legend is hidden by default.
- A grouped bar of zero keeps a 1px line so it can be pointed at.
- Reference lines on the category axis (a divider between two groups of bars, as in the source) are not included: no generic need yet.
