# Comparison

**Tier** 2 · **Group** Data display · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

Two sides compared on a list of metrics: one row per metric, the first side's value at the start, the label in the middle, the second side's value at the end, with an optional pair of bars that grow from the centre. A header names the two sides and can carry one large pair of values. A one-line strip is its smallest form.

## Not for

- More than two sides, or sorting and selection: use `DataTable`.
- One label and one value per row: use `KeyValueList`.
- A value against a goal: use `ProgressBar` with `target`.
- A value on both sides of zero: use `DivergingMeter`.

## Evidence

Two mirrored lists of the same ten metrics, one per side, each value in a small box, around a central drawing split in two colours in proportion to one metric, under a header with each side's mark and name (36). A strip at the top of the same screen: a short name on each side's colour, one pair of values in a box between them, and a second box with a caption (36). A strip of small cards, each with two entities and a value per entity (30). The source draws the lead by colour and by the split of the drawing; the library marks the leading value by weight and a dot, and draws the split as two bars per row.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `header` | the two sides, and the summary between them | shown |
| `side` | one side: its mark and its name (asked for once per side) | shown |
| `summary` | a large pair of values with a caption under it | shown when `summary` is set |
| `row` | one metric | one per row |
| `label` | the metric's name, in the middle | shown |
| `value` | one side's value (asked for twice per row), with the leader mark | shown |
| `bars` | two bars back to back, one per side | shown when `showBars` |
| `strip` | the one-line form | shown in the `strip` variant, and when the rows do not fit |
| `skeleton` | placeholder rows while loading | shown when `loading` |
| `state` | the empty or error state | shown when empty or failed |

Inside these: `icon` and `name` (in a side), `caption` (in the summary and the strip), `leader` (the mark in a leading value), `bar` (one bar), `table` and `body` (the table and its rows).

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `table` (default), `strip` | `strip`: one line with the first side, the two values, the second side and a quiet caption. The values are the `summary`, or else the first row with its label as the caption. |
| header | names, or names with a summary | Set by `summary`: the two values in the display font, a separator between them and the caption under them, in the middle of the header line. |
| `showBars` | `true` (default), `false` | Each side's bar is its value's share of the row's `max` (default: the larger of the two values, so the leading side's bar is full). |
| `highlightLeader` | `true` (default), `false` | The value of the side that leads a row is bold and has a dot in the side's colour. `lowerIsBetter` on a row makes the lower value the leader. Equal values, and a row with a missing value, have no leader. |

States: loading, empty, error; a changed value (`highlightChanges`).

## Customisation

### 1. Tokens

`--umbra-comparison-color`, `--umbra-comparison-secondary-color` (labels, caption), `--umbra-comparison-font`, `--umbra-comparison-border` (the rule under the header), `--umbra-comparison-summary-font`, `--umbra-comparison-row-height`, `--umbra-comparison-row-padding`, `--umbra-comparison-bar-height`, `--umbra-comparison-track`, `--umbra-comparison-leader-size`, `--umbra-comparison-strip-bg` (the box of the strip's values). The row height follows the density level. A side's colour is data (`sides[n].color`), not a token: without it the two sides take the first two series colours.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `sides` | `[{ name, icon?, color? }, { … }]` | — | The two sides. `icon` is any node: an `EntityIcon`, an `Avatar`. |
| `rows` | `{ id, label, values: [a, b], lowerIsBetter?, formatValue?, max? }[]` | — | One metric per row. A value is a number, or `null` for none. |
| `summary` | `{ values: [a, b], caption?, separator? }` | — | The large pair in the header |
| `variant` | see above | `table` | |
| `showBars` | boolean | `true` | |
| `highlightLeader` | boolean | `true` | |
| `formatValue` | `(value, row) => node` | the number as it is | Text of a value; a row's own `formatValue` wins |
| `emptyLabel` | node | "—" | In place of a missing value |
| `height` | `fill` \| `content` \| number | `fill` | As `List` and the charts (`src/internal/height.ts`) |
| `loading`, `empty`, `error`, `onRetry`, `retryLabel` | the shared data state props | — | `src/internal/dataState.tsx`; the empty text defaults to "Nothing to compare" |
| `skeletonRows` | number | 5 | Placeholder rows while loading |
| `highlightChanges`, `increasedLabel`, `decreasedLabel` | boolean, string, string | off | A value that changes flashes once, with a sign (`plan/interaction.md`, "Live updates") |
| `metricLabel` / `summaryLabel` / `leaderLabel` | string | "Metric" / "Summary" / "Leading" | For assistive technology: the header of the label column, the name of a summary without a caption, the text with a leading value |
| `aria-label` | string | — | Names the table, or the strip |
| `size`, `priority`, `minWidth`, `minHeight`, `label` | slot props | — | As a child of `Columns` or `Stack` |

### 3. Parts

`header`, `side`, `summary`, `row`, `label`, `value`, `bars`, `strip`, `skeleton`, `state`. `row`, `label` and `value` receive the row.

### 4. Blocks

`Comparison.Root` (`variant`, `strip`, `height`, the slot props), `Comparison.Table`, `Comparison.Header` (`metricLabel`, `summary`), `Comparison.Side` (`opposite`, `icon`, `color`, `role`), `Comparison.Summary`, `Comparison.Body`, `Comparison.Row`, `Comparison.Label`, `Comparison.Value` (`opposite`, `leader`, `color`, the change props), `Comparison.Bars` (`shares`, `colors`), `Comparison.Strip`.

## Behaviour as space shrinks

By its width (a container query):

| Step | Trigger | Result |
|---|---|---|
| 1 | Any width | The two values of a row keep their whole text. The label has the room between them and ends in an ellipsis when it is short; the whole label is then in a tooltip. A side's name does the same in the header. |
| 2 | Narrower than 240px | The bars hide |
| 3 | Narrower than 180px | The marks of the two sides hide |

By its height, when its slot is shorter than its rows (measured, `useFitLevel`; a comparison that is as tall as its content, as in a card body, is never short and the card scrolls it):

| Step | Trigger | Result |
|---|---|---|
| 1 | The rows are taller than the slot | The bars hide |
| 2 | The rows without bars are still taller | The strip replaces the table |

In the strip, by width: the caption hides under 320px, the marks under 260px, and the names end in an ellipsis; the two values stay whole. Growing starts again from everything, so each size gives the same result on the way down and on the way up.

## Interaction and accessibility

- **It is a table** (`role="table"`, with `rowgroup`, `row`, `columnheader`, `rowheader` and `cell`): the columns are the label ("Metric", for assistive technology only), the first side and the second side, and each row's header is its label. A screen reader reads a row as "Orders, 128, 96", and a cell with its side's name. The roles are written out, because the rows are laid out as grids and a `<table>` loses its semantics in some browsers when its display changes.
- The page's order is label, first value, second value; the drawing puts the label between the two values. Nothing in a row takes focus, so the two orders never meet a keyboard user.
- The summary is a row of the same table: its caption is the row's header ("Week 12, 12, 9"), or `summaryLabel` when there is none.
- The lead is never colour alone: weight, a dot, and `leaderLabel` ("Leading") as text for assistive technology in the leading cell.
- A side's colour is paired with its position: the first side's bar and dot are always on the first side.
- The bars are a drawing of the two numbers beside them, so they are hidden from assistive technology.
- The strip is a group named by `aria-label`, read in the order it is drawn: first side, the two values, second side, caption.
- Right to left mirrors the sides: the first side is at the right, and each bar still grows from the centre.
- Loading sets `aria-busy`, keeps the header (the two sides are known) and shows placeholder rows in the rows' layout. An error is an alert with a retry button; when the retry removes it while it holds the focus, the focus moves to the comparison.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Semantics: a table, label first.** Chosen over a list of groups (no column context for a value) and over the drawn order (a value would be read before what it measures).
- **The bars are drawn here, not with `ProgressBar`**: a `ProgressBar` is a meter with its own name, value text and tooltip, and two of them per row would read every number twice. The values are plain text; an app that wants them boxed gives a `ValuePill` through the `value` part (the story does).
- **A bar is a share of the row's larger value** (`max` per row overrides it, for a percentage out of 100). A share of the two values' sum was left out: it makes two bars that always add up to one bar, which reads as a single split bar.
- **`lowerIsBetter` per row**, the name the thresholds use. No `thresholds` here: the rows compare two sides, they do not grade a value.
- **The header variant is not a prop**: giving `summary` is what asks for the large pair.
- **The strip is the last height step**, as the brief states, and it shows the summary, or else the first row. The table does not scroll inside itself: in a card body the card scrolls it.
- **The strip is a group, not a table**: one line of text in reading order says the same with less.
- **`highlightChanges` on the values** (a comparison is often live): the shared hook, per value.
- **Side colours default to the first two series colours**, the palette already checked against every tint.
