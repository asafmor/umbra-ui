# FormField

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

Absorbs SettingRow.

## Purpose

Pairs a label, a description and an error message with one control: a row of a form or of a settings list. It gives the control its name and description for screen readers, so every input is labelled the same way.

## Not for

- Grouping several fields under a heading: use `SectionTitle` above them.
- A label that belongs to the control itself (the text beside a checkbox, radio or toggle): use that control's children.
- A read-only label and value: use `KeyValue`.

## Evidence

Setting rows: a bold title and a grey one-line description at the start, the control at the end, on a slightly raised surface (12, 21, 26). Rows hold a checkbox, a toggle, a select, a button or a button group. Compact rows with only a title (26, "Animate Menus").

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | a `<label>` for the control, and the required or optional marker | shown when `label` is set |
| `description` | a line that explains the setting | hidden |
| `control` | the control | shown |
| `error` | an error icon and message | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `layout` | `row`, `stacked`, `inline` | `row`: label, description and error at the start, control at the end, centred on them. `stacked`: label, description, control, error from top to bottom. `inline`: label and control on one line, description and error under the control. |
| `labelWidth` | number or CSS width | the width of the label column of `row` and `inline`, to line up the controls of several fields. A `row` control then starts after the label column and fills the rest. |
| `surface` | boolean | a raised surface and padding, as the source's setting rows have |

States: invalid (set by `invalid`, or by itself when there is an error), required, optional, disabled (the label dims; the control is disabled).

The error is an icon and text in the danger colour, never colour alone.

## Customisation

### 1. Tokens

`--umbra-form-field-gap`, `--umbra-form-field-control-gap`, `--umbra-form-field-control-max-width`, `--umbra-form-field-bg`, `--umbra-form-field-padding-x`, `--umbra-form-field-padding-y`, `--umbra-form-field-radius`.

Shared with the other inputs: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node, or `(control) => node` | — | The control. An umbra-ui input picks up the field by itself; for a plain form element pass a function and spread what it receives. |
| `label` | node | — | |
| `description` | node | — | |
| `error` | node | — | Makes the control invalid |
| `layout` | see above | `row` | |
| `labelWidth` | number \| string | — | |
| `surface` | boolean | `false` | |
| `required` / `optional` | boolean | `false` | Show the marker; `required` also marks the control |
| `requiredLabel` / `optionalLabel` | string | "Required" / "Optional" | The marker's text |
| `invalid` | boolean | `false` | |
| `disabled` | boolean | `false` | |
| `id` | string | generated | The id of the control |

The function form receives `{ id, 'aria-describedby', 'aria-invalid', required, disabled }`.

### 3. Parts

`label`, `description`, `control`, `error`.

### 4. Blocks

`FormField.Root`, `FormField.Label`, `FormField.Description`, `FormField.Control`, `FormField.Error`. Composed by hand they wire themselves: the description and error ids exist only while those blocks are rendered, and an `Error` block makes the control invalid.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 0 | `row` | The control takes at most 60% of the width (`--umbra-form-field-control-max-width`); the label and description wrap in the rest |
| 1 | Field narrower than 20em, `row` or `inline` | The field stacks: label, description, control, error. The control starts under the text and may fill the width. |

The field is a size container (a container query does step 1), so it takes the width its parent gives it: in a flex row give it `flex: 1` or a width.

## Interaction and accessibility

- The label is a `<label for>` the control: a click on it focuses a text field and toggles a checkbox or toggle.
- The control gets, through context: `id`, the label (`aria-labelledby`, for controls that are not a native input, such as a radio group), the description and the error (`aria-describedby`, in that order), `aria-invalid`, `required` and `disabled`. `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Toggle` and `TextField` read it; other inputs read it with the internal hook `useField` (`src/inputs/useField.ts`).
- A group that takes the field hides it from its own options, so the options do not all take the field's id.
- The error is announced as the control's description and with `aria-invalid`. It is not a live region: an app that validates while the user types, and wants each change announced, puts the message in a `Banner`.
- The required marker is visible text, hidden from screen readers because the control says "required". The optional marker has no ARIA equivalent, so it is part of the label.
- One control per field. For a second control (a "Test" button beside a field), put both in the `control` and label the second one itself.

## Open questions

None.

Resolved 2026-10-10:

- The default `layout` is `row`, the source's settings row, because settings screens are the main use in a full-window app.
- The markers are text ("Required", "Optional"), not an asterisk: no legend needed, and translatable through `requiredLabel` / `optionalLabel`.
- In `row` the error sits in the text column under the description, so a row does not grow under its control.
- The stack threshold is fixed at 20em, because a container query cannot read a token. `layout="stacked"` is the way to stack earlier.
- `surface` is a prop, not only tokens: it is the source's look and one word to ask for.
- No `FormSection`: `SectionTitle` above a list of fields does it.

Resolved 2026-10-11 (review 2):

- **Which element carries what** (F13). The control's focusable element gets `id` (the label's `for`), `aria-describedby` (description, then error) and `aria-invalid` when invalid: the `<input>` of a `TextField` or `SearchField`, the `<input>` of a `Checkbox`, `Toggle` or `Radio`, the group element of a `CheckboxGroup` or `RadioGroup`, and the trigger button of a `Select`. `required` goes on the native form element (for a `Select`, its hidden `<select>`). The earlier text promised `aria-invalid` on the select's trigger and nothing set it.
- **A control's own validation message.** A control that validates itself reports its message to the field (`report` on the internal field context), which shows it in its error block, wired as the control's description. Used by `Select` for `required` on submit. While such a message shows, the field does not tell the control it is invalid (the control already knows), and `data-invalid` is on the field as for any error.
