# RadarChart

**Tier** 1 · **Group** Meters and charts · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Compares one or more series across several axes that share a centre: a profile at a glance.

## Not for

- Values over time or over an ordered scale: use `LineChart`.
- Fewer than three axes, or precise comparison of single values: use `BarChart`.

## Evidence

Eight axes on an octagonal grid with one inner ring, one filled series, labels outside each corner with the value printed beside the label, no scale and no legend (3, 29); a 50px filled polygon on a hexagon grid without labels, used as a thumbnail (1). The reference screen shows the thumbnail form.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `grid` | rings and spokes | 3 polygon rings |
| `series` | per series: filled area, outline, a point on each axis | shown |
| `axisLabels` | the axis names outside the grid, with values when `labels` is set | shown |
| `legend` | one item per series, drawn as its line and point shape | shown with more than one series |
| `tooltip` | the axis, and each series' value on it | on hover and focus |
| `skeleton`, `empty`, `error` | the data states | — |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `grid` | `polygon`, `circle` | Shape of the rings |
| `rings` | number | Rings, the outer one included |
| `filled` | boolean | Area fill at 22% under the outline |
| `labels` | boolean | Prints each value beside its axis label when one series is drawn (source: 3, 29) |
| per-axis `max` | number | An axis may have its own scale |
| series cue | point shape (dot, square, diamond, triangle) and dash (solid, dashed, dotted) | Taken in turn by position; the pair repeats after twelve series |

States: hover, focus, series hidden, series dimmed, loading, empty, error.

## Customisation

### 1. Tokens

Shared by the four charts: `--umbra-chart-font`, `--umbra-chart-fg` (axis and label text), `--umbra-chart-value-fg` (value labels, hover outline), `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-grid`, `--umbra-chart-grid-width`, `--umbra-chart-grid-dash`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-area-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-track`, `--umbra-chart-value`, `--umbra-chart-positive`, `--umbra-chart-negative`, `--umbra-chart-warning`, `--umbra-chart-info`, `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-band-opacity`, `--umbra-chart-dim-opacity`, `--umbra-chart-center-font`, `--umbra-chart-gap`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-radius`. Each falls back to a global token. Series colours are the global palette `--umbra-color-series-1` … `-8`, by position. No global token was added.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `axes` | `{ id, label, max? }[]` | required | The axes, clockwise |
| `series` | `{ id, label, values, color?, marker? }[]` | required | One value per axis; `null` sits at the centre |
| `max` | number | a round number above the largest value | The value at the outer ring |
| `rings` | number | `3` | |
| `grid` | see above | `polygon` | |
| `filled` | boolean | `true` | |
| `startAngle` | number | `0` | Where the first axis points, in degrees clockwise from 12 o'clock |
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

`RadarChart.Root`, `RadarChart.Grid` (`rings`, `shape`), `RadarChart.Series` (`filled`), `RadarChart.AxisLabels`. Other SVG elements may be placed between them.

## Behaviour as space shrinks

The radius is the largest that leaves every axis label inside the slot, but never under a quarter of the slot's short side; a label that still does not fit is truncated with an ellipsis.

| Step | Trigger (slot width or height below) | Result |
|---|---|---|
| 1 | 300 / 260 | The legend hides |
| 2 | 220 / 190 | The values beside the labels hide |
| 3 | 150 / 130 | The axis labels hide: the grid and the shape only, as in the source's thumbnail |

## Interaction and accessibility

- The root is a `figure` named by `aria-label` or `aria-labelledby`, and described by a visually hidden summary (`description` replaces the generated one).
- The marks are one tab stop: a `listbox` named by `pointsLabel`, whose options are the points, each with a readable name ("Region 1, Quality: 12"). `aria-activedescendant` follows the arrow keys.
- Keys: left and right move around the axes, up and down between series. `Home` and `End` go to the first and last point of the series. `Enter` and `Space` call `onPointPress`. `Escape` clears the point (and only then takes the key, so a dialog around the chart still closes).
- With no point chosen the focus ring is on the plot, drawn inwards; with one it is on the point. A hovered point gets a light outline instead, so hover and focus differ.
- Hover or focus shows the tooltip: the group's title and one row per series at that position, the pointed one in bold. It is positioned inside the plot, above the point unless the point is in the top half, and aligned to the side of the plot the point is on; it is never wider than two thirds of the plot. It is hidden from assistive technology, which has the option names.
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
- Not a layout child: a chart goes inside a `Card` or `Slot`, so it takes no `size` or `priority`.
- The points are a `listbox` with `aria-activedescendant`: one tab stop, real option names, no roving DOM focus inside SVG.
- The tooltip is the chart's own element inside the plot, not a portal, so it cannot leave the slot. It is clipped if the plot is shorter than the tooltip.
- Data states come from `src/internal/dataState.tsx` (changed 2026-10-11, review C6): the same props, types and defaults as `List` and `DataTable`. The retry label is "Try again" (was "Retry"), `error` wins over `loading`, and the `error` part receives `{ children }` only (it had `onRetry` and `retryLabel`).
- With every series switched off (review C4) the chart shows the empty state with `allHiddenLabel` and keeps its legend, so a series can be switched back on. Bare axes were rejected: they read as a chart of nothing. The list of points is a `listbox` and a tab stop only while it has points.
- The hidden summary is left out when there is no data (review C8); it read "0: ".
- While loading, the legend's place is held by a placeholder line, so the plot does not move when the data arrives.
- The generated summary lists the series and the range; apps that need a sentence in their own language set `description`.
- Values are clamped to the axis; a missing value is drawn at the centre and has no point.
- Values are printed beside labels only with one series drawn; with more they would not say whose they are. The tooltip and the table carry them.
- No scale numbers on the rings, as in the source.
- The legend item of a series is a piece of its line with its point shape, drawn from the same definitions as the chart (`src/charts/internal/cues.tsx`), through the Legend's `item` part.
