# List

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A vertical list of rows that scrolls inside its slot, with optional groups, selection and row actions: an inbox, a list of people, a leaderboard.

## Not for

- Rows with columns, sorting or column headers: use `DataTable`.
- Choosing a value in a form: use `Select` or `Radio`.
- A list of commands: use `Menu`.
- Navigation between pages: use `VerticalNav`.

## Evidence

Inbox with date groups, one selected message and a detail pane beside it (13–16, 25). Two-sided rows mirrored around a centre box, and a ring beside a title and a paragraph (24, 30, 33; 8): the catalog's "FixtureRow" and "MediaObject", which are the `pair` variant and `descriptionLines` of `ListItem`. Message lists on overview pages (1, 2, 27, 28, 30). Person lists (14). Leaderboards: grouped, three rows per group, a value on the right (24, 27, 29). The reference screen (`plan/reference/index.html`, "Inbox") is the look.

## Anatomy

| Part | Content | Default |
|---|---|---|
| rows | `List.Item` (a `ListItem`) | from `items` + `renderItem`, or children |
| groups | `List.Group`: a `GroupHeader` and its rows | from `groups`, or children |
| `skeleton` | one skeleton row, repeated `skeletonRows` times | shown while `loading` |
| `state` | the empty or error state (an `EmptyState`, which carries `data-part="empty"` or `"error"`) | shown when empty or in error |
| `loadingMore` | a skeleton row after the last row | shown when `loadingMore` |

Each row element carries `data-part="row"` and each group's header row `data-part="groupHeader"`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `selectionMode` | `none`, `single`, `multiple` | |
| `selectionBehavior` | `toggle`, `replace` | `replace` when `onAction` is set, otherwise `toggle` |
| `dividers` | boolean | a line under every row (default on) |
| `striped` | boolean | a faint fill on every other row, at `--umbra-state-stripe-strength`, as in `DataTable` and `KeyValueList` |
| `numbered` | boolean | the row's position before its content, for a ranking |
| `itemVariant` / `itemSize` | as `ListItem` | default look of every row and of the skeleton rows |

States: `loading`, empty, error, `loadingMore`; per row: hover, pressed, selected, focus, disabled.

## Customisation

### 1. Tokens

`--umbra-list-divider-color`, `--umbra-list-stripe-bg`, `--umbra-list-number-width`, and the tokens of `ListItem` and `GroupHeader`. Row height comes from the density level (`density-list-row`). The stripe is drawn on the row around the item, so `--umbra-list-item-bg` stays the app's: set on the list or any ancestor it reaches every item, striped or not.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` / `renderItem` | array / function | — | Rows as data; `renderItem` returns a `List.Item` |
| `groups` | array of `{ key, items, …GroupHeader props }` | — | Grouped rows as data |
| `children` | `List.Item`, `List.Group` | — | Rows as elements |
| `selectionMode` | see above | `none` | |
| `selectedIds` / `defaultSelectedIds` / `onSelectionChange` | id array / id array / function | — | Controlled or uncontrolled selection, as plain arrays of keys |
| `selectionBehavior` | see above | see above | |
| `disallowEmptySelection` | boolean | on with `replace` | The user cannot deselect the last selected row |
| `onAction` | function (key) | — | A row was activated |
| `dividers` / `striped` / `numbered` | boolean | `true` / `false` / `false` | |
| `itemVariant` / `itemSize` | see above | — | |
| `stickyHeaders` | boolean | `true` | Group headers stick while their group scrolls |
| `loading` / `empty` / `error` / `onRetry` / `retryLabel` | the shared data states (see `EmptyState.md`) | empty text "No items" | |
| `skeletonRows` | number | 6 | |
| `height` | `fill`, `content`, number | `fill` | `fill` takes the height of the parent and falls back to the content's height where the parent has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content. A number is pixels.  |
| `onReachEnd` | function | — | The list was scrolled to its end |
| `loadingMore` / `loadingMoreLabel` | boolean / string | `false` / "Loading more" | |
| `aria-label` / `aria-labelledby` | string | — | Names the list; one is required |

`List.Item` takes the props of `ListItem` (except `selected`), plus `id` (the key, required) and `textValue`; its `children` replace the row's content, and as a function they receive `{ selected, disabled, interactive }` to pass to `ListItem.Root`. `List.Group` takes the props of `GroupHeader`, or `header` to replace it.

### 3. Parts

`skeleton`, `state`, `loadingMore`.

### 4. Blocks

`List.Root`, `List.Item`, `List.Group`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Rows narrower than their content | Each row follows `ListItem`: text truncates; `trailing`, `description`, then `meta` hide |
| 2 | Group header narrower than its content | It follows `GroupHeader`: `meta` hides, then the title truncates |
| 3 | Rows taller than the slot | The list scrolls inside its slot; group headers stick, and cover the rows under them (a `plain` header takes the card's surface while it is in a list with sticky headers). A row brought into view by the arrow keys stops below the stuck header (`scroll-margin-top` of one header height). |
| 4 | Empty or error state larger than the slot | It follows `EmptyState`: the icon hides, then the description |

## Interaction and accessibility

- Built on React Aria's `GridList`, which allows controls inside rows. The list is a `grid`, rows are `row`s, a group is a `rowgroup` named by its header.
- Tab enters the list at one row (the selected row, or the row that last had the focus). Arrow up and down move between rows, `Home` and `End` go to the first and last, typing letters goes to the row whose `textValue` matches. Left and right arrows move into and out of the controls of a row.
- **Group headers with controls are stops of the list.** A header that holds a caret or actions is reached with the up and down arrows, in its place between the rows: the focus lands on its first control (the caret). Left and right move between the controls of that header, following the reading direction. `Enter` and `Space` press the control; collapsing a group keeps the focus on its caret, also when the focused row was inside the group. A collapsed group's header stays a stop. `Tab` and `Shift+Tab` walk the header controls and the list's one row stop in the order they are shown, and leave the list after the last one. A header with no control is passed over, and a list without header controls is one tab stop, as before.
- `toggle`: a click or `Space` toggles a row. `replace`: a click selects only that row, selection follows the arrow keys, `Space` selects, and `Ctrl`/`Shift` extend a multiple selection. `Ctrl+A` selects all rows in `multiple`.
- `onAction`: `Enter`, or a double click; a single click when nothing can be selected.
- Selected rows have `aria-selected`, the violet fill and the edge stripe (the cue that is not colour; its contrast is in `ListItem.md`). The focus ring is drawn inwards. A disabled row has the default cursor.
- `loading` sets `aria-busy` on the root and shows skeleton rows in the layout of the final rows. The error state has `role="alert"`. The `loadingMore` row is a `status` named by `loadingMoreLabel`.
- The grid carries `aria-label` / `aria-labelledby`. While there is no grid (loading, empty, error) the root is a `group` with the same name, so the name is never lost.
- A group is a `rowgroup` named by its title alone ("Today"), not by the whole header, whose text would start with the caret's name.
- After Retry, and whenever an empty or error state that held the focus goes away, the focus moves to the list's row stop (plan/interaction.md, "Loading, empty, error").
- The numbers of a `numbered` list are generated by CSS from the row order.

## Open questions

None.

Resolved 2026-10-11 (review fixes):

- **Header controls are part of the keyboard model** (review B1). They were plain tab stops that React Aria's grid skipped, so no key reached them while a row was shown. The rule is under "Interaction and accessibility". Both ways in were asked for: the arrows, as for any stop of a composite, and Tab, because a caret is a control a keyboard user looks for with Tab. The cost is that Tab no longer leaves a list with collapsible groups in one press from a row above them; `Shift+Tab`, or Tab from the last stop, leaves it.
- **Entering the list always lands on a row** when there is one: React Aria moves a focus that enters on a header control to the row stop. With no row shown (every group collapsed), Tab reaches the carets directly.
- **A Shift range can shrink again** (found while testing `multiple` with `replace`, review B22). The selection is given to React Aria as an array, which dropped the row a range started from: `Shift+ArrowDown` twice and `Shift+ArrowUp` kept three rows. The list now hands back the selection object React Aria reported for as long as the app's ids match it.
- **`single` selection: the stripe is the second cue, and it now has 3:1** (review B2; numbers in `ListItem.md`). No check mark was added: a mark at the trailing edge competes with `meta` and `trailing`, and the stripe is a shape, not a colour.
- **The catalog's FixtureRow and MediaObject** (review B9) are `ListItem`'s `pair` variant and `descriptionLines`; see `ListItem.md`.
- The callback stays `onSelectionChange` (plan/decisions/07-customisation.md: the callback of an ids list names the idea).
- Sample data: the inbox titles of the stories were rewritten so none reads as adapted from the source's inbox.

Resolved 2026-10-11:

- **`height`**, shared with `DataTable` and the charts (`src/internal/height.ts`): the same values and the same fallback.

- 2026-10-11: the type of a row's id is `ListId` (it was `ListKey`): rows are identified by `id`, and the selection props are `selectedIds`.
- 2026-10-11: **a selected row that leaves the list stays selected.** The selection is the app's (or the list's own, when uncontrolled): it is not moved to another row and nothing is reported. With `replace`, selection follows focus in React Aria. A list that removes the selected row (a filter on "unread") lost focus to the list itself, which selected the row focus fell on; that row left too, and the row that slid under the pointer was selected again when the button was released. One press of the pointer now changes the selection once, at most (`Data/List > Removed on selection`, tested with the mouse and the keyboard). With the keyboard, focus moves to the next row and the selection does not.

Resolved 2026-10-10:

- `GridList`, not `ListBox`: a `ListBox` option cannot hold buttons or links.
- `replace` is the default with `onAction`, because with `toggle` a click on a row activates it and the mouse cannot select. `replace` also turns on `disallowEmptySelection`, otherwise the second click of a double click deselects the row.
- `renderItem` returns a `List.Item` element (not `ListItem` props), so a row can be anything.
- `itemVariant` and `itemSize` were added so the skeleton rows match the rows, and rows need not repeat them.
- `List` is not a layout child (no `size` or `priority`): it goes in a `Card` with `padding="none"`, or any element with a height.
- In `multiple` every row shows a `Checkbox` (`size="small"`) at the start of its `leading`, before an avatar or icon, so the selection is not carried by the fill alone; the fill and the stripe stay. It is the row's selection control in React Aria's grid list: named after the row, not a tab stop of its own, toggled by a click or by `Space` on the row. A row drawn by hand (function `children`) receives it as `selectionControl`. `single` rows keep the fill and stripe only (revisited 2026-10-11: the stripe was under 3:1 and is now a lighter violet).
- No virtualisation: every row is rendered. To add (React Aria's `Virtualizer`) when lists pass a few thousand rows.
- No drag and drop.
