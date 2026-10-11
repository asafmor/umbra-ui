# PieIndicator

**Tier** 2 · **Group** Meters and charts · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A small disc of wedges that fills with a value: a level gauge that takes the room of an icon. Both the filled amount and the colour show the level. Sized for table cells, rows and lines of text.

## Not for

- A bar with a label and a track: use `ProgressBar`.
- A position on a scale of ticks, a range or a comparison: use `LevelMeter`.
- Shares of a whole with a legend: use `DonutChart`.
- A rating the user sets: use `StarRating`.

## Evidence

A disc of about 8 wedges at the end of each row of a two-column list: all wedges bright green for a high level, part of them yellow-green or orange for a middle one, grey for a low one (39). The same glyph before a level name, yellow for a minimal level (7) and green, nearly full, for an extensive one (15). The disc is about 16px in a 30px row.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `disc` | the track circle, the filled sector (`fill`) and the gaps that cut it into wedges | shown |
| `label` | the name of the indicator | shown when `label` is set |
| `value` | the value as text | hidden; shown by `showValue` or `valueLabel` |
| `skeleton` | stands in for the disc while loading | shown when `loading` |

Every part carries `data-part` with its name; inside the disc, `track` and `fill` carry one too.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `segmented` (default), `continuous` | Segmented fills whole wedges; continuous fills one sector to the exact value |
| `segments` | number, default 8 | Wedges of the segmented disc |
| `size` | `small` 12px, `default` 16px, `large` 24px | The disc; the text keeps the label font |
| `layout` | `inline` (default), `block` | Inline: disc, label, value on one line. Block: the disc above them |
| `tone` | `default`, the six tones, `ramp-1` to `ramp-5` | A matching threshold wins |

States: no value (`data-empty`: empty disc with a dashed edge, `emptyLabel` as the text), out of range (`data-out-of-range`: the disc clamps, the text keeps the real value), loading, changed (`highlightChanges`), value hidden (`data-value-hidden`).

## Customisation

### 1. Tokens

`--umbra-pie-indicator-size`, `--umbra-pie-indicator-gap` (between disc and text), `--umbra-pie-indicator-wedge-gap` (in units of the radius, default 0.16), `--umbra-pie-indicator-fill`, `--umbra-pie-indicator-track`, `--umbra-pie-indicator-track-border`. A changed value reads the shared `--umbra-change-*` tokens.

### 2. Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | number or `null` | — | `null`, `undefined` or `NaN`: no value |
| `min`, `max` | number | 0, 100 | |
| `tone` | `MeterTone` | `default` | |
| `thresholds` | `true` or `ThresholdList` | — | The shared shape. `true`: thirds, danger, warning, success. The band's `label` joins the value text |
| `lowerIsBetter` | boolean | `false` | Mirrors the looks of the bands |
| `size`, `layout`, `segments`, `variant` | see above | | |
| `label` | node | — | Names the meter |
| `showValue`, `valueLabel` | boolean, node | `false` | |
| `formatValue` | `(value, { min, max, percent }) => string` | rounded percentage | |
| `loading` | boolean | `false` | |
| `emptyLabel`, `noValueLabel` | node, string | "—", "No value" | Shown, and read, when there is no value |
| `tooltip` | boolean | `true` | The exact value on hover and focus |
| `highlightChanges`, `increasedLabel`, `decreasedLabel` | | | As on every value block |
| `aria-label` | string | — | For an indicator with no visible label |

### 3. Parts

`disc`, `label`, `value`, `skeleton`. Each accepts a node, `null` or a function receiving the default part's props.

### 4. Blocks

`PieIndicator.Root`, `PieIndicator.Disc`, `PieIndicator.Label`, `PieIndicator.Value`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The disc, the label and the value do not fit side by side | The value hides; the tooltip and assistive technology still have it |
| 2 | The label still does not fit | The label truncates with an ellipsis |

The disc never shrinks. Measured with `useShrinkLevel` and the meters' shared check (`src/meters/fit.ts`).

## Interaction and accessibility

- `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` (the formatted value and the band's label; `noValueLabel` when there is none). The disc is `aria-hidden`.
- Not focusable. The tooltip of the exact value opens on hover, and on focus of the link, button or row around it; it goes through the shared `Tip`, so inside a `Modal` it is in the modal's layer.
- Colour is never alone: the filled amount shows the level, and the band's label is in the text.
- Right to left: the row mirrors (the disc is at the right of its label); the disc itself fills clockwise from 12 o'clock, like a clock.
- While `loading` the root is a named group with `aria-busy`, not a meter.

## Open questions

None.

Resolved 2026-10-11:

- The wedges are one sector under a mask of spokes, not `segments` separate shapes: the gaps are even from the centre to the edge at any size, and the continuous variant is the same drawing without the mask. No `d3`: the meters are in the main entry.
- A value above the minimum lights at least one wedge, so "a little" never looks like "nothing"; otherwise the number of wedges is rounded.
- The default tone is the accent pink of the library, not green: green means "good", which only thresholds can know. The evidence's "amount and hue" is `thresholds`; `thresholds={true}` gives thirds, as on `ProgressBar`.
- The cue that is not colour is the filled amount itself, with the band's label in the text; a 16px wedge is too small for a pattern.
- No value: the track's edge is dashed, so an empty disc is not read as zero.
- `layout` defaults to `inline` (the two other meters default to `block`): the indicator is a glyph beside text.
- The root is a `div` (React Aria's meter), so it cannot sit inside a `<p>`: a line of text that holds one is a `div`. It is `inline-flex` and aligns to the middle of the line. Compromise, recorded: no `span` root.
- Fuller option taken: the continuous variant, `segments`, three sizes, a block layout, `highlightChanges`.
- Shared with `DivergingMeter`: the tone paints (`src/meters/tone.module.css`) and the "value hides first" check, moved out of `ProgressBar.tsx` into `src/meters/fit.ts`.
