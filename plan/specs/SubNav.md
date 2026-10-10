# SubNav

**Tier** 0 · **Group** Shell · **Status** spec approved 2026-10-10; revised 2026-10-10 for Milestone 1 (`ShortcutBar`, review items 9 and 15)

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
| `end` | free slot, normally a `ShortcutBar`; any node works. Its content is never clipped | hidden |

## Variants and states

Item states are the same as `PrimaryNav`.

## Customisation

### 1. Tokens

`--umbra-subnav-height`, `--umbra-subnav-bg`, `--umbra-subnav-indicator-color`, `--umbra-subnav-gap`, `--umbra-subnav-padding-x`, `--umbra-subnav-end-gap`. The bar declares no token of another component on its parts; a `ShortcutBar` in the end slot is sized by its own tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `label` | node | — | |
| `items` | same shape as `PrimaryNav` | — | |
| `value` / `onChange` | id / function | — | |
| `renderLink` | function | plain `<a>` | |
| `end` | node | — | |
| `moreLabel` / `aria-label` | string | "More" / "Section" | |
| `submenuLabel` | function (label) | `"<label>, submenu"` | Accessible name of the caret that opens an item's dropdown |

### 3. Parts

`label`, `item`, `indicator`, `more`, `end`.

### 4. Blocks

`SubNav.Root`, `SubNav.Label`, `SubNav.Item`, `SubNav.Menu`, `SubNav.End`.

## Behaviour as space shrinks

| Step | Result |
|---|---|
| 1 | The `ShortcutBar` in `end` gives way first: its labels hide (when every shortcut has an icon), then its items move into its "+N" menu, until only that chip is left |
| 2 | Items move into a "More" menu, last first; the active item stays |
| 3 | `label` hides |

The end slot never shrinks below what its content needs, and clips nothing: a control in it is fully visible or not there. Content other than a `ShortcutBar` keeps its full width, so step 1 is skipped for it. After step 3 nothing more gives way and the list of items clips at its end (below about 220px with a `ShortcutBar`). When the bar grows again, the shortcuts come back before anything else.

## Interaction and accessibility

Same as `PrimaryNav`, including the dropdowns and "More" as a `Menu`, the named caret and its 24 × 24px pointer target; the landmark is named differently ("Section") so the two can be told apart.

## Open questions

None.
