# DataTable

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Rows and columns of data that fill their slot and scroll inside it: a ranking, a list of people or orders, a sheet of numbers. It sorts, selects, groups, pins columns, and hides columns by priority as it narrows.

## Not for

- Rows without columns or column headers: use `List`.
- A few labels with their values: use `KeyValueList`.
- Laying out a form or a page in a grid: use `Columns` and `Stack`.
- Letting the end user choose, reorder or resize columns, or save views: out of scope by decision (`plan/components.md`).
- Editing values in place like a spreadsheet: cells can hold controls, but there is no cell editing model.

## Evidence

About 30 of the 40 screenshots. Best: 18 and 9 (dense rows with tags, pills, bars, selects and checkboxes), 19 and 32 (rankings: edge stripes for zones, one row marked as the user's), 31 (group header rows with a count, a sort arrow in the header), 16 (headers that span columns, buttons in cells), 6 and 23 (group labels, a summary row, a selected row with a full-width fill), 5 and 17. Seen everywhere: sentence-case muted headers with no fill, numbers aligned under their headers, faint stripes or hairline dividers, rows of 22 to 34px. No pinned column appears in the evidence; pinning is the library's own answer to "the page never scrolls". The table in `plan/reference/index.html` ("Ranking") is the look.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `caption` | the table's name | read by assistive technology; shown with `showCaption` |
| `header` | the header rows: an optional row of spanning headers (`columnGroups`), then one `headerCell` per column | shown; sticks to the top |
| `headerCell` | label, and in a sortable column a button with the `sortIndicator` | |
| `row` | one `cell` per column; with selection a checkbox cell first; with hidden columns a disclosure cell | |
| `groupHeader` | a group's caret, title, count, `meta` and aggregate cells | with `groupBy`; sticks below the header |
| `detail` | the labels and values of the hidden columns, under an expanded row (a `KeyValueList`) | with `expandableHidden` |
| `footer` | one summary cell per column | when a column has a `footer`; sticks to the bottom |
| `skeleton` | the placeholder in each cell of a skeleton row | while `loading`, and one row while `loadingMore` |
| `empty` / `error` | the empty or error state (an `EmptyState`), below the header | when there are no rows, or `error` is set |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `selectionMode` | `none`, `single`, `multiple` | adds the checkbox column; `multiple` adds the header checkbox |
| `striped` | boolean | a faint fill on every other row (counted inside each group) |
| `dividers` | boolean | a line under every row (default on) |
| `virtualize` | `auto`, `true`, `false` | `auto`: above 200 rows, unless a column wraps |
| column `align` | `start`, `center`, `end` | numbers default to `end` with tabular figures |
| column `pin` | `start`, `end` | the column sticks while the table scrolls sideways |
| column `wrap` | boolean | default: one line, cut with an ellipsis |

States: `loading`, empty, error, `loadingMore`; per row: hover, pressed, selected, highlighted, accent, disabled, expanded; per header: unsorted, ascending, descending; per group: collapsed; per cell: focus, changed (`highlightChanges`).

## Customisation

### 1. Tokens

`--umbra-table-row-height`, `--umbra-table-header-height`, `--umbra-table-cell-padding-x`, `--umbra-table-edge-padding-x`, `--umbra-table-font`, `--umbra-table-color`, `--umbra-table-row-bg`, `--umbra-table-stripe-bg`, `--umbra-table-hover-bg`, `--umbra-table-selected-bg`, `--umbra-table-highlight-bg`, `--umbra-table-highlight-marker`, `--umbra-table-stripe-width`, `--umbra-table-border-color`, `--umbra-table-pin-border-color`, `--umbra-table-header-bg`, `--umbra-table-header-color`, `--umbra-table-header-active-color`, `--umbra-table-header-group-color`, `--umbra-table-header-font`, `--umbra-table-header-border-color`, `--umbra-table-footer-bg`, `--umbra-table-detail-bg`, `--umbra-table-caption-color`, `--umbra-table-change-up`, `--umbra-table-change-down`, `--umbra-table-change-neutral`. Group header rows read the tokens of `GroupHeader` (`--umbra-group-header-bg`, `-color`, `-font`, `-height`). The row height follows the density level (`density-table-row`: 22 / 26 / 32px).

Every fill is opaque, mixed into the surface below (`--umbra-table-row-bg`, by default the card's own fill), because pinned cells and the sticky header must cover what scrolls under them.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `data` | `Row[]` | required | The rows |
| `getRowId` | `(row) => string` | required | A stable id: selection, highlight, focus and change highlighting are kept by it |
| `columns` | `DataTableColumn<Row>[]` | required | See below |
| `columnGroups` | `{ id, header, columns }[]` | — | Headers that span neighbouring columns |
| `sort` / `defaultSort` / `onSortChange` | `{ id, direction }[]` | `[]` | Controlled or uncontrolled sort order |
| `multiSort` | boolean | `false` | Shift+click or Shift+Enter adds a column to the sort |
| `manualSorting` | boolean | `false` | The rows arrive sorted; the table reports the sort and does not reorder |
| `selectionMode` | see above | `none` | |
| `selectedIds` / `defaultSelectedIds` / `onSelectionChange` | `string[]` | `[]` | Controlled or uncontrolled selection, as plain arrays of ids |
| `selectRowLabel` / `selectAllLabel` | function / string | English text | Names of the checkboxes |
| `highlightedRowIds` / `rowHighlight` | `string[]` / `(row) => boolean` | — | Rows with a stronger fill, bold text and an edge marker |
| `highlightLabel` | string | "Highlighted" | What assistive technology hears for such a row |
| `rowAccent` | `(row) => { color, label }` | — | A coloured edge stripe; `label` is required, so it is never colour alone |
| `striped` / `dividers` | boolean | `false` / `true` | |
| `onRowAction` | `(row) => void` | — | Enter, a double click, or a single click when rows cannot be selected |
| `rowHref` | `(row) => string` | — | The row's header cell holds a real link; activating the row follows it |
| `isRowDisabled` | `(row) => boolean` | — | Dimmed; neither selected nor activated |
| `groupBy` | key or `(row) => string` | — | Groups the rows under header rows |
| `groups` | `{ key, title, meta }[]` | — | Titles and order of the groups; listed groups show even when empty |
| `collapsibleGroups` | boolean | `false` | A caret on every group header row |
| `collapsedGroups` / `defaultCollapsedGroups` / `onCollapsedGroupsChange` | `string[]` | `[]` | Controlled or uncontrolled collapse, as group keys |
| `stickyGroups` | boolean | `true` | Group rows stick below the header |
| `onHiddenColumnsChange` | `(ids) => void` | — | The columns hidden for lack of width |
| `expandableHidden` | boolean | `false` | Each row can show its hidden columns under it |
| `loading` / `empty` / `error` / `onRetry` / `retryLabel` | the shared data states | empty text "No rows" | |
| `skeletonRows` | number | 8 | |
| `height` | `fill`, `content`, number | `fill` | `fill` takes the height of the parent and falls back to the content's height where the parent has none (flowing content, a popover, a modal body, an accordion panel). `content` is always as tall as the content. A number is pixels. A content-sized table renders every row (no virtualisation) and its header scrolls away with the page around it. |
| `loadingMore` / `loadingMoreLabel` / `onReachEnd` | boolean / string / function | | Incremental loading |
| `virtualize` | see above | `auto` | |
| `highlightChanges` | boolean or column ids | `false` | A changed value flashes once |
| `increasedLabel` / `decreasedLabel` | string | "increased" / "decreased" | Read with the sign of a changed value |
| `caption` / `showCaption` | node / boolean | — / `false` | Names the table |
| `aria-label` / `aria-labelledby` | string | — | Names the table when there is no caption |
| `collapseGroupLabel`, `expandGroupLabel`, `showDetailsLabel`, `hideDetailsLabel` | string | English text | Names of the carets |

A column (`DataTableColumn<Row>`):

| Field | Type | Default | Purpose |
|---|---|---|---|
| `id` | string | required | |
| `header` / `headerLabel` | node / string | — | The header; `headerLabel` is its text when the header is not text |
| `description` | string | — | Read after the header by assistive technology (no tooltip) |
| `tooltip` | string | — | A hint for the header, in a tooltip on hover and keyboard focus; also read after the header unless `description` is set |
| `hideHeader` | boolean | `false` | The header stays for assistive technology only |
| `accessor` | key or `(row) => value` | — | The value: sorts, and renders when there is no `cell` |
| `cell` | `(row, context) => node` | the value as text | `context`: `value`, `text`, `rowId`, `rowIndex`, `selected`, `highlighted`, `disabled` |
| `format` | `(value, row) => string` | `String` | The value as text: the cell, its tooltip, `context.text` |
| `align` / `numeric` | see above / boolean | by the first row's value | |
| `width` | px, or `{ min, max, flex }` | `{ min: 96, flex: 1 }` | A number is a fixed width |
| `priority` | number or `always` | 0 | Higher stays longer |
| `sortable` / `sortFn` / `sortDescFirst` | boolean / `(a, b) => number` / boolean | | |
| `wrap` | boolean | `false` | |
| `pin` | `start`, `end` | — | |
| `footer` | node or `(rows) => node` | — | The summary cell |
| `aggregate` | `(rows) => node` | — | The cell in each group header row |
| `rowHeader` | boolean | `false` | Its cells are the headers of their rows |

Helpers: `numberColumn(column)` (end-aligned, tabular, 80px, largest first) and `actionsColumn({ cell, menu, onMenuAction, menuLabel })` (pinned to the end, never hidden, header for assistive technology only; `cell` returns buttons, `menu` returns the rows of a `Menu` opened by a "more" button). There is no helper per widget: a cell renderer returns the widget.

### 3. Parts

`header`, `headerCell`, `sortIndicator`, `row`, `cell`, `groupHeader`, `detail`, `footer`, `skeleton`, `empty`, `error`. Each accepts a node, `null` or a function receiving the default part's props. `row` and `cell` also receive the data `row` (and `column`).

### 4. Blocks

`DataTable.Root`, `DataTable.Header`, `DataTable.HeaderCell`, `DataTable.SortIndicator`, `DataTable.Body`, `DataTable.Row`, `DataTable.Cell`, `DataTable.GroupRow`, `DataTable.Footer`. A table composed from them is a grid with the same keyboard; sorting, selection and widths are then the app's (`Row` takes `onAction` and `onSelect`; `Root` takes `width` and a `<colgroup>`).

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | A column narrower than its content | Text is cut with an ellipsis; while it is cut, hover or keyboard focus shows the full text in a tooltip. Widgets follow their own rules |
| 2 | The columns do not fit at their minimum widths | Columns hide one at a time: lowest `priority` first, equal priorities from the end of the source order. They return, in reverse, when there is room. With `expandableHidden` a disclosure column appears and each row can show its hidden columns under it |
| 3 | Only `always` columns are left and still do not fit | The table scrolls sideways inside its slot; pinned columns stay in view |
| 4 | Rows taller than the slot | The body scrolls; header, group rows and footer stick |
| 5 | Empty or error state larger than the slot | It follows `EmptyState` |

How step 2 is decided: the width of the scroll area is measured (a `ResizeObserver`, applied before paint), and `fitColumns` (`src/table/logic.ts`, unit-tested) returns the hidden columns and every width. Column widths come from the column definitions, never from the content, so the answer depends on the available width alone: it cannot oscillate at a threshold, is right after one large resize, and does not change when a font loads. The vertical scrollbar always keeps its room, so it cannot change the width either. Spare width goes to the flexible columns by `flex` up to `max`; what is left over is shared evenly, so rows always span the full width.

## Interaction and accessibility

Markup: a real `<table>` with `role="grid"`, `<th scope="col">` headers (`columnheader`, with `aria-sort`), `<th scope="row">` for `rowHeader` columns, `aria-rowcount`, `aria-colcount`, `aria-rowindex` and `aria-colindex`. A table, not a grid of `div`s: virtualisation only needs spacer rows, and sticky cells work on table cells.

Keyboard (the decided model):

- **One tab stop.** The focused cell is the tab stop; controls inside cells are not in the tab order. Leaving and returning lands on the same cell.
- **Arrow keys** move the focused cell, through header rows, group rows, detail rows and the footer. **Home / End**: first / last cell of the row. **Ctrl or Cmd + Home / End**: first / last cell of the table. **PageUp / PageDown**: one page of rows.
- **Headers**: Enter or Space on a sortable header cycles its sort (ascending, descending, unsorted; a `sortDescFirst` column starts descending). Shift+Enter adds it to a multiple sort.
- **Body cells**: Space toggles the row's selection. Enter is the row action; in a cell with exactly one control, Enter (and Space, when rows cannot be selected) is forwarded to it; in a cell with several, Enter or F2 moves focus to the first, Tab and Shift+Tab move among them, and Escape (or F2) returns to the cell. From a button, link or checkbox focused by a click, the arrow keys still move through the grid.
- **Shift + Arrow Up / Down** extends the selection from the row where it started. **Shift+click** selects a range from the last row toggled.
- **Group rows**: Enter or Space works the caret, a button with `aria-expanded` (in a grid, unlike a tree grid, a row cannot carry it).
- **Right to left**: Left and Right follow what is seen.
- No type-ahead.

Focus: the ring is drawn inside the cell (never violet). The focused cell is scrolled into view clear of the sticky header, group row, footer and pinned columns. It is remembered as row id and column id, so it follows its row through a sort and through virtualised scrolling; when its column hides it moves to the nearest column of the same row; when the focused element is removed by a render, focus returns to the cell instead of being lost.

Mouse: a click on a row selects it (toggle; Shift for a range), or activates it when rows cannot be selected; a double click activates a selectable row. Clicks on controls inside the row, and a click that ends a text selection, are not the row's.

Selection: rows have `aria-selected`; the grid has `aria-multiselectable`. Selected rows show the violet fill and the checked box. The header checkbox is "some" (indeterminate) between none and all.

Not colour alone: the sort direction is the arrow's shape; a highlighted row is also bold, has an edge marker and a hidden `highlightLabel`; an accent stripe has its required `label` as hidden text (pair it with a `Legend` for sighted users); a changed value shows ▲ or ▼ with hidden text.

Tooltips: one tooltip serves the whole table, in the look of `Tooltip`. It shows a header's `tooltip`, and the full text of a plain-text cell while that text is cut; after 500ms of hover, at once on keyboard focus, and it goes on scroll, press or blur. Nothing is mounted per cell.

Data states: `loading` sets `aria-busy` and shows skeleton rows in the real columns, hidden from assistive technology. The error state is an `alert`. `loadingMore` is announced through a `status` region.

Virtualisation: only the rows in view (plus 8 on each side) are rendered, between two spacer rows; row heights are read from the rendered rows, so density and tokens are followed, and all rows are assumed equally tall (detail rows are measured one by one). The row that holds the tab stop and the header of the group at the top stay rendered outside the window.

`highlightChanges`: when a cell's value changes for the same row id, the cell flashes once (1.2s, fading): green with ▲ for a larger number, red with ▼ for a smaller one, neutral without a sign otherwise. The sign stays 4s. With reduced motion there is no flash, only the sign. Numbers are never counted up.

## Open questions

None.

Resolved 2026-10-11:

- **`height`**, shared with `List` and the charts (`src/internal/height.ts`). The table used to be zero pixels tall in a parent without a height (flowing content in a card body, a popover, an accordion panel). The scrolling area now starts from the height of its rows (`flex: 1 1 auto`), which only counts where there is no height to fill; with one, it grows or shrinks to it and scrolls inside as before. Two tables can flow one after another in one scrolling card body.

Resolved 2026-10-10:

- **A real `<table>`**, also when virtualised: spacer rows keep the scroll height, so an ARIA grid on `div`s was not needed.
- **Engine**: TanStack Table 9 (`@tanstack/react-table`) for sorting, the grouped row model, selection state and column visibility. No type of it is public. Group order is the table's own (listed groups, then first appearance), because the engine would reorder groups by the sorted column.
- **Column widths come from the definitions** (`width` in pixels or `{ min, max, flex }`), not from the content. This is what makes priority hiding exact and stable, and keeps columns still while a virtualised table scrolls.
- **Row ids are strings.** Selection, highlight and collapse are plain arrays of strings.
- **`rowAccent` returns `{ color, label }`** instead of a separate `accentLabel` prop, so the label cannot be forgotten.
- **Accent wins the edge**: a highlighted row with an accent shows the accent stripe; the highlight keeps its fill, bold text and label.
- **A single click activates a row only when rows cannot be selected** (as in `List`); otherwise a click selects, and Enter or a double click activates.
- **The checkbox column is always shown when selection is on**, in `single` too (without the header checkbox). `selectionColumn` was not needed as a helper.
- **`groups` lists titles and order; `groupBy` assigns rows.** Aggregates are per column (`aggregate`); the first column holds the group's title and cannot have one.
- **Group rows do not push each other out**: each sticks below the header and is covered by the next.
- **Expanded detail rows are uncontrolled** (no prop for which rows are open).
- **`virtualize="auto"` starts above 200 rows** and is off when a column wraps; a virtualised table needs rows of one height.
- **Escape returns from a control to its cell even when a tooltip is open on it**; a control with `aria-expanded="true"` keeps Escape for itself. A menu opened from a cell closes first, focus returns to its button, and the next Escape returns to the cell.
- **One shared tooltip, not a `Tooltip` per cell**: `Tooltip` needs an element with a widget role as its trigger (a header cell or row header is not one) and one trigger per cell would cost thousands of components. The table opens React Aria's tooltip against the cell itself and reuses the styles of `Tooltip`.
- **Focus is taken back only when it is nowhere** (the focused element was removed): focus that moved to a menu or dialog opened from a cell is left alone.
- **Ctrl+Home goes to the first header cell** and does not scroll the body; the next Arrow Down goes to the first row.
- **`wrap` only**; there is no separate `truncate` option (truncation is the default).
- **Not a layout child** (no `size` or `priority` of its own): it goes in a `Card` with `padding="none"`, or any element with a height.
- **The visual tests run with overlay scrollbars**; the layout was also checked with classic scrollbars that take room.
