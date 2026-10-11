# ValuePill

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A value coloured by where it falls on a five-step ramp, so a column of numbers can be scanned for good and bad.

## Not for

- A count of new things: use `Badge`.
- A category or code: use `Tag`.
- A value shown as a length: use `ProgressBar` or `LevelMeter`.
- A change over time: use `TrendArrow`.

## Evidence

Rating pills in table cells, green for high, grey for middling, a grey dash for no data (4, 9, 10, 23, 24); square value chips in dense rows, coloured in several steps (6); a round letter grade (7). `plan/tokens.json` holds the ramp (`valueRamp` 1 to 5).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `value` | the formatted value, or `emptyLabel` | shown |
| `level` | five small bars, as many filled as the ramp step | hidden; shown by `showLevel` |
| `skeleton` | placeholder while `loading` | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| level | 1 to 5, or none | Computed from `value`. 1 is the worst step of the ramp, 5 the best. |
| `ramp` | `higher-is-better`, `lower-is-better` | Which end of the scale gets step 5 |
| `shape` | `pill`, `square`, `circle` | `square` for dense rows, `circle` for one or two characters |
| `size` | `small`, `default`, `large` | `small` fits a compact table row |

States: no value (`null`, `undefined` or not a number: neutral surface, `emptyLabel`), `loading`.

How the level is found:

- With `min` and `max`: the scale is split into five equal bands. Values outside take the end bands.
- With `thresholds` (ascending, at most four): a value at a threshold belongs to the band above it. Four thresholds give the five steps. Fewer spread over the whole ramp: one threshold gives steps 1 and 5, two give 1, 3 and 5.

## Customisation

### 1. Tokens

`--umbra-value-pill-bg`, `--umbra-value-pill-fg`, `--umbra-value-pill-radius`, `--umbra-value-pill-padding`, `--umbra-value-pill-min-width`, `--umbra-value-pill-font`. The colour of each step is the global `--umbra-color-value-ramp-1` to `-5`, which can be set on any subtree.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | number \| null | — (required) | The value |
| `min` / `max` | number | `0` / `100` | The scale |
| `thresholds` | number[] | — | Explicit boundaries; replace `min` and `max` |
| `ramp` | see above | `higher-is-better` | |
| `formatValue` | function of the value, returns a node | the number | What is shown |
| `shape` | see above | `pill` | |
| `size` | see above | `default` | |
| `showLevel` | boolean | `false` | Adds the level marker |
| `levelLabel` | function of (level, steps) | "Level 4 of 5" | What a screen reader hears for the marker |
| `emptyLabel` | node | "—" | Shown when there is no value |
| `loading` | boolean | `false` | Shows a placeholder of the pill's size |
| `highlightChanges` | boolean | off | The value flashes softly once when it changes: green when a number rose, red when it fell, neutral otherwise, with a ▲ or ▼ sign as the cue that is not colour. No flash under reduced motion; the sign stays for four seconds. Never counted up or down. |
| `increasedLabel` / `decreasedLabel` | string | "increased" / "decreased" | What a screen reader hears with the sign |

### 3. Parts

`value`, `level`, `skeleton`.

### 4. Blocks

`ValuePill.Root` (takes `level` directly), `ValuePill.Value`, `ValuePill.Level`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The pill is wider than its container | The value truncates with an ellipsis; the level marker keeps its size. The pill never grows past its container. |

## Interaction and accessibility

- Not interactive.
- The colour is never the only cue: the value itself is always shown. `showLevel` adds a marker that reads without colour (bars, plus "Level 4 of 5" for screen readers), for places where the colour means more than the number says, or for colour-blind use.
- The text is dark on every ramp step, at 4.5:1 or more; a unit test checks each step against `plan/tokens.json`.
- The pill without a value uses the secondary text colour on a neutral surface (above 4.5:1).

## Open questions

None.

Resolved 2026-10-11 (review fix pass):

- The default `emptyLabel` is the em dash ("—"), the same as on every single-value component (plan/interaction.md); it was an en dash. No error state.
- Every block passes `className` and `style` to its element, and every part carries `data-part` with its name as written here (plan/decisions/07-customisation.md). The placeholder shown while `loading` carries `data-part="skeleton"`.

Resolved 2026-10-10:

- 2026-10-11: `highlightChanges` (plan/interaction.md, "Live updates"), the same as on `DataTable` and from the same code: `src/internal/useChangeHighlight.ts` and `ChangeHighlight.tsx`. The number itself is compared, not the formatted text, so `formatValue` keeps the direction. Tokens: `--umbra-change-up`, `--umbra-change-down`, `--umbra-change-neutral`.
- `ramp` takes `higher-is-better` or `lower-is-better`.
- Fewer than four thresholds spread over the whole ramp, so a single pass mark gives the two end colours.
- A value at a threshold belongs to the band above it.
- The level marker is five bars of rising height, not a number or a letter.
- Three shapes, so the source's rating pill, value chip and round grade are one component.
- No value is a neutral pill with `emptyLabel`, not nothing, so table columns stay aligned.
- Level text for screen readers is only added with `showLevel`; without it the value alone is read.
