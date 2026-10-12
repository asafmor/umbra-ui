# DivergingMeter

**Tier** 2 · **Group** Meters and charts · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A bar that fills to one side of an origin or the other: the direction and the size of a change or an effect. Nothing is filled for a value at the origin.

## Not for

- A value that only grows from one end: use `ProgressBar`.
- A position on a scale of ticks: use `LevelMeter`.
- Many values side by side on one axis: use `BarChart` with `variant="diverging"` or `colorBy="sign"`.
- A value the user sets: use `Slider`.

## Evidence

Six meters in a side column, each a label above a thin grey track: a short green chunk right of the centre for a positive effect, a pink-red chunk left of it for a negative one, and no chunk for none (22). The track is about 4px high and as wide as the column.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | the name of the meter | shown when `label` is set |
| `value` | the value as text | hidden; shown by `showValue` or `valueLabel` |
| `track` | the bar: the rail, the fill and the origin tick | shown |
| `fill` | the coloured chunk between the origin and the value | shown unless the value is at the origin |
| `origin` | a tick at the origin | shown; `originTick={false}` hides it |
| `skeleton` | stands in for the bar while loading | shown when `loading` |

Every part carries `data-part` with its name; the unfilled bar inside the track carries `rail`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | `thin` 4px, `default` 6px, `thick` 12px | |
| `layout` | `block` (default), `inline` | Inline: label, bar, value on one line |
| `tone`, `negativeTone` | `MeterTone` | `success` above the origin, `danger` below |

States: direction (`data-direction`: `positive`, `negative`, `neutral`), no value (`data-empty`), out of range (`data-out-of-range`), loading, changed, value hidden.

## Customisation

### 1. Tokens

`--umbra-diverging-meter-height`, `--umbra-diverging-meter-radius`, `--umbra-diverging-meter-min-width`, `--umbra-diverging-meter-track`, `--umbra-diverging-meter-track-border`, `--umbra-diverging-meter-fill` (the `default` tone), `--umbra-diverging-meter-hatch`, `--umbra-diverging-meter-origin`, `--umbra-diverging-meter-origin-width`.

### 2. Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | number or `null` | — | `null`, `undefined` or `NaN`: no value |
| `min`, `max` | number | -100, 100 | |
| `origin` | number | 0, or the middle of a scale that does not hold 0 | Where the fill starts |
| `tone`, `negativeTone` | `MeterTone` | `success`, `danger` | |
| `thresholds` | `ThresholdList` | — | The shared shape; a band wins over the side's tone, and its `label` joins the value text |
| `lowerIsBetter` | boolean | `false` | Swaps the tones of the two sides and mirrors the looks of the bands |
| `size`, `layout` | see above | | |
| `originTick` | boolean | `true` | |
| `label`, `showValue`, `valueLabel` | | | As on `ProgressBar` |
| `formatValue` | `(value, { min, max, origin }) => string` | the distance from the origin with its sign: "+12", "−8", "0" | |
| `loading`, `emptyLabel`, `noValueLabel`, `tooltip` | | | As on `ProgressBar` |
| `highlightChanges`, `increasedLabel`, `decreasedLabel` | | | As on every value block |
| `aria-label` | string | — | |

### 3. Parts

`label`, `value`, `track`, `fill`, `origin`, `skeleton`. Each accepts a node, `null` or a function receiving the default part's props (`fill` receives `tone` and `color`).

### 4. Blocks

`DivergingMeter.Root`, `DivergingMeter.Label`, `DivergingMeter.Value`, `DivergingMeter.Track`, `DivergingMeter.Fill`, `DivergingMeter.Origin`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The label and the value (and, inline, the shortest bar) do not fit side by side | The value hides; the tooltip and assistive technology still have it |
| 2 | The label still does not fit | The label truncates with an ellipsis |

The bar fills the width that is left and never goes below `--umbra-diverging-meter-min-width` (24px) in the inline layout. The same rule and the same code as `ProgressBar` (`src/meters/fit.ts`).

## Interaction and accessibility

- `role="meter"` with `aria-valuenow` (clamped to the scale) and `aria-valuetext` (the formatted value, which carries the sign, and the band's label; `noValueLabel` without a value).
- The direction never depends on colour: the side of the origin the fill is on, the sign in the value text (a real minus, U+2212), and a hatch on a fill below the origin.
- The tooltip of the exact value is the shared one (`Tip`), so it opens inside a `Modal` too.
- Right to left: positive is towards the end of the line, so the bar mirrors with the page (a positive fill is left of the origin). The hatch stays on the fill below the origin.
- While `loading` the root is a named group with `aria-busy`.

## Open questions

None.

Resolved 2026-10-11 (fix pass of review 2, plan/reviews/milestone-2.md):

- **Invalid input** follows the one rule of plan/decisions/03-charts.md ("Invalid input"): a value that is not a finite number is no value.
- **The default value text has no noise of binary fractions** (MC-14): `value={0.3} origin={0.1}` reads "+0.2" (it read "+0.19999999999999998"); the difference is rounded to 12 significant digits.
- **The value never shows beside a cut label** (MC-15), as on `PieIndicator`.
- **In a `MeterList`** the meter takes the list's columns and leaves hiding the value to the list. A cut label shows its text in a tooltip (plan/specs/MeterList.md).

Resolved 2026-10-11:

- **Positive is towards the inline end**, in both directions: the meter is a row of text-like content, not a plot, so it mirrors like `ProgressBar` does. (The charts do not mirror; a chart has axes with numbers.)
- Three cues for the direction, not one: side, sign and hatch. The hatch is on the negative side because "below" is the one that most needs telling apart when the value text is hidden.
- `lowerIsBetter` swaps which side is "good" (the tones) and leaves the hatch on the side below the origin: the hatch says where the value is, the colour says whether that is good.
- The tick at the origin is on by default, although the evidence has none: with nothing filled for a neutral value, the tick is what shows where the centre is. `originTick={false}` gives the look of the evidence.
- The default scale is -100 to 100, and the default text is the distance from the origin, not a percentage: a diverging value is usually a difference in its own unit.
- `origin` defaults to 0 when the scale holds it, else to the midpoint, so `min={20} max={80}` works with no third prop.
- Thresholds are bands of the value, as everywhere; they colour the fill and do not move the origin.
- Fuller option taken: three sizes, an inline layout, a free origin, thresholds, `highlightChanges`.
