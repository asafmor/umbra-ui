# ProgressBar

**Tier** 1 · **Group** Meters and charts · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A bar that fills with a value: the progress of a task, or a measured level such as a budget or a capacity. It fills the width of its container, including a table cell.

## Not for

- A position on a scale of ticks, a range or a comparison: use `LevelMeter`.
- A value that grows left or right of a centre: use `DivergingMeter`.
- A value the user sets: use `Slider`.
- A busy button: `Button` has `loading`.

## Evidence

Thin pink bar under a budget value, about 95% and 55% (1, 27); the same in violet (2, 19); full bar used as a capability meter (20); a bar whose colour follows its length, green to red, and an empty one (22); thin green and magenta "intensity" bars with no label or value (37, 38); a full white bar (40); segmented dashes, 3 of 6 amber and 6 of 6 green (23). The bar in `plan/reference/index.html` (6px, pill ends, primary-to-accent gradient) is the look of the plain variant.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | the name of the bar | shown when `label` is set |
| `value` | the value as text | hidden; shown by `showValue` or `valueLabel` |
| `track` | the bar: one cell per segment | shown |
| `fill` | the coloured part of a cell; one per stacked part | shown |
| `target` | a tick at the goal value | shown when `target` is set |
| `skeleton` | stands in for the track while loading | shown when `loading` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| shape | plain, segmented (`segments`), stacked (`stack`) | Plain in the default tone carries the reference gradient; the others are flat |
| `kind` | `progress`, `meter` | `role="progressbar"` for a task, `role="meter"` for a level |
| `tone` | `default`, `neutral`, `info`, `success`, `warning`, `danger`, `ramp-1` to `ramp-5` | |
| `thresholds` | `true` or a list of `{ from, tone, label? }` | Colour by fill level. Each band also has a pattern (hatched; the top band is solid), and its `label` joins the value text. `invert` swaps the tones and patterns. |
| `size` | `thin` (4px), `default` (6px), `thick` (18px) | |
| `layout` | `block`, `inline` | `inline` puts label, bar and value on one line, for cells and rows |
| `valuePlacement` | `outside`, `inside` | `inside` needs `size="thick"` |

States: `indeterminate`, `loading`, out of range (`data-out-of-range="under"` or `"over"`), value hidden by lack of space (`data-value-hidden`).

## Customisation

### 1. Tokens

`--umbra-progress-bar-track`, `--umbra-progress-bar-fill`, `--umbra-progress-bar-fill-end` (the end of the gradient; defaults to the fill once that is set), `--umbra-progress-bar-height`, `--umbra-progress-bar-radius`, `--umbra-progress-bar-segment-gap`, `--umbra-progress-bar-target`, `--umbra-progress-bar-target-width`, `--umbra-progress-bar-min-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | number | sum of `stack`, else 0 | |
| `min` / `max` | number | 0 / 100 | |
| `kind` | see above | `progress` | |
| `label` | node | — | The name, shown above or beside the bar |
| `aria-label` | string | — | Names a bar with no visible label |
| `showValue` | boolean | `false` | Shows the value as text |
| `valueLabel` | node | — | Replaces the formatted value, and shows it |
| `valuePlacement` | see above | `outside` | |
| `formatValue` | `(value, { min, max, percent }) => string` | rounded percent | Used for the visible value, the stacked parts, the target and `aria-valuetext` |
| `tone` | see above | `default` | |
| `thresholds` / `invert` | see above / boolean | — / `false` | |
| `size` | see above | `default` | |
| `layout` | see above | `block` | |
| `segments` | number \| number[] | — | A count of equal segments, or the values where a segment ends |
| `stack` | `{ id, label, value, tone?, color? }[]` | — | Several coloured parts, one after another |
| `target` / `targetLabel` | number / string | — / "Target" | A tick at a goal value, and its name for assistive technology |
| `indeterminate` | boolean | `false` | Progress of unknown length |
| `loading` | boolean | `false` | Skeletons in place of the bar and the value |
| `tooltip` | boolean | `true` | The exact value in a tooltip on hover |

### 3. Parts

`label`, `value`, `track`, `fill`, `target`, `skeleton`. The `fill` function receives `{ fraction, tone, color, pattern, indeterminate, id }`.

### 4. Blocks

`ProgressBar.Root`, `ProgressBar.Label`, `ProgressBar.Value`, `ProgressBar.Track`, `ProgressBar.Fill`, `ProgressBar.Target`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Label, value and (inline) the shortest bar do not fit side by side | The value hides. It stays in `aria-valuetext`. |
| 2 | Still too narrow | The label truncates with an ellipsis |
| 3 | Any width | The bar stays, never shorter than `--umbra-progress-bar-min-width` (24px) in the inline layout |

A value drawn inside a thick bar hides when the bar is shorter than 72px. Everything returns when the container grows.

## Interaction and accessibility

- Not focusable; no keyboard interaction.
- Built on React Aria's `ProgressBar` and `Meter`. The visible label names it; without one, `aria-label` does.
- `aria-valuetext` is the formatted value, then the threshold label, the stacked parts ("Team A 40%") and the target ("Target: 80%"). These are only drawn, so the text carries them.
- Colour is never the only cue: threshold bands and stacked parts differ by pattern, and a threshold label is shown with the value.
- A value outside the scale clamps the bar and `aria-valuenow`; the text keeps the real value ("120%").
- An indeterminate bar has no `aria-valuenow`. Its fill travels along the bar; with reduced motion it stands still, covers the bar and is striped.
- While loading, the root is not a progress element; it sets `aria-busy`.
- Hovering the bar shows the same text as `aria-valuetext` in a tooltip (500ms delay, Escape closes it). `tooltip={false}` turns it off. The bar is still not a tab stop; if the app makes it or a control around it focusable, keyboard focus shows the tooltip too.

## Open questions

None.

Resolved 2026-10-10:

- The stacked data prop is `stack`, not `parts`: every component uses `parts` for the customisation layer.
- A threshold is `{ from, tone, label? }`; the highest `from` not above the value wins. `thresholds={true}` is thirds of the scale: danger, warning, success, with no labels (a built-in label would need translating).
- `invert` swaps the tones and patterns of the bands; the labels stay with their bands.
- The second cue of a threshold is a pattern on the fill, plus the band's label in the value text when one is given.
- Tones include the five steps of the value ramp (`ramp-1` to `ramp-5`), which `tokens.json` defines for this use.
- A stacked bar defaults to cycling tones (default, info, success, warning, neutral) and patterns (solid, diagonal, vertical, reverse).
- The default text is a rounded, unclamped percentage. No number formatting options: `formatValue` covers them.
- `valuePlacement="inside"` applies to the thick size only; the text sits on a dark chip so it is readable on every fill.
- `layout="inline"` is the in-cell form. There is no separate cell component.
- The gradient belongs to the plain variant in the default tone; setting `--umbra-progress-bar-fill` alone makes it flat.
- Heights of 4, 6 and 18px are literals: the spacing scale has no 6px step.
