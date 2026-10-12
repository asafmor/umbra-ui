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

Defaults for what is inside, as private properties, never as public tokens: the fade of a `ScrollArea` blends into the card's background (`--scroll-fade-color`), and a badge in a band header gets a ring in the header's text colour (`--badge-ring`). The app's own value of the global token, set on any ancestor, wins over these defaults (2026-10-11, `plan/decisions/07-customisation.md`, "Tokens"). The card also declares `--umbra-slot-min-height`, the minimum height the `Stack` around it reads: it is reset on every layout child, so it is never inherited.

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
| `empty` | node \| `{ title, description, icon, action }` | — | Shown in place of the body when set. Text or a node is drawn as it is, centred; the pieces form draws the shared `EmptyState`. |
| `error` | node \| `{ title, description, icon, action }` \| `true` | — | Shown in place of the body when set, as an alert. `true` shows a default text. |
| `onRetry` / `retryLabel` | function / string | — / "Try again" | Adds a retry button to the error state |
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
| 1 | Header narrower than its content | `subtitle` hides, then `actions` move into an overflow menu (its code is loaded then); `title` truncates last |
| 2 | Body taller than the slot | Body scrolls inside the card |
| 2a | `size="content"` in a `Stack` | The card is as tall as its header plus its content (a card without a header: its content plus the padding). When the stack cannot give that much, the card gets what is left after the minimums of the others and its body scrolls inside. It is never collapsed by the layout. |
| 3 | The cards of a `Stack` cannot all have their `minHeight` | While they all fit, each open card is held at its `minHeight` or more. When they do not, the parent `Stack` collapses the card to its header; clicking the header opens the body in a `Popover` anchored to it. A layout-collapsed card shows a small "expand" hint icon in its header, so it looks different from a user-collapsed card (which shows the caret and expands in place). |

## Interaction and accessibility

- The root is a `region` named by its title.
- The collapse caret is a button with `aria-expanded`; `Enter` and `Space` toggle it. The card's height then animates (see "The size animation").
- A card collapsed by the layout (step 3) opens its popover with `Enter`; `Escape` closes it and returns focus to the header. Pressing the header again closes it too. The popover is the public `Popover`: it has no backdrop and the page stays usable.
- Loading sets `aria-busy`.
- The popover closes by itself when the layout opens the card again, or when the window enters or leaves tab mode.
- A card starts a new layout context: a `Slot`, `Stack` or `Columns` inside it belongs to the card, not to the layout around it.
- The popover of a layout-collapsed card shows the card's `actions` above its content, because the collapsed header is a single button.
- The card's content exists once. While the popover is open the `toolbar`, `body` and `footer` blocks are rendered into it (a portal) instead of the card; nothing is rendered twice, so ids are not repeated. While the card is collapsed by the layout and the popover is closed, the blocks stay mounted, hidden and inert, so text typed in them, scroll positions and state survive a resize. Opening the popover moves the same elements into it and closing moves them back; nothing is rendered again. (Limit: a block added or removed by the app while the popover is open is placed when it closes.) A card collapsed with its caret does not render its body.
- The popover of a layout-collapsed card is named by the card: its title when that is text, else its `aria-label`, else `expandLabel`.

### The size animation

Pressing the caret animates the card's height over 180ms (`--umbra-motion-duration-base`; ease-in to collapse, ease-out to expand). The duration is multiplied by `--umbra-motion-scale`, so reduced motion makes it instant.

What the user sees:

- **Collapse**: the caret turns and the header takes its collapsed look at once. The card's bottom edge then moves up to the header. The body gets shorter from the bottom, its content staying in place under the header and being cut off by the edge; a footer rides up with the edge. The other cards of the stack grow into the room as it comes. When the edge reaches the header, the body leaves the page.
- **Expand**: the body is back at once, cut off at the header. The bottom edge moves down to where the card's share of the stack ends, and the other cards give way as it goes. If the stack has to collapse another card to make room, that card collapses at once, at the start.

How (this is the accordion's problem with one more difficulty: here the height is a flex share, not the content's):

| When | What happens |
|---|---|
| Press | `Card` notes its height at that moment (also in the middle of a running animation, which is then replaced). |
| After the render, before paint | The end height is measured in the final layout: the header alone for a collapse, the card's share of the stack for an expand. This is done in a microtask, after the parent `Stack` has applied its rules for the new state. |
| While it moves | The root's `height` is animated between the two with the Web Animations API, and the root carries `data-resizing`, which gives it `flex: 0 0 auto`. So the flex share is switched off at the start, for both directions, and the animated height is the card's size; the cards beside it share what is left. The body's viewport cannot scroll, so no scrollbar flashes. |
| At the end | The animation and `data-resizing` go. An expanded card is back on its flex share, which is the height the animation ended on, so nothing jumps. A collapsed card unmounts its `toolbar`, `body` and `footer`, which had stayed for the animation. |

Pitfall, found by the owner as a flicker on a `WidgetBoard` (O-1, fixed 2026-10-11): **the body must go in the frame in which the animation lets go of the height.** A content-sized card (`size="content"`, every widget of a board) takes its content's height the moment the animation ends. If the body is unmounted a render later (a state change that React schedules), the card is drawn once at its full height before it is drawn collapsed: 87, 226, 70 pixels. So the end of the animation renders the change at once (`flushSync`), the animation holds its end height until then (`fill: forwards`), and only then is it cancelled. A card that fills its slot never showed it, because its body has no height of its own there. `tests/visual/shell-layout-tier2.spec.ts` reads the height in every frame, for a widget of a board, a content-sized card in a stack and a card that fills: it only moves towards its end.

A pure-CSS version (the accordion's grid row) was not possible: an expanding card has to end on a height that only the stack's flex layout knows, and `flex-grow` cannot be transitioned to it without the other cards jumping.

Not animated, on purpose:

- A collapse or expand by the parent `Stack` (step 3), and anything during a window resize: there is no press, so there is no start height.
- A change of the `collapsed` prop that did not come from the caret.
- A card whose height does not change when it collapses (directly in `Columns`, where its height is the row's).

Tested in `tests/visual/structure.spec.ts` ("Card collapse animation"): the height only moves one way, there is a real state in between, the stack is never overflowed, the end has no jump, the body stays while closing, and reduced motion is instant.

`empty`, `error`, `onRetry` and `retryLabel` are the props every data component has (`src/internal/dataState.tsx`). `Card` differs in one point, kept from Milestone 0: plain text or a node, without `onRetry`, is drawn as given (centred, quiet), not as an `EmptyState` title, and `empty` has no default: a card is only empty when the app says so.

## Open questions

None.

Resolved 2026-10-10:

- Default `minHeight` is 72 / 88 / 104px for compact / default / spacious.
- Approved after Milestone 0: `href` renders a plain `<a>`, not a router link; `toolbar` and `footer` are set through `parts` only, with `Card.Toolbar` and `Card.Footer`.
- 2026-10-11: a `PageHeader` given as the `header` part and an `ActionBar` given as the `footer` part are spaced by the card: a plain header gets the card padding (above and at the sides), the body after any header that is not the card's own gets the padding above, a tinted or band header runs edge to edge with one rule below, and the bar gets the footer's padding and rule (a `strong` bar keeps its own). `--umbra-page-header-padding` and `--umbra-action-bar-padding-x/-y` still override.
- 2026-10-11: `size="content"` sizes the card by its header plus its body. Before, the body had no height of its own and the card showed only its header.
- 2026-10-10 (review item 6): the popover moves the content, it does not repeat it. The overflow of `actions` is a `Menu`.
- 2026-10-11 (Milestone 2): **the menu and the popover are loaded on demand.** A card cost about 70 KB gzip because its header imported the menu and its collapsed state the popover. The menu's code is now asked for the first time a header does not fit, and the popover's the first time a stack collapses the card (`import()`; mechanism and numbers in `plan/decisions/05-packaging.md`, "Loaded on demand"). A card whose header fits never asks for either: what loads first is 35 KB gzip under Vite, from 75. Nothing the user sees changes: the "more" button appears in the same frame as before, and a press that comes before the code is kept, so the menu or popover opens when it arrives, with the focus where that press would have put it, and focus never leaves the button in between. The "more" button is now drawn by the header's overflow itself (`src/internal/ActionsOverflow.tsx`): it opens on a press, on `ArrowDown` (first row) and on `ArrowUp` (last row), and stays pressed while the menu is open. Tests: `tests/visual/card-menu.spec.ts`.

Resolved 2026-10-11 (review 2):

- `renderLink` on `Card`, `Card.Header` and `Card.Title` (2026-10-11): `href` rendered a plain `<a>`, so an app's router could not take the link. It receives the shared `LinkRenderProps`, as on the navigation components.
- A collapse with nothing to animate (reduced motion, or no change of height) removes the body in the same frame; it used to stay for one more render, which a test saw about one run in four.
- **The popover of a layout-collapsed card is rendered inside the provider's root** (integration pass, 2026-10-11): rendered into `<body>`, nothing in the moved body answered a press or a key (`plan/layout.md`, "Mechanism").
- **A content-sized card gives way before a collapsed card loses any of its header** (integration pass, 2026-10-11): `plan/layout.md`, rule 3.
- **Controls that cannot be menu rows stay in the header** (integration pass, 2026-10-11) when its actions overflow, as the same elements (`plan/decisions/07-customisation.md`). The actions are always rendered through `ActionsOverflow`.
- **`id`, `data-*` and `aria-*` reach the root** (integration pass, 2026-10-11), as on every component.
- **What `actions` may hold** (review 3 of Milestone 2, F1, 2026-10-11; the rule is in `plan/decisions/07-customisation.md`, "Controls among actions that overflow", and is the same for every header with actions). Anything: nothing an app puts there can break the "more" menu. What moves into the menu when the header is too narrow: `Button`, `IconButton`, `Menu`, `SplitButton`, a plain element around them, and a component of the app that renders one of them and nothing else. Everything else stays in the header: an input (given directly or inside a component of the app), a `Tag`, a `<span>`, text. If what stays does not fit, the header clips it, so keep such things few and small.
