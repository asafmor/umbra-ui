# TopBar

**Tier** 0 · **Group** Shell · **Status** spec approved 2026-10-10

## Purpose

The brand-coloured bar at the top: where the user is, the main sections, and the one primary action of the app.

## Not for

- Section-level navigation: use `SubNav`.
- Page titles: use `PageHeader`.

## Evidence

Nearly every screenshot. Blue brand (1), charcoal (15), light with dark text (38). The magenta primary action stays the same on all.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `start` | `HistoryButtons`, then `logo` | shown when given |
| `nav` | a `PrimaryNav` | shown when given |
| `actions` | search trigger and `IconButton`s | shown when given |
| `context` | a `ContextBlock` (two-line status) | shown when given |
| `primaryAction` | a `PrimaryAction` button | shown when given |

## Variants and states

No variants. Text colour on the bar is computed from the brand colour (light or dark).

## Customisation

### 1. Tokens

`--umbra-topbar-bg` (defaults to brand), `--umbra-topbar-fg`, `--umbra-topbar-height`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `logo` | node | — | App or entity mark |
| `nav` | node | — | |
| `actions` | node | — | |
| `context` | node | — | |
| `primaryAction` | node | — | |
| `history` | boolean \| node | `false` | Shows back and forward buttons |
| `onSearch` | function | — | Shows the search trigger and is called when it is used. From Milestone 1 it opens the `CommandPalette`. |
| `brand` | colour | provider | Overrides the brand for this bar only |

### 3. Parts

`start`, `logo`, `nav`, `actions`, `context`, `primaryAction`.

### 4. Blocks

`TopBar.Root`, `TopBar.Start`, `TopBar.Nav`, `TopBar.Actions`, `TopBar.End`.

## Behaviour as space shrinks

| Step | Result |
|---|---|
| 1 | `context` hides |
| 2 | `actions` collapse into one overflow menu; the search trigger stays |
| 3 | `nav` items move into a "More" menu from the end (see `PrimaryNav`) |
| 4 | `primaryAction` shows its icon only |

## Interaction and accessibility

- Root is a `banner`.
- Contrast of text and icons against any brand colour is at least 4.5:1, by computation.

## Open questions

None.

Resolved 2026-10-10: for a brand colour where neither white nor near-black text reaches 4.5:1, the bar uses the better of the two and warns in development. The bar colour is never changed.
