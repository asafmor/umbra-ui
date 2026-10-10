# Tag

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A small label chip: a category, a short status code, or a value with an icon.

## Not for

- A number on the corner of something: use `Badge`.
- A number coloured by how good it is: use `ValuePill`.
- A status with a dot or icon and a sentence-like label: use `StatusIndicator`.
- A choice among options: use `SegmentedFilter`. A tag is not selectable.

## Evidence

Outline category tags on message rows (1, 2, 25, 27); solid status codes in table cells (4, 5); a solid code with a second colour on its trailing edge (5, 6); bordered value chips with a leading icon (6, 7); grey chips with a flag (24); tinted rating tags (25). `plan/reference/index.html` shows the outline tag in this library's look.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | leading icon, avatar or flag (any node) | hidden |
| `label` | the text | shown |
| `remove` | a button that removes the tag | shown when `onRemove` is set |
| `skeleton` | placeholder while `loading` | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `tone` | `neutral`, `info`, `success`, `warning`, `danger`, `accent` | `accent` is the fixed violet. `color` replaces it with any CSS colour. |
| `variant` | `outline`, `subtle`, `solid` | `outline`: coloured border, primary text (the neutral outline takes the context tint, as in the reference). `subtle`: tinted fill. `solid`: filled, bold, for short codes. |
| `size` | `default`, `small` | `small` fits a compact table row |
| `stripe` | a tone name or a CSS colour | A second colour on the trailing edge |

States: `loading`; on the remove button: hover, pressed, focus.

## Customisation

### 1. Tokens

`--umbra-tag-bg`, `--umbra-tag-fg`, `--umbra-tag-border`, `--umbra-tag-radius`, `--umbra-tag-padding`, `--umbra-tag-gap`, `--umbra-tag-font`, `--umbra-tag-stripe-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label |
| `tone` | see above | `neutral` | |
| `color` | CSS colour | — | Custom colour; replaces `tone` |
| `variant` | see above | `outline` | |
| `size` | `default` \| `small` | `default` | |
| `stripe` | tone name \| CSS colour | — | Edge stripe |
| `stripeLabel` | string | — | What the stripe means: read by screen readers, shown as a tooltip |
| `icon` | node | — | Leading icon |
| `onRemove` | function, no arguments | — | Shows the remove button |
| `removeLabel` | string | "Remove" | Name of the remove button; a text label is added ("Remove Region 2") |
| `loading` | boolean | `false` | Shows a placeholder of the tag's size |

### 3. Parts

`icon`, `label`, `remove`, `skeleton`.

### 4. Blocks

`Tag.Root`, `Tag.Icon`, `Tag.Label`, `Tag.Remove`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The tag is wider than its container | The label truncates with an ellipsis. The icon and the remove button keep their size. The tag never grows past its container. |

## Interaction and accessibility

- A tag is text; it is not focusable. Only the remove button is a tab stop; `Enter` and `Space` press it.
- The remove button is named `removeLabel` plus the label when the label is a string.
- The focus ring of the remove button is drawn inside it, and takes the text colour on a `solid` tag, where pink can fall under 3:1.
- Text contrast is at least 4.5:1 in every tone and variant: `outline` uses the primary text colour, `subtle` a light mix of the tone, `solid` dark text on the semantic colours and white on violet. For a custom `color`, the text of a `solid` tag is chosen (light or dark) for contrast when the colour is hex or `rgb()`.
- The tone is never the only cue: the label says what the tag means. A `stripe` is colour only, so give `stripeLabel` when it carries meaning.

## Open questions

None.

Resolved 2026-10-10:

- Three variants (`outline`, `subtle`, `solid`) instead of outline and solid only: the source shows all three.
- The stripe is a prop on any variant (`stripe`), not a fourth variant, so a solid code can carry it as in the source.
- `stripe` and `color` take any CSS colour; `stripe` also takes a tone name.
- A tag is not interactive (no `onPress`, no selected state): selectable chips belong to `SegmentedFilter`.
- The built-in remove icon is the provider's `close` icon.
- No automatic tooltip with the full text of a truncated label; the app can wrap the tag in a `Tooltip` when that exists.
