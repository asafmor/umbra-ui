# Slider

**Tier** 2 · **Group** Inputs · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Chooses a number, or a range with two thumbs, by dragging along a track. The `scrubber` variant is a position on a timeline.

## Not for

- Showing a value that cannot be changed: use `ProgressBar` or `LevelMeter`.
- A few named choices: use `SegmentedFilter` or `Stepper`.
- An exact number: use `TextField type="number"`.

## Evidence

Screenshot 38 (and 24, 37): a thin "intensity" bar per row, filled to a share, coloured by its value. Screenshot 36: a thin track with the value in a box at its start and a marker, a scrubber of a timeline. Both are drawn as displays in the source; the control is the library's own.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `track` | the `rail`, its `fill`, a `tick` per mark, a `boundary` tick where a band starts, and the thumbs | shown |
| `thumb` | the handle; holds the `bubble` | one, or two for a range |
| `output` | the value as text | shown (`showValue`) |
| `marks` | the labels of the marks (`markLabel`) | shown when a mark has a label |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| value | a number, or `[from, to]` | A range has two thumbs and the fill between them |
| `orientation` | `horizontal`, `vertical` | Vertical takes the height of its slot, the low end at the bottom |
| `variant` | `default`, `scrubber` | Scrubber: 2px rail, a bar for a thumb, the output in a box before the track |
| `size` | `default`, `small` | Thumb 16 / 12px, rail 4 / 3px |

States: hover, dragging, focus (thumb), disabled, read-only, invalid.

## Customisation

### 1. Tokens

`--umbra-slider-width` (the width it asks for where its slot is as wide as its content: 200px), `--umbra-slider-length` (vertical), `--umbra-slider-thumb-size`, `--umbra-slider-small-thumb-size`, `--umbra-slider-scrubber-thumb-size`, `--umbra-slider-track-height`, `--umbra-slider-small-track-height`, `--umbra-slider-scrubber-track-height`, `--umbra-slider-track-bg`, `--umbra-slider-fill`, `--umbra-slider-thumb-bg`, `--umbra-slider-thumb-border`, `--umbra-slider-tick-color`, `--umbra-slider-output-fg`, `--umbra-slider-hatch`, `--umbra-slider-mark-width` (vertical).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` / `defaultValue` / `onChange` / `onChangeEnd` | number \| `[number, number]` | — | Generic over the two |
| `min` / `max` / `step` | number | 0 / 100 / 1 | |
| `orientation`, `variant`, `size` | see above | | |
| `marks` | `(number \| { value, label? })[]` | — | Ticks, with labels under the track |
| `thresholds`, `lowerIsBetter` | the shared `ThresholdList`, boolean | — | Colour by value (one thumb) |
| `formatValue` | `(value: number) => string` | `String` | Output, bubble and screen reader |
| `showValue` | boolean | `true` | The output |
| `bubble` | boolean | `false` | The value over the thumb while it is hovered, focused or dragged |
| `disabled`, `readOnly`, `invalid` | boolean | `false` | Also from the `FormField` |
| `name` | string | — | Each thumb sends its value under it |
| `startLabel`, `endLabel` | string | "From", "To" | Names of the two thumbs of a range |
| `aria-label`, `id` | string | — | |

### 3. Parts

`track`, `output`, `marks`.

### 4. Blocks

`Slider.Root`, `Slider.Track`, `Slider.Thumb`, `Slider.Output`, `Slider.Marks`.

## Behaviour as space shrinks

A horizontal slider fills its slot; the track takes what the output leaves.

| Step | Trigger | Result |
|---|---|---|
| 1 | Under 200px wide (container query) | `marks` (the labels) hide; the ticks stay |
| 2 | Under 120px wide | `output` hides; a thumb still says its value |

A vertical slider is as tall as its slot (at least 96px) and has no steps.

## Interaction and accessibility

- React Aria's slider: each thumb is a `slider` (a visually hidden range input, so it is sent with a form). A range is a `group` with two sliders named `startLabel` and `endLabel` after the group's name.
- Keys: the arrow keys step (following what is drawn in right to left), `PageUp` and `PageDown` step a tenth of the scale, `Home` and `End` go to the ends. The thumbs of a range do not pass each other.
- Pointer: drag a thumb, or press the track to move the nearest thumb there. The track is 24px across and a thumb's target is 24px, whatever is drawn.
- `aria-valuetext` is `formatValue` of the value, and the label of its band.
- **Colour by value**: with `thresholds` the fill takes the colour of the band the value is in. Cues that are not colour: the band's pattern over the fill (the patterns of `ProgressBar`: hatched by position, the top band solid), a taller tick where each band starts, and the band's `label` in the output ("55 · Medium") and in the value text. State for CSS: `data-band` on the fill.
- Read-only: focusable, `aria-readonly`, and neither keys nor the pointer change it. Invalid: `aria-invalid` on each thumb and a danger outline on the rail; the message is the field's.
- Right to left: the low end is at the right; fill, ticks and labels use logical properties.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Output and bubble are both offered** (`showValue`, `bubble`): the output is the default because it is always visible; the bubble is drawn inside the thumb, so a container that clips (a card body at its edge) can cut it. Recorded as the bubble's limit.
- **`required` is left out**: a slider always has a value, and ARIA has no `aria-required` for it.
- **`thresholds` apply to one thumb only**: a range has no single band.
- **`scrubber` is a variant**, not a component: same behaviour, another look.
- **No `loading` state**: it is an input.
- **The name inside a `FormField`**: React Aria names a thumb through the slider's group, and a name is not followed through two references, so the thumb's `aria-labelledby` is pointed at the field's label directly.
- **Vertical has no shrink steps**: its labels are beside the track, where narrowing the height does not make them collide as soon.
- **Among actions that overflow it stays in the row** (integration pass, 2026-10-11): as `Stepper`.
