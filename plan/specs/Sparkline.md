# Sparkline

**Tier** 2 · **Group** Meters and charts (`umbra-ui/charts`) · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A tiny chart with no axes: the shape of a run of values in the room of a word. The in-cell chart of `DataTable` and the trend of a `SummaryTile`.

## Not for

- A chart to read values from, with axes, a legend and keyboard access to every point: use `LineChart` or `BarChart`.
- A few discrete outcomes as dots: use `SequenceDots`.
- One value on a scale: use `ProgressBar`, `LevelMeter` or `PieIndicator`.

## Evidence

A strip of up to five small bars of different heights in a table column, one per recent result, olive or yellow-green with grey for low ones and an occasional red one, packed from the left of the cell (4, 9, 17, 18). Each bar is about 4px wide and at most 16px high in a 30px row. A mini filled chart used as a preview in a card (1). No line sparkline appears in the evidence; `line` and `area` are the library's own, as the common case of the pattern.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `reference` | a dashed line at a value, or a band between two | shown when `reference` is set |
| `marks` | the line, the area or the bars | shown |
| `markers` | dots on the last, the lowest and the highest value, and on the value the tooltip shows | shown by `lastPoint`, `extremes`, `interactive` |
| `skeleton` | stands in for the drawing while loading | shown when `loading` |
| `empty` | `emptyLabel`, when there is no value | |

Every part carries `data-part` with its name; a bar carries `bar`, and the dots `lastPoint`, `minPoint`, `maxPoint`, `activePoint`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `line` (default), `area`, `bars`, `signed` | `bars`: one bar per value from zero. `signed`: equal bars above or below the middle by the sign of each value, a tick for zero |
| `curve` | `linear`, `smooth`, `step` | Line and area |
| `tone` / `color` | `default`, a threshold tone / any CSS colour | |

States: loading (`data-loading`), no values (`data-empty`), interactive (`data-interactive`).

## Customisation

### 1. Tokens

`--umbra-sparkline-height` (20px), `--umbra-sparkline-color`, `--umbra-sparkline-line-width`, `--umbra-sparkline-area-opacity`, `--umbra-sparkline-marker`, `--umbra-sparkline-reference`, `--umbra-sparkline-positive`, `--umbra-sparkline-negative`.

### 2. Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `data` | `(number or null)[]` | — | `null` is a missing value: a gap in the line, no bar |
| `variant`, `curve`, `tone`, `color` | see above | | |
| `labels` | `string[]` | — | The name of each value, for the tooltip |
| `domain` | `[number, number]` | the lowest and highest value; bars include zero | |
| `thresholds`, `lowerIsBetter` | the shared shape | — | Colours each bar, and the last point of a line, by its band |
| `reference` | number or `[number, number]` | — | |
| `lastPoint`, `extremes` | boolean | `false` | |
| `maxBarWidth` | number | 6 | Bars are packed from the left at this width, and get narrower when the values do not fit |
| `interactive` | boolean | `false` | A tab stop with a tooltip of the nearest value |
| `formatValue` | `(value) => string` | the provider's locale | |
| `formatSummary` | `(stats, format) => string` | an English sentence | `stats`: `count`, `first`, `last`, `min`, `max`, `trend` |
| `aria-label` | string | the summary | Replaces the summary |
| `loading` | boolean | `false` | |
| `emptyLabel`, `noValueLabel` | node, string | "—", "No data" | |

`sparklineColumn({ values, sparkline, ...column })` returns a `DataTable` column whose cells draw a sparkline: `values(row)` is the run, `sparkline` the props (or a function of the row). The column is 96px wide and sorts by the last value unless it has an `accessor`. It is exported from `umbra-ui/charts`, so the main entry imports no chart code.

### 3. Parts

`reference`, `marks`, `markers`, `skeleton`. Each accepts a node, `null` or a function.

### 4. Blocks

`Sparkline.Root`, `Sparkline.Reference`, `Sparkline.Marks`, `Sparkline.Markers`.

## Behaviour as space shrinks

A sparkline has one size rule and no steps: it is as wide as its container and `--umbra-sparkline-height` high (set `height` in `style` for another). The drawing is absolute inside it, so it never pushes a cell or a tile wider, and is redrawn for every width. A line gets flatter and bars narrower (down to 1px each); nothing is dropped, because there is nothing secondary to drop.

## Interaction and accessibility

- `role="img"` with a generated summary as its name: how many values, the first, the last, the lowest, the highest, and whether the run rises or falls. `formatSummary` words it in the app's language; `aria-label` replaces it. The drawing is `aria-hidden`.
- No point-by-point keyboard navigation by default: at this size the summary is the content, and a table of sparklines must not add a tab stop per row.
- `interactive`: the sparkline is one tab stop. Focus shows the last value in a tooltip; Left and Right move to the previous and next value, Home and End to the first and last; the pointer shows the value nearest to it; Escape dismisses the tooltip and keeps the focus. The tooltip is the shared `Tip`, so it opens inside a `Modal`.
- Colour is never alone: a bar's height is its value, a signed bar's side is its sign, and the band's label is in the tooltip.
- No value: `emptyLabel` is shown and `noValueLabel` is the name. Loading: a skeleton of the same size, `aria-busy`, and an image only when the app named it.
- Right to left: like the charts, the drawing does not mirror; the run reads left to right, and bars are packed from the left.

## Open questions

None.

Resolved 2026-10-11:

- The discrete win/loss-style variant is named `signed`: it draws the sign of each value and nothing else, which is what it is in any domain.
- Not built on `Frame`: no legend, no axes, no states with actions, no data table. It shares the charts' size hook, scales and line paths (`d3-scale`, `d3-shape`), and the tooltip of the meters.
- The data table for screen readers is replaced by the summary: five numbers and a direction say what a 20px drawing shows.
- The cue of `thresholds` on bars is the bar's own height (a higher band is a taller bar), so no pattern is drawn on a 4px bar.
- `sparklineColumn` lives in the charts entry and imports `DataTable`'s column type only. `npm run check:package` holds the ceilings.
- `SummaryTile` needs nothing new: it takes any node (`caption`, `trend`); story `Charts/Sparkline`, "In summary tile".
- The focus tooltip of an interactive sparkline is not announced value by value (the name is the summary); an app that needs every value read uses a chart.
- Fuller option taken: four variants, three curves, markers, reference line and band, thresholds, the interactive tooltip with keyboard, the column helper.
- **A width of its own where the container has none to give** (integration pass, 2026-10-11): in a container that is as wide as its content (the `trend` slot of a `SummaryTile`, the `trailing` slot of a list row, an item of a flex row) a sparkline was zero pixels wide. It now counts as `--umbra-sparkline-width` (4rem) there, through size containment (`contain-intrinsic-inline-size`), which changes nothing where the container has a width.
