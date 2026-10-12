# Select

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Chooses one option, or several, from a list that opens under a button. It is the control alone; its label, description and error message come from the `FormField` around it. One component covers the plain select, the coloured select in a table cell, and the "person" and "role" selects with an avatar or a swatch and two lines of text.

## Not for

- Two to five choices that should all stay visible: use `SegmentedFilter` or `Radio`.
- A list of actions or links: use `Menu`.
- Free text with suggestions: use `SearchField`.
- A filter with many fields: use `FilterPanel`.

## Evidence

About 30 screens. Clear examples: 1 (bordered select with a leading icon in a card header), 3 (a wide filled select and a compact one), 4 and 12 (view picker with an icon, "Filter", and coloured selects in table cells whose label truncates), 12 (open list with a long option, wider than its trigger; person selects with an avatar and two lines), 14 (role select with a colour swatch and sub-lines), 11 (plain in-cell selects with no border). The source never shows a multiple or searchable select; those are the library's own.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `trigger` | the button that opens the list; holds `value` | shown |
| `value` | the chosen option (leading mark, label, optional second line), the chosen labels or their count, or the placeholder | shown |
| `icon` | the caret | shown |
| `popover` | the panel with the filter field, the list and its states | while open |
| `option` | the content of one row: leading mark, label, description, `meta` | per option |
| `check` | the mark of a chosen option: a check at the end of the row, or a checkbox at its start when `multiple` | per option |
| `empty` | what the list shows in place of options: skeleton rows, the empty text, the error | when there is nothing to list |

Also rendered, without a part of their own: the clear button (`clearable`), the error icon of an invalid select, and section headings.

The leading mark of an option is its `avatar`, else its `icon`, else a swatch of its `tone` or `color`. In a list where some options have one, the others keep an empty place so the labels line up.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `default`, `ghost`, `inCell` | `default` is a bordered field. `ghost` has no border or fill until hovered or open: for toolbars and headers. `inCell` fills the width of a table cell with no border; the chosen option's `tone` or `color` fills it, with bold text in a colour that keeps 4.5:1. The label is the cue that is not colour. |
| `size` | `default`, `small` | `default` has the control height of the density level; `small` is for table cells and dense toolbars |
| `multiple` | boolean | options show checkboxes and the list stays open |
| `searchable` | boolean | a filter field above the options |
| `fullWidth` | boolean | fills its slot; otherwise the select is as wide as its value |

States: hover (the box lightens one step; a coloured cell darkens instead), pressed, open (the caret turns; a ghost select shows its border), focus (ring on the whole box; inwards in a cell), disabled, read-only (dashed border, no fill, does not open), invalid (danger border and an error icon), required. An option is hovered or keyboard-focused (one step lighter), chosen (violet tint with an edge stripe, and the check), or disabled. The list is loading, empty, or in error.

## Customisation

### 1. Tokens

`--umbra-select-height`, `--umbra-select-width`, `--umbra-select-padding-x`, `--umbra-select-radius`, `--umbra-select-bg`, `--umbra-select-ghost-bg`, `--umbra-select-fg`, `--umbra-select-border`, `--umbra-select-invalid-border`, `--umbra-select-placeholder`, `--umbra-select-icon-color`, `--umbra-select-swatch-size`, `--umbra-select-popover-max-width`, `--umbra-select-option-selected-bg`.

The panel and its rows are a `Menu`'s, so they also follow `--umbra-menu-bg`, `--umbra-menu-border`, `--umbra-menu-radius`, `--umbra-menu-item-height`, `--umbra-menu-item-radius` and `--umbra-menu-item-hover-bg`: menus and selects stay alike.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `options` | `SelectEntry[]` | — | The choices: `{ id, label, textValue?, description?, icon?, avatar?, tone?, color?, disabled?, meta? }`, or `{ type: 'section', label?, options }`. Or pass `Select.Option` and `Select.Section` children. |
| `value` / `defaultValue` / `onChange` | string / string / `(id) => void` | — | The chosen id of a single select. `''` is no choice. |
| `multiple` | boolean | `false` | |
| `values` / `defaultValues` / `onValuesChange` | string[] / string[] / `(ids) => void` | — | The chosen ids of a `multiple` select |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | Controlled or uncontrolled list |
| `placeholder` | string | "Select" | Shown while nothing is chosen |
| `clearable` / `clearLabel` | boolean / string | `false` / "Clear" | A button that removes the choice |
| `disabled` / `readOnly` / `invalid` / `required` | boolean | `false` | |
| `size` / `variant` / `fullWidth` | see above | `default` / `default` / `false` | |
| `name` | string | — | Form support: the chosen ids are sent with the form |
| `id`, `aria-label` | string | — | `aria-label` names a select that has no `FormField` label |
| `valueDescription` | boolean | `false` | Shows the chosen option's description as a second line in the trigger, which grows taller |
| `selectedLabel` | `(count) => string` | "N selected" | The text of a `multiple` select whose labels do not fit |
| `renderValue` | `(selected) => node` | — | Replaces the content shown for the chosen options |
| `renderOption` | `(option, { selected }) => node` | — | Replaces the content of an option row; the check stays |
| `searchable` | boolean | `false` | |
| `searchPlaceholder` / `searchLabel` | string | "Search" / "Filter options" | |
| `onSearchChange` | `(text) => void` | — | For filtering on the server; called with `''` when the list closes |
| `filter` | `(option, text) => boolean` | label or description contains the text | Pass `() => true` when the server filters |
| `loading` / `loadingLabel` | boolean / string | `false` / "Loading" | |
| `empty` | text, node or `{ title, description, icon, action }` | "No options" | |
| `noResultsLabel` | string | "No results" | Shown when the filter leaves nothing |
| `error` / `onRetry` / `retryLabel` | as every data component | — | The error takes the place of the options |
| `placement` / `offset` | as `Popover` | `bottom start` / 4 | |
| `matchTriggerWidth` | boolean | `false` | The list is exactly as wide as the trigger; otherwise at least that wide |
| `maxHeight` | number | 320 | Never taller than the room in the window; the options scroll |

### 3. Parts

`trigger`, `value`, `icon`, `popover`, `option`, `check`, `empty`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `option` receives `{ option, selected, children }`.

### 4. Blocks

`Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Popover`, `Select.Option`, `Select.Section`.

`Select.Option` and `Select.Section` only carry data, as `Menu.Item` does: they are direct children of `Select` or `Select.Root`, which renders the rows. `Select.Root` takes the state and `options`; `Select.Trigger` the caret (`icon`) and any content beside `Select.Value`; `Select.Popover` everything about the list (filter, states, placement, `renderOption`, and the `option`, `check` and `empty` parts).

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The value is wider than the trigger | The label truncates with an ellipsis; a second line truncates on its own. The leading mark, the clear button and the caret keep their size. |
| 2 | The labels of a `multiple` select do not fit | The trigger shows "N selected" in their place; that text truncates last. When the trigger grows, or fewer are chosen, the labels come back. |
| 3 | The list is taller than `maxHeight` or than the room in the window | The options scroll inside the list; the filter field stays in place |
| 4 | There is no room under the trigger | The list opens above it |
| 5 | An option is wider than the list may be (`--umbra-select-popover-max-width`, or the trigger's width with `matchTriggerWidth`) | Its label and description truncate |

## Interaction and accessibility

- Built on React Aria `Select`, `ListBox` and, for the filter field, `Autocomplete`.
- The trigger is a button with `aria-haspopup="listbox"` and `aria-expanded`, named by its value and its label. `ArrowDown`, `Enter` and `Space` open the list with focus on the chosen option. Closed, typing a letter or `ArrowLeft` / `ArrowRight` changes the choice.
- The list is a `listbox`; one tab stop. Arrows, `Home`, `End` and type-ahead move through the options and pass over disabled ones; `Enter` or `Space` chooses; `Escape` closes without a change. Focus returns to the trigger. A single select closes when an option is chosen; a `multiple` one stays open (`aria-multiselectable`).
- `searchable`: focus is in the filter field for as long as the list is open, and the option the arrow keys are on is its active descendant (`aria-autocomplete="list"`). `Escape` empties the filter first, then closes the list. Closing resets the filter.
- A chosen option has `aria-selected`, the tint of the interaction colour, and a check (or a checked box), so it does not depend on colour. No edge stripe (2026-10-11, owner's O-4: the stripe is for rows of data).
- The clear button is a separate button after the trigger, at least 24 by 24px. Pressing it empties the choice, calls `onChange('')` (or `onValuesChange([])`) and puts focus on the trigger. It is not rendered while nothing is chosen, or when disabled or read-only.
- Inside a `FormField` the trigger takes the field's id, label, description, error, `required` and `disabled`.
- `name` sends the chosen ids with a form (one entry per id when `multiple`), and `required` holds the form back while nothing is chosen, as a native select does. An invalid select holds its form back too.
- Read-only: focusable, does not open, and no key changes the choice.
- While loading without options the list shows skeleton rows and is marked `aria-busy`; a `searchable` select also shows a named spinner in the filter field. Options already listed stay while more load.
- An avatar in an option or in the trigger is decorative (hidden from assistive technology): the label beside it names the option. Prefer an image avatar there: initials are visible text that is not part of the trigger's name.
- With a filter field the options are not focusable, so the region that scrolls is a tab stop after the field: the keyboard can reach and scroll it.
- The list keeps the density, context tint and tokens of the place it opened from.

## Open questions

Resolved 2026-10-11:

- The label of the chosen option, when the trigger cuts it, shows its full text in a tooltip on hover and keyboard focus (`TruncatedText`, as in `Tag`, `KeyValue` and `ListItem`).


None.

Resolved 2026-10-10:

- `value` is a plain string and `''` means no choice, so `useState('')` and a form field behave the same way. A `multiple` select has its own `values` and `onValuesChange`, so each callback has one type and the generated props table lists both.
- The "person" and "role" selects of the source are this component with `avatar`, `tone` / `color`, `description` and `valueDescription`, not separate components. `renderOption` and `renderValue` cover the rest.
- Option rows and the panel reuse the `Menu` look and its tokens; a chosen option adds the selected tint of a list row, without its edge stripe (2026-10-11).
- The default width is the width of the value (as in the source's toolbars); `fullWidth` fills the slot, and `inCell` always does.
- The filter is applied by the select itself to its `options`; `onSearchChange` reports the text for the server and `filter={() => true}` turns the local filter off. The chosen options must stay among `options` for their labels to show.
- The error state supports a retry button (`onRetry`). It is rendered beside the list, not inside it, because a `listbox` cannot hold a button.
- Only the `inCell` variant is filled with the chosen colour. Elsewhere the colour is a swatch before the label.
- Read-only is the library's own state (React Aria has none for a select): the list does not open and changes are ignored.
- The clear button and the error icon have no part name: the part list is the one in the catalog task.

Resolved 2026-10-11 (review 2):

- **Invalid, exactly where** (F13). The trigger button carries `aria-invalid="true"` (a global ARIA attribute, valid on a button; `aria-required` is not, so required is said by the label's marker and by the message below). The error icon is shown beside the value. The visually hidden native `<select>` carries `required` and `name`: it is what the browser validates and submits; it is not focusable and not read. The message of a field's `error` is the trigger's description (`aria-describedby`).
- **Required, on submit.** A required select left empty holds the form back and says why: the browser's own message ("Please select an item in the list.", in the browser's language) is shown as the error of the `FormField` around it and is the trigger's description; without a field it is the description only. Choosing a value clears it. The select passed `invalid={false}` to React Aria, which silenced this; it now passes `invalid` only when set.
- The list renders into the modal it was opened from.
- `inCell`: the focus ring is the fixed focus colour on a dark gap ring, so it keeps 3:1 on any fill (F30). The filter input of a searchable list has a visible ring (F30). The caret turns with the motion easing token (F33).
