# WidgetBoard

**Tier** 2 · **Group** Layout · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A board of many small cards of different heights, packed in columns with no holes, each collapsible to its header. For a page of widgets that is longer than the window: the board scrolls inside itself.

## Not for

- A page whose cards should share the window: use `Columns` and `Stack`, where cards fill their slot.
- A row of cards that scrolls sideways: use `HorizontalScroller`.
- Sections of one document: use `Accordion`.

## Evidence

36: about a dozen widgets of different heights and widths in a packed board, each with a title and a caret; some span two columns.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `toolbar` | a row above the board, holding `collapseAll` | shown when a widget can collapse |
| `collapseAll` | the button that collapses or expands every widget | shown |
| `grid` | the list of items, inside a `ScrollArea` (without the fade: a cut card says there is more, and the board sits on the page's gradient, which no one fade colour fits) | shown |
| `item` | one cell: a `Card`, or anything | — |
| `skeleton` | placeholder cards | while `loading` |

## Variants and states

No variants. States: `loading`, `empty`, `error`; each widget open or collapsed.

## Customisation

### 1. Tokens

`--umbra-widget-board-gap` (between cards, both ways; follows the density), `--umbra-widget-board-min-column-width`, `--umbra-widget-board-toolbar-gap`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `minColumnWidth` | number | 280 | The board has as many columns as fit at this width or more |
| `columns` | number | — | A fixed number of columns; wins over `minColumnWidth` |
| `collapsedIds` / `defaultCollapsedIds` / `onCollapsedChange` | ids / ids / function | — | The collapsed widgets |
| `height` | `fill` \| `content` \| number | `fill` | The shared height prop |
| `size`, `priority`, `minWidth`, `minHeight`, `label` | | | The slot props: the board is a layout child |
| `loading`, `empty`, `error`, `onRetry`, `retryLabel` | | | The shared data states |
| `skeletonItems` | number | 6 | |
| `collapseAllLabel` / `expandAllLabel` | string | English text | |
| `aria-label` | string | "Widgets" | Names the list |

`WidgetBoard.Widget` takes the props of `Card`, plus `id` (required) and `span` (columns, default 1); it is `collapsible` unless told otherwise.

### 3. Parts

`toolbar`, `collapseAll`, `skeleton`. `collapseAll` receives `{ allCollapsed, onPress, children }`.

### 4. Blocks

`WidgetBoard.Root`, `WidgetBoard.Toolbar`, `WidgetBoard.CollapseAll`, `WidgetBoard.Grid`, `WidgetBoard.Item`, `WidgetBoard.Widget`. `Item` takes `span` and, with an `id`, hands its child `{ collapsed, onCollapsedChange }` through a function child, for a card composed from `Card.Root` by hand.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The board narrows | Fewer columns: as many as fit at `minColumnWidth`; a `span` wider than the board is cut to its width |
| 2 | Narrower than one column | One column, as wide as the board; each card then shrinks by its own rules |
| 3 | The cards are taller than the board | The board scrolls inside (thin thumb, no track) |

**The one layout where a card hugs its content.** Everywhere else a card fills its slot and its body scrolls; here each card is as tall as its header plus its content, and it is the board that scrolls (`plan/layout.md`, sizing rules).

The number of columns is a function of the board's width alone: the room for the scroll thumb is always kept, so a thumb that comes or goes cannot change the count, and a resize never flips it.

## Interaction and accessibility

- The grid is a list (`role="list"`, named by `aria-label`) and each cell a list item, so a screen reader hears how many widgets there are. Each card stays a region named by its title.
- **Order.** The items are in the page in source order, and that is the tab and reading order. Each is placed in the first free place from the top, leftmost first ("shortest column"): the first row reads left to right in source order, and further down a card sits where there is room. So the order on screen is close to the source order, never the reverse of it, and no card is moved in the page.
- The caret of each card is the `Card`'s own: a button with `aria-expanded`.
- "Collapse all" becomes "Expand all" when every widget is collapsed. It is one button whose name changes, and it keeps the focus.
- **Motion.** A collapse or expand by a caret animates that card's height (the `Card`'s own animation, 180ms), and the cards under it follow frame by frame. A card that changes column does so at once. "Collapse all", a resize, a change of `collapsedIds` by the app and everything under reduced motion are instant.
- Loading sets `aria-busy` and shows skeleton cards in the grid.
- The board starts a new layout context: a `Stack` around it does not count or collapse its cards.
- When the content has no focusable element the scroll area is a tab stop (the `ScrollArea` rule).

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **It scrolls inside itself; no drag to reorder** (Milestone 2, decision 10).
- **Placement by a CSS grid with dense packing, not CSS columns.** CSS columns keep the page order but read down each column, re-balance every column when one card collapses, and cannot span. A grid of 1px rows, where each item spans its measured height, gives the "shortest column" placement with the items untouched in the page, and `span` for free. The cost: heights are measured (one `ResizeObserver`), and the placement is not strictly row by row.
- **`span`** is the fuller option and is in.
- **Both `minColumnWidth` and `columns`.**
- **Widgets are identified by `id`** on `WidgetBoard.Widget`; the board's state is `collapsedIds` with `onCollapsedChange` (decision 07).
- **No animated change of column**: only the vertical movement is animated, by the pressed card's own height animation. Recorded as weaker than a full animated reflow.
