# Menu

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A list of actions or links that opens from a control, against an element, or at the pointer as a context menu. One tab stop, arrow keys, type-ahead and submenus.

## Not for

- Choosing the value of a field: use `Select`.
- Free content, forms or tabs in a panel: use `Popover`.
- Page-level navigation that is always visible: use `PrimaryNav`, `SubNav` or `VerticalNav`.
- Commands found by typing: use `CommandPalette`.

## Evidence

2 (a dropdown under a sub-nav item: text rows, the current page filled), 17 (a context menu on a table column: rows with a trailing chevron for a submenu, rows ending in "…", separators forming groups, a cascading submenu with its own scrollbar, three levels), 19 (a system menu from a top-bar icon: 16 rows in groups, a trailing icon on two rows), 21 (a menu that leaves its container and scrolls inside; a muted "current" row and a brighter hovered row), 12 (a listbox look: full-width highlight).

## Anatomy

| Part | Content | Default |
|---|---|---|
| list | the rows; scrolls | shown |
| `item` | check gutter, icon, label, description, key hint, submenu chevron | one per row |
| `check` | the mark of a checked row | shown when checked |
| `sectionHeader` | heading of a section | shown when the section has a `label` |
| separator | a rule between groups | where given |

A row is `{ id, label, textValue?, icon?, shortcut?, description?, disabled?, danger?, href?, current?, items?, type?, checked? }`. A section is `{ type: 'section', label?, items }`; a separator is `{ type: 'separator' }`.

## Variants and states

| Variant | How | Notes |
|---|---|---|
| dropdown | `trigger` | Named by its trigger |
| anchored | `anchorRef` with `open` | Needs `aria-label`; starts on its first row |
| context menu | `Menu.Context` around a region | Opens at the pointer, or at the focused element from the keyboard |
| submenu | `items` in a row, or `Menu.Sub` | Any depth |

Row kinds (`type`): `item`, `checkbox` (toggles; the menu stays open on a press or `Space`), `radio` (neighbouring radio rows are one group; choosing closes the menu).

Row states: hover and keyboard highlight (one step lighter), pressed, focus ring (inside the row), disabled (40%), checked (a check in a leading gutter, in the accent text colour), current page (violet fill with an edge stripe and bold text), danger (danger text colour), submenu open. Data attributes: `data-focused`, `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-selected`, `data-current`, `data-danger`, `data-has-submenu`, `data-open`.

## Customisation

### 1. Tokens

`--umbra-menu-bg`, `--umbra-menu-border`, `--umbra-menu-radius`, `--umbra-menu-min-width`, `--umbra-menu-max-width`, `--umbra-menu-item-height`, `--umbra-menu-item-radius`, `--umbra-menu-item-hover-bg`. Row height follows the density level.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | rows, sections and separators | — | The rows as data |
| `children` | blocks | — | The rows as `Menu.Item`, `Menu.Section`, `Menu.Separator`, `Menu.Sub` |
| `trigger` | node | — | The control that opens it: an umbra-ui button, or a plain `<button>` |
| `anchorRef` | ref | — | The element to open against when there is no `trigger`; used with `open` |
| `open` / `defaultOpen` / `onOpenChange` | boolean / boolean / function | — | Controlled or uncontrolled state |
| `aria-label` | string | the trigger's name | Accessible name |
| `onAction` | function (id) | — | The row the user chose |
| `selectedIds` / `defaultSelectedIds` / `onSelectionChange` | string[] / string[] / function (ids) | — | The checked `checkbox` and `radio` rows of every section and submenu. A row's own `checked` wins for that row |
| `placement` | as `Popover` | `bottom start` | Flips to stay in the window |
| `offset` | number | `4` | Gap to the anchor |
| `matchAnchorWidth` | boolean | `false` | At least as wide as the anchor |
| `maxHeight` | number | the window | The rows scroll beyond it |
| `renderLink` | function | plain `<a>` | The app's router link, for rows with `href` |
| `emptyLabel` | string | "No items" | Shown when there are no rows |

`Menu.Context` takes the same props except the trigger, anchor and placement ones; its `children` are the region, and block rows go in `content`. `disabled` leaves the browser's own menu alone.

### 3. Parts

`item` (the content of a row; a function receives `{ item, selected, children }`), `check`, `sectionHeader`.

### 4. Blocks

`Menu.Item`, `Menu.Section`, `Menu.Separator`, `Menu.Sub`, `Menu.Context`. The row blocks carry data only: `Menu` reads their props, so they must be direct children (or inside fragments) of `Menu`, `Menu.Section` or `Menu.Sub`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | No room on the asked side | The menu flips to the other side and slides along the anchor to stay in the window; a submenu opens on the other side of its row |
| 2 | More rows than fit in the window (or in `maxHeight`) | The list scrolls inside the menu; the focused row is scrolled into view |
| 3 | A label wider than the menu's maximum width (360px, or the window minus a margin) | The label and the description truncate with an ellipsis; the key hint and the chevron stay |

## Interaction and accessibility

- Role `menu`; rows are `menuitem`, `menuitemcheckbox` or `menuitemradio` with `aria-checked`; sections are groups named by their heading; separators are `separator`. A row with `href` is an `<a>` with the `menuitem` role; the current page has `aria-current="page"`.
- The trigger carries `aria-haspopup` and `aria-expanded`. `Enter`, `Space` and `ArrowDown` open the menu on its first row, `ArrowUp` on its last.
- `ArrowDown` / `ArrowUp` move, `Home` / `End` jump, typing letters moves to the row that starts with them. Disabled rows are passed over.
- `Enter` chooses a row and closes the menu. `Space` on a checkbox row toggles it and keeps the menu open.
- `ArrowRight` or `Enter` on a row with a submenu opens it; `ArrowLeft` or `Escape` closes that level. Hovering the row opens it too.
- `Escape`, a press outside, and choosing a row close the menu; focus returns to where it was.
- While a menu is open the rest of the page is inert, as for any menu.
- A context menu opens on a right click at the pointer, and on the context-menu key or `Shift+F10` at the focused element, so something inside the region must be focusable.
- A checked row always shows the check; colour only supports it. The current page is the violet fill with a stripe and bold text.
- Key hints come from the provider's shortcut list (`shortcut` is an id). The menu shows them; it does not bind them.
- It keeps the density, context tint and tokens of the place it was opened from. Motion as `Popover`.

## Open questions

None.

Resolved 2026-10-11:

- 2026-10-11: the accessible name is `aria-label` (it was `label`), as on the other components: `plan/decisions/07-customisation.md`, "Prop names".

Resolved 2026-10-10:

- Built on React Aria's `Menu`, `MenuSection` and `SubmenuTrigger`. A run of neighbouring checkbox or radio rows is rendered as its own group, which is what lets one menu mix plain, checkbox and radio rows.
- Hover and keyboard highlight are the lighter surface, not the source's solid purple: `plan/interaction.md` keeps violet for "selected", so the fill is used only for the current page.
- The block form is data: the blocks do not render, `Menu` reads them. A row cannot be wrapped in an app component; use `parts.item` to change what a row shows.
- A level reserves a check gutter when any of its rows can be checked, and an icon gutter when any has an icon, so the labels line up.
- An anchored or context menu always starts on its first row.
- A submenu leaves at once; only the menu itself fades out, so every level closing together is one fade.
- Actions that move into an overflow menu (`Card`, `SectionTitle`, `TopBar`) keep working as they are written: inside that menu a `Button` or `IconButton` renders as a menu item, a toggle as a checkbox item with its check at the end of the row, a link button as a link item, and a `Menu` with a `trigger` as a submenu. A plain element that wraps actions (`<div>`, `<span>`) gives way to them, and text among them is left out. A component of the app among the actions must render one of those three itself; if it renders its own wrapper element, the rows after it are lost.
- Trailing icons on a row (the source's "opens elsewhere" mark) are part of the label node; there is no prop for them.
- The check is the library's own icon; it is replaced through `parts.check` (it is not in the provider's icon map yet).

Resolved 2026-10-11 (Milestone 2):

- A menu without a trigger of its own (anchored with `anchorRef`, a context menu, the overflow menu of a header) now gives its submenus the state React Aria's `MenuTrigger` would: a row chosen in a submenu closes the whole menu. Before, it closed the submenu and left the menu open.
- The overflow menu of a header (`OverflowMenu`, internal) is loaded on demand and draws the buttons it holds as rows itself (`plan/decisions/05-packaging.md`, "Loaded on demand").

Resolved 2026-10-11 (review 2):

- A danger row under the highlight (pointer or arrow keys) takes a lighter red, `--umbra-menu-item-danger-highlight-fg`: the plain danger red was 4.40:1 on the highlight (F14). Measured 4.5:1 or more on all four tints (`tests/visual/regressions.spec.ts`).
- The stripe of the current row is on the start side, and the submenu chevron is mirrored, when the direction is right to left (F32). The menu renders into the modal it was opened from.
- Kept: `Space` on a radio or checkbox row changes it and leaves the menu open, `Enter` changes it and closes. This is the ARIA Authoring Practices pattern for `menuitemradio` (review 2 listed it as a defect, F30).
