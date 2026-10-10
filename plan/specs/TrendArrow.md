# TrendArrow

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Shows the direction of a change: up, down or flat, with an optional value.

## Not for

- A status that is not a change: use `StatusIndicator`.
- A value on a scale: use `ValuePill`.
- A series over time: use `Sparkline`.
- A sort direction in a table header: that belongs to `DataTable`.

## Evidence

Green up, red down and a grey dash for movement in ranking tables (1, 5, 27); a number with a green up or red down arrow (4); small arrows beside values in dense rows (6); also 32, 36.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | the arrow: up, down, or a dash for flat | shown |
| `value` | text after the arrow | hidden |

A text for screen readers ("Up", "Down", "No change") sits between them.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `direction` | `up`, `down`, `flat` | Each has its own shape |
| `positive` | `up`, `down` | Which direction is good. Sets the tone: the good direction is green, the other red, `flat` grey. |
| `tone` | `good`, `bad`, `neutral` | Overrides the tone that `positive` gives |

No states.

## Customisation

### 1. Tokens

`--umbra-trend-arrow-good`, `--umbra-trend-arrow-bad`, `--umbra-trend-arrow-neutral`, `--umbra-trend-arrow-gap`. The arrow's size follows the font size around it.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `direction` | see above | — (required) | |
| `positive` | `up` \| `down` | `up` | Which direction is good |
| `tone` | see above | from `direction` and `positive` | |
| `value` | node | — | Text after the arrow |
| `icon` | node | arrow or dash | Replaces the arrow |
| `label` | string | the direction's label | What a screen reader hears for the direction |
| `upLabel` / `downLabel` / `flatLabel` | string | "Up" / "Down" / "No change" | The default labels, for translation |

### 3. Parts

`icon`, `value`.

### 4. Blocks

`TrendArrow.Root`, `TrendArrow.Icon`, `TrendArrow.Value`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Wider than its container | The value truncates with an ellipsis; the arrow keeps its size |

## Interaction and accessibility

- Not interactive.
- The arrow is hidden from screen readers; the label is read in its place, followed by the value ("Up 2.4%").
- The direction never depends on colour: each direction has its own shape. Keep that when replacing `icon`.
- Only the arrow is coloured. The value keeps the text colour around it, so its contrast does not depend on the tone or the context tint.

## Open questions

None.

Resolved 2026-10-10:

- `positive` decides which direction is good; `tone` can still be forced.
- Arrows (not triangles) for up and down and a dash for flat.
- The value is not coloured.
- No `delta` prop that derives the direction from a number: the app knows what counts as flat.
- The arrows are not in the provider's icon map yet (it belongs to another group in this batch); the `icon` prop and part replace them. Adding `trendUp`, `trendDown` and `trendFlat` to the map is a follow-up.
