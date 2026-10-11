# DonutChart

**Tier** 1 · **Group** Meters and charts · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A ring that shows one value against a total (a KPI ring), or how a total splits into a few segments.

## Not for

- A value in a table row or a line of text: use `ProgressBar` or `LevelMeter`.
- More than about six segments, or comparing values precisely: use `BarChart`.
- A full pie: the centre is always open.

## Evidence

Ring with a yellow arc on a dark track and the percentage inside, about 80px, 8px stroke, clockwise from 12 o'clock (7); green arc without a centre label, beside a title and text (8). Segments, gauges, tones and labels are the library's own additions.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `track` | the ring behind the value | shown |
| `segments` | the value arc, or one arc per segment | shown |
| `labels` | segment name and share beside each segment | shown with `labels`, in the segment form |
| `center` | `centerValue` (large) and `centerLabel` (caption) | the percentage in the single-value form; empty in the segment form |
| `legend` | one item per segment | shown in the segment form with more than one segment |
| `tooltip` | name and value of the pointed segment | on hover and focus |
| `skeleton`, `empty`, `error` | the data states | — |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| form | `value` + `max`, or `data` | One value against a total, or several segments |
| `tone` | `default`, `success`, `warning`, `danger`, `info` | Single value only. The number in the centre is the cue that does not depend on colour |
| `thresholds` | `{ from, tone }[]` | Picks the tone from the value: the last threshold reached |
| `sweep` / `startAngle` | degrees | Less than 360 leaves the ring open, as a gauge |
| `roundedCaps` | boolean | On by default for one value, off for segments |
| `gap` | degrees | Space between segments, default 2 |
| segment fill | `square` (solid), `stripes`, `dots` | Taken in turn by position, so neighbours differ without colour; the legend shows the same swatch |
| `labels` | boolean | Name and percentage outside each segment of 4% or more |

States: hover, focus, series hidden, series dimmed, loading, empty, error.

## Customisation

### 1. Tokens

Shared by the four charts: `--umbra-chart-font`, `--umbra-chart-fg` (axis and label text), `--umbra-chart-value-fg` (value labels, hover outline), `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-grid`, `--umbra-chart-grid-width`, `--umbra-chart-grid-dash`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-area-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-track`, `--umbra-chart-value`, `--umbra-chart-positive`, `--umbra-chart-negative`, `--umbra-chart-warning`, `--umbra-chart-info`, `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-band-opacity`, `--umbra-chart-dim-opacity`, `--umbra-chart-center-font`, `--umbra-chart-gap`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-radius`. Each falls back to a global token. Series colours are the global palette `--umbra-color-series-1` … `-8`, by position. No global token was added.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | number | — | The single value |
| `max` | number | `100` | What a full ring stands for |
| `data` | `{ id, label, value, color?, marker? }[]` | — | The segments |
| `centerValue` / `centerLabel` | node | percentage / — | The two lines in the middle; `centerValue={null}` hides the percentage |
| `thickness` | number | a fifth of the radius, 3 to 28px | Ring width in pixels |
| `startAngle` | number | `0` | Degrees clockwise from 12 o'clock |
| `sweep` | number | `360` | Degrees the ring covers |
| `roundedCaps` | boolean | see above | |
| `gap` | number | `2` | Degrees between segments |
| `tone` / `thresholds` / `color` | see above / see above / CSS colour | `default` / — / — | Colour of the single value; `color` wins |
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
| `valueLabel` | string | "Value" | What the single value is called (its option and its table column) when the chart is named by `aria-labelledby`; with `aria-label` it is called by that name |
| `height` | `fill`, `content`, number | `fill` | `fill` takes the height of the parent and falls back to the content's height where the parent has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content. A number is pixels. The content height of a chart is `--umbra-chart-content-height` (240px) for the plot, plus the legend. |

### 3. Parts

`legend`, `tooltip`, `skeleton`, `empty`, `error`, `center`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `empty` and `error` receive `{ children }`, the default state (as in `DataTable`); `tooltip: null` shows no tooltip. A `center` node is drawn inside the SVG.

### 4. Blocks

`DonutChart.Root`, `DonutChart.Track`, `DonutChart.Segments`, `DonutChart.Labels`, `DonutChart.Center`. Other SVG elements may be placed between them.

## Behaviour as space shrinks

The ring always takes the largest circle that fits the plot.

| Step | Trigger (slot width or height below) | Result |
|---|---|---|
| 1 | 200 / 190 | The legend and the segment labels hide |
| 2 | 120 / 110 | The centre caption hides; the value stays and shrinks with the ring |
| 3 | 64 / 64 | The centre value hides: a bare ring |

The caption also hides whenever there is under 72px of room inside the ring. Centre text that is still too wide truncates with an ellipsis.

## Interaction and accessibility

- The root is a `figure` named by `aria-label` or `aria-labelledby`, and described by a visually hidden summary (`description` replaces the generated one).
- The marks are one tab stop: a `listbox` named by `pointsLabel`, whose options are the points, each with a readable name ("Web: 48 (48%)", or "Budget used: 81% (81 / 100)" for one value). `aria-activedescendant` follows the arrow keys.
- Keys: left and right move between segments. `Home` and `End` go to the first and last point of the series. `Enter` and `Space` call `onPointPress`. `Escape` clears the point (and only then takes the key, so a dialog around the chart still closes).
- With no point chosen the focus ring is on the plot, drawn inwards; with one it is on the point. A hovered point gets a light outline instead, so hover and focus differ.
- Hover or focus shows the tooltip: the group's title and one row per series at that position, the pointed one in bold. It is positioned inside the plot, above the point unless the point is in the top half, and aligned to the side of the plot the point is on; it is never wider than two thirds of the plot. It is hidden from assistive technology, which has the option names.
- **Right-to-left** (decided 2026-10-11, review C1): the plot does not mirror. Values grow to the right and upwards, time runs to the right, a sideways bar chart keeps its categories on the left, and the arrow keys follow what is drawn (`ArrowRight` is the point to the right). The drawing is laid out left to right in every page direction, so each label keeps its side and stays off the marks; a label in a right-to-left script is still drawn in its own direction. Everything around the plot is HTML and follows the page: the legend (`start` is the right side of a right-to-left page), the tooltip's content, the empty and error states and the hidden data table. Mirroring only the value axis was rejected: the same data would read differently in two languages, and screenshots could not be shared between them.
- The legend is the `Legend` component, interactive: an item hides its series (pressed means shown), and hovering or focusing one dims the other series.
- A visually hidden `table` repeats every value: one row per series, one column per position.
- Loading sets `aria-busy` and removes the list of points; the error state is an `alert`.
- Marks fade in over 180ms on the first draw and when the data changes. With reduced motion the duration is 0.
- Text keeps 4.5:1; axis lines, grid dots and marks keep 3:1 against the card on every tint (checked in `src/charts/scales.test.ts` and by the series palette's own test).
- Hiding a segment in the legend shares the ring among the others; percentages follow.

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
- Data states come from `src/internal/dataState.tsx` (changed 2026-10-11, review C6): the same props, types and defaults as `List` and `DataTable`. The retry label is "Try again" (was "Retry"), `error` wins over `loading`, and the `error` part receives `{ children }` only (it had `onRetry` and `retryLabel`).
- With every series switched off (review C4) the chart shows the empty state with `allHiddenLabel` and keeps its legend, so a series can be switched back on. Bare axes were rejected: they read as a chart of nothing. The list of points is a `listbox` and a tab stop only while it has points.
- The hidden summary is left out when there is no data (review C8); it read "0: ".
- While loading, the legend's place is held by a placeholder line, so the plot does not move when the data arrives.
- The generated summary lists the series and the range; apps that need a sentence in their own language set `description`.
- One component for both forms; `data` switches to segments.
- The default centre value is the percentage, as in the source. The default colour is the first series colour, not the source's yellow, which reads as a warning here.
- Tones use the semantic colours. Thresholds are in the units of `value`.
- Segment fills go solid, stripes, dots by position, in the Legend's own marker kinds, so a legend swatch matches its segment.
- Zero and negative values draw nothing; a value above `max` fills the ring.
