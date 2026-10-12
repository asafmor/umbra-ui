# Scatter

**Tier** 2 · **Group** Meters and charts (`umbra-ui/charts`) · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Points placed by two values, in one or more series; a third value makes them bubbles. It can be drawn over a diagram the app supplies, to show where things are.

## Not for

- Values over ordered categories or time, joined by a line: use `LineChart`.
- Density of many points: use `Heatmap` with `points`.
- Values compared across categories: use `BarChart`.

## Evidence

Numbered round nodes of one colour placed on an upright diagram in a small card, with a caption under it (36); about nine dots coloured by level on a small diagram in a header (22). No axes in either: the diagram is the frame. Only seen over a diagram; the chart with numeric axes is the library's own, as the generic form.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `backdrop` | the app's node, behind the points, at the size of the plot area | none |
| `grid` | lines at the ticks of both axes | shown with the axes |
| `annotations` | reference lines and bands | when `annotations` is set |
| `series` | the points of each series: its shape in its colour | shown |
| `axes` | the two axis lines, `xTicks`, `yTicks`, `xTitle`, `yTitle` | shown; `axes={false}` hides them |
| `pointLabels` | the name beside each point | with `labels` |
| `legend` | one item per series, with its shape | with more than one series |
| `tooltip` | the point's name and values | on hover and keyboard focus |
| `skeleton`, `empty`, `error` | the three data states | |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| x axis | numbers or dates | By the first point's `x`; dates are drawn in UTC |
| bubbles | a `size` on a point | The area follows the size; see-through, with an edge |
| `labels` | boolean | Names beside the points; one that would cover a point or another name is left out |
| `axes` | `true` (default), `false` | |
| marker | `dot`, `square`, `diamond`, `triangle` | Per series, taken in turn |

States: loading, empty, error (with `onRetry`), every series switched off.

## Customisation

### 1. Tokens

`--umbra-scatter-bubble-opacity`, `--umbra-chart-point-scale`, `--umbra-chart-outline-width`, `--umbra-chart-label-halo`, and the shared `--umbra-chart-*` tokens (font, axis, grid, annotation, tooltip, ring, dim opacity, content height).

### 2. Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `series` | `{ id, label, data, color?, marker? }[]` | — | `data`: `{ x, y, size?, label?, id? }[]` |
| `xDomain`, `yDomain` | `[from, to]` | round numbers around the data | |
| `sizeDomain` | `[number, number]` | 0 to the largest size | The sizes of the smallest and largest bubble |
| `annotations` | `ChartAnnotation[]` | — | The type of `LineChart` and `BarChart` |
| `axes` | boolean | `true` | |
| `xTitle`, `yTitle`, `sizeLabel` | string | —, —, "Size" | They name the values in the tooltip, for screen readers and in the table |
| `formatX`, `formatValue`, `formatSize` | functions | the provider's locale | |
| `labels` | boolean | `false` | |
| `onAction` | `(id) => void` | — | The point's `id`, or `seriesId-index` |
| common | | | As on every chart, `onPointPress` included |

### 3. Parts

`backdrop`, `legend`, `tooltip`, `skeleton`, `empty`, `error`.

### 4. Blocks

`Scatter.Root`, `Scatter.Backdrop`, `Scatter.Grid`, `Scatter.Annotations`, `Scatter.Points`, `Scatter.Axes`, `Scatter.PointLabels`.

## Behaviour as space shrinks

| Step | Trigger (slot width or height below) | Result |
|---|---|---|
| 1 | 360 / 240 | The legend hides |
| 2 | 280 / 190 | The point labels and annotation labels hide |
| 3 | 220 / 150 | The axis titles hide |
| 4 | 150 / 100 | The axes, tick labels and grid hide: the points only |

At every size the tick labels thin out to what fits, and the largest bubble is a ninth of the plot's short side (6 to 24px). Every point stays.

## Interaction and accessibility

- The frame of every chart: `figure` with its name, a summary, and a hidden table with one row per point (x, y, and the size when any point has one).
- The points are a `listbox` with one tab stop. Left and Right move along the x axis within a series, Up and Down to the nearest point of the next series, Home and End to the first and last, Enter or Space press (`onAction`, `onPointPress`), Escape clears. A point is named "series, label: x, y, size", with the axis titles before the numbers when they are set.
- A series never depends on colour: each has a point shape, the same in the plot and in the legend.
- Every point is at least 24px to the pointer.
- The tooltip lists every point at the same place (same label, or same values).
- Right to left: the plot does not mirror; a label still follows its point.
- The backdrop is decoration: `aria-hidden`, and it takes no pointer.

## Open questions

None.

Resolved 2026-10-11 (fix pass of review 2, plan/reviews/milestone-2.md):

- **Invalid input** follows the one rule of plan/decisions/03-charts.md ("Invalid input"): a point whose `x` or `y` is not a finite number is not drawn and does not stretch an axis (one `NaN` blanked the chart), a `size` that is not one makes a plain point, and a second series of one id is left out (MC-4).
- **One draw order for all the series**: every point is its own group, the largest first, so a small point under a larger bubble of a later series is on top, for the eye and for the pointer. `data-series` and `data-dim` are on each point's group (MC-7).
- **A point outside an `xDomain` or `yDomain` the app set is not drawn** (it lay on the tick labels), as a `Heatmap` leaves out points outside its domains. **Without axes** the scales stop short of the plot's edge by the size of a point, so one on the end of a domain is whole (MC-12).
- **5,000 points with `labels`** (MC-16): the names are measured once (the cache of widths holds 50,000, it was emptied at 5,000 and so on every resize); a label is compared only with what is near it (a grid of 48px squares, in the same order as before, so the same labels are drawn); and the model is kept through a hover or a key. A key now costs a frame (it built the chart again: 143ms). A resize is about 100 to 150ms, which is drawing 5,000 SVG nodes.
- **Focus and `aria-describedby`**: as on every chart (MC-6, X-5; see `Heatmap`).

Resolved 2026-10-11:

- The marker of a series is the charts' point shape (`dot`, `square`, `diamond`, `triangle`, `src/charts/internal/cues.tsx`), as on `LineChart`, with a legend glyph drawn from the same shape. The legend's own marker kinds (`src/internal/SeriesMarker.tsx`: line, dashed, stripes, dots) are swatches for lines and fills and say nothing about a point.
- `onAction(id)` is added beside `onPointPress(point)`: here a point can carry an `id`, which the other charts' points cannot.
- Axes: numbers and dates, from the existing scales. No ordinal axis: points on named levels are a `LineChart` with `yLevels`.
- Label collision is greedy, in data order: after the point, else before it, else left out. No leader lines.
- Bubbles are 55% opaque with an edge in the full colour, so overlapping ones can be told apart; the largest are drawn first, so a small one is never hidden under a large one.
- The grid is drawn on both axes, since both are values.
- The order of the shrink steps is the one of the existing charts (see `plan/specs/Heatmap.md`).
- `backdrop`: as on `Heatmap`, a part with no props in a `foreignObject` at the plot area.
- Fuller option taken: bubbles, point labels, a time axis, annotations on both axes, `onAction`.
