# SubNav

**Tier** 0 · **Group** Shell · **Status** spec approved 2026-10-10

## Purpose

The second bar: the pages of the current section on the left, and room for shortcuts on the right.

## Not for

- Top-level sections: use `PrimaryNav`.
- Tabs that belong to one card: use `Tabs`.

## Evidence

Nearly every screenshot: a bold section label, a divider, sentence-case items with the current one underlined, some with carets (1, 14, 38). The right side holds the `ShortcutBar` with a "(+1)" overflow.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | the section name | shown when given |
| `items` | page links, optionally with dropdowns | shown |
| `end` | free slot, normally a `ShortcutBar` | hidden |

## Variants and states

Item states are the same as `PrimaryNav`.

## Customisation

### 1. Tokens

`--umbra-subnav-height`, `--umbra-subnav-bg`, `--umbra-subnav-indicator-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `label` | node | — | |
| `items` | same shape as `PrimaryNav` | — | |
| `value` / `onChange` | id / function | — | |
| `renderLink` | function | plain `<a>` | |
| `end` | node | — | |
| `moreLabel` / `aria-label` | string | "More" / "Section" | |

### 3. Parts

`label`, `item`, `indicator`, `more`, `end`.

### 4. Blocks

`SubNav.Root`, `SubNav.Label`, `SubNav.Item`, `SubNav.Menu`, `SubNav.End`.

## Behaviour as space shrinks

| Step | Result |
|---|---|
| 1 | `end` content shrinks first (the `ShortcutBar` moves items into its own overflow; until that component exists the slot clips its content) |
| 2 | Items move into a "More" menu, last first; the active item stays |
| 3 | `label` hides |

## Interaction and accessibility

Same as `PrimaryNav`; the landmark is named differently ("Section") so the two can be told apart.

## Open questions

None.
