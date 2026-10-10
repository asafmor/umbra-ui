# SearchField

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A field for typing a search. It has two forms: always an input, or an icon that opens into the input in place. It can list suggestions and recent searches under itself. It is the control alone; a label, description and error message come from the `FormField` around it.

## Not for

- Text that is not a search: use `TextField`.
- Choosing one of a fixed set of options: use `Select`, with `searchable` when the set is long.
- The app-wide search of pages, entities and actions: that is the `CommandPalette`, which the `TopBar` search opens.
- A filter with several fields: use `FilterPanel`.

## Evidence

Nearly every screen shows only the collapsed trigger: a search icon with the word "Search" at the end of the top bar (1, 11), and a bare search icon in a card toolbar (1, 13). No screenshot shows the open field, suggestions or a key hint; the expanded form, the list and every behaviour here are the library's own design, in the look of `TextField` and `Menu`.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | the search icon; the spinner while `loading`. A collapsed field shows `collapsedLabel` after it. | shown |
| `input` | the text box | shown (unseen while collapsed, but still the thing that takes focus) |
| `clear` | a button that empties the field | while there is text |
| `shortcut` | the key that focuses the field | with `shortcut`, while the field is empty and not focused |
| `suggestions` | the list under the field | with `suggestions` or `recent`, while there is something to list |
| `suggestion` | the content of one row: icon, label, description | per row |
| `empty` | what the list shows without rows: skeleton rows or the "no results" text | when the list has no rows |

Also rendered, without a part of its own: the error icon of an invalid field, and the remove button of a recent search.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `collapsible` | boolean | `false`: always an input. `true`: only the icon (and `collapsedLabel`) shows, with the look of a ghost icon button, until the field is pressed, focused or reached by its shortcut; it collapses again when it is empty and focus has left. With text it stays open. |
| `expandMode` | `overlay`, `inline` | How a collapsible field opens. `overlay`: over the space beside it, so nothing around it moves. `inline`: it takes the space and its neighbours move. |
| `expandTo` | `start`, `end` | The direction an `overlay` field grows in. `start` suits a field at the end of a bar. |
| `size` | `default`, `small` | `default` has the control height of the density level; `small` is for dense toolbars |
| `landmark` | boolean | Wraps the field in a `search` landmark, for the main search of a page |

States: hover (the border lightens; a collapsed field lightens like a ghost button), focus (ring on the whole field, drawn inwards), disabled, read-only (dashed border, no fill), invalid (danger border and an error icon), loading. The list is open or closed, with a row hovered or active.

## Customisation

### 1. Tokens

`--umbra-search-field-height`, `--umbra-search-field-width`, `--umbra-search-field-expanded-width`, `--umbra-search-field-min-width`, `--umbra-search-field-padding-x`, `--umbra-search-field-radius`, `--umbra-search-field-bg`, `--umbra-search-field-fg`, `--umbra-search-field-border`, `--umbra-search-field-invalid-border`, `--umbra-search-field-placeholder`, `--umbra-search-field-icon-color`, `--umbra-search-field-shortcut-color`, `--umbra-search-field-list-max-width`.

The list and its rows are a `Menu`'s, so they also follow the `--umbra-menu-*` tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` / `defaultValue` / `onChange` | string / string / `(text) => void` | — | Controlled or uncontrolled text |
| `debounce` | number (ms) | `0` | `onChange` waits this long after the last keystroke. The field itself shows the text at once. Submitting, clearing and choosing a row do not wait. |
| `onSubmit` | `(text) => void` | — | Enter, or a recent search chosen |
| `onClear` | `() => void` | — | The clear button, or Escape |
| `placeholder` | string | — | |
| `loading` / `loadingLabel` | boolean / string | `false` / "Loading" | |
| `size` | `default` \| `small` | `default` | |
| `shortcut` | string | — | The id of a shortcut in the provider's list, or the keys themselves (`/`, `Mod+F`). It focuses the field and is shown as a hint. |
| `collapsible` / `expandMode` / `expandTo` | see above | `false` / `overlay` / `start` | |
| `collapsedLabel` | node | — | Text beside the icon of a collapsed field |
| `landmark` | boolean | `false` | |
| `label` | string | "Search" | Accessible name, when there is no `FormField` label; also the name of the landmark |
| `suggestions` | `{ id, label, textValue?, description?, icon?, section? }[]` | — | Rows for the text typed, shown as given |
| `recent` | string[] | — | Earlier searches, listed while the field is empty |
| `onSelect` | `(id) => void` | — | A suggestion was chosen; its text becomes the field's text |
| `onRemoveRecent` | `(text) => void` | — | Adds a remove button to each recent search |
| `clearLabel` / `recentLabel` / `removeRecentLabel` / `noResultsLabel` | string | English text | |
| `maxHeight` | number | 320 | Tallest the list may be |
| `disabled` / `readOnly` / `invalid` / `required` | boolean | `false` | |
| `name`, `id` | string | — | Form support |

### 3. Parts

`icon`, `input`, `clear`, `shortcut`, `suggestions`, `suggestion`, `empty`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `suggestion` receives `{ suggestion, text, recent, children }`.

### 4. Blocks

`SearchField.Root`, `SearchField.Icon`, `SearchField.Input`, `SearchField.Clear`, `SearchField.Shortcut`, `SearchField.Suggestions`.

## Behaviour as space shrinks

An input fills the width of its slot (`--umbra-search-field-width` fixes it). An open collapsible field is `--umbra-search-field-expanded-width` wide (240px).

| Step | Trigger | Result |
|---|---|---|
| 1 | The field is narrower than its minimum width plus the key hint | The key hint hides |
| 2 | A collapsible `inline` field, open, is narrower than its minimum width (120px) | It gives the space back: its place in the layout becomes the icon's, and the open field lies over what follows it, at its full width, as in `overlay` mode. It takes space again when its slot grows. |
| 3 | A field that is not collapsible keeps narrowing | The text box gives way and scrolls its text; the icon and the clear button keep their size |

A collapsible `overlay` field has no steps: collapsed it is one icon wide, and open it lies over its neighbours.

## Interaction and accessibility

- Without a list it is React Aria's `SearchField`: a native `type="search"` input (role `searchbox`). With `suggestions` or `recent` it is React Aria's `ComboBox`: role `combobox`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, and the active row as `aria-activedescendant`. Switching between the two remounts the input, so pass `suggestions={[]}`, not nothing, while there are none.
- `Enter` submits the text (`onSubmit`); without `onSubmit` it submits the surrounding form. With a row active, `Enter` chooses that row.
- `Escape` closes the list when it is open, then empties the field (`onClear`, `onChange('')`), then takes focus off the field. The first two do not reach a popover or modal around the field.
- The clear button is the next tab stop after the text box, at least 24 by 24px. It empties the field and returns focus to the text box.
- The shortcut focuses the field (and so opens a collapsed one). Keys given directly do nothing while the user types in another field. A disabled field has no shortcut.
- **Collapsed**: the text box is still there, unseen, over the icon. So Tab reaches it and a press focuses it, a screen reader meets one search field and no extra button, and opening needs no change of focus. The field opens when it has focus or text.
- An `overlay` field grows over 180ms (removed by reduced motion); an `inline` field takes its space at once, as other layout changes do.
- **List**: opens on focus when there are rows, and while typing. The arrow keys move through the rows with focus kept in the field; a press or `Enter` chooses. Choosing a suggestion puts its text in the field, calls `onSelect(id)` and closes the list. Choosing a recent search puts it in the field and calls `onSubmit`. Rows are grouped under their `section`; rows without one come first.
- The app supplies `suggestions` for the current text; the field does not filter them. With text and no rows the list says "No results"; while `loading` without rows it shows skeleton rows (`aria-busy`), and the field shows a named spinner.
- A recent search is removed with the button on its row (pointer) or `Shift+Delete` on the active row (keyboard). The button is not a tab stop and is hidden from assistive technology, because an option cannot hold a control.
- Inside a `FormField` it takes the field's id, label, description, error, `required` and `disabled`. `name` sends the text with a form.
- The list keeps the density, context tint and tokens of the place it opened from.

## Open questions

None.

Resolved 2026-10-10:

- The expanded form, which the source never shows, is a `TextField`-like box: search icon, text, clear button, key hint.
- The collapsed form keeps the real input in place of a separate button. That removes a focus hand-over and gives assistive technology one control.
- `overlay` is the default `expandMode`, because the usual place is the end of a toolbar where a moving layout is the worse outcome. `expandTo` chooses the side it grows towards.
- A collapsible field stays open while it holds text, in both modes, so a search in effect is never hidden.
- `shortcut` accepts a registry id or plain keys. The registry is preferred (it appears in the shortcuts sheet and is checked for conflicts); plain keys suit a field that should not need a provider entry.
- The key hint shows only while the field is empty and not focused, where the clear button would otherwise be.
- `debounce` delays `onChange` only. The field keeps its own copy of the text so typing is never delayed, including when `value` is controlled.
- Suggestions are shown as given, without a local filter: the app (usually a server) knows what matches.
- Recent searches are plain strings, shown only while the field is empty, and chosen ones are submitted.
- After a row is chosen the list stays closed until the text changes.
- The remove button of a recent search is not a real button (see above); `Shift+Delete` is the keyboard path.
- `landmark` is an option, off by default: a page should have few `search` landmarks.
