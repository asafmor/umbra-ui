# StarRating

**Tier** 2 · **Group** Inputs · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A rating out of a number of stars. Two modes: a picture of a value (any fraction) for tables and lists, and a control for choosing one.

## Not for

- A value on a scale with thresholds or a marker: use `LevelMeter` or `ValuePill`.
- A single on/off star ("favourite"): use `IconButton` with `pressed`.
- A fine-grained number: use `Slider`.

## Evidence

Screenshots 3, 6, 10, 15, 23, 29, 40: five stars, filled, half and outlined, in headers, in a "currently selected" panel, on small tokens and in two table columns. Only display mode is in the evidence; input mode is the library's own.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `stars` | the row of stars; in input mode also one radio over each step | shown |
| `star` | the empty shape, and over it the full one cut to the share that is filled | one per step of `max` |
| `value` | the value as a number after the stars | hidden (`showValue`) |
| `skeleton` | placeholder while `loading`, the size of the row | — |
| `empty` | the em dash of display mode without a value | — |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| mode | input (default), display (`readOnly`) | Display is `role="img"`; input is a radio group |
| `size` | `small` (14px), `default` (18px), `large` (24px) | `small` for table cells |
| `step` | `1`, `0.5` | What a user can choose. Display mode draws any fraction. |
| `clearable` | boolean | Adds "No rating" as a choice |

States: hover (previews the value under the pointer), focus, disabled, invalid, loading, no value.

## Customisation

### 1. Tokens

`--umbra-star-rating-size`, `--umbra-star-rating-small-size`, `--umbra-star-rating-large-size`, `--umbra-star-rating-gap`, `--umbra-star-rating-color` (full; default the warning colour), `--umbra-star-rating-empty-color` (outline; default the secondary text colour).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` / `defaultValue` / `onChange` | number \| null / same / `(value: number \| null) => void` | — | `null` is no rating |
| `max` | number | 5 | How many stars |
| `step` | `1` \| `0.5` | `1` | |
| `clearable` | boolean | `false` | |
| `readOnly` | boolean | `false` | Display mode |
| `disabled`, `invalid`, `required` | boolean | `false` | Also taken from the `FormField` around it |
| `name` | string | — | The number is sent with the form; no rating sends nothing |
| `size` | see above | `default` | |
| `showValue` | boolean | `false` | The number after the stars |
| `loading` | boolean | `false` | |
| `formatValue` | `(value, max) => string` | "3.5 of 5" | The picture's name, and the name of each choice |
| `icon` / `emptyIcon` | node | the `star` of the icon map | |
| `clearLabel`, `emptyLabel`, `noValueLabel` | string | "No rating", "—", "No rating" | |
| `aria-label`, `id` | string | — | |

### 3. Parts

`stars`, `star` (receives `index`), `value`.

### 4. Blocks

`StarRating.Root`, `StarRating.Stars`, `StarRating.Star`, `StarRating.Value`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The row and the value text do not fit | `value` hides (`useShrinkLevel`) |
| 2 | The stars alone do not fit | The row is cut at its end; stars keep their size. The name still says the value. |

## Interaction and accessibility

- **Display**: `role="img"` named by `formatValue` ("3.5 of 5"); an `aria-label` goes before it ("Quality: 7 of 10"), and so does the label of a `FormField`. Not a tab stop. Without a value it shows `emptyLabel` and is named `noValueLabel`.
- **Input**: a radio group (React Aria), one radio per step, named by `formatValue`. One tab stop; the arrow keys move and choose, following what is drawn in right to left. With `clearable`, "No rating" is the choice before the first star, and a press on the chosen star clears too.
- A pointer target is never under 24px wide or tall, in any size (the stars are spaced out to that). With `step={0.5}` the target is still the whole star, and a press on it chooses the whole star; a half is chosen by dragging along the row (the stars follow the pointer in half steps, and the value is taken where the pointer is let go), or with the arrow keys.
- The cue that is not colour: a full star is filled, an empty one is an outline. The outline has at least 3:1 against the page and the three surfaces on every tint (tested).
- Right to left: the first star is at the right and a partial star fills from the right (logical properties only).
- Invalid: the outlines take the danger colour; the message and its icon are the `FormField`'s.
- The icon comes from the icon map (`star`, added to `src/provider/icons.tsx`), so `UmbraProvider icons` replaces it everywhere.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **`readOnly` is display mode**, not a focusable control that cannot change: a rating that only shows a value is a picture with a text name, as the catalog's use in tables needs. There is no third state.
- **Input is the default mode**, as for every form control of the group; tables write `readOnly`.
- **"No rating" is a radio**, so clearing has radio semantics and a keyboard path. It is checked while there is no value, and it is taken out of the form (`form=""` on its input): no rating sends nothing and does not satisfy `required`.
- **Half steps are a prop of input mode only** (`step`); display mode draws any fraction, not only halves.
- **Hover previews** the value under the pointer; the value changes on press.
- **Full colour**: the warning colour (amber), no new token.
- **Half steps by pointer are a drag, not a press** (review 1 of Milestone 2, 2026-10-11; replaces the two earlier notes that left half targets at 12 to 16px). Decided by what serves a pointer user: two targets of half a star are too small to hit on a touch screen and fail WCAG 2.5.8; stars 48px apart would be no rating to look at. So a star is one target (24px or more) for its whole value, and a half is reached as on a slider, by a drag along the row, which a finger does well. Hovering previews the whole star a press would choose.
- **Loading keeps the room of the value text** (review 1, I-11): the blocks draw their own placeholders, so `showValue` while loading is as wide as it will be.
- **In a form it is a native radio group** (review 1, I-8, I-10; `tests/visual/forms.spec.ts`): a press on the field's label gives the chosen star the focus; without `name` it sends nothing (React Aria's generated name is taken out of what the form sends); `required` and left empty it holds the form back and the field shows the browser's message.
