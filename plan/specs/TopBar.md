# TopBar

**Tier** 0 · **Group** Shell · **Status** spec approved 2026-10-10; revised 2026-10-10 for Milestone 1 (shell extras, review items 8, 10 and 15)

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
| `logo` | the app or entity mark, in a round badge | shown when given |
| `nav` | a `PrimaryNav` | shown when given |
| `actions` | the search trigger (pinned) and `IconButton`s | shown when given |
| `search` | the search trigger, and the `CommandPalette` it opens | shown with `commandPalette` or `onSearch` |
| `context` | a `ContextBlock` (two-line status) | shown when given |
| `primaryAction` | the slot for a `PrimaryAction` | shown when given |

## Variants and states

No variants. Text colour on the bar is computed from the brand colour (light or dark).

## Customisation

### 1. Tokens

`--umbra-topbar-bg` (defaults to brand), `--umbra-topbar-fg`, `--umbra-topbar-height`, `--umbra-topbar-gap` (between the groups), `--umbra-topbar-padding-x`, `--umbra-topbar-action-size` and `--umbra-topbar-action-gap` (the icon buttons in `actions`), `--umbra-topbar-logo-size`.

The bar declares no token of another component on its parts: its parts read the bar's own tokens, so an app can set them from any ancestor. A `PrimaryAction` and `HistoryButtons` in the bar are sized by their own tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `logo` | node | — | App or entity mark |
| `nav` | node | — | |
| `actions` | node | — | |
| `context` | node | — | |
| `primaryAction` | node | — | A `PrimaryAction`: it fills the bar's height to the window edge. Any other node is shown as it is, centred and kept off the edge |
| `history` | boolean \| node | `false` | `true` shows `HistoryButtons` that use the browser history; a node replaces them (for example `HistoryButtons` in router mode) |
| `commandPalette` | a `CommandPalette` element | — | Shows the search trigger, which opens and closes it (also by `Mod+K`). The bar keeps its open state unless the element is controlled |
| `onSearch` | function | — | For an app with its own search: shows the search trigger and is called when it is used (also by `Mod+K`). Works together with `commandPalette` |
| `brand` | colour | provider | Overrides the brand for this bar only |
| `searchLabel` / `backLabel` / `forwardLabel` / `moreLabel` | string | English text | Accessible names of the built-in buttons |

### 3. Parts

`start`, `logo`, `nav`, `actions`, `search`, `context`, `primaryAction`.

### 4. Blocks

`TopBar.Root`, `TopBar.Start`, `TopBar.Logo`, `TopBar.Nav`, `TopBar.End`, `TopBar.Actions`, `TopBar.Search`, `TopBar.Context`, `TopBar.PrimaryAction`. `TopBar.Actions` takes `pinned` for content that stays out of the overflow menu (the search trigger). `TopBar.Search` takes `label`, `onSearch`, `commandPalette` and `shortcut`.

The all-in-one `TopBar` is built from these blocks and nothing else, with `HistoryButtons` and `PrimaryAction` as the public components inside them. Each shrink step is taken by the block concerned, which reads the level from `TopBar.Root`, so a bar composed by hand shrinks the same way.

## Behaviour as space shrinks

| Step | Result |
|---|---|
| 1 | `context` hides |
| 2 | `actions` collapse into one overflow `Menu`; the search trigger stays |
| 3 | `nav` items move into a "More" menu from the end (see `PrimaryNav`) |
| 4 | `primaryAction` shows its icon only (a `PrimaryAction` with an icon; a `Button` there needs an icon and `collapseTo="icon"`) |

The current step is exposed as `data-shrink` (`0`–`4`) on the root. Step 4 waits until the nav has nothing left to move.

Edge cases:

| Case | Result |
|---|---|
| A step's block is missing (no `context`, no `actions`) | The step changes nothing and the next follows at once |
| No nav | The bar itself is measured. Step 3 changes nothing; step 4 follows |
| The nav has moved every item it can | Only then is step 4 taken, also when the window narrows slowly |
| After step 4 | Nothing more gives way. The bar clips at its end: with every slot filled this starts at about 320px (without a nav) and 450px (with one), far below the 1024px minimum window |
| A custom node as `primaryAction` | Never collapsed by the bar, unless it is a `Button` with `collapseTo="icon"` |
| The window grows | The bar starts again from step 0 |

## Interaction and accessibility

- Root is a `banner`.
- The search trigger is an icon button bound to the reserved `Mod+K` shortcut. With a `commandPalette` it opens the palette, and focus returns to the trigger when the palette closes. The trigger owns the key; the palette inside the bar does not bind it a second time.
- `HistoryButtons` bind `Alt+ArrowLeft` and `Alt+ArrowRight` (`plan/specs/HistoryButtons.md`).
- The overflow of `actions` is a real menu (`plan/specs/Menu.md`): each `IconButton` or `Button` in it is a `menuitem` with its icon and label (a toggle is a `menuitemcheckbox`, a `Menu` a submenu), with arrow keys and type-ahead.
- Contrast of text and icons against any brand colour is at least 4.5:1, by computation.

## Open questions

None.

Resolved 2026-10-10 (Milestone 1):

- Review item 8: `TopBar.Logo`, `TopBar.Context`, `TopBar.PrimaryAction` and `TopBar.Search` are public; nothing the bar renders is private.
- Review item 15: the `primaryAction` part no longer sets `Button` tokens. A `PrimaryAction` fills the slot by itself; a plain `Button` there keeps its normal look.
- Gradual narrowing never reached step 4 with a nav: the nav reported that it was exhausted only at the moment it moved its last item. The bar now measures the overflow itself once the nav has nothing left to move.

Resolved 2026-10-10: for a brand colour where neither white nor near-black text reaches 4.5:1, the bar uses the better of the two and warns in development. The bar colour is never changed.

Resolved 2026-10-11 (review 2):

- The bar declares no public token of another component (F21): what it needs inside itself is a private default (`--primary-action-min-height`, `--icon-size`), which the component reads after its public token, so `--umbra-primary-action-min-height` or `--umbra-icon-size` set by the app on any ancestor wins. `--umbra-badge-ring` is still declared here, because `Badge` (another group's file) does not read a private default yet.
- When nothing is left to move, "More" itself gives way: its label ends in an ellipsis and its caret stays, so it is not cut at the edge down to a bar 470px wide (it was cut from 470px; F31). Narrower than that the logo and the actions alone are wider than the bar: not supported, as phones are not a design target (`plan/layout.md`).
