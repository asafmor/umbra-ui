# KeyValue

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Shows a label with its value. `KeyValue` is one pair; `KeyValueList` is a group of pairs in rows, columns or a grid, with one shared label column in rows.

## Not for

- One large headline number: use `StatValue`.
- Records with several columns, sorting or selection: use `DataTable`.
- Rows that are links or have actions: use `List`.
- Editing a value: use `FormField`.

## Evidence

Label left and value right in a detail panel, grouped under section titles (9); zebra rows with the value column starting near the middle (13, 25); label above value in header strips and side panels (5, 6, 7, 33, 37); rows with a divider and a value that carries an icon or a mark (24, 32); a truncated value (24); a sub-line under the label (reference screen, "Top performers").

## Anatomy

`KeyValue`:

| Part | Content | Default |
|---|---|---|
| `label` | what the value is, with the `icon` before it | shown |
| `icon` | a small icon | hidden |
| `value` | the value: text or any node | shown |
| `hint` | a secondary line: under the label when inline, under the value when stacked | hidden |

`KeyValueList`: the rows (`item`, each `data-part="item"`), or `skeleton` rows, or the `empty` or `error` state in their place.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `orientation` | `inline`, `stacked` | Label beside the value, or above it |
| `align` | `start`, `end` | Where the value sits. Default `end` inline, `start` stacked |
| `wrap` | off, on | A long value is cut with an ellipsis, or wraps |
| `layout` (list) | `rows`, `columns`, `grid` | Rows share one label column. `columns` puts the items side by side. `grid` uses up to `columns` columns. |
| `striped` (list) | off, on | Shades every other row (`rows`) |
| `dividers` (list) | off, on | A line between items (`rows`, `columns`) |

States (list): `loading`, `empty`, `error`. Row height and text size follow the density level.

## Customisation

### 1. Tokens

`--umbra-key-value-gap`, `--umbra-key-value-label-width` (the most the label column takes, default 60%), `--umbra-key-value-label-fg`, `--umbra-key-value-value-fg`, `--umbra-key-value-hint-fg`, `--umbra-key-value-value-font` (stacked), `--umbra-key-value-row-height`, `--umbra-key-value-padding-x`, `--umbra-key-value-stripe`, `--umbra-key-value-divider`, `--umbra-key-value-min-column` (grid, default 140px), `--umbra-key-value-highlight-bg`, `--umbra-key-value-highlight-fg` (a `highlighted` row).

### 2. Props

`KeyValue`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `label` | node | — | |
| `value` | node | `children` | With neither, the row shows `emptyLabel` |
| `emptyLabel` | node | "—" | Shown when there is no value |
| `highlighted` | boolean | `false` | A key row: tinted, with the label in bold |
| `icon` | node | — | Before the label |
| `hint` | node | — | Secondary line |
| `orientation` | see above | `inline`, or the list's | |
| `align` | see above | by orientation | |
| `wrap` | boolean | `false` | |

`KeyValueList`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | array of `KeyValue` props, each with an optional `key` | — | The rows as data |
| `children` | `KeyValue` elements | — | The rows as elements |
| `layout` | see above | `rows` | |
| `columns` | number | `2` | Most columns of the grid |
| `orientation` / `align` / `wrap` | as `KeyValue` | by layout | Apply to every item |
| `striped` / `dividers` | boolean | `false` | |
| `labelWidth` | number \| CSS length | widest label, at most 60% | Width of the shared label column |
| `loading` | boolean | `false` | Shows skeleton rows |
| `skeletonRows` | number | `4` | |
| `empty` | text \| node \| `{ title, description, icon, action }` | "No data" | Shown when there are no items |
| `error` | the same, or `true` for the default text | — | Shown in place of the items; wins over `loading` |
| `onRetry` | function, no arguments | — | Adds a retry button to the error state |
| `retryLabel` | string | "Try again" | |
| `aria-label` | string | — | Names the list |
| `highlightChanges` | boolean | off | On a row, or on the list as the default of every row (a row's own value wins). The value flashes softly once when it changes: green when a number rose, red when it fell, neutral otherwise, with a ▲ or ▼ sign as the cue that is not colour. No flash under reduced motion; the sign stays for four seconds. Never counted up or down. |
| `increasedLabel` / `decreasedLabel` | string | "increased" / "decreased" | What a screen reader hears with the sign |

### 3. Parts

`KeyValue`: `icon`, `label`, `value`, `hint`. `KeyValueList`: `item` (receives the props of each row built from `items`), `skeleton`, `empty`, `error`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`KeyValue.Root`, `KeyValue.Label`, `KeyValue.Value`, `KeyValue.Hint`; `KeyValueList.Root`, `KeyValueList.Item`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | A value is wider than its column | It is cut with an ellipsis, or wraps with `wrap` |
| 2 | A label is wider than 60% of the row | The label is cut with an ellipsis; the value keeps the rest |
| 3 | A grid column would be narrower than 140px | The grid uses one column fewer, down to one |
| 4 | The list is taller than its card | The card body scrolls; the list itself never scrolls |

`columns` layout: the items share the width equally and truncate (steps 1 and 2); they do not wrap onto a second line.

A truncated value shows its full text in a tooltip on hover. It is measured at that moment, so a value that fits or wraps has none.

## Interaction and accessibility

- Not interactive. Interactive nodes inside a value keep their own behaviour.
- A list is a `<dl>`; each row is a group with a `<dt>` and `<dd>`s. A single `KeyValue` outside a list is a one-row `<dl>`.
- While `loading` the list is `aria-busy` and holds skeleton rows in the final layout. `error` is announced as an alert.
- In the loading, empty and error states the root has another role (a description list must hold terms): `group` when it has an `aria-label`, else `presentation`. It stays the same element, so the focus is kept across the states.
- After Retry the button goes away with the error state: the focus moves to the list itself (`tabindex="-1"`), and stays there when the rows arrive. It never falls to the page.
- Label text is the secondary text colour and the hint the muted one; both keep 4.5:1 on every card tone.
- A value coloured to carry meaning needs a second cue (an icon or a word); the component adds none.

## Open questions

None.

Resolved 2026-10-11 (review fix pass):

- **The list uses the shared data states** (`src/internal/dataState.tsx`): `loading`, `empty`, `error`, `onRetry`, `retryLabel` with the types and defaults of `List` and `DataTable`. `error` takes text, a node, `{ title, description, icon, action }` or `true`; it used to take a node only, with the retry action written by the app. The state is an `EmptyState` (`data-part="empty"` or `"error"`); the `empty` and `error` parts receive it as `children`.
- **`highlightChanges` on the list.** The spec listed `highlightChanges`, `increasedLabel` and `decreasedLabel` among the list's props and the code had them on the row only. The list now takes them and hands them to every row as the default; a row can still set its own. `changeValue` stays a row prop.
- **A row is a single-value component**: without a value it shows `emptyLabel` ("—"). No error state of its own.
- **Key rows (the catalog's `AttributeList`).** `highlighted` on a row (and so on an item) marks a key row: a fill in the stronger card tint, and the label in bold in the primary text colour as the cue that is not colour. A prop, not only a token, because which rows are key is data. The trend and the value chip of such a row are nodes in `value` (`TrendArrow`, `ValuePill`), as before.
- Every block passes `className` and `style` to its element, and every part carries `data-part` with its name as written here (plan/decisions/07-customisation.md).

Resolved 2026-10-10:

- 2026-10-11: `highlightChanges` (plan/interaction.md, "Live updates"), the same as on `DataTable` and from the same code: `src/internal/useChangeHighlight.ts` and `ChangeHighlight.tsx`. `KeyValue.Value` takes the same props, and `changeValue` when its content is a formatted text. Tokens: `--umbra-change-up`, `--umbra-change-down`, `--umbra-change-neutral`.
- `layout` names how the items are arranged; `orientation` names how one item is arranged. Rows default to inline items; columns and the grid to stacked ones. Either can be overridden.
- The shared label column is a CSS subgrid: as wide as the longest label, at most 60%, or exactly `labelWidth`. No measuring in JavaScript.
- `hint` sits under the label when inline and under the value when stacked, so it is always the last line.
- The list has an `error` state as well as `loading` and `empty`, as every data component does.
- `striped` applies to rows only, and `dividers` to rows and columns: in a grid neither reads as a row.
- The grid drops columns by itself below 140px per column, adjustable with a token.
- The catalog's `AttributeList` (a label, a trend and a value chip per row, with tinted rows) is built from this list with nodes as values; the tinted "key" rows are `highlighted` (2026-10-11).
- `KeyValueList` is part of this spec and has no catalog row of its own.
