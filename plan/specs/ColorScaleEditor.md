# ColorScaleEditor

**Tier** 2 · **Group** Inputs · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Edits a scale of value bands and their colours: an ascending list of stops, each "from this value up, until the next". Its value is the shared `thresholds` list (`plan/decisions/07-customisation.md`, "Thresholds"), so it goes straight into `ValuePill`, `ProgressBar`, `LevelMeter`, `BarChart`, `DonutChart` and `Slider`. With `readOnly` it is the preview alone (the catalog's ColorScalePreview).

## Not for

- Choosing one colour: use the browser's colour field, or a `Select` with `color` options.
- A legend of a chart's series: use `Legend`.
- A continuous gradient: the bands are steps, as the components that read them draw steps.

## Evidence

Screenshot 26: a "Preview" row of eight small numbered swatches from the lowest to the highest value, and an "edit colours" button beside it. The editor itself is not in the evidence.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `preview` | a list of `swatch`es: a `chip` of the colour with its pattern, the boundary (`from`), the `label` | shown |
| `track` | the scale as a bar of `band`s, with a `handle` on each boundary | shown, not in `readOnly` |
| `stops` | one `stop` row per stop: its number and chip, the boundary field, the colour choice (and the browser's `color` field for a free colour), the label field, a remove button | shown, not in `readOnly` |
| `actions` | "Add stop", and "Reset" when there is a `defaultValue` | shown, not in `readOnly` |

## Variants and states

`readOnly` (preview only), `disabled`, `invalid`. Limits: at `minStops` the remove buttons are disabled, at `maxStops` (or when no band has room for another boundary) the add button is; the reset button is disabled while the value is the `defaultValue`.

## Customisation

### 1. Tokens

`--umbra-color-scale-editor-width` (the width it asks for where its slot is as wide as its content: 480px), `--umbra-color-scale-editor-gap`, `--umbra-color-scale-editor-chip-size`, `--umbra-color-scale-editor-swatch-radius`, `--umbra-color-scale-editor-handle-bg`, `--umbra-color-scale-editor-hatch`. The fields, the select and the buttons inside keep their own tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` / `onChange` | `Threshold[]` | — | Controlled |
| `defaultValue` | `Threshold[]` | — | The start, and what Reset goes back to (in controlled use too) |
| `min` | number | the first stop's `from` | The bottom of the scale |
| `max` / `step` | number | 100 / 1 | |
| `minStops` / `maxStops` | number | 2 / 8 | |
| `readOnly`, `disabled`, `invalid` | boolean | `false` | `disabled` and `invalid` also from the `FormField` |
| `name` | string | — | A hidden input: the value as JSON |
| `formatValue` | `(value: number) => string` | `String` | The boundaries in the preview |
| `stopLabel`, `fromLabel`, `colorLabel`, `nameLabel`, `removeLabel`, `addLabel`, `resetLabel`, `trackLabel` | string | English | "Stop", "From", "Colour", "Label", "Remove", "Add stop", "Reset", "Boundaries" |
| `toneLabels` | names by tone, `custom` and `default` | English | The colour choices |
| `formatAnnouncement` | `({ type, index }) => string` | English | Said after add, remove and reset |
| `aria-label`, `id` | string | — | |

### 3. Parts

`preview`, `track`, `stops`, `actions`.

### 4. Blocks

`ColorScaleEditor.Root`, `ColorScaleEditor.Preview`, `ColorScaleEditor.Track`, `ColorScaleEditor.Stops`, `ColorScaleEditor.Actions`.

## Behaviour as space shrinks

The editor fills its slot. The preview wraps. When the slot is shorter than the rows, the rows scroll inside the editor.

| Step | Trigger | Result |
|---|---|---|
| 1 | Under 440px wide (container query) | The label fields hide: a label is extra, a boundary and a colour are the value |
| 2 | Under 300px wide | The `track` and the row numbers hide; every stop keeps its boundary field, colour and remove button |

## Interaction and accessibility

- The root is a `group`, named and described by its `FormField` or `aria-label`. The controls inside are named by the editor ("Stop 2: From"), not by the field.
- **Value rules** (`src/inputs/colorScale.ts`, unit-tested): the first stop is the bottom of the scale (`min`; its field is read-only); every other boundary is at least one `step` above the one before and inside `min` to `max`. Any list handed in is drawn by these rules (sorted, pushed apart), and every change emits a list that holds them: ascending, JSON-safe, never `-Infinity`.
- **A boundary** changes two ways: its number field, or its handle on the track. The handles are a multi-thumb slider (React Aria): drag, or arrow keys, `PageUp`/`PageDown`, `Home`/`End`; a handle stops one step short of its neighbours. A typed number takes effect while it is allowed; one that is not is kept as typed and marked invalid, and leaving the field (or `Enter`) settles it on the nearest allowed value.
- **A colour** is one of the five steps of the value ramp, one of the six tones, a free colour, or none (the consumer keeps its own colour). The choice is the library's `Select`; a free colour is picked in the browser's `<input type="color">`, shown beside the select.
- **The cue that is not colour**: each chip and band carries the pattern `ProgressBar` and `Slider` draw for a band at that position (hatched by position, the top band solid), and each swatch shows its boundary as a number and its label; a screen reader also hears the colour's name.
- **Add** puts a stop in the middle of the widest band, in a tone no other stop has, and moves the focus to its boundary field. **Remove** moves the focus to the remove button of the row that takes its place, or to "Add stop" when the fewest stops are reached. **Reset** moves it to "Add stop". Each is said through a polite live region (`role="status"`).
- Right to left: the bottom of the scale is at the right, and the arrow keys on a handle follow what is drawn.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **The value is `Threshold[]`**, nothing of its own: no ids, no `to`.
- **The first boundary is fixed at `min`**: a value below the first `from` has no band in any consumer, so a movable bottom would make values that draw uncoloured.
- **Both ways to move a boundary** are built (field and handle), the fuller option; the handle track is the first thing to go when narrow because the field is the equivalent.
- **Reset needs a `defaultValue`**; in controlled use the prop is only the reset target. Without it there is no reset button.
- **"None" is a colour choice**, because the shared type allows a band with only a label.
- **A free colour that is not `#rrggbb`** (a named colour, `rgb()`) is drawn as it is, but the browser's colour field can only show hex: it starts from a mid grey until the user picks.
- **No custom colour picker**, by the brief: the browser's field.
- **Rows scroll with the browser's thin scrollbar**, not `ScrollArea`: the rows hold popups and focus rings that `ScrollArea`'s fades would cover. Recorded as a difference in look.
- **No `required`**: `minStops` says how many stops there must be.
- **Row keys are positions**: a stop has no identity besides its place, so a draft typed in one row does not follow a stop that moves past it (it cannot: boundaries do not cross).
