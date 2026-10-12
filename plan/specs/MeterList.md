# MeterList

**Tier** 2 · **Group** Meters · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Lays out a group of meters in aligned columns: every label in one column, every bar in the next, every value in the last. It takes any of the four meters (`ProgressBar`, `LevelMeter`, `PieIndicator`, `DivergingMeter`), in any mix. It is to the meters what `KeyValueList` is to `KeyValue`.

## Not for

- One meter: use the meter itself.
- Labels with text values and no bar: use `KeyValueList`.
- Records with several columns, sorting or selection: use `DataTable` (a meter can be a cell).
- A vertical `LevelMeter`, or the captions at the ends of its scale: a row is horizontal and has three columns.

## Evidence

The owner's finding O-7 (plan/reviews/milestone-2.md): in the detail panel of the list and detail page, rows of "label, level meter, value" each started their meter right after their own label, so the meters did not line up. The source shows the aligned form: attribute rows with a tick strip per row in one column (37 to 40), and bars with a label before and a value after (3, 6, 10).

## Anatomy

| Part | Content | Default |
|---|---|---|
| rows | the meters given as `children`: each meter's root is a row | shown |
| `skeleton` | rows of placeholders in the three columns | while `loading` |
| `empty` | the empty state, across the columns | with no meters |
| `error` | the error state, with its retry button | with `error` |

A row is the meter's own root, so nothing is wrapped. The list places the parts of each meter by their `data-part`: `label` in the first column; `track`, `strip` or `disc` in the second; `value` in the third.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| label column | by content, or `labelWidth` | By content: as wide as the longest label, and narrower when the bars would go below their minimum |
| value column | present, absent | Absent when no meter shows a value: the bars then reach the end of the list |

States: `loading`, `empty`, `error`. A row may also load or have no value on its own (the meter's `loading`, a `null` value); it keeps its columns.

Inside a list a meter is laid out on one line whatever its `layout` or `orientation` is, and does not hide its own value: the list hides the values of all its rows together.

## Customisation

### 1. Tokens

`--umbra-meter-list-gap` (between rows, 8px), `--umbra-meter-list-column-gap` (8px), `--umbra-meter-list-bar-min-width` (the shortest a bar gets before the list gives way, 64px), `--umbra-meter-list-label-fg`, `--umbra-meter-list-skeleton-height` (6px). The meters keep their own tokens.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | meters | — | The rows |
| `labelWidth` | number \| CSS track size | the longest label | Width of the label column: pixels, `"40%"`, `"12rem"`, `"fit-content(50%)"`. Labels that do not fit are cut |
| `loading` | boolean | `false` | Shows skeleton rows |
| `skeletonRows` | number | `4` | |
| `empty` | text \| node \| `{ title, description, icon, action }` | "No data" | Shown when there are no meters |
| `error` | the same, or `true` for the default text | — | Shown in place of the meters; wins over `loading` |
| `onRetry` | function, no arguments | — | Adds a retry button to the error state |
| `retryLabel` | string | "Try again" | |
| `aria-label` | string | — | Names the group |
| `className`, `style`, `id`, `data-*`, `aria-*` | | — | On the root |

### 3. Parts

`skeleton` (receives `{ rows }`), `empty`, `error` (each receives the default state as `children`). Each accepts a node (replace), `null` (hide) or a function. The parts of a row are the meter's own.

### 4. Blocks

`MeterList.Root` (takes `state` in place of the data state props). The rows are the meters.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 0 | The labels, the shortest bars and the values fit | Three columns; the bars take what is left |
| 1 | They do not fit: a label is cut, or the columns are wider than the list | The column of values hides. Each value is still read, and shown on hover |
| 2 | Labels and the shortest bars still do not fit | Each label moves to a line of its own, above its bar, which takes the whole width |
| — | A label is wider than the list even then | It is cut with an ellipsis, and its text is in a tooltip |

With `labelWidth` the app has chosen the width of the labels: a label cut by it is not a reason to step, only columns wider than the list are. The step is a function of the width (`useShrinkLevel`): the same on the way down, on the way up and on a fresh load. A `LevelMeter` in a narrow column still thins its own ticks.

## Interaction and accessibility

- Not interactive. Each row keeps its own role (`meter` or `progressbar`), name and value text; with an `aria-label` the list is a `group`.
- A cut label shows its whole text in a tooltip on hover; over it the tooltip of the meter's value gives way (one tooltip at a time). This holds for a meter outside a list too.
- While `loading` the list is `aria-busy` and holds skeleton rows in the three columns, so nothing moves when the meters arrive. `error` is announced as an alert; after Retry the focus is kept (`src/internal/dataState.tsx`).
- Right to left: the columns mirror (labels on the right, values on the left); each meter mirrors as it does alone.
- Colour: the list adds none. Label text is the secondary text colour (4.5:1 on every card tone).

## Open questions

None.

Resolved 2026-10-11:

- **A list, not a prop on each meter.** The columns must be shared by the rows, which only a common parent can do without measuring: a grid whose rows are subgrids (as `KeyValueList`). Without subgrid (below the supported browsers) each row sizes its own columns.
- **Children only, no `items` array.** The rows are four different components with different props; an array would need a `type` field and repeat their prop types. `KeyValueList` has `items` because its rows are one component.
- **The row is the meter's root, with no wrapper.** The list's stylesheet places the meter's parts by `data-part`, and a context (`src/meters/label.tsx`) tells the meter it is in a list: it takes the one-line layout and leaves hiding the value to the list.
- **The label column follows the longest label**, as far as the bars keep `--umbra-meter-list-bar-min-width`. A cap in percent (as the 60% of `KeyValueList`) would cut a long label in a wide list while its bar had room; `labelWidth` gives a cap or a fixed width when the app wants one.
- **Two steps: values, then labels above.** The value goes first because it is on the tooltip and read by assistive technology; the label names the row, so it gets a line of its own before it is cut.
- **The end captions of a `LevelMeter` and its vertical form are left out** in a list: there is no column for them.
- **The shared label block** (`MeterLabel`) is used by all four meters, in and out of a list: one place for the label of a meter, its plain form while loading, and the tooltip of a cut label.
