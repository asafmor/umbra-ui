# ShortcutBar

**Tier** 1 · **Group** Shell · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

The user's pinned shortcuts: a row of small chips at the end of the `SubNav`, each a link to a page or an action.

## Not for

- The pages of the current section: use `SubNav` items.
- Actions on the current page or selection: use `PageHeader` actions or an `ActionBar`.
- Filters: use `SegmentedFilter`.

## Evidence

11, 22 (five or six outlined chips, icon and label, at the right of the second bar), 13 and 23 (a count on a chip, which in the source covers the label), 24 and 26 ("(+1)" overflow), 28 (the list is user-configurable with pin toggles, and labels can be switched off: an icon-only mode), 23 (a truncated chip label). `plan/reference/index.html` (`.chip`): 22px high, 1px border, 4px radius.

## Anatomy

| Part | Content | Default |
|---|---|---|
| list | the chips that fit | shown |
| `item` | icon, label, count or dot | one per shortcut |
| `more` | the "+N" chip; opens the rest as a menu | shown when something does not fit |
| edit button | `editIcon` | shown with `onEdit` |

An item is `{ id, label, icon?, href?, onPress?, badge?, disabled? }`.

## Variants and states

| `mode` | Chips show |
|---|---|
| `labels` | icon and label |
| `icons` | the icon only; the label is the tooltip and the name. An item without an icon keeps its label |
| `auto` (default) | labels while they fit; then icons, when every item has one |

Chip states: hover (one step lighter), pressed, focus (ring inside the chip), disabled (40%), menu open. Data attributes on the root: `data-mode` (`labels` or `icons`, as shown now), `data-overflow` (the number of items in the menu).

## Customisation

### 1. Tokens

`--umbra-shortcut-bar-gap`, `--umbra-shortcut-bar-font`, `--umbra-shortcut-bar-item-height` (22px), `--umbra-shortcut-bar-item-bg`, `--umbra-shortcut-bar-item-fg`, `--umbra-shortcut-bar-item-border`, `--umbra-shortcut-bar-item-radius`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | list of items | — | The shortcuts as data |
| `children` | `ShortcutBar.Item` blocks | — | The shortcuts as blocks |
| `renderLink` | function | plain `<a>` | The app's router link, for items with `href` (in the bar and in the menu) |
| `mode` | `labels` \| `icons` \| `auto` | `auto` | |
| `moreLabel` | function (count) | `"+N"` | Text of the overflow chip |
| `moreName` | function (count) | `"N more shortcuts"` | Its accessible name |
| `onEdit` / `editLabel` | function / string | — / "Edit shortcuts" | Shows the edit button |
| `aria-label` | string | "Shortcuts" | Name of the toolbar |

### 3. Parts

`item` (the content of a chip; receives the item and `iconOnly`), `more` (the content of the overflow chip; receives `count`), `editIcon`.

### 4. Blocks

`ShortcutBar.Item` (`id`, `icon`, `href`, `onPress`, `badge`, `disabled`; its child is the label as text). It carries data only: the bar reads its props, because an item that does not fit is drawn as a row of the menu.

## Behaviour as space shrinks

The bar is as wide as its chips and gives way before anything else in the `SubNav`.

| Step | Result |
|---|---|
| 1 | `auto`, every item has an icon: the labels hide |
| 2… | One item at a time moves into the "+N" menu, last first |
| last | Only the "+N" chip (and the edit button) is left. These never shrink |

Nothing is ever clipped: an item is either fully visible or a row of the menu, so nothing is focusable without being visible. When the room around the bar grows, it starts again with everything visible.

## Interaction and accessibility

- A `toolbar`, named by `aria-label`: one tab stop; `ArrowLeft` and `ArrowRight` move between the chips, the "+N" chip and the edit button; `Tab` leaves, and coming back returns to the chip that had the focus.
- A chip is a link with `href`, otherwise a button.
- A count is part of the chip's name ("Inbox 8"). Icon only, the name is spelled out and the label is the tooltip.
- The "+N" chip opens a `Menu` (`plan/specs/Menu.md`): rows with icon, label and count; links stay links.

## Open questions

None.

Resolved 2026-10-10:

- The count sits inside the chip after the label (on the corner of the icon when icon only). The source puts it over the label, which hides part of it.
- The overflow chip reads "+N" by default; `moreLabel` gives the source's "(+N)".
- In `auto`, labels are dropped for all chips at once, not one by one: a row that mixes both reads as broken.
- Labels do not truncate: a chip that does not fit moves into the menu instead.
- The chip height is fixed (22px) at every density, like the height of the `SubNav` that holds it.
- Editing is the app's own screen; the bar only offers the button (`onEdit`).
