# SplitButton

**Tier** 2 · **Group** Inputs · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A main action, with a caret beside it that opens a menu of related actions ("Save" and, in the menu, "Save a copy").

## Not for

- A button that only opens a menu: use `Menu` with a `Button` as its trigger.
- Choosing a value: use `Select`.
- Unrelated actions side by side: use two `Button`s.

## Evidence

Screenshots 3, 4, 10, 29: a labelled button with a separate chevron segment, in a table toolbar and in a modal header.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `action` | the main button: `iconStart` (or the spinner), `label` | shown |
| `menu` | the caret button and the `Menu` it opens | shown |
| `caret` | the icon of the caret button | chevron down |

## Variants and states

`variant` and `size` are `Button`'s, exactly: `primary`, `accent`, `neutral` (default), `ghost`, `danger`; `default` and `small`. Both halves are drawn by `Button`'s own element and stylesheet (`ButtonBase`); this component only joins them.

States: hover, pressed and focus per half; the caret stays pressed while its menu is open; `loading`; `disabled`.

## Customisation

### 1. Tokens

`Button`'s tokens (`--umbra-button-*`), and `--umbra-split-button-caret-width` (0.8 of the height, never under 24px), `--umbra-split-button-divider` (the line between the halves of a filled or ghost variant).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label of the action |
| `variant`, `size` | as `Button` | `neutral`, `default` | |
| `iconStart` | node | — | |
| `onPress` | `() => void` | — | The main action. Called with nothing (decision 07) |
| `items` | `MenuEntry[]` | — | The related actions, in the shape `Menu` takes |
| `onAction` | `(id) => void` | — | A menu row was chosen |
| `menuLabel` | string | "More options" | Name and tooltip of the caret, and name of the menu |
| `menuPlacement` | placement | `bottom end` | |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | The menu |
| `loading`, `loadingLabel` | boolean, string | `false`, "Loading" | The action only |
| `disabled` | boolean | `false` | Both halves; also from the `FormField` |
| `href`, `shortcut`, `type`, `fullWidth` | as `Button` | — | On the action |
| `aria-label` | string | — | Names the pair |

### 3. Parts

`action`, `menu`, `iconStart`, `label`, `caret`.

### 4. Blocks

`SplitButton.Root`, `SplitButton.Action`, `SplitButton.Menu` (its children may be `Menu.Item`, `Menu.Section`, `Menu.Separator`, `Menu.Sub`).

## Behaviour as space shrinks

The label of the action truncates with an ellipsis; the caret keeps its width. Among actions that moved into an overflow "more" menu (a card or page header, a section title) the action is a row of that menu and its own menu a submenu row after it, named by `menuLabel`: `Button` and `Menu` already behave so, and the pair draws no group there.

## Interaction and accessibility

- A `group` holding two buttons, each a tab stop. The caret has `aria-haspopup` and `aria-expanded`, and is named by `menuLabel`.
- The menu is the public `Menu`: `Enter`, `Space` and `ArrowDown` open it, the arrow keys move, `Escape` closes, and the focus returns to the caret.
- `loading` blocks the action and shows its spinner; the menu stays usable.
- In a `FormField` the group is named and described by the field, and disabled with it. `type="submit"` makes the action submit the form.
- Right to left: the caret is at the left (logical properties).

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Two tab stops**: the ARIA practice has no split button role; the pattern in use is a button and a menu button side by side, each reachable. One stop with an arrow key for the menu would hide the menu from a user who does not know the key.
- **`loading` leaves the caret enabled**: a button that is disabled while it holds the focus loses it, and the related actions are not the one that is running.
- **No value**: it is not a field. "Form control" here means the field's name, description and `disabled`, and `type="submit"`.
- **`ButtonBase` got one optional prop**, `part` (`data-part`), so the halves carry `data-part="action"` and `data-part="caret"`. Nothing else in `Button` changed, and `Button` does not import the menu: only `SplitButton` does.
- **A disabled caret has no tooltip**: `Tooltip` wraps a disabled control in a stand-in element, which would part the halves.
- **No blocks for the inner pieces of the action** (icon, label, spinner): as in `Button`, they are parts.
- **Review 1 of Milestone 2** (2026-10-11): the root takes `id` (I-9: the field's id replaced it with nothing outside a field); `onPress` is called with no argument (I-16: the button's press event came through); two menu rows with one id are both drawn (I-6, in `Menu`).
