# Card

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10 (this file is the template for all specs)

## Purpose

The container for one unit of content on a page. It fills the slot its parent `Stack` or `Columns` gives it, and scrolls its own body when the content is taller.

## Not for

- Grouping form fields inside a card: use `FormField` and `SectionTitle`.
- Floating content: use `Popover` or `Modal`.
- A clickable summary that only navigates: use `SummaryTile`.

## Evidence

Every screenshot. Clear examples: 1 (right column: five stacked cards), 14 (list card + detail card), 32–33 (tinted headers), 38 (collapsible carets).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `header` | `icon`, `title`, `subtitle`, `actions`, collapse caret | shown when `title` is set |
| `toolbar` | filters or tabs that stay fixed above the body | hidden |
| `body` | the content; a `ScrollArea` | shown |
| `footer` | status or actions fixed below the body | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `tone` | `default`, `tinted`, `neutral` | `tinted` takes the context tint; `neutral` ignores it (source: right-column cards) |
| `headerStyle` | `plain`, `band` | `band` fills the header with the brand or a given colour (source: 32, 33) |
| `padding` | `default`, `none` | `none` for edge-to-edge tables and media |

States: `collapsed`, `loading`, `empty`, `error`, `focus-within`.

## Customisation

### 1. Tokens

`--umbra-card-bg`, `--umbra-card-border`, `--umbra-card-radius`, `--umbra-card-padding`, `--umbra-card-header-bg`, `--umbra-card-min-height`. Padding and minimum height follow the density level.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | Header title |
| `subtitle` | node | — | Second header line |
| `icon` | node | — | Leading header icon |
| `actions` | node | — | Trailing header controls |
| `tone` | see above | `default` | |
| `headerStyle` | see above | `plain` | |
| `padding` | see above | `default` | |
| `size` | number \| `"content"` | `1` | Share of the parent's space (see `layout.md`) |
| `priority` | number | `0` | Which cards collapse first when space runs out. Higher stays open longer; cards with the same priority collapse from the end of the source order. |
| `minHeight` | number | per density | Below this the parent may collapse the card |
| `collapsible` | boolean | `false` | Lets the end user collapse it |
| `collapsed` / `defaultCollapsed` / `onCollapsedChange` | boolean / boolean / function | — | Controlled or uncontrolled collapse |
| `loading` | boolean | `false` | Shows the body skeleton |
| `empty` | node | — | Shown in place of the body when set |
| `error` | node | — | Shown in place of the body when set |
| `href` / `onOpen` | string / function | — | Makes the title a link (source: underlined pink titles) |
| `headingLevel` | 2–6 | 2 | Heading level of the title |
| `aria-label` | string | — | Names a card that has no title |
| `moreLabel` / `collapseLabel` / `expandLabel` | string | English text | Accessible names of the overflow menu, the caret, and a collapsed header |

### 3. Parts

`header`, `title`, `actions`, `toolbar`, `body`, `footer`, `skeleton`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `toolbar` and `footer` are empty by default; fill them with the blocks: `parts={{ footer: <Card.Footer>…</Card.Footer> }}`.

### 4. Blocks

`Card.Root`, `Card.Header`, `Card.Title`, `Card.Actions`, `Card.Toolbar`, `Card.Body`, `Card.Footer`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Header narrower than its content | `subtitle` hides, then `actions` move into an overflow menu; `title` truncates last |
| 2 | Body taller than the slot | Body scrolls inside the card |
| 3 | The cards of a `Stack` cannot all have their `minHeight` | While they all fit, each open card is held at its `minHeight` or more. When they do not, the parent `Stack` collapses the card to its header; clicking the header opens the body in a `Popover` anchored to it. A layout-collapsed card shows a small "expand" hint icon in its header, so it looks different from a user-collapsed card (which shows the caret and expands in place). |

## Interaction and accessibility

- The root is a `region` named by its title.
- The collapse caret is a button with `aria-expanded`; `Enter` and `Space` toggle it.
- A card collapsed by the layout (step 3) opens its popover with `Enter`; `Escape` closes it and returns focus to the header. Pressing the header again closes it too. The popover is the public `Popover`: it has no backdrop and the page stays usable.
- Loading sets `aria-busy`.
- The popover closes by itself when the layout opens the card again, or when the window enters or leaves tab mode.
- A card starts a new layout context: a `Slot`, `Stack` or `Columns` inside it belongs to the card, not to the layout around it.
- The popover of a layout-collapsed card shows the card's `actions` above its content, because the collapsed header is a single button.
- The card's content exists once. While the popover is open the `toolbar`, `body` and `footer` blocks are rendered into it (a portal) instead of the card; nothing is rendered twice, so ids are not repeated. The body is not mounted while the card is collapsed and the popover closed, as for a card collapsed with its caret.
- Collapsing with the caret is not size-animated yet: the caret rotates (180ms) and the layout changes at once.

## Open questions

None.

Resolved 2026-10-10:

- Default `minHeight` is 72 / 88 / 104px for compact / default / spacious.
- Approved after Milestone 0: `href` renders a plain `<a>`, not a router link; `toolbar` and `footer` are set through `parts` only, with `Card.Toolbar` and `Card.Footer`.
- 2026-10-10 (review item 6): the popover moves the content, it does not repeat it. The overflow of `actions` is a `Menu`.
