# StatusIndicator

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Shows the state of one thing: a dot or an icon with a label, or a coloured label.

## Not for

- A category or short code in a chip: use `Tag`.
- A count: use `Badge`.
- The direction of a change: use `TrendArrow`.
- A message that needs attention and an action: use `Banner` or `Toast`.

## Evidence

Coloured icons in table cells whose colour gives the state (4, 9); a coloured dot or face with a word ("Happy", "Very Good", "Peak") (6, 8, 11); a headline word in the status colour (4); coloured dots beside table rows (29); an icon and status text in a key-value row (24); also 12, 16–18.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `indicator` | the dot, or the icon | shown, except in the `label` variant |
| `label` | the text | shown when given |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `status` | `success`, `warning`, `danger`, `info`, `neutral` | `color` replaces the colour; the shape stays |
| `variant` | `dot`, `icon`, `label` | `label` has no mark: the label itself is coloured and bold |
| `pulse` | boolean | A ring grows and fades around the dot |

Each status has its own shape in both marks, so it never depends on colour:

| Status | Dot | Icon |
|---|---|---|
| `success` | circle | check in a circle |
| `warning` | triangle | exclamation in a triangle |
| `danger` | diamond | exclamation in an octagon |
| `info` | square | "i" in a circle |
| `neutral` | ring | minus in a circle |

## Customisation

### 1. Tokens

`--umbra-status-indicator-color`, `--umbra-status-indicator-size` (the dot), `--umbra-status-indicator-gap`, `--umbra-status-indicator-pulse-duration` (default: the global `--umbra-motion-duration-pulse`, 1600ms). The colours are the global semantic colours.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label |
| `status` | see above | `neutral` | |
| `color` | CSS colour | — | Custom colour |
| `variant` | see above | `dot` | |
| `icon` | node | per status | Replaces the icon of the `icon` variant |
| `pulse` | boolean | `false` | |
| `aria-label` | string | — | Names an indicator without a visible label |

### 3. Parts

`indicator`, `label`.

### 4. Blocks

`StatusIndicator.Root`, `StatusIndicator.Indicator` (a dot without children, an icon with), `StatusIndicator.Label`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Wider than its container | The label truncates with an ellipsis; the mark keeps its size |

## Interaction and accessibility

- Not interactive.
- With a label, the mark is hidden from screen readers and the label is read. Without one, `aria-label` names it and the root is an image.
- The status never depends on colour: the shapes above differ, and the `label` variant is text.
- `pulse` is movement: with reduced motion the ring does not grow, so the dot stands still.
- In the `label` variant the semantic colours are used as text. They have 4.5:1 on card surfaces; on a strongly tinted surface use the `dot` or `icon` variant, whose label keeps the text colour.

## Open questions

None.

Resolved 2026-10-11 (review fix pass):

- The pulse lasts `--umbra-motion-duration-pulse` (a new global token, 1600ms), no longer a literal.
- Every block passes `className` and `style` to its element, and every part carries `data-part` with its name as written here (plan/decisions/07-customisation.md). `StatusIndicator.Indicator` dropped `className` and `style` when it held an icon.
- No loading, empty or error state: the indicator is decorative (plan/interaction.md).

Resolved 2026-10-10:

- Dots have a shape per status, not only icons, so a bare dot in a table cell still reads without colour.
- `variant="label"` is the name of the label-only look.
- A custom `color` keeps the shape of `status`; with `variant="icon"` the app usually passes its own `icon` too.
- The pulse is on the `dot` variant only.
- No `size` prop: the mark follows the font size around it, and `--umbra-status-indicator-size` sets the dot.
- The status icons come from the provider's icon map (`success`, `warning`, `danger`, `info`, `neutral`); the `icon` prop and the `indicator` part replace them for one indicator.
- The prop is `status`, not `tone` as on `Tag` or `Banner`: a status is a smaller set (no `accent`) and each has its own shape, which a tone does not.
