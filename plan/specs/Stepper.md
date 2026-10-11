# Stepper

**Tier** 2 · **Group** Inputs · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Previous and next around one value, with a row of segments that shows the position. It walks through a short list of options, or through numbers.

## Not for

- The steps of a wizard: not in the catalog.
- Typing a number: use `TextField type="number"`.
- Choosing from a list the user wants to see at once: use `Select`, `SegmentedFilter` or `RadioGroup`.
- A value on a continuous scale: use `Slider`.

## Evidence

Screenshot 29: chevrons around a coloured value and, under it, six segments with the current one highlighted; it cycles through discrete options. Numeric mode is the library's own addition.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `previous` | chevron button | shown |
| `value` | the label of the option, or the number; the one tab stop | shown |
| `next` | chevron button | shown |
| `indicator` | one `segment` per position | shown for 2 to 12 positions |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| mode | options (`options`), numeric (`min`, `max`, `step`) | |
| `wrap` | boolean | Default: on for options, off for numbers |
| `size` | `default`, `small` | |

States: hover and pressed (buttons), focus (value), disabled, read-only, invalid, no value (`emptyLabel`), a button at an end without `wrap` (disabled).

## Customisation

### 1. Tokens

`--umbra-stepper-width` (200px), `--umbra-stepper-height`, `--umbra-stepper-radius`, `--umbra-stepper-button-fg`, `--umbra-stepper-value-fg`, `--umbra-stepper-indicator-gap`, `--umbra-stepper-segment-width`, `--umbra-stepper-segment-color`, `--umbra-stepper-segment-current-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `options` | `{ id, label, textValue? }[]` | — | Options mode |
| `min` / `max` / `step` | number | 0 / 100 / 1 | Numeric mode |
| `value` / `defaultValue` / `onChange` | id or number (\| null) | — | The component is generic over the two |
| `wrap` | boolean | see above | |
| `formatValue` | `(value: number) => string` | `String` | Numeric mode |
| `showIndicator` | boolean | 2 to 12 positions | |
| `disabled`, `readOnly`, `invalid`, `required` | boolean | `false` | Also from the `FormField` |
| `name` | string | — | A hidden input: the id or the number |
| `size` | see above | `default` | |
| `previousLabel`, `nextLabel`, `emptyLabel` | string | "Previous", "Next", "—" | |
| `aria-label`, `id` | string | — | |

### 3. Parts

`previous`, `value`, `next`, `indicator`.

### 4. Blocks

`Stepper.Root`, `Stepper.Previous`, `Stepper.Value`, `Stepper.Next`, `Stepper.Indicator`.

## Behaviour as space shrinks

The stepper is `--umbra-stepper-width` wide and never wider than its slot.

| Step | Trigger | Result |
|---|---|---|
| 1 | The label is wider than the room between the buttons | It truncates with an ellipsis; the value text for a screen reader is whole |
| 2 | The stepper is under 96px wide (container query) | `indicator` hides |

## Interaction and accessibility

- The value is a **spin button** (`role="spinbutton"`) and the only tab stop. Numeric: `aria-valuenow` is the number. Options: `aria-valuenow` is the position from 1, `aria-valuemin`/`max` are 1 and the count, and `aria-valuetext` is the option's label.
- Keys on the value: `ArrowUp` and the arrow towards Next step forward, `ArrowDown` and the arrow towards Previous step back (they follow what is drawn in right to left); `Home` and `End` go to the ends; `PageUp` and `PageDown` step a tenth of the positions.
- Previous and Next are buttons for the pointer and for touch: not tab stops, named by `previousLabel` and `nextLabel`, at least 24px. A press does not move the focus; the new value is said through a polite live region (`role="status"`). With the focus on the value, a screen reader says the change of the spin button itself.
- Without `wrap` the button at an end is disabled.
- The current segment is brighter and taller: a cue that is not colour. The indicator is decorative (`aria-hidden`): the spin button says the position.
- Read-only: focusable, `aria-readonly`, nothing changes it. Disabled: not a tab stop.
- Without a value the label is `emptyLabel`; the first step in either direction lands on an end.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Role**: a spin button in both modes, as the ARIA practice describes for a value picked from an ordered set (its example is a date picker with a month spin button whose `aria-valuetext` is the month's name). A listbox was rejected: the options are never shown together, so there is no list to move in.
- **One tab stop**, as the spin button pattern has it: the two buttons are out of the tab order.
- **The buttons announce** through a live region, because a press on them does not hold the focus on the value (a touch screen reader stays on the button and presses again).
- **Numeric mode** is included (the fuller option), with `formatValue`; the indicator hides above 12 positions.
- **`wrap`** defaults by mode: a list of options goes round, as in the evidence; numbers stop at their ends.
- **No `loading` state**: it is an input; a field that waits for its options is `disabled` by the form.
- **A press on a `FormField` label does not focus the value**: a `<label>` only activates native controls. The label still names it.
