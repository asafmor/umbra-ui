# LevelMeter

**Tier** 1 · **Group** Meters and charts · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A strip of ticks with a marker that shows where a value sits on a scale. The scale is numeric or a list of named levels. It can also show a range, and a second marker to compare with.

## Not for

- An amount that fills from one end: use `ProgressBar`.
- A value left or right of a centre: use `DivergingMeter`.
- A star score: use `StarRating`.
- A value the user sets: use `Slider`.

## Evidence

A bordered box of about ten ticks with one taller, coloured tick, orange, yellow or green by level; ticks before it are lit, after it dim (37, 38). The same beside a label in a card header and in each sub-card header (39). Several adjacent ticks lit as a range, in a popover and a table column (40). The catalog also lists 3, 6, 10 and 23 (taken from the inventory; only 39 was re-read for this spec).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | the name of the meter | shown when `label` is set |
| `minLabel` / `maxLabel` | captions at the two ends | shown when set |
| `strip` | the box and its ticks | shown |
| `band` | the range | shown when `range` is set |
| `marker` | the value | shown when `value` is set |
| `compare` | the comparison: a hairline with a pointer | shown when `compare` is set |
| `value` | the value as text | hidden; shown by `showValue` or `valueLabel` |
| `skeleton` | stands in for the strip while loading | shown when `loading` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| scale | numeric (`min`, `max`, `steps`), named (`levels`) | On a named scale the marker sits on a level |
| `range` | `[low, high]` | A band, alone or with a marker inside it |
| `zones` | `{ from, to, tone, label }[]` | The marker takes the tone of its zone; zone edges are taller ticks |
| `tone` | `default`, `neutral`, `info`, `success`, `warning`, `danger`, `ramp-1` to `ramp-5` | Marker colour when no zone or level sets it |
| `orientation` | `horizontal`, `vertical` | Vertical runs from the bottom up and fills the height it is given |
| `size` | `small` (14px), `default` (20px), `large` (28px) | `small` is for table cells |
| `boxed` | boolean | The border and surface around the ticks |

States: `loading`, out of range (`data-out-of-range`), shrink level (`data-shrink="1"` to `"3"`).

## Customisation

### 1. Tokens

`--umbra-level-meter-track`, `--umbra-level-meter-border`, `--umbra-level-meter-tick`, `--umbra-level-meter-tick-lit`, `--umbra-level-meter-tick-width`, `--umbra-level-meter-marker`, `--umbra-level-meter-marker-width`, `--umbra-level-meter-band`, `--umbra-level-meter-compare`, `--umbra-level-meter-height`, `--umbra-level-meter-radius`, `--umbra-level-meter-pitch` (the least room one tick needs), `--umbra-level-meter-length` (the longest the strip grows; none by default).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | number \| level id | — | Where the marker sits. On a named scale a number is the level's index. |
| `min` / `max` | number | 0 / 100 | |
| `steps` | number | 10 | Number of ticks on a numeric scale |
| `levels` | `{ id, label, tone? }[]` | — | A named scale; replaces `min`, `max` and `steps` |
| `range` | `[low, high]` | — | |
| `compare` / `compareLabel` | number \| level id / string | — / "Comparison" | |
| `rangeLabel` | string | "Range" | Names the band for assistive technology |
| `zones` | see above | — | |
| `tone` | see above | `default` | |
| `label` | node | — | |
| `aria-label` | string | — | Names a meter with no visible label |
| `minLabel` / `maxLabel` | node | — | |
| `showValue` | boolean | `false` | |
| `valueLabel` | node | — | Replaces the formatted value, and shows it |
| `formatValue` | `(value) => string` | the number | A named scale uses the labels of its levels |
| `orientation` | see above | `horizontal` | |
| `size` | see above | `default` | |
| `boxed` | boolean | `true` | |
| `loading` | boolean | `false` | |

### 3. Parts

`label`, `minLabel`, `maxLabel`, `strip`, `band`, `marker`, `compare`, `value`, `skeleton`.

### 4. Blocks

`LevelMeter.Root`, `LevelMeter.Label`, `LevelMeter.EndLabel`, `LevelMeter.Strip`, `LevelMeter.Band`, `LevelMeter.Marker`, `LevelMeter.Value`.

## Behaviour as space shrinks

The strip takes the room left by the labels, and needs `--umbra-level-meter-pitch` (5px) per tick. When the meter does not fit its width (its height, when vertical):

| Step | Result |
|---|---|
| 1 | The end labels hide |
| 2 | Every 2nd tick stays |
| 3 | Every 5th tick stays (and the last one) |
| 4 | The label truncates |

The marker, the band and the comparison marker always stay, at the same place on the scale. Everything returns when the container grows.

## Interaction and accessibility

- Not focusable; no keyboard interaction.
- Built on React Aria's `Meter` (`role="meter"`). The visible label names it; without one, `aria-label` does.
- `aria-valuetext` describes it in words: the value or level, the zone's label, the range and the comparison ("62, Fair, Range: 40 – 65, Last month: 45").
- On a named scale `aria-valuenow` is the index of the level. A meter that shows only a range reports the middle of the range.
- Colour is never the only cue: the marker is taller and wider than a tick, the comparison has its own shape, zone edges are taller ticks, and the zone's label is in the text.
- A value outside the scale clamps the marker; the text keeps the real value.
- While loading, the root is not a meter; it sets `aria-busy`.
- The exact value on hover (a tooltip) waits for the public `Tooltip`.

## Open questions

None.

Resolved 2026-10-10:

- The marker sits at the exact value, not on the nearest tick; ticks up to it are lit, as in the source.
- `value`, `compare` and the ends of `range` accept a level id or a number.
- A value that names no level draws no marker.
- Zones apply to numeric scales; on a named scale each level carries its own tone.
- The band has one neutral colour (`--umbra-level-meter-band`); the marker inside it carries the tone.
- The strip fills the room it is given, like every component. `--umbra-level-meter-length` caps it for a compact meter in a header.
- A vertical meter shrinks by its height, in the same steps.
- Strings read by assistive technology (`compareLabel`, `rangeLabel`) are props with English defaults; a named level is not announced as "3 of 5", which would need a translated pattern.
- Thinning keeps the first and last tick, so the ends of the scale stay visible.
