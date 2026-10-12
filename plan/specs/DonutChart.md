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
| `tone` | `default`, `neutral`, `info`, `success`, `warning`, `danger`, `accent`, `ramp-1` to `ramp-5` | Single value only. The number in the centre is the cue that does not depend on colour |
| `thresholds` | a list of `{ from, tone?, color?, label? }`, or number[] | Single value only. Colours it by its band (the shared shape of `plan/decisions/07-customisation.md`, "Thresholds"): the last `from` not above the value. The band's `label` joins the value text (tooltip, point name, summary). `lowerIsBetter` mirrors the colours. `data-band` on the segment. |
| `sweep` / `startAngle` | degrees | Less than 360 leaves the ring open, as a gauge |
| `roundedCaps` | boolean | On by default for one value, off for segments |
| `gap` | degrees | Space between segments, default 2 |
| segment fill | `square` (solid), `stripes`, `dots` | Taken in turn by position, so neighbours differ without colour; the legend shows the same swatch |
| `labels` | boolean | Name and percentage outside each segment of 4% or more |

States: hover, focus, series hidden, series dimmed, loading, empty, error.

## Customisation

### 1. Tokens

Shared by the four charts: `--umbra-chart-font`, `--umbra-chart-fg` (axis and label text), `--umbra-chart-value-fg` (value labels, hover outline), `--umbra-chart-axis`, `--umbra-chart-axis-width`, `--umbra-chart-grid`, `--umbra-chart-grid-width`, `--umbra-chart-grid-dash`, `--umbra-chart-line-width`, `--umbra-chart-point-scale`, `--umbra-chart-area-opacity`, `--umbra-chart-bar-radius`, `--umbra-chart-track`, `--umbra-chart-value`, `--umbra-chart-positive`, `--umbra-chart-negative`, `--umbra-chart-warning`, `--umbra-chart-info`, `--umbra-chart-annotation`, `--umbra-chart-annotation-width`, `--umbra-chart-band-opacity`, `--umbra-chart-dim-opacity`, `--umbra-chart-center-font`, `--umbra-chart-gap`, `--umbra-chart-tooltip-bg`, `--umbra-chart-tooltip-fg`, `--umbra-chart-tooltip-border`, `--umbra-chart-tooltip-radius`, `--umbra-chart-tooltip-max-width`, `--umbra-chart-track-border`, `--umbra-chart-track-border-width`, `--umbra-chart-band-edge-width`, `--umbra-chart-annotation-dash`, `--umbra-chart-ring-width` (hover outline), `--umbra-chart-outline-width` (patterned fills), `--umbra-chart-content-height`. Each falls back to a global token where one exists. Series colours are the global palette `--umbra-color-series-1` … `-8`, by position. No global token was added.

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
| `tone` / `thresholds` / `color` | see above / see above / CSS colour | `default` / — / — | Colour of the single value; `color` wins, then the band |
| `lowerIsBetter` | boolean | `false` | Mirrors the colours of the bands |
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
- Hover or focus shows the tooltip: the group's title and one row per series at that position, the pointed one in bold. It is never cut: it sits above the point unless the point is in the top half, aligned to the side of the plot the point is on, and stays inside the chart when it fits there; in a chart too short for it, it leaves the chart on that side, and it never leaves the window (it takes the other side, or is moved back in). It never covers its point. It is at most `--umbra-chart-tooltip-max-width` (20rem) wide. `Escape` dismisses it, also when it was opened by the pointer and the focus is elsewhere. It is hidden from assistive technology, which has the option names.
- **Right-to-left** (decided 2026-10-11, review C1): the plot does not mirror. Values grow to the right and upwards, time runs to the right, a sideways bar chart keeps its categories on the left, and the arrow keys follow what is drawn (`ArrowRight` is the point to the right). The drawing is laid out left to right in every page direction, so each label keeps its side and stays off the marks; a label in a right-to-left script is still drawn in its own direction. Everything around the plot is HTML and follows the page: the legend (`start` is the right side of a right-to-left page), the tooltip's content, the empty and error states and the hidden data table. Mirroring only the value axis was rejected: the same data would read differently in two languages, and screenshots could not be shared between them.
- The legend is the `Legend` component, interactive: an item hides its series (pressed means shown), and hovering or focusing one dims the other series.
- A visually hidden `table` repeats every value: one row per series, one column per position.
- Loading sets `aria-busy` and removes the list of points; the error state is an `alert`.
- Marks fade in over 180ms on the first draw and when the data changes. With reduced motion the duration is 0.
- Text keeps 4.5:1; axis lines, grid dots and marks keep 3:1 against the card on every tint (checked in `src/charts/scales.test.ts` and by the series palette's own test).
- Hiding a segment in the legend shares the ring among the others; percentages follow.

## Open questions

None.

Resolved 2026-10-11 (fix pass of review 2, plan/reviews/milestone-2.md):

- **Invalid input, focus and `aria-describedby`.** A value that is not a finite number is a missing value and a second segment of one id is left out, with a warning in development (plan/decisions/03-charts.md, "Invalid input"). The focus of the plot is kept when the app shows the skeleton or an error in its place (the shared frame). An `aria-describedby` given by the app is kept, before the chart's own summary. A single `value` that is not finite gives the empty state; a segment with such a value is left out.

Resolved 2026-10-11 (Milestone 2, one `thresholds` shape):

- A threshold is the shared `Threshold` (it was `{ from, tone }`): a `tone`, a free `color` or neither (the ring keeps its `tone`), and a `label`. `DonutTone` is `default` plus every tone a threshold can have.
- The cue that is not colour stays the number in the centre, now with the band's label in the text; a ring of one value takes no pattern.

Resolved 2026-10-11:

- The accessible name is `aria-label` (it was `label`), as on the other components: `plan/decisions/07-customisation.md`, "Prop names".
- **`height`**, shared with `DataTable` and `List` (`src/internal/height.ts`). The chart used to be zero pixels tall in a parent without a height. The plot now has a content size of its own (`contain-intrinsic-block-size`), which only counts where there is no height to fill, so the fallback needs no measuring. Token: `--umbra-chart-content-height`.

Resolved 2026-10-10:

- Drawn as SVG by the library; `d3-scale` and `d3-shape` only (`plan/decisions/03-charts.md`). Ships from `umbra-ui/charts`.
- The chart measures its slot with a `ResizeObserver` (`src/charts/internal/useChartSize.ts`) and draws from that; its only size prop is `height` (2026-10-11), for a chart that has no slot height to fill. Steps are decided from the slot's width and height together: the smaller one decides.
- Label widths are measured, not estimated (revisited 2026-10-11, review C2, C3, C11): each label is measured once in the chart's own font with tabular figures (a hidden SVG text, `measurer` in `src/charts/internal/useChartSize.ts`), the width is kept, and labels are measured again when a web font has loaded. The layout is still one pass. A tick label under the plot is centred on its tick and moved in by what the edge of the chart would cut; a sideways bar chart leaves room for half of its last value. Nothing is cut at any size or density (tested at three window sizes and three densities).
- Right-to-left: the plot is not mirrored (see "Interaction and accessibility"); story `Charts/Right to left`.
- `data-part` values are camelCase, as in `parts` (decision 07): `xTicks`, `yTicks`, `xTitle`, `yTitle`, `valueLabels`, `seriesLabel`, `axisLabels`, `centerValue`, `centerLabel`, `focusRing`; the placeholder carries `skeleton`.
- Non-text contrast of the track (review C12): the track shows how far the scale goes, so it carries information. Its fill stays quiet (1.19–1.21:1 against the card) and it has an edge line with 4.11–4.16:1 on the four tints (`--umbra-chart-track-border`, the control border colour; `--umbra-chart-track-border-width`). The line is drawn inside the ring, so the value covers it and the ring keeps its width. A brighter fill was rejected: at 3:1 it would stand only 1.6:1 from the value.
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
- One component for both forms; `data` switches to segments.
- The default centre value is the percentage, as in the source. The default colour is the first series colour, not the source's yellow, which reads as a warning here.
- Tones use the semantic colours. Thresholds are in the units of `value`.
- Segment fills go solid, stripes, dots by position, in the Legend's own marker kinds, so a legend swatch matches its segment.
- Zero and negative values draw nothing; a value above `max` fills the ring.
