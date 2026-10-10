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

Inbox with date groups, one selected message and a detail pane beside it (13–16, 25). Message lists on overview pages (1, 2, 27, 28, 30). Person lists (14). Leaderboards: grouped, three rows per group, a value on the right (24, 27, 29). The reference screen (`plan/reference/index.html`, "Inbox") is the look.

## Anatomy

| Part | Content | Default |
|---|---|---|
| rows | `List.Item` (a `ListItem`) | from `items` + `renderItem`, or children |
| groups | `List.Group`: a `GroupHeader` and its rows | from `groups`, or children |
| `skeleton` | one skeleton row, repeated `skeletonRows` times | shown while `loading` |
| `state` | the empty or error state (an `EmptyState`) | shown when empty or in error |
| `loadingMore` | a skeleton row after the last row | shown when `loadingMore` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `selectionMode` | `none`, `single`, `multiple` | |
| `selectionBehavior` | `toggle`, `replace` | `replace` when `onAction` is set, otherwise `toggle` |
| `dividers` | boolean | a line under every row (default on) |
| `striped` | boolean | a faint fill on every other row |
| `numbered` | boolean | the row's position before its content, for a ranking |
| `itemVariant` / `itemSize` | as `ListItem` | default look of every row and of the skeleton rows |

States: `loading`, empty, error, `loadingMore`; per row: hover, pressed, selected, focus, disabled.

## Customisation

### 1. Tokens

`--umbra-list-divider-color`, `--umbra-list-stripe-bg`, `--umbra-list-number-width`, and the tokens of `ListItem` and `GroupHeader`. Row height comes from the density level (`density-list-row`).

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
| 3 | Rows taller than the slot | The list scrolls inside its slot; group headers stick |
| 4 | Empty or error state larger than the slot | It follows `EmptyState`: the icon hides, then the description |

## Interaction and accessibility

- Built on React Aria's `GridList`, which allows controls inside rows. The list is a `grid`, rows are `row`s, a group is a `rowgroup` named by its header.
- One tab stop. Arrow up and down move between rows, `Home` and `End` go to the first and last, typing letters goes to the row whose `textValue` matches. Left and right arrows move into and out of the controls of a row.
- `toggle`: a click or `Space` toggles a row. `replace`: a click selects only that row, selection follows the arrow keys, `Space` selects, and `Ctrl`/`Shift` extend a multiple selection. `Ctrl+A` selects all rows in `multiple`.
- `onAction`: `Enter`, or a double click; a single click when nothing can be selected.
- Selected rows have `aria-selected`, the violet fill and the edge stripe. The focus ring is drawn inwards.
- `loading` sets `aria-busy` on the root and shows skeleton rows in the layout of the final rows. The error state has `role="alert"`. The `loadingMore` row is a `status` named by `loadingMoreLabel`.
- Group headers are not rows: the arrow keys pass over them. Their caret and actions are ordinary tab stops.
- The numbers of a `numbered` list are generated by CSS from the row order.

## Open questions

None.

Resolved 2026-10-11:

- **`height`**, shared with `DataTable` and the charts (`src/internal/height.ts`): the same values and the same fallback.

Resolved 2026-10-10:

- `GridList`, not `ListBox`: a `ListBox` option cannot hold buttons or links.
- `replace` is the default with `onAction`, because with `toggle` a click on a row activates it and the mouse cannot select. `replace` also turns on `disallowEmptySelection`, otherwise the second click of a double click deselects the row.
- `renderItem` returns a `List.Item` element (not `ListItem` props), so a row can be anything.
- `itemVariant` and `itemSize` were added so the skeleton rows match the rows, and rows need not repeat them.
- `List` is not a layout child (no `size` or `priority`): it goes in a `Card` with `padding="none"`, or any element with a height.
- In `multiple` every row shows a `Checkbox` (`size="small"`) at the start of its `leading`, before an avatar or icon, so the selection is not carried by the fill alone; the fill and the stripe stay. It is the row's selection control in React Aria's grid list: named after the row, not a tab stop of its own, toggled by a click or by `Space` on the row. A row drawn by hand (function `children`) receives it as `selectionControl`. `single` rows keep the fill and stripe only.
- No virtualisation: every row is rendered. To add (React Aria's `Virtualizer`) when lists pass a few thousand rows.
- No drag and drop.
