# LineChart

**Tier** 1 · **Group** Meters and charts · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

One or more series over categories, numbers or time. The y axis is numeric, or ordinal with named levels.

## Not for

- Comparing separate categories that have no order: use `BarChart`.
- A trend inside a table cell or a tile: a sparkline, in a later batch (a chart in a very small slot already drops its axes).
- Part-to-whole: use `DonutChart` or a stacked `BarChart`.

## Evidence

One line with a point on every value over seasons, an ordinal y axis of two or three named levels with a grid line each, x labels thinned to every second or third, single points recoloured green and red (13, 25, 31); two step lines of a running total over time with a vertical divider and an inline legend (35, 36). Curves, areas, bands and the time axis are the library's own additions.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `grid` | a dotted line at each y tick or level | shown |
| `annotations` | reference lines and bands, with labels | from `annotations` |
| `series` | per series: area, line, points, and its name at the line's end | line and points |
| `axes` | two axis lines, tick labels, titles | shown |
| `legend` | one item per series, drawn as its line and point shape | shown with more than one series |
| `tooltip` | the x value, and each series' value at it | on hover and focus |
| `skeleton`, `empty`, `error` | the data states | — |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| x axis | category, number, time | Taken from the first point's `x`: string, number or `Date`. Time is drawn and formatted in UTC |
| y axis | numeric, or `yLevels` | Ordinal: named levels from the bottom up, a grid line per level (source: 13, 25, 31) |
| `curve` | `linear`, `step`, `smooth` | `step` holds a value until the next point (source: 35, 36); `smooth` is monotone, so it never overshoots |
| `area` | boolean | Fills under the line; the y axis then starts at zero |
| `points` | boolean | A shape on every value. Left out when points are under 14px apart, except points with their own colour or shape and values with no neighbours |
| per point | `color`, `marker` | One point in its own colour and shape (source: green and red points). Give both, so the point differs without colour |
| `annotations` | line or band, on `x` or `y` | Dashed line or tinted band with a label |
| `labels` | boolean | The series name at the end of each line, kept a line apart |
| series cue | point shape and dash | As in `RadarChart` |

A `null` y is a missing value and breaks the line. States: hover, focus, series hidden, series dimmed, loading, empty, error.

## Customisation

### 1. Tokens

Shared by the four charts: `--umbra-chart-font`, `--umbra-chart-fg` (axis and label text), `--umbra-chart-value-fg` (value labels, hover outline), `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-grid`, `--umbra-chart-grid-width`, `--umbra-chart-grid-dash`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-area-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-track`, `--umbra-chart-value`, `--umbra-chart-positive`, `--umbra-chart-negative`, `--umbra-chart-warning`, `--umbra-chart-info`, `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-band-opacity`, `--umbra-chart-dim-opacity`, `--umbra-chart-center-font`, `--umbra-chart-gap`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-radius`, `--umbra-chart-tooltip-max-width`, `--umbra-chart-track-border`, `--umbra-chart-track-border-width`, `--umbra-chart-band-edge-width`, `--umbra-chart-annotation-dash`, `--umbra-chart-ring-width` (hover outline), `--umbra-chart-outline-width` (patterned fills), `--umbra-chart-content-height`. Each falls back to a global token where one exists. Series colours are the global palette `--umbra-color-series-1` … `-8`, by position. No global token was added.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `series` | `{ id, label, data: { x, y, color?, marker? }[], color?, marker?, dash? }[]` | required | |
| `categories` | string[] | order of first appearance | Order of a category x axis |
| `yLevels` | string[] | — | Makes the y axis ordinal |
| `yDomain` | `[min, max]` | round numbers around the data | Range of a numeric y axis |
| `curve` | see above | `linear` | |
| `area` | boolean | `false` | |
| `points` | boolean | `true` | |
| `annotations` | `{ type: 'line', axis?, value, label?, color? }` or `{ type: 'band', axis?, from, to, label?, color? }` | — | `axis` defaults to `y` |
| `xTitle` / `yTitle` | string | — | Axis titles |
| `formatX` | `(x) => string` | number or short date in the provider's locale | Text of x values |
| `aria-label` / `aria-labelledby` | string | — | Accessible name; one of the two is required |
| `description` | string | generated summary | What a screen reader hears after the name |
| `legend` | boolean \| `top` \| `bottom` \| `start` \| `end` \| node | shown below when there is more than one series | The built-in `Legend`, its place, or the app's own node |
| `hiddenIds` / `defaultHiddenIds` / `onHiddenChange` | string[] / string[] / function | — / `[]` / — | Controlled or uncontrolled set of switched-off series |
| `labels` | boolean | `false` | Direct labels on the chart (see Variants) |
| `formatValue` | `(value) => string` | `Intl.NumberFormat` in the provider's locale | Text of values in labels, tooltip, names and table |
| `onPointPress` | `(point) => void` | — | Click, Enter or Space on a point. `point` is `{ seriesId, seriesLabel, index, x, value }` |
| `loading` | boolean | `false` | Shows the skeleton. The data-state props are the shared ones (`src/internal/dataState.tsx`), the same as on `List` and `DataTable` |
| `empty` | text, node or `{ title, description, icon, action }` | "No data" | Shown when there is no data |
| `allHiddenLabel` | string | "All series are hidden" | Shown in place of the plot when the legend has switched every series off. The legend stays |
| `error` | text, node, `{ title, description, icon, action }` or `true` | — | When set, shown in place of the chart, also while `loading`. `true` gives "Something went wrong" |
| `onRetry` / `retryLabel` | function / string | — / "Try again" | Adds a retry button to the error state. When the state goes away while it holds the focus, the focus moves to the points instead of being lost |
| `pointsLabel` / `legendLabel` | string | "Data points" / "Legend" | Accessible names of the list of points and of the legend |
| `height` | `fill`, `content`, number | `fill` | `fill` takes the height of the parent and falls back to the content's height where the parent has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content. A number is pixels. The content height of a chart is `--umbra-chart-content-height` (240px) for the plot, plus the legend. |

### 3. Parts

`legend`, `tooltip`, `skeleton`, `empty`, `error`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `empty` and `error` receive `{ children }`, the default state (as in `DataTable`); `tooltip: null` shows no tooltip.

### 4. Blocks

`LineChart.Root`, `LineChart.Grid`, `LineChart.Annotations`, `LineChart.Series`, `LineChart.Axes`. Their order is the drawing order; other SVG elements may be placed between them.

## Behaviour as space shrinks

| Step | Trigger (slot width or height below) | Result |
|---|---|---|
| 1 | 360 / 240 | The legend hides |
| 2 | 280 / 190 | The series names at the line ends and annotation labels hide |
| 3 | 220 / 150 | The axis titles hide |
| 4 | 150 / 100 | The axes, tick labels and grid hide: the marks only |

At every size the tick labels thin out to what fits: a value axis asks for fewer round ticks as it gets shorter, and a category axis keeps every second, third, … label. Labels wider than their room are truncated.

## Interaction and accessibility

- The root is a `figure` named by `aria-label` or `aria-labelledby`, and described by a visually hidden summary (`description` replaces the generated one).
- The marks are one tab stop: a `listbox` named by `pointsLabel`, whose options are the points, each with a readable name ("Plan, Mar: 48"). `aria-activedescendant` follows the arrow keys.
- Keys: left and right move along x, up and down to the same x in the next series (or the nearest one). `Home` and `End` go to the first and last point of the series. `Enter` and `Space` call `onPointPress`. `Escape` clears the point (and only then takes the key, so a dialog around the chart still closes).
- With no point chosen the focus ring is on the plot, drawn inwards; with one it is on the point. A hovered point gets a light outline instead, so hover and focus differ.
- Hover or focus shows the tooltip: the group's title and one row per series at that position, the pointed one in bold. It is never cut: it sits above the point unless the point is in the top half, aligned to the side of the plot the point is on, and stays inside the chart when it fits there; in a chart too short for it, it leaves the chart on that side, and it never leaves the window (it takes the other side, or is moved back in). It never covers its point. It is at most `--umbra-chart-tooltip-max-width` (20rem) wide. `Escape` dismisses it, also when it was opened by the pointer and the focus is elsewhere. It is hidden from assistive technology, which has the option names.
- **Right-to-left** (decided 2026-10-11, review C1): the plot does not mirror. Values grow to the right and upwards, time runs to the right, a sideways bar chart keeps its categories on the left, and the arrow keys follow what is drawn (`ArrowRight` is the point to the right). The drawing is laid out left to right in every page direction, so each label keeps its side and stays off the marks; a label in a right-to-left script is still drawn in its own direction. Everything around the plot is HTML and follows the page: the legend (`start` is the right side of a right-to-left page), the tooltip's content, the empty and error states and the hidden data table. Mirroring only the value axis was rejected: the same data would read differently in two languages, and screenshots could not be shared between them.
- The legend is the `Legend` component, interactive: an item hides its series (pressed means shown), and hovering or focusing one dims the other series.
- A visually hidden `table` repeats every value: one row per series, one column per position.
- Loading sets `aria-busy` and removes the list of points; the error state is an `alert`.
- Marks fade in over 180ms on the first draw and when the data changes. With reduced motion the duration is 0.
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
- The legend glyph is drawn from the line's own definition (changed 2026-10-11, review C5): the same dash array (solid, `6 3`, `2 3`) at the chart's scale, on a piece of line two markers wide so the dash shows on both sides of the point shape. It drew every dash as `3 2`. Limit: four shapes and three dashes, each taken in turn, give twelve pairs, so twelve series differ without colour; the thirteenth repeats the first and differs by colour only. With the eight palette colours, colour and cue together repeat after 24 series. Past twelve series, give `marker` and `dash` per series, or split the chart.
- `data-part` values are camelCase, as in `parts` (decision 07): `xTicks`, `yTicks`, `xTitle`, `yTitle`, `valueLabels`, `seriesLabel`, `axisLabels`, `centerValue`, `centerLabel`, `focusRing`; the placeholder carries `skeleton`.
- Non-text contrast of an annotation band (review C13): the tint alone is about 1.3:1 against the card, so the band has a dashed line at each of its two ends in the annotation colour (8.9–9.0:1 on the four tints; `--umbra-chart-band-edge-width`). The tint is decoration between the two lines.
- A point is a target of 24 by 24 pixels (review C14, WCAG 2.5.8); it was 20. Where points are closer than that, the one drawn last is on top, and the arrow keys reach every point.
- `onPointPress(point)` stays, as a documented exception to decision 07's `onAction(id)` (review C18): a point has no id of its own. It is a series and a position, and `point` carries both (`seriesId`, `index`) with the label, the x value and the value, so the app does not look them up again.
- Tokens (review C16, C19): the stroke widths that were literals are tokens (`--umbra-chart-axis-width` and `--umbra-chart-grid-width` fall back to `--umbra-border-width`; `--umbra-chart-ring-width`, `--umbra-chart-outline-width`, `--umbra-chart-annotation-dash`). The charts read tokens and never declare one, so a value set by the app on any ancestor wins (unit-tested). The generated token table now also lists tokens read in the code (`--umbra-chart-value`, `-positive`, `-negative`, `-warning`, `-info`).
- Not a layout child: a chart goes inside a `Card` or `Slot`, so it takes no `size` or `priority`.
- The points are a `listbox` with `aria-activedescendant`: one tab stop, real option names, no roving DOM focus inside SVG.
- The tooltip is still the chart's own element, not a portal, so it keeps the tokens, the density and the direction of its place; but it is shown in the browser's top layer (the Popover API, `popover="manual"`) and placed in window pixels once its size is known (`fitTooltip` in `src/charts/internal/scales.ts`), so nothing clips it (revisited 2026-10-11, review C9: a 74px tooltip lost 21px in a 108px chart). It follows its point when something scrolls. Every supported browser has the Popover API (it sets the minimum Firefox, 125, and with `contain-intrinsic-block-size` the minimum Safari, 17.0).
- `Escape` dismisses a tooltip opened by the pointer too, wherever the focus is (review C10, WCAG 1.4.13); it does not stop the key, so a dialog around the chart still closes.
- Data states come from `src/internal/dataState.tsx` (changed 2026-10-11, review C6): the same props, types and defaults as `List` and `DataTable`. The retry label is "Try again" (was "Retry"), `error` wins over `loading`, and the `error` part receives `{ children }` only (it had `onRetry` and `retryLabel`).
- With every series switched off (review C4) the chart shows the empty state with `allHiddenLabel` and keeps its legend, so a series can be switched back on. Bare axes were rejected: they read as a chart of nothing. The list of points is a `listbox` and a tab stop only while it has points.
- The hidden summary is left out when there is no data (review C8); it read "0: ".
- While loading, the legend's place is held by a placeholder line, so the plot does not move when the data arrives.
- The generated summary lists the series and the range; apps that need a sentence in their own language set `description`.
- A numeric y axis does not start at zero unless `area` is set; `yDomain` sets it.
- A number or time x axis runs exactly from the first to the last value; a category axis has half a step of room at both ends.
- Grid lines are dots in the axis colour: each dot keeps 3:1, and the grid still reads lighter than the axes.
- Labels of vertical annotations sit above the plot, where they cannot cover the marks.
- Hit areas are a 10px circle around each value; where two overlap, the series drawn last wins.
- **The labels of annotations are drawn above the marks, with an outline** (review 2, OP-5, 2026-10-11; all charts with two axes share the code, `src/charts/internal/cartesian.tsx`). They were in the annotations' own layer, under the bars and lines. The lines and bands stay under the marks; the labels are in `data-part="annotationLabels"`, an element moved to the end of the group the chart draws in (not a portal: React listens for focus on a portal's container, and Chromium then lets Tab stop on that SVG element), outlined in `--umbra-chart-label-halo` as the labels on marks are.
