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

Every part carries `data-part` with its name. Inside the strip, `plot`, each `tick` and each zone `boundary` carry one too; they cannot be replaced.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| scale | numeric (`min`, `max`, `steps`), named (`levels`) | On a named scale the marker sits on a level |
| `range` | `[low, high]` | A band, alone or with a marker inside it |
| `thresholds` | a list of `{ from, tone?, color?, label? }`, or number[] | The marker takes the colour of the band it is in (the shared shape of `plan/decisions/07-customisation.md`, "Thresholds"); where a band starts inside the scale is a taller tick. Numbers are boundaries on the value ramp. `lowerIsBetter` mirrors the colours. `data-band` on the root. |
| `tone` | `default`, `neutral`, `info`, `success`, `warning`, `danger`, `accent`, `ramp-1` to `ramp-5` | Marker colour when no band or level sets it |
| `orientation` | `horizontal`, `vertical` | Vertical runs from the bottom up and fills the height it is given |
| `size` | `small` (14px), `default` (20px), `large` (28px) | `small` is for table cells |
| `boxed` | boolean | The border and surface around the ticks |

States: `loading`, no value (`data-empty`), out of range (`data-out-of-range`), shrink level (`data-shrink="1"` to `"3"`).

## Customisation

### 1. Tokens

`--umbra-level-meter-track`, `--umbra-level-meter-border`, `--umbra-level-meter-tick`, `--umbra-level-meter-tick-lit`, `--umbra-level-meter-boundary`, `--umbra-level-meter-tick-width`, `--umbra-level-meter-marker`, `--umbra-level-meter-marker-width`, `--umbra-level-meter-band`, `--umbra-level-meter-compare`, `--umbra-level-meter-height`, `--umbra-level-meter-radius`, `--umbra-level-meter-pitch` (the least room one tick needs), `--umbra-level-meter-length` (the longest the strip grows; none by default).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | number \| level id \| `null` | — | Where the marker sits. On a named scale a number is the level's index. |
| `emptyLabel` | node | "—" | Shown in place of the value text when there is no value, or it names no level |
| `noValueLabel` | string | "No value" | What `aria-valuetext` and the tooltip say when there is no value and no range |
| `min` / `max` | number | 0 / 100 | |
| `steps` | number | 10 | Number of ticks on a numeric scale |
| `levels` | `{ id, label, tone? }[]` | — | A named scale; replaces `min`, `max` and `steps` |
| `range` | `[low, high]` | — | |
| `compare` / `compareLabel` | number \| level id / string | — / "Comparison" | |
| `rangeLabel` | string | "Range" | Names the band for assistive technology |
| `thresholds` / `lowerIsBetter` | see above / boolean | — / `false` | |
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
| `tooltip` | boolean | `true` | The exact value in a tooltip on hover |
| `highlightChanges` | boolean | off | The value text flashes softly once when it changes: green when a number rose, red when it fell, neutral otherwise, with a ▲ or ▼ sign as the cue that is not colour. No flash under reduced motion; the sign stays for four seconds. Never counted up or down. |
| `increasedLabel` / `decreasedLabel` | string | "increased" / "decreased" | What a screen reader hears with the sign |

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
| 3 | Every 5th tick stays (and the last one), and the label may truncate |

The marker, the band and the comparison marker always stay, at the same place on the scale. Everything returns when the container grows.

## Interaction and accessibility

- Not focusable; no keyboard interaction.
- Built on React Aria's `Meter` (`role="meter"`). The visible label names it; without one, `aria-label` does.
- `aria-valuetext` describes it in words: the value or level, the band's label, the range and the comparison ("62, Fair, Range: 40 – 65, Last month: 45").
- On a named scale `aria-valuenow` is the index of the level. A meter that shows only a range reports the middle of the range.
- Colour is never the only cue: the marker is taller and wider than a tick, the comparison has its own shape, the start of a band is a taller tick, and the band's label is in the text.
- A value outside the scale clamps the marker; the text keeps the real value.
- **No value** (`value` is `null`, missing or names no level, and there is no `range`): no marker and no lit tick are drawn, the value text is `emptyLabel` ("—"), and `aria-valuetext` and the tooltip say `noValueLabel` ("No value"), followed by the comparison when there is one. `aria-valuenow` stays at `min` because the role requires it; the text is what is read. The root carries `data-empty`. There is no error state (plan/interaction.md, "Which states a component has").
- **Right to left**: the scale runs from the right; the marker, the band, the comparison and the end labels mirror. A vertical meter does not change.
- **Non-text contrast**, measured on violet / teal / green / slate: the box against the card 4.16 / 4.12 / 4.11 / 4.15; an unlit tick against the strip 4.26 on every tint; a lit tick 9.2. Lit and unlit ticks also differ in height (70% and 40% of the strip), so the difference does not depend on colour.
- While loading, the root is not a meter; it sets `aria-busy`.
- Hovering the meter shows the same text as `aria-valuetext` (value, band, range, comparison) in a tooltip (500ms delay, Escape closes it). `tooltip={false}` turns it off. The meter is still not a tab stop; if the app makes it or a control around it focusable, keyboard focus shows the tooltip too.

## Open questions

None.

Resolved 2026-10-11 (fix pass of review 2, plan/reviews/milestone-2.md):

- **Invalid input**: a value that is not a finite number (`NaN`, `Infinity`) is no value, as `null` is, with a warning in development (plan/decisions/03-charts.md, "Invalid input"). `Infinity` used to fill the scale. **In a `MeterList`** the meter takes the list's columns (label, bar, value) on one line. **A cut label** shows its text in a tooltip, over which the tooltip of the value gives way (plan/specs/MeterList.md). In a list the meter is horizontal and its end captions are left out.

Resolved 2026-10-10:

- 2026-10-11 (review B7): unlit ticks and the box border use `border-control` (they measured 1.9:1 in `border-strong`). Lit ticks are `text-secondary` and taller, and band edges keep `text-muted` through their own token, `--umbra-level-meter-boundary`.
- 2026-10-11 (review B6, B8): a missing value is announced as "No value", not as 0%. No error and no empty state. `value` accepts `null`.
- 2026-10-11: the shrink steps are three, as the code has them; the label truncates at the third.

- 2026-10-11: `highlightChanges` (plan/interaction.md, "Live updates"), the same as on `DataTable` and from the same code: `src/internal/useChangeHighlight.ts` and `ChangeHighlight.tsx`. The number itself is compared. Tokens: `--umbra-change-up`, `--umbra-change-down`, `--umbra-change-neutral`.
- The marker sits at the exact value, not on the nearest tick; ticks up to it are lit, as in the source.
- `value`, `compare` and the ends of `range` accept a level id or a number.
- A value that names no level draws no marker.
- 2026-10-11 (Milestone 2): `zones` (`{ from, to, tone, label }[]`) became `thresholds`, the shared list: a band runs to the next entry, so `to` is gone. To end a coloured band before the end of the scale, add an entry with no `tone` (the marker keeps the meter's `tone` there). The cue that is not colour is the band's label and the taller ticks; a marker is too small for a pattern.
- Thresholds apply to numeric scales; on a named scale each level carries its own tone.
- The band has one neutral colour (`--umbra-level-meter-band`); the marker inside it carries the tone.
- The strip fills the room it is given, like every component. `--umbra-level-meter-length` caps it for a compact meter in a header.
- A vertical meter shrinks by its height, in the same steps.
- Strings read by assistive technology (`compareLabel`, `rangeLabel`) are props with English defaults; a named level is not announced as "3 of 5", which would need a translated pattern.
- Thinning keeps the first and last tick, so the ends of the scale stay visible.
