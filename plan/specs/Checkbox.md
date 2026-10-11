# Checkbox

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

Covers `Checkbox` and `CheckboxGroup`.

## Purpose

A box that is checked or not: one yes-or-no choice, or one of several in a `CheckboxGroup`. A group gives several checkboxes one label, description and error.

## Not for

- A setting that takes effect at once: use `Toggle`.
- Exactly one choice among a few: use `RadioGroup`.
- A label and description at the start of a row with the box at its end (a settings row): put a bare `Checkbox` in a `FormField`.
- Row selection in a table: `DataTable` renders `Checkbox size="small"` itself.

## Evidence

Row selection in tables (4, 10, 11, 35, 40), a read-only boolean column (18), setting rows with the box at the end (21, 26), a save list (20). The source has two checked looks (a white box with a dark tick; a green fill with a white tick). The library fixes one: the filled violet box with a white check mark.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `box` | the box; holds the check mark, or a dash while indeterminate | shown |
| `label` | the label, and the required marker | shown when there are children |
| `description` | a second line under the label | hidden |
| `error` | an error icon and message | hidden |

`CheckboxGroup`:

| Part | Content | Default |
|---|---|---|
| `label` | the group's label, and the required marker | hidden |
| `description` | a line under the label | hidden |
| `options` | the checkboxes | shown |
| `error` | an error icon and message | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | `default`, `small` | `default` follows the density level (14 / 18 / 22px box). `small` is for table cells (13 / 15 / 18px) and keeps the label on one line. |
| `orientation` (group) | `vertical`, `horizontal` | `horizontal` wraps |
| `columns` (group) | number | a grid of at most that many columns |

States: unchecked, checked, indeterminate; hover (the border lightens; a filled box darkens, because it carries a light mark), pressed, focus (ring around the box), disabled, read-only, invalid (danger border; the message has an icon), required (a text marker after the label).

Checked is shown by the fill and the mark, never by colour alone.

## Customisation

### 1. Tokens

`--umbra-checkbox-size`, `--umbra-checkbox-small-size`, `--umbra-checkbox-radius`, `--umbra-checkbox-border`, `--umbra-checkbox-border-width`, `--umbra-checkbox-bg`, `--umbra-checkbox-selected-bg`, `--umbra-checkbox-mark-color`, `--umbra-checkbox-invalid-border`, `--umbra-checkbox-gap`.

Shared with the other inputs: `--umbra-field-description-color`, `--umbra-field-error-color`, `--umbra-field-marker-color`; for groups `--umbra-option-group-gap`, `--umbra-option-group-inline-gap`, `--umbra-option-group-text-gap`, `--umbra-option-group-min-option-width`.

### 2. Props

`Checkbox`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label |
| `description` | node | — | A second line |
| `error` | node | — | An error message; makes the checkbox invalid |
| `checked` / `defaultChecked` / `onChange` | boolean / boolean / `(checked) => void` | — | Controlled or uncontrolled state |
| `indeterminate` | boolean | `false` | The "some, not all" mark |
| `disabled` / `readOnly` | boolean | `false` | |
| `invalid` | boolean | `false` | |
| `required` | boolean | `false` | |
| `requiredLabel` | string | "Required" | The marker's text |
| `size` | `default` \| `small` | `default` | |
| `name` / `value` | string | — | Form support. In a group, `value` is the entry in the group's value. |
| `id` | string | — | |
| `aria-label` | string | — | Names a checkbox with no visible label |

`CheckboxGroup`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The checkboxes |
| `label` / `description` / `error` | node | — | |
| `value` / `defaultValue` / `onChange` | `string[]` / `string[]` / `(value) => void` | — | The values of the checked boxes |
| `orientation` | `vertical` \| `horizontal` | `vertical` | |
| `columns` | number | — | |
| `disabled` / `readOnly` / `invalid` / `required` | boolean | `false` | `required`: at least one must be checked |
| `requiredLabel` | string | "Required" | |
| `name` | string | — | The form name of every checkbox |
| `id` / `aria-label` | string | — | |

### 3. Parts

`Checkbox`: `box`, `label`, `description`, `error`. `CheckboxGroup`: `label`, `description`, `options`, `error`.

### 4. Blocks

`Checkbox.Root`, `Checkbox.Box`, `Checkbox.Label`, `Checkbox.Description`, `Checkbox.Error`. `CheckboxGroup.Root`, `CheckboxGroup.Label`, `CheckboxGroup.Description`, `CheckboxGroup.Options`, `CheckboxGroup.Error`.

`Checkbox.Box` takes children as its mark: they are shown while the box is checked.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Label wider than the checkbox | The label, description and error wrap. A `small` checkbox truncates its label with an ellipsis instead. |
| 2 | Group with `columns` narrower than its columns need | A column is never narrower than 12em (`--umbra-option-group-min-option-width`), so columns drop one by one |
| 3 | `horizontal` group narrower than its checkboxes | They wrap onto more lines |

## Interaction and accessibility

- Built on React Aria `Checkbox` and `CheckboxGroup`: a native checkbox input inside a `<label>`.
- `Space` toggles. `Tab` moves to the next checkbox; a group is not a single tab stop, because each box is its own choice.
- A click on the label, the description or the error toggles it. The accessible name is the label alone; the description and the error are its description.
- The pointer target is at least 24 by 24px at every size, also for a bare box.
- A group is a `group` named by its label. Its description and error are also part of each checkbox's description, so they are heard on the box that has focus; an invalid group marks each box invalid.
- The required marker is visible text, hidden from screen readers because the input already says "required". `required` uses the browser's form validation: a form does not submit until it is satisfied, unless the form has `noValidate`.
- Read-only: focusable, announced as read-only, no hover response, does not change.
- Inside a `FormField` a bare checkbox takes the field's id, label, description, error, `required` and `disabled`. A group takes them for the group; its checkboxes do not.

## Open questions

None.

Resolved 2026-10-10:

- One checked look: violet fill with a white check mark. The box border is two border widths, so the unchecked box reads on a dark card.
- `error` exists on the single checkbox too (for a lone "accept the terms" box), not only on the group.
- `size="small"` is a fixed step below the density size, not a second density scale.
- A group's `columns` is the same grid as `RadioGroup`'s.
- No "select all" prop: it is one controlled `Checkbox` with `indeterminate` (shown in the stories).

Resolved 2026-10-11 (review 2):

- `required` on a `CheckboxGroup` works (F12): while no box is checked every box is `required`, which is what the browser validates, so the form does not submit; with one checked none is. A checkbox passed its own `required={false}` and `invalid={false}` to React Aria, which hid what the group said; it now passes them only when set.
- Pressed darkens an unchecked box too; it used to lighten it (F33). The same for `Radio` and `Toggle`.
