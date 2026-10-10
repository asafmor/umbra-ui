# CardHeader

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10

## Purpose

The title row of a `Card`: what the card is, and the controls that act on the whole card. It is the `Card.Header` block, specified separately because it has its own shrink rules and is what remains when a card collapses.

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

Set through `Card` (`title`, `subtitle`, `icon`, `actions`, `headerStyle`). As a block it takes the same props plus `bandColor`.

### 3. Parts

`icon`, `title`, `subtitle`, `actions`, `toggle`.

### 4. Blocks

`Card.Header`, `Card.Title`, `Card.Actions`.

## Behaviour as space shrinks

`subtitle` hides, then `actions` move into one overflow menu, then `title` truncates with an ellipsis. The `toggle` never hides.

## Interaction and accessibility

- `title` is a heading; its level is set by the card (`headingLevel`, default 2).
- When the card is layout-collapsed, the header is one button with `aria-haspopup="dialog"`.

## Open questions

None.
