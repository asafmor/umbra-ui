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

Item states: default, hover, active (current section), open (menu shown), focus, disabled.

## Customisation

### 1. Tokens

`--umbra-nav-font`, `--umbra-nav-gap`, `--umbra-nav-indicator-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | list of `{ id, label, icon?, href?, items?, disabled? }` | — | `items` inside an item makes a dropdown |
| `value` | id | — | The active item |
| `onChange` | function | — | |
| `renderLink` | function | plain `<a>` | Plugs in the app's router link |
| `moreLabel` | string | "More" | |

### 3. Parts

`item`, `indicator`, `more`.

### 4. Blocks

`PrimaryNav.Root`, `PrimaryNav.Item`, `PrimaryNav.Menu`. Items can be written as children instead of the `items` prop.

## Behaviour as space shrinks

Items that do not fit move into the "More" menu, last item first. The active item never moves into "More".

## Interaction and accessibility

- A `navigation` landmark; the active item has `aria-current="page"`.
- One tab stop; arrow keys move between items; `Enter` or `ArrowDown` opens a dropdown; `Escape` closes it.

## Open questions

- Whether clicking an item with a dropdown navigates, opens the menu, or both (source: both, with a separate caret target).
