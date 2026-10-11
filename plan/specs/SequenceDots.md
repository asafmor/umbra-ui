# SequenceDots

**Tier** 2 · **Group** Data display · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A short ordered row of small marks, one per recent outcome, newest last: the last five results of a check, the recent ratings of an item. Two looks: a dot with a shape per tone, or a thin bar whose height is a value.

## Not for

- A trend over many points: use `Sparkline`.
- One status: use `StatusIndicator`.
- A filled share of a capacity: use `LevelMeter` or `ProgressBar`.
- A chart with axes: use `BarChart`.

## Evidence

A dot before a value in a table column: solid, hollow ring, half filled (1, 2, 27, 28). Three to five small squares or dots under a label in a header or a side card (1, 31, 37, 38). Three to five thin vertical bars of different heights in a table column, some grey for "nothing yet", directly followed by a `ValuePill` (4, 9, 11, 18). Five equal grey squares where there is no data (6). The source carries the meaning by colour and, for the dots, by fill; the library gives every tone its own shape.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `mark` | one dot or one bar | one per item |
| `skeleton` | the placeholder while loading | shown when `loading` |
| `empty` | the text shown when there is no value | shown when `items` is empty, `null` or missing |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `dots`, `bars` | `dots`: one shape per item. `bars`: one bar per item, as tall as its `value` on `range`; a missing value is a 2px stub in the muted colour. |
| `size` | `sm`, `md`, `lg` | Dots of 8 / 10 / 14px; bars 12 / 16 / 24px high and 4 / 5 / 7px wide. `sm` fits a table cell, `md` a list row. |

The cue that is not colour: each tone has a shape, and the same position gives a bar its fill.

| Tone | Dot (`mark`) | Bar fill |
|---|---|---|
| `success` | `dot`: solid circle | solid |
| `danger` | `ring`: hollow circle | outline |
| `warning` | `half`: half-filled circle | horizontal stripes |
| `info` | `square` | solid, with a gap under its cap |
| `accent` | `diamond` | outline, lower half filled |
| `neutral` (default) | `dash` | dashed outline |

An item sets `mark` itself to override, which is how a free `color` gets a cue.

States: loading, no value, and, with `onAction`: hover, pressed, focus, disabled.

## Customisation

### 1. Tokens

`--umbra-sequence-dots-size` (a dot), `--umbra-sequence-dots-bar-width`, `--umbra-sequence-dots-bar-height`, `--umbra-sequence-dots-gap`, `--umbra-sequence-dots-target-size` (a mark that can be pressed, 24px), `--umbra-sequence-dots-empty-color`, `--umbra-sequence-dots-focus-offset` (inwards, because the row clips; passed on as the private `--focus-offset`, so `--umbra-focus-offset` set by the app wins).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `{ id, label, tone?, color?, mark?, value?, tooltip?, disabled? }[]` \| `null` | — | The sequence, oldest first. `label` says in words what the mark stands for. |
| `variant` | see above | `dots` | |
| `size` | see above | `md` | |
| `max` | number | — | The most marks shown: the newest ones |
| `range` | `[min, max]` | 0 to the largest value | `bars`: the values of an empty and of a full bar |
| `onAction` | `(id) => void` | — | Makes each mark a button |
| `formatSummary` | `(items) => string` | the labels joined by commas | The text assistive technology reads |
| `aria-label` | string | from `formatSummary` | Replaces the summary |
| `loading` | boolean | `false` | A placeholder of the sequence's size |
| `loadingLabel` | string | "Loading" | The name while loading, when there is no `aria-label` |
| `emptyLabel` | node | "—" | Shown when there is no value |
| `noValueLabel` | string | "No value" | Read by assistive technology when there is no value |

### 3. Parts

`mark` (asked for once per item, with the item), `skeleton`, `empty`.

### 4. Blocks

`SequenceDots.Root` (`variant`, `size`, `range`, `onAction`, `aria-label`) and `SequenceDots.Mark` (the members of an item).

## Behaviour as space shrinks

Measured (`useShrinkLevel`), by the width the row is given:

| Step | Trigger | Result |
|---|---|---|
| 1 | Any width | At most `max` marks: the newest |
| 2 | The marks are wider than the row | The oldest mark goes, one per step, until the rest fit |
| 3 | Room for one mark only | The newest mark stays; it is never dropped |

Growing starts again from all the marks. The row never wraps and never overflows.

## Interaction and accessibility

- Without `onAction` the whole sequence is one image (`role="img"`) named by the summary, so a screen reader reads "Run 1: Passed, Run 2: Failed, …" once and not five unnamed shapes. The summary is of the data: the items up to `max`, also when fewer fit.
- With `onAction` the sequence is a toolbar named by the summary, and each mark is a button named by its `label`: one tab stop, the arrow keys move between the marks (they follow what is drawn in a right-to-left page), `Enter` and `Space` act. A disabled mark is passed over. Each button is a 24px target whatever the size of its drawing.
- A `tooltip` shows on hover, and on keyboard focus of a mark that can be pressed. A mark that cannot be pressed has no focus, so its tooltip is for the pointer; the summary carries the same information.
- Newest last: at the right in a left-to-right page and at the left in a right-to-left one, by the direction of the row alone.
- No value: an em dash, with `noValueLabel` for assistive technology and no mark that would read as an outcome. No error state: the failure belongs to the container that fetched the items (`plan/interaction.md`, "Shows one value handed to it").
- When a resize drops the mark that has the focus, the focus moves to a mark that stays.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Both looks in one component**: `variant="dots"` and `variant="bars"`, as the catalog row asks.
- **Own shapes, not `SeriesMarker`**: the series markers (dot, square, line, patterns) tell series apart in a legend; here the evidence is a solid, a hollow and a half-filled circle. Six shapes, one per tone, drawn by this component.
- **Bars carry tone by fill**: at 4 to 7px wide six fills are possible (solid, outline, stripes, capped, half, dashed). They are small; the summary and the tooltip say the same in words.
- **No `thresholds` prop**: a mark's tone is given by the app per item. An app that colours bars by value calls the public `resolveThreshold` and passes the tone; a second way to give the colour was left out.
- **`max` is a count** (as on `AvatarGroup`), so the scale of the bars is `range`.
- **The summary does not follow the width**: marks dropped for lack of room are still in the text for assistive technology.
- **No `highlightChanges`**: a new item moves every mark; there is no single value to flash.
- **Loading has a name**: an image needs one, so `loadingLabel` ("Loading") stands in while there is no summary.
- **Three vocabularies of shapes, by job** (recorded in the integration pass, 2026-10-11): the outcome marks here (a shape per tone: dot, ring, half, square, diamond, dash), the legend swatches of a series (`src/internal/SeriesMarker.tsx`) and the points drawn at data coordinates in a chart (`src/charts/internal/cues.tsx`, which `Scatter` uses like `LineChart`). They are not merged: an outcome is not a series, and a ring or a half has no meaning as a series marker.
