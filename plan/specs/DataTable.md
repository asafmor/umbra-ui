# DataTable

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Rows and columns of data that fill their slot and scroll inside it: a ranking, a list of people or orders, a sheet of numbers. It sorts, selects, groups, pins columns, and hides columns by priority as it narrows. The end user can show, hide, reorder, pin and resize the columns; the app saves that choice if it wants to.

## Not for

- Rows without columns or column headers: use `List`.
- A few labels with their values: use `KeyValueList`.
- Laying out a form or a page in a grid: use `Columns` and `Stack`.
- Named, saved views of a table, and storing the user's columns: the table is controlled (`columnState`) and ships no storage. The app saves the value where it likes (`docs/recipes.md`, "Remember a user's columns").
- Editing values in place like a spreadsheet: cells can hold controls, but there is no cell editing model.

## Evidence

About 30 of the 40 screenshots. Best: 18 and 9 (dense rows with tags, pills, bars, selects and checkboxes), 19 and 32 (rankings: edge stripes for zones, one row marked as the user's), 31 (group header rows with a count, a sort arrow in the header), 16 (headers that span columns, buttons in cells), 6 and 23 (group labels, a summary row, a selected row with a full-width fill), 5 and 17. Seen everywhere: sentence-case muted headers with no fill, numbers aligned under their headers, faint stripes or hairline dividers, rows of 22 to 34px. No pinned column appears in the evidence; pinning is the library's own answer to "the page never scrolls". The table in `plan/reference/index.html` ("Ranking") is the look.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `caption` | the table's name | read by assistive technology; shown with `showCaption`. Set by the `caption` prop, which takes any node: it is not in `parts`, because it is the table's accessible name and must not be hidden |
| `header` | the header rows: an optional row of spanning headers (`columnGroups`), then one `headerCell` per column | shown; sticks to the top |
| `headerCell` | label, and in a sortable column a button with the `sortIndicator` | |
| `row` | one `cell` per column; with selection a cell first that holds a checkbox (`multiple`) or a radio (`single`); with hidden columns and `expandableHidden` a disclosure cell | |
| `hiddenIndicator` | the content of the columns button: how many columns are not shown ("+3"), or the columns icon when all are | see `columnsButton` |
| `columnsButton` | a button in a narrow column of its own at the end of the header row; it opens the `columnMenu` | `columnMenu="auto"` (default): while a column is not shown (no room, or hidden by the user), without `expandableHidden`. `columnMenu`: always. `columnMenu={false}`: never (the mark is then plain text, as before) |
| `columnMenu` | a popover that lists every column in order: a handle to move it, a checkbox to show it, "No room" when the table hid it, a pin mark; above the list "Show all" and "Reset", and a search field from 10 columns up | closed |
| `columnMenuItem` | one row of that list | |
| `headerMenuButton` | a "more" button in each column header | on hover of the header, on keyboard focus of its cell and while its menu is open; it takes no room |
| `headerMenu` | the menu of one column: sort ascending, descending, clear; move left, right; pin to start, to end, unpin; hide; resize, fit to content, reset width; "Columns…" | closed |
| `resizeHandle` | a separator on the end edge of a column header | a 2px line on hover, on focus and while dragging |
| `groupHeader` | a group's caret, title, count, `meta` and aggregate cells | with `groupBy`; sticks below the header |
| `detail` | the labels and values of the hidden columns, under an expanded row (a `KeyValueList`) | with `expandableHidden` |
| `footer` | one summary cell per column | when a column has a `footer`; sticks to the bottom |
| `skeleton` | the placeholder in each cell of a skeleton row | while `loading`, and one row while `loadingMore` |
| `empty` / `error` | the empty or error state (an `EmptyState`), below the header | when there are no rows, or `error` is set |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `selectionMode` | `none`, `single`, `multiple` | adds the selection column: a radio per row in `single`, a checkbox per row and one in the header in `multiple` |
| `striped` | boolean | a faint fill on every other row (counted inside each group) |
| `dividers` | boolean | a line under every row (default on) |
| `virtualize` | `auto`, `true`, `false` | `auto`: above 200 rows, unless a column wraps |
| column `align` | `start`, `center`, `end` | numbers default to `end` with tabular figures |
| column `pin` | `start`, `end` | the column sticks while the table scrolls sideways |
| column `wrap` | boolean | default: one line, cut with an ellipsis |

States: `loading`, empty, error, `loadingMore`; per column: shown, hidden by the user, hidden for lack of room, pinned, resized, resizing; per row: hover, pressed, selected, highlighted, accent, disabled, expanded; per header: unsorted, ascending, descending; per group: collapsed; per cell: focus, changed (`highlightChanges`).

## Customisation

### 1. Tokens

`--umbra-table-row-height`, `--umbra-table-header-height`, `--umbra-table-cell-padding-x`, `--umbra-table-edge-padding-x`, `--umbra-table-font`, `--umbra-table-color`, `--umbra-table-row-bg`, `--umbra-table-stripe-bg`, `--umbra-table-hover-bg`, `--umbra-table-selected-bg`, `--umbra-table-highlight-bg`, `--umbra-table-highlight-marker`, `--umbra-table-stripe-width`, `--umbra-table-border-color`, `--umbra-table-pin-border-color`, `--umbra-table-header-bg`, `--umbra-table-header-color`, `--umbra-table-header-active-color`, `--umbra-table-header-group-color`, `--umbra-table-header-font`, `--umbra-table-header-border-color`, `--umbra-table-footer-bg`, `--umbra-table-detail-bg`, `--umbra-table-caption-color`, `--umbra-table-change-up`, `--umbra-table-change-down`, `--umbra-table-change-neutral`, `--umbra-table-focus-offset`, `--umbra-table-control-size`, `--umbra-table-resize-color` (the line of a resize handle), `--umbra-table-drop-color` (the line that shows where a dragged column lands), `--umbra-table-column-menu-width`. The radio of `single` selection reads the tokens of `Radio` (`--umbra-radio-selected-bg`, `-border`, `-border-width`, `-bg`, `-mark-color`) and the size of the small checkbox (`--umbra-checkbox-small-size`). Group header rows read the tokens of `GroupHeader` (`--umbra-group-header-bg`, `-color`, `-font`, `-height`). The row height follows the density level (`density-table-row`: 22 / 26 / 32px).

The table gives two tokens of other components its own default for what is inside it: `--umbra-focus-offset` (inwards, because the table clips) and `--umbra-icon-button-size` (two pixels less than the row). They are private properties (`--focus-offset`, `--icon-button-size`), so the app's `--umbra-focus-offset` or `--umbra-icon-button-size`, set on any ancestor, wins; `--umbra-table-focus-offset` and `--umbra-table-control-size` change the table's defaults only. The table's opaque fills are mixed into the surface it is on: `--umbra-table-row-bg`, else `--umbra-scroll-fade-color`, else the surface's private `--scroll-fade-color` (2026-10-11).

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
| `selectRowLabel` / `selectAllLabel` | function / string | English text | Names of the checkboxes or radios, and of the selection column |
| `highlightedRowIds` / `rowHighlight` | `string[]` / `(row) => boolean` | — | Rows with a stronger fill, bold text and an edge marker |
| `highlightLabel` | string | "Highlighted" | What assistive technology hears for such a row |
| `rowAccent` | `(row) => { color, label }` | — | A coloured edge stripe; `label` is required, so it is never colour alone: it is read before the row's first cell and shown in that cell's tooltip |
| `striped` / `dividers` | boolean | `false` / `true` | |
| `onRowAction` | `(row) => void` | — | Enter, a double click, or a single click when rows cannot be selected |
| `rowHref` | `(row) => string` | — | The row's header cell holds a real link; activating the row follows it |
| `isRowDisabled` | `(row) => boolean` | — | Dimmed; neither selected nor activated |
| `groupBy` | key or `(row) => string` | — | Groups the rows under header rows |
| `groups` | `{ key, title, meta }[]` | — | Titles and order of the groups; listed groups show even when empty |
| `collapsibleGroups` | boolean | `false` | A caret on every group header row |
| `collapsedGroups` / `defaultCollapsedGroups` / `onCollapsedGroupsChange` | `string[]` | `[]` | Controlled or uncontrolled collapse, as group keys |
| `stickyGroups` | boolean | `true` | Group rows stick below the header |
| `onHiddenColumnsChange` | `(ids) => void` | — | The columns hidden for lack of width (not those the user hid: they are in `columnState`) |
| `columnState` / `defaultColumnState` / `onColumnStateChange` | `DataTableColumnState` | `{}` | What the end user did to the columns, controlled or uncontrolled: `{ order?: string[], visibility?: Record<id, boolean>, widths?: Record<id, px>, pins?: Record<id, 'start' \| 'end' \| 'none'> }`. Plain JSON, every member optional, a missing entry means "as the app defined it". "Reset" returns to `defaultColumnState` (or `{}`), in the controlled case too |
| `columnMenu` | `auto`, boolean | `auto` | The end user's column controls: the columns button and the menu of each header. `auto` shows the button only while a column is not shown; `true` always; `false` removes the button and the header menus |
| `resizableColumns` / `reorderableColumns` | boolean | `true` | Resize handles on the headers; the handles and "move" rows of the menus |
| `columnsLabel`, `showAllColumnsLabel`, `resetColumnsLabel`, `searchColumnsLabel`, `noColumnsLabel`, `noRoomLabel`, `moveColumnLabel`, `moveUpLabel`, `moveDownLabel`, `moveLeftLabel`, `moveRightLabel`, `pinStartLabel`, `pinEndLabel`, `unpinLabel`, `hideColumnLabel`, `sortAscendingLabel`, `sortDescendingLabel`, `clearSortLabel`, `resizeColumnLabel`, `autosizeColumnLabel`, `resetWidthLabel`, `columnOptionsLabel` | string | English text | Every string of the column controls. The ones that name a control of one column are followed by the column's label ("Move Region") |
| `columnMovedLabel` / `columnWidthLabel` | `(label, position, count) => string` / `(label, px) => string` | "Region moved to position 3 of 12" / "Amount width 180 pixels" | What the live region says after a move and a resize |
| `expandableHidden` | boolean | `false` | Each row can show its hidden columns under it |
| `hiddenColumnsLabel` | `(count) => string` | "3 columns hidden" | Accessible name of the mark for hidden columns |
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
| `width` | px, `{ min, max, flex }`, or `content` | `{ min: 96, flex: 1 }` | A number is a fixed width. Pixels are written for the default density and scale with the cell font size (80 is 74px at compact, 86px at spacious). `content` is as wide as the longest text of the column and its header, counted in characters of the cell font. |
| `priority` | number or `always` | 0 | Higher stays longer |
| `sortable` / `sortFn` / `sortDescFirst` | boolean / `(a, b) => number` / boolean | | |
| `wrap` | boolean | `false` | |
| `pin` | `start`, `end` | — | The user can change it (`columnState.pins`) |
| `hideable` / `reorderable` / `resizable` | boolean | `true` | What the end user may do to this column. A column that is not `hideable` shows a checked, disabled box in the column menu |
| `minWidth` / `maxWidth` | px | 48 / 800 | The limits of a resize, in the same pixels as `width` |
| `footer` | node or `(rows) => node` | — | The summary cell |
| `aggregate` | `(rows) => node` | — | The cell in each group header row |
| `rowHeader` | boolean | `false` | Its cells are the headers of their rows |

Helpers: `numberColumn(column)` (end-aligned, tabular, 80px, largest first) and `actionsColumn({ cell, menu, onMenuAction, menuLabel })` (pinned to the end, never hidden, neither `hideable`, `reorderable` nor `resizable`, header for assistive technology only; `cell` returns buttons, `menu` returns the rows of a `Menu` opened by a "more" button). There is no helper per widget: a cell renderer returns the widget.

### 3. Parts

`header`, `headerCell`, `sortIndicator`, `hiddenIndicator`, `columnMenu`, `columnMenuItem`, `headerMenu`, `resizeHandle`, `row`, `cell`, `groupHeader`, `detail`, `footer`, `skeleton`, `empty`, `error`. Each accepts a node, `null` or a function receiving the default part's props. `row` and `cell` also receive the data `row` (and `column`). `hiddenIndicator` receives `count`, `labels` and the default `children`; `null` removes the mark and the column it stands in. `columnMenu` receives the props of `DataTable.ColumnMenu`, `columnMenuItem` one item of it and the default `children`, `headerMenu` the props of the `Menu` (with `column`; its `items` can be added to), `resizeHandle` the props of `DataTable.ResizeHandle` (with `column`). Every part carries `data-part` with its name as written here (`headerCell`, `sortIndicator`, `groupHeader`); so do the pieces that cannot be replaced: `caption`, `body`, `headerLabel`, `rowLink`, `radio`, `title`, `meta`, `state`, `fontProbe`, `columnsButton`, `headerMenuButton`, `dropIndicator`.

### 4. Blocks

`DataTable.Root`, `DataTable.Header`, `DataTable.HeaderCell`, `DataTable.SortIndicator`, `DataTable.Body`, `DataTable.Row`, `DataTable.Cell`, `DataTable.GroupRow`, `DataTable.Footer`, `DataTable.ResizeHandle`, `DataTable.ColumnMenu`. A table composed from them is a grid with the same keyboard; sorting, selection and widths are then the app's (`Row` takes `onAction` and `onSelect`; `Root` takes `width`, a `<colgroup>` and `onSelectAll` for Ctrl+A; `Cell` takes `title`, shown while its text is cut, and `tooltip`, shown always). `HeaderCell` takes `onMenu` and `menuLabel` (the "more" button, Shift+F10 and a right click) and `resizeHandle` (a `DataTable.ResizeHandle`, which reports `onResize(px, phase)` and never keeps a width itself). `DataTable.ColumnMenu` is the list of the column menu without its popover: it takes `items` (`{ id, label, visible, noRoom, pin, hideable, reorderable }`) and reports `onVisibleChange`, `onMove`, `onPinChange`, `onShowAll` and `onReset`, so an app can put the list in its own toolbar or drawer.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | A column narrower than its content | Text is cut with an ellipsis; while it is cut, hover or keyboard focus shows the full text in a tooltip. Widgets follow their own rules |
| 2 | The columns do not fit at their minimum widths | Columns hide one at a time: lowest `priority` first, equal priorities from the end of the order (the user's, when they changed it). A column the user ticked in the column menu is never hidden for lack of room, and one they hid stays hidden at any width. They return, in reverse, when there is room. While any is hidden, one narrow column (40px) is added, so the user is told: by default a button in its header, "+3", named "3 columns hidden", whose tooltip lists them on hover and keyboard focus and which opens the column menu; with `expandableHidden` a disclosure column instead, and each row can show its hidden columns under it. `parts={{ hiddenIndicator: null }}` gives the 40px back |
| 3 | Only `always` columns and columns the user asked for are left and still do not fit | The table scrolls sideways inside its slot; pinned columns stay in view |
| 4 | Rows taller than the slot | The body scrolls; header, group rows and footer stick |
| 5 | Empty or error state larger than the slot | It follows `EmptyState` |

How step 2 is decided: the width of the scroll area is measured (a `ResizeObserver`, applied before paint), and `fitColumns` (`src/table/logic.ts`, unit-tested) returns the hidden columns and every width. Column widths come from the column definitions and the cell font (its size, and the width of a digit), never from the rendered cells, so the answer depends on the available width alone: it cannot oscillate at a threshold and is right after one large resize. A `content` width is computed from the text of the data, not measured in the page. The vertical scrollbar always keeps its room, so it cannot change the width either. Spare width goes to the flexible columns by `flex` up to `max`; what is left over is shared evenly, so rows always span the full width.

A width the user set is fixed pixels: that column neither grows nor shrinks, the others share what is left, and it takes none of the spare width while any other column can. When the sum no longer fits, step 2 hides the lowest-priority columns the user did not ask for, then step 3 scrolls the table sideways inside itself. While a handle is dragged the same rule runs on every move, with no column hidden or shown until the handle is let go, and only the `<col>` widths are written: no row is rendered.

## Interaction and accessibility

Markup: a real `<table>` with `role="grid"`, `<th scope="col">` headers (`columnheader`, with `aria-sort`), `<th scope="row">` for `rowHeader` columns, `aria-rowcount`, `aria-colcount`, `aria-rowindex` and `aria-colindex`. `aria-colcount` counts every column, the hidden ones too, and `aria-colindex` is a column's place among all of them, so assistive technology hears that columns are missing. A table, not a grid of `div`s: virtualisation only needs spacer rows, and sticky cells work on table cells.

Keyboard (the decided model):

- **One tab stop.** The focused cell is the tab stop; controls inside cells are not in the tab order. Leaving and returning lands on the same cell.
- **Arrow keys** move the focused cell, through header rows, group rows, detail rows and the footer. **Home / End**: first / last cell of the row. **Ctrl or Cmd + Home / End**: first / last cell of the table (in the header and the footer, which stick), and the body scrolls to its start or end with it. **PageUp / PageDown**: one page of rows.
- **Headers**: Enter or Space on a sortable header cycles its sort (ascending, descending, unsorted; a `sortDescFirst` column starts descending). Shift+Enter adds it to a multiple sort. **Shift+F10 or the context-menu key** (and a right click) opens the column's menu; the "more" button is for a pointer only and hidden from assistive technology, which is told by `aria-haspopup` on the header cell.
- **Columns button**: a cell of the grid, at the end of the header row (End). Enter or Space opens the column menu; Escape closes it and returns to the button.
- **Column menu**: a dialog; Tab moves through "Show all", "Reset", the search field, and each row's handle and checkbox. On a handle, **Alt or Ctrl + Arrow Up / Down** moves the column, and Enter or Space opens its actions: move up, move down, pin to start, pin to end, unpin. A pointer drags the handle; a line shows where the column lands.
- **Resize**: "Resize" in the column's menu moves the focus to the handle, a `separator` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax` in pixels. Arrow Left / Right change the width by 8px (as drawn: mirrored right to left), Home / End go to the limits, Enter keeps the width and Escape puts the old one back; both return to the header cell. A pointer drags the handle (24px wide across the column border); a double click fits the column to its content.
- **Body cells**: Space toggles the row's selection. Enter is the row action; in a cell with exactly one control, Enter (and Space, when rows cannot be selected) is forwarded to it; in a cell with several, Enter or F2 moves focus to the first, Tab and Shift+Tab move among them, and Escape (or F2) returns to the cell. From a button, link or checkbox focused by a click, the arrow keys still move through the grid.
- **Shift + Arrow Up / Down** extends the selection from the row that had the focus at the first Shift+Arrow, for as long as Shift+Arrow keys follow each other (coming back shrinks it); what was selected before stays. Any other move of the focus ends the range. **Shift+click** and **Shift+Space** select a range from the last row toggled.
- **Ctrl or Cmd + A** selects every row that can be selected, where `selectionMode` is `multiple`, and the page's text is then not selected. In `single` and `none` the key is not the table's: it is left to the browser, like every key the table has no use for.
- **A control with a list or menu of its own** (a `Select`, a menu button): Enter opens it from the cell; while it is open (`aria-haspopup` with `aria-expanded="true"`) every key is its own. Escape closes it, and Escape again returns to the cell. What a control hides from assistive technology (the native `<select>` a `Select` keeps for forms) is not a control of the cell.
- **Group rows**: Enter or Space works the caret, a button with `aria-expanded` (in a grid, unlike a tree grid, a row cannot carry it).
- **Right to left**: Left and Right follow what is seen.
- No type-ahead.

Focus: the ring is drawn inside the cell (never violet). The focused cell is scrolled into view clear of the sticky header, group row, footer and pinned columns. It is remembered as row id and column id, so it follows its row through a sort and through virtualised scrolling; when its column hides it moves to the nearest column of the same row; when the focused element is removed by a render, focus returns to the cell instead of being lost. After a column is moved or pinned from its menu the focus is on its header in its new place; after it is hidden, on the nearest header; when a menu closes and its opener is gone, on the grid's tab stop.

Disabled rows: no hover or press response and the default cursor; their content is at the disabled opacity (40%). The fill stays opaque for the pinned cells, so bare text is mixed into the fill at that share and elements take the opacity itself; nothing is dimmed twice.

Mouse: a click on a row selects it (toggle; Shift for a range), or activates it when rows cannot be selected; a double click activates a selectable row. Clicks on controls inside the row, and a click that ends a text selection, are not the row's.

Selection: rows have `aria-selected`; the grid has `aria-multiselectable` in `multiple`. Selected rows show the violet fill and, as the cue that is not colour, the checked box or the filled radio. In `single` the control is a native radio named by `selectRowLabel`; pressing the chosen one again clears the selection. The header checkbox is "some" (indeterminate) between none and all.

Not colour alone: the sort direction is the arrow's shape; a highlighted row is also bold, has an edge marker and a hidden `highlightLabel`; an accent stripe has its required `label` as hidden text before the row's first cell, and that cell shows it in a tooltip on hover and keyboard focus ("Ahead of plan · Region 4"), so sighted users can find out too; where the stripe is the main message, also show it in a column or a `Legend`; a changed value shows ▲ or ▼ with hidden text.

Tooltips: one tooltip serves the whole table, in the look of `Tooltip`. It shows a header's `tooltip`, the label of a row's accent on its first cell, the names of the hidden columns on their mark, and the full text of a plain-text cell while that text is cut; after 500ms of hover, at once on keyboard focus, and it goes on scroll, press or blur. Nothing is mounted per cell.

Column controls: moves and resizes are said by the table's `status` region ("Region moved to position 3 of 12", "Amount width 180 pixels"). Dragging is never the only way (WCAG 2.5.7): a column is moved from either menu and resized with the keys or "Fit to content". `aria-colcount` and `aria-colindex` follow the user's order and still count the columns that are not shown.

Data states: `loading` sets `aria-busy` and shows skeleton rows in the real columns, hidden from assistive technology. The error state is an `alert`. `loadingMore` is announced through a `status` region.

Virtualisation: only the rows in view are rendered, plus 8 behind them and one more screen of rows ahead of them in the direction of travel, between two spacer rows. The window moves in steps of four rows, and in a scroll event it is rendered before the frame is painted, so no empty band shows however fast the table is scrolled. What is rendered for a row is kept while nothing it is made from changes, so a scroll step renders only the rows that enter the window. Row heights are read from the rendered rows, so density and tokens are followed, and all rows are assumed equally tall (detail rows are measured one by one). The row that holds the tab stop and the header of the group at the top stay rendered outside the window.

`highlightChanges`: when a cell's value changes for the same row id, the cell flashes once (1.2s, fading): green with ▲ for a larger number, red with ▼ for a smaller one, neutral without a sign otherwise. The sign stays 4s. With reduced motion there is no flash, only the sign. Numbers are never counted up.

## Open questions

None.

Resolved 2026-10-11 (end-user column management, owner's finding O-2; changes the decision "no end-user column editing"):

- **One value, `columnState`**, not four pairs of props (`hiddenColumnIds`, `columnOrder`, `columnWidths`, `pinnedColumns`, each with a default and a callback). An app saves and restores one JSON value, and "Reset" is one assignment. It also leaves `onHiddenColumnsChange` meaning what it meant: the columns hidden for lack of width. No second, combined callback exists beside it, so nothing is said twice.
- **Visibility has three states**: `true` (the user asked for the column: it is never hidden for lack of room), `false` (hidden at any width), missing (the table decides by `priority`). Ticking a column that had no room is how a user overrules the table; the table then scrolls sideways inside itself if what the user asked for does not fit.
- **`columnMenu` is `auto` by default**, neither on nor off: the button is there whenever a column is not shown, which is the case the owner met, and a table whose columns all fit looks as it did (no 40px taken, no baseline changed). The column menu is still one step away in every table: "Columns…" in each header's menu. `columnMenu` (true) keeps the button always; the table page uses it.
- **Resizing and reordering are on by default.** Nothing shows until a header is pointed at or focused, and without `onColumnStateChange` the table keeps the state itself, so they work out of the box.
- **The mark became a button** ("+3"), with the same name, tooltip, part and column; with `columnMenu={false}` it is the plain text it was.
- **The header's press stays sort.** The menu is on a "more" button that shows on hover and focus and takes no room (at the start of an end-aligned header, so it does not cover the number's label), on Shift+F10, the context-menu key and a right click.
- **The "more" button and the resize handle are not controls of the cell** for the grid (`data-grid-ignore`): a sortable header still has exactly one, so Enter sorts. The "more" button is `aria-hidden`: the header keeps its name and its single button, and the cell carries `aria-haspopup="menu"`. Everything in the menu except sorting and resizing is also in the column menu, which is a real button.
- **User widths are in the pixels of `width`** (written for the default density, scaled with the cell font), so a saved width fits at every density. The live region says the pixels drawn.
- **A resize writes `<col>` widths only while the handle moves** and commits once, on release: no row renders per move (guarded by a test on 10,000 rows).
- **The handle is 24px wide across the border**: 12px at the end of its own header and 12px at the start of the next, because a header cell clips. The last column has the 12px of its own cell only when nothing follows it.
- **Fit to content** uses the text of every row (as `width: 'content'` does) for a column without a `cell`, and the widest rendered cell for one with a `cell`.
- **Moves stay inside the column's pin group** (start, middle, end): the list shows the columns in the order they are drawn.
- **Reordering is pointer events and keys only**, no drag library. A drag near the top or bottom edge of the list scrolls it.
- **The engine keeps doing visibility; order, widths and pins are applied to the column list before the fit rule** (`applyColumnState` in `src/table/logic.ts`, unit-tested). The engine's ordering, sizing and pinning state would not be read by anything: this table lays its columns out itself.
- **Columns the saved state does not know** (added by the app later) keep their place after the column that precedes them in the definitions; ids it knows and the app dropped are ignored.
- **The last shown column cannot be hidden**: its box is disabled.
- **Headers that span columns** (`columnGroups`) split when the user moves a column out from under them: neighbours in the same group merge, as before.
- **The detail row of `expandableHidden`** shows the columns hidden for lack of room, not the ones the user hid.
- **Not done**: named saved views; a column's place changed by dragging its header in the table itself (the list and the menu do it); touch drag of a header.

Resolved 2026-10-11 (review fixes):

- **A Shift+Arrow run has its own start** (review D3): the row that has the focus at the first Shift+Arrow, not the last row toggled. The run goes on while the focus is on the row the last Shift+Arrow moved to; any other move ends it. `DataTable.Row` reports it as `onSelect({ range: true, anchor: true })`; the rule is `selectStep` in `src/table/logic.ts`, unit-tested.
- **Hidden columns are announced** (review, spec gap). Before, nothing told a user that columns were hidden unless `expandableHidden` was on, and `aria-colcount` counted only the shown ones. Now a mark in the header says how many (anatomy, step 2), and the column count and positions are those of the whole table. The mark costs 40px while columns are hidden, the same as the disclosure column; at a threshold that hides one column more than before.
- **A radio in `single` selection**, not a checkbox (revisits the decision of 2026-10-10 below; the evidence shows a radio). It is drawn by the table with the tokens of `Radio` on a native input: the rows of a table cannot sit inside the element of a `RadioGroup`, and the chosen row can be pressed again to clear the selection, which a radio group does not allow.
- **Ctrl or Cmd + A** selects all rows in `multiple` only; elsewhere the key stays the browser's (the rule for every key a component has no use for, `plan/interaction.md`, reserved keys).
- **Ctrl + Home / End scroll the body too** (revisits the decision below): the focus goes to the first or last cell of the table as before, and the body follows to its start or end, also when virtualised.
- **Accent stripes**: the label was hidden text only, and the spec handed sighted users to the app. The row's first cell now shows the label in its tooltip, which costs nothing per row. A 3px stripe cannot carry a shape or a pattern, so a column or a `Legend` is still advised where the stripe matters.
- **`caption` is a prop, not a part**; the anatomy says so.
- **Disabled rows** (review D5, D6) did answer to hover, and their text was mixed at 55%: see "Disabled rows".
- **A `Select` in a cell** (review D8) could not be opened from the keyboard: the native `<select>` it hides counted as a second control of the cell, so Enter moved the focus to it. Controls hidden from assistive technology no longer count, and an open list or menu keeps its keys.
- **Wrapping rows, `virtualize` by hand, `stickyGroups={false}`, virtualised groups and detail rows** (review D7, D8) have stories and tests; no code changed for them.
- **`data-part` names are camelCase**, as in `parts` (`plan/decisions/07-customisation.md`): `headerCell`, `headerLabel`, `sortIndicator`, `groupHeader`, `rowLink`, `fontProbe` were kebab-case. `row`, `skeleton`, `empty` and `error` now carry the attribute.
- **Foreign tokens** (review D10): `--umbra-focus-offset` and `--umbra-icon-button-size` were set on the root with no way in for an app on an ancestor; each is now a private property whose default is a table token (Tokens).
- **Classic scrollbars** are tested in a browser launched with scrollbars shown: the columns are fitted to the width beside the scrollbar, and the end-pinned column sits against it.
- **Sample data** (review D12): the ranking story's regions were a league table in all but name (won, lost, points as three times the wins plus the draws). They are regions with orders, shipped, pending, returned and revenue.
- **Scrolling 10,000 rows** (review D1, D2). Three causes, three fixes. (1) The sort order, the selection and the hidden columns were handed to the engine as new objects on every render, so its memo never held and every scroll step sorted all the rows again: each is now memoised on its own input. (2) Every scroll step rendered every row in the window, the header (whose "all selected" check walks all rows) and the footer total: what is rendered for each is now cached until one of its inputs changes, so React skips the rows that stay. (3) The window was renewed after the frame was painted, with 8 rows of overscan, so a fast wheel showed an empty band: it is now renewed inside the scroll event, with one screen of rows ahead. Measured with headless Chromium on 2026-10-11 (script time from the browser's own counter, median of 3 runs, 26px a frame for 180 frames): 2,183ms and 90 renders before, 217ms and 45 renders after (sorted: 2,177ms and 179 sorts of the 10,000 rows before, 205ms and no sort after); 300 Arrow Down presses 2.39s before, 0.86s after; wheel at 400px an event: an empty band of up to 505px and 41 frames over 33ms before, none of either after. `tests/visual/table.spec.ts` holds a guard: no sort while scrolling, fewer than 90 rows in the page, no empty band, and a ceiling on script time.
- **The app keeps `data`, `columns`, `sort` and `selectedIds` stable** (state or a memo). A new `data` array is sorted again; new inline callbacks (`getRowId`, `rowAccent`, a `parts` object) only cost a render of the rows in the window when the app itself renders, not on a scroll step.

Resolved 2026-10-11:

- **`highlightChanges` is the shared highlight** (`src/internal/useChangeHighlight.ts`, `ChangeHighlight.tsx`), which the other value components now have too. The table's behaviour and its `--umbra-table-change-*` tokens are unchanged; without them it reads `--umbra-change-*`. The flash now follows the provider's reduced-motion setting, not only the system's.
- **Pixel widths follow the density.** A width that fitted its text at the default density cut it at spacious, where the font is larger. Pixels are now written for the default density (a 13px cell font) and multiplied by the cell font size over 13 (`resolveWidth` in `src/table/logic.ts`, unit-tested). The table reads its font from a hidden probe of 1ch by 1em, observed for changes, so a density or font token change is followed.
- **`width: 'content'`**: the longest text of the column (through `format`), its header and a text footer, counted in characters, times the width of a digit, plus the cell padding and room for the sort arrow. It is fixed (no `flex`). `numberColumn` uses it by default; with a `cell` of its own, whose width the text does not tell, it keeps 80 pixels. Dates and other short codes can use `width: 'content'` too.
- **Stripes share one strength** with `List` and `KeyValueList`: the text colour at `--umbra-state-stripe-strength` (5%). The table's stripe is opaque, so it is mixed in sRGB, which is what a translucent fill composites as; mixed in oklab, as before, the same share was far fainter on a dark surface.
- **The "ResizeObserver loop completed with undelivered notifications" message** on the Table page does not come from the table: no `DataTable` story raises it (every story was loaded with a listener for it). It is raised by rows that show less as they narrow (`useShrinkLevel`: the top bar, the navigation, `Tabs`, `ShortcutBar`), by `BarChart`, and by React Aria's popover when it caps its own height. It is a notice that one observation is delivered a frame later, not a failure; it is left as it is.

- **`height`**, shared with `List` and the charts (`src/internal/height.ts`). The table used to be zero pixels tall in a parent without a height (flowing content in a card body, a popover, an accordion panel). The scrolling area now starts from the height of its rows (`flex: 1 1 auto`), which only counts where there is no height to fill; with one, it grows or shrinks to it and scrolls inside as before. Two tables can flow one after another in one scrolling card body.

Resolved 2026-10-10:

- **A real `<table>`**, also when virtualised: spacer rows keep the scroll height, so an ARIA grid on `div`s was not needed.
- **Engine**: TanStack Table 9 (`@tanstack/react-table`) for sorting, the grouped row model, selection state and column visibility. No type of it is public. Group order is the table's own (listed groups, then first appearance), because the engine would reorder groups by the sorted column.
- **Column widths come from the definitions** (`width` in pixels or `{ min, max, flex }`), not from the content. This is what makes priority hiding exact and stable, and keeps columns still while a virtualised table scrolls.
- **Row ids are strings.** Selection, highlight and collapse are plain arrays of strings.
- **`rowAccent` returns `{ color, label }`** instead of a separate `accentLabel` prop, so the label cannot be forgotten.
- **Accent wins the edge**: a highlighted row with an accent shows the accent stripe; the highlight keeps its fill, bold text and label.
- **A single click activates a row only when rows cannot be selected** (as in `List`); otherwise a click selects, and Enter or a double click activates.
- **The selection column is always shown when selection is on**, in `single` too (without the header checkbox; a radio per row since 2026-10-11). `selectionColumn` was not needed as a helper.
- **`groups` lists titles and order; `groupBy` assigns rows.** Aggregates are per column (`aggregate`); the first column holds the group's title and cannot have one.
- **Group rows do not push each other out**: each sticks below the header and is covered by the next.
- **Expanded detail rows are uncontrolled** (no prop for which rows are open).
- **`virtualize="auto"` starts above 200 rows** and is off when a column wraps; a virtualised table needs rows of one height.
- **Escape returns from a control to its cell even when a tooltip is open on it**; a control with `aria-expanded="true"` keeps Escape for itself. A menu opened from a cell closes first, focus returns to its button, and the next Escape returns to the cell.
- **One shared tooltip, not a `Tooltip` per cell**: `Tooltip` needs an element with a widget role as its trigger (a header cell or row header is not one) and one trigger per cell would cost thousands of components. The table opens React Aria's tooltip against the cell itself and reuses the styles of `Tooltip`.
- **Focus is taken back only when it is nowhere** (the focused element was removed): focus that moved to a menu or dialog opened from a cell is left alone.
- **Ctrl+Home goes to the first header cell**; the next Arrow Down goes to the first row. (It did not scroll the body until 2026-10-11.)
- **`wrap` only**; there is no separate `truncate` option (truncation is the default).
- **Not a layout child** (no `size` or `priority` of its own): it goes in a `Card` with `padding="none"`, or any element with a height.
- **The visual tests run with hidden scrollbars**, which take no room; two tests run with scrollbars shown (2026-10-11).
