# TextField

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A box for typing one line of text, or several with `multiline`. It is the control alone; its label, description and error message come from the `FormField` around it.

## Not for

- Searching with suggestions, or the collapsed search trigger: use `SearchField`.
- Choosing from a list: use `Select`.
- A number that is stepped with buttons: use `Stepper`.
- Text shown, not edited: use `KeyValue`.

## Evidence

The source shows no free-standing text input; it is implied by the search fields (nearly every screen) and by setting rows that hold a value (12, 20, 21, 26). The look follows the source's closed selects in the same rows: a dark inset surface, a light 1px outline, 4px radius, the control height of the density level.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `prefix` | text or an icon before the text | hidden |
| `input` | the `<input>`, or a `<textarea>` when `multiline` | shown |
| `invalidIcon` | an error icon | shown while invalid |
| `clear` | a button that empties the field | with `clearable`, while there is text |
| `suffix` | text, an icon or a small control after the text | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `multiline` | boolean | a text area of `rows` lines (3 by default); it does not resize |
| `type` | `text`, `number`, `password`, `email`, `url` | the native types. `number` hides the browser's spin buttons; the arrow keys still step. |
| `size` | `default`, `small` | `default` has the control height of the density level; `small` is for table cells |

States: hover (the border lightens), focus (ring on the whole field, drawn inwards), disabled, read-only (dashed border, no fill), invalid (danger border and the error icon, so it does not depend on colour), required.

## Customisation

### 1. Tokens

`--umbra-text-field-height`, `--umbra-text-field-width`, `--umbra-text-field-padding-x`, `--umbra-text-field-radius`, `--umbra-text-field-bg`, `--umbra-text-field-fg`, `--umbra-text-field-border`, `--umbra-text-field-invalid-border`, `--umbra-text-field-placeholder`, `--umbra-text-field-affix-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` / `defaultValue` / `onChange` | string / string / `(value) => void` | — | Controlled or uncontrolled text |
| `multiline` | boolean | `false` | |
| `rows` | number | `3` | |
| `type` | see above | `text` | |
| `placeholder` | string | — | |
| `prefix` / `suffix` | node | — | |
| `clearable` | boolean | `false` | |
| `clearLabel` | string | "Clear" | Accessible name of the clear button |
| `disabled` / `readOnly` | boolean | `false` | |
| `invalid` | boolean | `false` | |
| `required` | boolean | `false` | |
| `size` | `default` \| `small` | `default` | |
| `name` | string | — | Form support |
| `autoComplete` | string | — | The browser's autofill hint |
| `maxLength` | number | — | |
| `id` | string | — | |
| `aria-label` | string | — | Names a field that has no `FormField` label |

### 3. Parts

`prefix`, `input`, `invalidIcon`, `clear`, `suffix`.

### 4. Blocks

`TextField.Root`, `TextField.Prefix`, `TextField.Input`, `TextField.InvalidIcon`, `TextField.Clear`, `TextField.Suffix`.

## Behaviour as space shrinks

The field fills the width of its slot (`--umbra-text-field-width` fixes it). As the slot narrows the text box gives way first and scrolls its text; then a long prefix or suffix truncates with an ellipsis, each at no more than 40% of the field. The icon and the clear button keep their size. Nothing hides, because each piece carries meaning (a unit, a currency sign, the error icon).

## Interaction and accessibility

- Built on React Aria `TextField`, `Input` and `TextArea`: a native input.
- A click on the padding, the prefix or the suffix puts the caret in the field.
- The clear button is the next tab stop after the text box, at least 24 by 24px. Pressing it empties the field, calls `onChange('')` and returns focus to the text box. It is not rendered while the field is empty, disabled or read-only.
- Invalid sets `aria-invalid`; the message is the `error` of the `FormField`, which the field announces as its description.
- Inside a `FormField` it takes the field's id, label, description, error, `required` and `disabled`.
- `required` and the native types use the browser's form validation: a form does not submit until they are satisfied, unless the form has `noValidate`.
- Read-only: focusable, selectable, does not change.

## Open questions

None.

Resolved 2026-10-10:

- Added to the catalog as a tier 1 input: `FormField`, `SearchField` and the full-page stories need a text input in the library's look.
- No `label`, `description` or `error` prop: `FormField` owns them, so there is one way to label a control. `aria-label` covers a field with no visible label.
- An invalid field shows an icon inside itself, so a field outside a `FormField` does not depend on its border colour.
- No password reveal button and no character counter: both fit in `suffix`.
- A `multiline` field has a fixed number of rows and does not resize or grow, so it cannot push the page into scrolling.
- The ring is drawn inwards, on the whole field, so it survives in a table cell or any container that clips.
