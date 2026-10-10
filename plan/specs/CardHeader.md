# CardHeader

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10

## Purpose

The title row of a `Card`: what the card is, and the controls that act on the whole card. It is the `Card.Header` block, specified separately because it has its own shrink rules and is what remains when a card collapses. There is no separate `CardHeader` export.

## Not for

- A heading inside a card body: use `SectionTitle`.
- A page-level header: use `PageHeader`.

## Evidence

Plain uppercase titles (1, right column), tinted bands (32, 33), carets for collapsing (38), expand icons (38, top row cards).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | leading icon or image | hidden |
| `title` | condensed uppercase text | shown |
| `subtitle` | second line, body font | hidden |
| `actions` | trailing controls | hidden |
| `toggle` | collapse caret (user-collapsible) or expand hint (layout-collapsed) | per card state |

## Variants and states

| Variant | Values |
|---|---|
| `headerStyle` | `plain`, `band` |

States: collapsed by user (caret), collapsed by layout (expand hint; the whole header is a button that opens the popover).

## Customisation

### 1. Tokens

`--umbra-card-header-bg`, `--umbra-card-header-fg`, `--umbra-card-header-height`, `--umbra-card-title-font`.

### 2. Props

Set through `Card` (`title`, `subtitle`, `icon`, `actions`, `headerStyle`). As a block it takes the same props plus `bandColor`, `moreLabel` and `href` / `onOpen`. Given children, it renders them in place of the built-in parts and keeps the `toggle`.

### 3. Parts

`icon`, `title`, `subtitle`, `actions`, `toggle`.

### 4. Blocks

`Card.Header`, `Card.Title`, `Card.Actions`.

## Behaviour as space shrinks

`subtitle` hides, then `actions` move into one overflow `Menu`, then `title` truncates with an ellipsis. The `toggle` never hides.

## Interaction and accessibility

- `title` is a heading; its level is set by the card (`headingLevel`, default 2).
- When the card is layout-collapsed, the header is one button with `aria-haspopup="dialog"` that opens and closes the card's `Popover`.
- The overflow of `actions` is a real menu (`plan/specs/Menu.md`): the app still passes buttons, and each `Button` or `IconButton` shows as a `menuitem` with its icon and label (a toggle as a `menuitemcheckbox`, a link button as a link, a `Menu` as a submenu), with arrow keys and type-ahead. Other content among the actions is not shown in the menu.

## Open questions

None.
