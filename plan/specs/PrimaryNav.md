# PrimaryNav

**Tier** 0 · **Group** Shell · **Status** spec approved 2026-10-10

## Purpose

The top-level sections of the app, inside the `TopBar`. Each item is a link, optionally with a dropdown of sub-pages.

## Not for

- Second-level navigation: use `SubNav`.
- Switching views inside a card: use `Tabs`.
- Navigation in a modal or settings screen: use `VerticalNav`.

## Evidence

Nearly every screenshot: condensed uppercase items with a caret (1, 14); the active item has a short underline (38).

## Anatomy

| Part | Content |
|---|---|
| `item` | `icon` (optional), `label`, `caret` when it has a menu |
| `indicator` | the underline under the active item |
| `more` | the overflow item, shown only when needed |

## Variants and states

Item states: default, hover, active (current section), open (menu shown), focus, disabled. A disabled item is a button marked `aria-disabled`: it never navigates and does not respond to hover, but it keeps its place in the arrow-key order.

## Customisation

### 1. Tokens

`--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | list of `{ id, label, textValue?, icon?, href?, items?, disabled? }` | — | `items` inside an item makes a dropdown. `textValue` is the label as text, required when `label` is not a string |
| `value` | id | — | The current page: a top-level item, or a sub-page (its parent item is then marked as the current section) |
| `onChange` | function | — | |
| `renderLink` | function | plain `<a>` | Plugs in the app's router link. It receives anchor props to spread: `renderLink={(p) => <RouterLink to={p.href} {...p} />}` |
| `aria-label` | string | "Main" | Name of the navigation landmark |
| `moreLabel` | string | "More" | |
| `submenuLabel` | function (label) | `"<label>, submenu"` | Accessible name of the caret that opens an item's dropdown |

### 3. Parts

`item`, `indicator`, `more`.

### 4. Blocks

`PrimaryNav.Root`, `PrimaryNav.Item`, `PrimaryNav.Menu`. Items can be written as children instead of the `items` prop. `Item` takes `id`, `href`, `icon`, `disabled`, `textValue`, the label as children, and `menu` (a `Menu` holding more `Item`s). Items must be direct children of `Root`, which reads their `id`.

## Behaviour as space shrinks

Items that do not fit move into the "More" menu, last item first. The active item never moves into "More".

## Interaction and accessibility

- A `navigation` landmark; the active item has `aria-current="page"`.
- One tab stop; arrow keys move between items and carets; `Enter` (on a caret) or `ArrowDown` opens a dropdown; `Escape` closes it and returns focus.
- A dropdown and "More" are a `Menu` (`plan/specs/Menu.md`): rows are `menuitem` links, with arrow keys and type-ahead; the current page has `aria-current="page"`, the violet fill, an edge stripe and bold text. Opening one moves focus to its first row.
- In "More", an item with sub-pages is a submenu. When the item is also a link, its own page is the first row of that submenu, above a separator.
- The caret has its own name, `"<label>, submenu"` (`submenuLabel`), so it is not confused with the link beside it. An item whose label is not a string needs `textValue`; without it the item's `id` is used and a warning is logged in development.
- The caret's pointer target is at least 24 × 24px (WCAG 2.2 target size). The caret looks no bigger: the target grows into the gap after the item.
- Overflow is measured again when web fonts finish loading.

## Open questions

None.

Resolved 2026-10-10:

- An item with a dropdown does both, as in the source. Its label navigates and a separate caret button opens the menu. An item without `href` opens the menu from anywhere on the item.
- Approved after Milestone 0: `renderLink` receives anchor props to spread on the app's router link.
- 2026-10-10 (review items 4 and 7): dropdowns moved to the public `Menu`; the caret is named and has a 24px target. `renderLink` also renders the link rows of the menus.

Resolved 2026-10-11 (review 2):

- **`value` when a sub-page is current.** `value` is the id of the current page, at any depth. When it is the id of a sub-page (a row of an item's dropdown), the top-level item that holds it is marked as the current section: `aria-current="true"` on its link or button, `data-active` and `data-section` on the item, and the same indicator as a current item. The sub-page's row in the dropdown has `aria-current="page"`. Exactly one top-level item is marked. That item never moves into "More". Before, nothing in the bar was marked (F4).
- **Opening a dropdown or "More" by key.** `Enter`, `Space` and `ArrowDown` on the caret (or on an item that only opens a menu) open it with focus on its first row; `Enter` there chooses the row, `Escape` closes and returns focus. Before, `Enter` and `Space` left focus on the menu itself, where `Enter` did nothing (F3). The keys are handled on key-down; the browser's click from them is not used.
- **Arrow keys follow the direction**: Left goes to the next item when the direction is right to left (F10).
- **The menu closes when a row is chosen**, including a row of a submenu inside "More" whose choice moves its parent out of "More".
