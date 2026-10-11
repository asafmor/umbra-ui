# Heatmap

**Tier** 2 · **Group** Meters and charts (`umbra-ui/charts`) · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A grid of cells coloured by value: two categories against each other (days by hours), or points summed into bins (where things happen on a plan). It can be drawn over a diagram the app supplies.

## Not for

- Values compared along one category: use `BarChart`.
- Single points with two values each: use `Scatter`.
- A table with a few coloured cells: use `DataTable` with `ValuePill`.
- A calendar: use `Planner` or `WeekStrip`.

## Evidence

A heat overlay on an upright diagram in a small card, blobs running from green through yellow to red where activity is dense, under it a legend "Low", five swatches, "High" and a one-line note (36). The same overlay beside a table in a modal (35). No axes in either: the diagram is the frame. Only seen over a diagram; the plain grid with axes is the library's own, as the generic form.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `backdrop` | the app's node, behind the cells, at the size of the plot area | none |
| `cells` | one `cell` per value; each is a point | shown |
| `axes` | the two axis lines, the row and column names (`yTicks`, `xTicks`), the titles (`xTitle`, `yTitle`) | shown; `axes={false}` hides them |
| `valueLabels` | the value printed in each cell | shown when every value fits its cell |
| `legend` | "Low", one swatch per step of the scale, "High" (`lowLabel`, `highLabel`); with `thresholds`, one item per band with its name | shown below the chart |
| `tooltip` | the cell's row and column, and its value | on hover and keyboard focus |
| `skeleton`, `empty`, `error` | the three data states | |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| data | `rows` + `columns` + `values`, or `points` + `bins` | Binned points are summed per cell (a count without `value`); rows and columns are named by their ranges, the highest `y` first |
| scale | `steps` (default 5), or `thresholds` | Steps are equal parts of the value domain; thresholds are bands with a tone or colour and a name |
| `lowerIsBetter` | boolean | Mirrors the looks over the steps or bands |
| `labels` | `true` (default), `false` | `false` never prints values: the size of each mark shows its step |
| `axes` | `true` (default), `false` | |
| `legend` | as on every chart | |

States: loading, empty, error (with `onRetry`), every step switched off (`allHiddenLabel`).

## Customisation

### 1. Tokens

`--umbra-heatmap-low`, `--umbra-heatmap-high` (the two ends of the colour scale), `--umbra-heatmap-cell-border`, `--umbra-heatmap-cell-border-width`, `--umbra-heatmap-cell-radius`, `--umbra-heatmap-backdrop-opacity`, `--umbra-chart-label-halo`, and the shared `--umbra-chart-*` tokens (font, axis, tooltip, ring, content height).

### 2. Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `rows`, `columns` | `string[]` | — | The names, rows from the top down |
| `values` | `(number or null)[][]` | — | One list per row. `null` leaves the cell out |
| `points` | `{ x, y, value? }[]` | — | In place of the three above |
| `bins` | number or `[columns, rows]` | 8 | |
| `xDomain`, `yDomain` | `[number, number]` | the range of the points | |
| `steps` | number | 5 | |
| `valueDomain` | `[number, number]` | round numbers around the values | |
| `thresholds`, `lowerIsBetter` | the shared shape | — | |
| `axes` | boolean | `true` | |
| `xTitle`, `yTitle` | string | — | |
| `lowLabel`, `highLabel` | string | "Low", "High" | |
| `labels` | boolean | `true` | |
| common | | | `aria-label`, `aria-labelledby`, `description`, `legend`, `hiddenIds`, `defaultHiddenIds`, `onHiddenChange`, `formatValue`, `onPointPress`, `height`, `loading`, `empty`, `error`, `onRetry`, `retryLabel`, `allHiddenLabel`, `pointsLabel`, `legendLabel` |

`hiddenIds` holds the ids of steps of the scale: `step-0` (the lowest) to `step-4`. `onPointPress` receives `{ seriesId: row, seriesLabel: row, index: column index, x: column, value }`.

### 3. Parts

`backdrop`, `legend`, `tooltip`, `skeleton`, `empty`, `error`.

### 4. Blocks

`Heatmap.Root`, `Heatmap.Backdrop`, `Heatmap.Cells`, `Heatmap.Axes`, `Heatmap.ValueLabels`.

## Behaviour as space shrinks

| Step | Trigger (slot width or height below) | Result |
|---|---|---|
| 1 | 360 / 240 | The legend hides |
| 2 | 280 / 190 | The printed values hide; the size of each mark shows its step |
| 3 | 220 / 150 | The axis titles hide |
| 4 | 150 / 100 | The axes and the row and column names hide: the cells only |

At every size the row and column names thin out to what fits, and names wider than their room are truncated. The printed values also give way, at any size, as soon as one of them does not fit its cell. Cells share the plot evenly and never disappear.

## Interaction and accessibility

- The frame of every chart: `figure` with its name, a summary, and the same values as a hidden table (row and column headers).
- The cells are a `listbox` with one tab stop. Left and Right move along a row, Up and Down to the same column of the next row (the nearest cell where one is missing), Home and End to the ends of the row, Enter or Space press, Escape clears. A cell is named "row, column: value", with the band's name.
- Colour is never alone. The value is printed in the cell when it fits; otherwise the mark is a square whose side grows with the step (45% of the cell to all of it). The value is always in the tooltip and the table.
- The legend is the scale: its swatches are toggle buttons named by their range ("0 – 10"), which switch a step's cells off; hovering one dims the others.
- Right to left: the plot does not mirror, as in every chart; the legend around it does.
- The backdrop is decoration: `aria-hidden`, and it takes no pointer.

## Open questions

None.

Resolved 2026-10-11:

- **No new token for the scale.** The value ramp is five meanings (grey, orange, yellow, green, teal), not a sequence, so it does not suit. The scale is one hue mixed in oklab between two existing tokens: `--umbra-color-base-surface3` (low) and `--umbra-color-series-1` (high), at 15%, 36%, 58%, 79% and 100% for five steps; both ends are component tokens.
- **Contrast, measured on the four tints** (violet, teal, green, slate; the card differs by at most 0.03). Step against the card: 1.5, 2.0, 3.0, 4.3, 6.2 to 1. Neighbouring steps: 1.4 to 1.5 to 1. Neither can reach 3:1 with five steps of one hue on a dark card, which is why colour is not the only cue: every cell has an edge in the control border colour (4.1:1 against the card), so the lowest step can be told from no cell, and the value is printed or shown by size. Printed text is the primary text colour with a halo in the surface colour (18:1 against its halo; without it the text would be 2.9:1 on the highest step).
- The second cue is the printed value, then size; no patterns: five patterns in cells of 20px cannot be told apart.
- The steps of the scale are the chart's "series": the legend lists them, `hiddenIds` switches them, hovering one dims the rest. A row is not a series.
- The scale's ends are rounded (`niceDomain`), so the steps start at round numbers and the legend's names are short.
- The legend of a scale shows swatches between "Low" and "High", as in the evidence; the ranges are the accessible names of the swatches. With `thresholds` it shows the bands' names instead.
- An empty bin is `null`, not zero: there is nothing there. Over a backdrop the diagram shows where nothing happened.
- Over a backdrop the cells are 80% opaque (`--umbra-heatmap-backdrop-opacity`).
- **The order of the steps is the one of the four existing charts** (legend, labels on the marks, axis titles, axes), not "titles, tick labels, legend, axes": one order for every chart, from one piece of code (`Frame`, `cartesianMargins`). Tick labels thin out continuously instead of being a step.
- `backdrop` is a part with no props: the node fills the plot area through its own CSS (`width: 100%; height: 100%`; an `<svg>` with `preserveAspectRatio="none"` stretches). It is drawn in a `foreignObject`, so it can be HTML or SVG. The shared block is `Backdrop` in `src/charts/internal/cartesian.tsx`.
- No annotations on a heatmap: its axes are categories.
- Fuller option taken: the binned mode, thresholds, `lowerIsBetter`, the interactive scale legend.
