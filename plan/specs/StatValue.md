# StatValue

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

One large value with its label, for the number a card or header is about. It can carry a unit, a trend, a secondary line and a meter.

## Not for

- Several label and value pairs of equal weight: use `KeyValueList`.
- A clickable summary that navigates: use `SummaryTile`.
- A small coloured value inside a row: use `ValuePill`.
- A chart: use the `umbra-ui/charts` entry.

## Evidence

Budget cards: an icon and label, a large pink value, a secondary line and a bar (1, 2, 7, 27); a number with a trend arrow and a caption (4, 11, 18); an icon, a large number and a caption, three in a row (5); label over value, centred, in a profile header (23); plain large counts (6, 7). The reference screen shows the look and the shrink order ("Project budget", "Payroll budget").

## Anatomy

| Part | Content | Default |
|---|---|---|
| `label` | what the value is, with the `icon` before it | shown when `label` is set |
| `icon` | a small icon | hidden |
| `value` | the value | shown, always |
| `unit` | after the value, smaller | hidden |
| `trend` | a node after the value, for example a `TrendArrow` | hidden |
| `caption` | a secondary line | hidden |
| `meter` | a node under the caption, for example a `ProgressBar` | hidden |
| `skeleton` | stands in for the value while loading | hidden |

The value, unit and trend share one line (the `Figure` block).

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | `md`, `lg`, `xl` | The title font (19px), the display font (28px), and 40px |
| `tone` | `default`, `accent`, `success`, `warning`, `danger`, `muted` | Colour of the value only |
| `align` | `start`, `center`, `end` | |

States: `loading`.

## Customisation

### 1. Tokens

`--umbra-stat-value-font`, `--umbra-stat-value-font-small` (the value one step down), `--umbra-stat-value-fg`, `--umbra-stat-value-label-fg`, `--umbra-stat-value-unit-fg`, `--umbra-stat-value-caption-fg`, `--umbra-stat-value-gap`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` | node | — | |
| `label` | node | — | |
| `icon` | node | — | Before the label |
| `unit` | node | — | |
| `caption` | node | — | |
| `trend` | node | — | |
| `meter` | node | — | |
| `size` | see above | `md` | |
| `tone` | see above | `default` | |
| `align` | see above | `start` | |
| `loading` | boolean | `false` | Skeletons in place of the value, caption and meter |
| `aria-label` | string | — | Names a stat that has no label |
| `highlightChanges` | boolean | off | The value flashes softly once when it changes: green when a number rose, red when it fell, neutral otherwise, with a ▲ or ▼ sign as the cue that is not colour. No flash under reduced motion; the sign stays for four seconds. Never counted up or down. |
| `increasedLabel` / `decreasedLabel` | string | "increased" / "decreased" | What a screen reader hears with the sign |

### 3. Parts

`icon`, `label`, `value`, `unit`, `trend`, `caption`, `meter`, `skeleton`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`StatValue.Root`, `StatValue.Label`, `StatValue.Figure`, `StatValue.Value`, `StatValue.Unit`, `StatValue.Trend`, `StatValue.Caption`, `StatValue.Meter`.

## Behaviour as space shrinks

The slot is the nearest size container: the `Card` or `Slot` the stat sits in. The steps are container queries on its height.

| Step | Slot height at most (`md` / `lg` / `xl`) | Result |
|---|---|---|
| 1 | 150 / 158 / 170px | The caption hides |
| 2 | 126 / 134 / 146px | The meter hides |
| 3 | 110 / 118 / 130px | The label hides, and the value goes one font step down (to 16 / 19 / 28px) |

- The value never hides.
- When the stat is narrower than its value, the value is cut with an ellipsis; the unit and trend keep their width. The label and caption truncate too.
- The heights are those of a card with a header that holds one stat. A stat that shares a short card with other content should hide pieces itself, through `parts`.

## Interaction and accessibility

- Not interactive.
- The root is a `group` named by its label, or by `aria-label`. A label hidden by step 3 still names it.
- `loading` sets `aria-busy`; the label stays, so nothing moves when the value arrives.
- `tone` is colour only. A tone that carries meaning needs a second cue: the `trend` node (an arrow and a number), an icon, or the label.
- Every tone keeps 4.5:1 on the card surfaces.
- No animated counting; a changed value appears at once.

## Open questions

None.

Resolved 2026-10-10:

- 2026-10-11: `highlightChanges` (plan/interaction.md, "Live updates"), the same as on `DataTable` and from the same code: `src/internal/useChangeHighlight.ts` and `ChangeHighlight.tsx`. `StatValue.Value` takes the same props, and `changeValue` when its content is a formatted text: only numbers have a direction. Tokens: `--umbra-change-up`, `--umbra-change-down`, `--umbra-change-neutral`.
- Hide order: caption, then meter, then label, as the task set. (The reference screen hides the meter and label together; the library separates them so the bar goes before the words that name the number.)
- The value scales down once, at the last step, and never hides.
- The steps use the height of the nearest size container rather than measuring the stat: no JavaScript, and it matches the reference screen. The thresholds cannot be tokens, because a container query cannot read a CSS variable.
- `xl` is 40px. There is no font token above `display`, so the size lives in the component token `--umbra-stat-value-font`; a `displayLarge` token can replace it if another component needs the size.
- `icon` was added to the task's list: the source shows one before most labels.
- The default tone is the primary text colour; the pink of the source's budget values is `tone="accent"`.
- `trend` and `meter` are nodes, so the stat does not depend on `TrendArrow` or `ProgressBar`.
- No `highlightChanges` yet (the opt-in flash in `interaction.md`); it comes with the live-update work.
