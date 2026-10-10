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

`KeyValueList`: the rows (`item`), or `skeleton`, `empty` or `error` in their place.

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

`--umbra-key-value-gap`, `--umbra-key-value-label-width` (the most the label column takes, default 60%), `--umbra-key-value-label-fg`, `--umbra-key-value-value-fg`, `--umbra-key-value-hint-fg`, `--umbra-key-value-value-font` (stacked), `--umbra-key-value-row-height`, `--umbra-key-value-padding-x`, `--umbra-key-value-stripe`, `--umbra-key-value-divider`, `--umbra-key-value-min-column` (grid, default 140px).

### 2. Props

`KeyValue`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `label` | node | — | |
| `value` | node | `children` | |
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
| `empty` | node | "No data" | Shown when there are no items |
| `error` | node | — | Shown in place of the items; put a retry action inside |
| `aria-label` | string | — | Names the list |

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
- In the loading, empty and error states the root is a plain element (a description list must hold terms), a `group` when it has an `aria-label`.
- Label text is the secondary text colour and the hint the muted one; both keep 4.5:1 on every card tone.
- A value coloured to carry meaning needs a second cue (an icon or a word); the component adds none.

## Open questions

None.

Resolved 2026-10-10:

- `layout` names how the items are arranged; `orientation` names how one item is arranged. Rows default to inline items; columns and the grid to stacked ones. Either can be overridden.
- The shared label column is a CSS subgrid: as wide as the longest label, at most 60%, or exactly `labelWidth`. No measuring in JavaScript.
- `hint` sits under the label when inline and under the value when stacked, so it is always the last line.
- The list has an `error` state as well as `loading` and `empty`, as every data component does.
- `striped` applies to rows only, and `dividers` to rows and columns: in a grid neither reads as a row.
- The grid drops columns by itself below 140px per column, adjustable with a token.
- The catalog's `AttributeList` (a label, a trend and a value chip per row, with tinted rows) is built from this list with nodes as values; the tinted "key" rows wait for `ValuePill` and `TrendArrow`.
- `KeyValueList` is part of this spec and has no catalog row of its own.
