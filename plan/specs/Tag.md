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

`--umbra-tag-bg`, `--umbra-tag-fg`, `--umbra-tag-border`, `--umbra-tag-radius`, `--umbra-tag-padding`, `--umbra-tag-gap`, `--umbra-tag-font`, `--umbra-tag-stripe-width`, `--umbra-tag-focus-color` (the ring of the remove button on a `solid` tag; default: the tag's text colour).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label. `null`, `undefined` or an empty text shows `emptyLabel` |
| `emptyLabel` | node | "—" | Shown when there is no label |
| `tone` | see above | `neutral` | |
| `color` | CSS colour | — | Custom colour; replaces `tone` |
| `variant` | see above | `outline` | |
| `size` | `default` \| `small` | `default` | |
| `stripe` | tone name \| CSS colour | — | Edge stripe |
| `stripeLabel` | string | — | What the stripe means: read by screen readers, and shown in the library tooltip on hover and while the remove button has keyboard focus |
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
- When the app removes the tag, the focus moves to the remove button of the next tag beside it, else of the previous one, else to the element that holds the tags (which gets `tabindex="-1"`). It never falls to the page.
- The focus ring of the remove button is drawn inside it, and takes the text colour on a `solid` tag, where pink can fall under 3:1.
- Text contrast is at least 4.5:1 in every tone and variant: `outline` uses the primary text colour, `subtle` a light mix of the tone, `solid` dark text on the semantic colours and white on violet. For a custom `color`, the text of a `solid` tag is chosen (light or dark) for contrast when the colour is hex or `rgb()`.
- The tone is never the only cue: the label says what the tag means. A `stripe` is colour only, so give `stripeLabel` when it carries meaning.

## Open questions

None.

Resolved 2026-10-11 (review fix pass):

- **Focus after removal.** `Tag.Remove` looks at its sibling tags before it calls `onPress`, and moves the focus one frame later, only if its tag is gone and the focus fell to the page. No wrapper component is needed. Limits: it looks at sibling tags only (tags wrapped one by one fall back to their holder), and a tag removed later than the next frame (after a server answer) is the app's to handle.
- **The stripe label is the library tooltip**, not the native `title`, which the keyboard cannot reach. It shows on hover, and while the remove button has keyboard focus; `Escape` dismisses it. A tag without a remove button is not focusable, so there the text for screen readers (always present, in brackets after the label) is the keyboard user's equivalent. While the label is truncated its own tooltip shows instead, so two never overlap.
- **No value.** A tag is a single-value component (plan/interaction.md): it has `loading`, and a tag without a label shows `emptyLabel` ("—") instead of an empty chip. No error state.
- On a `solid` tag the ring of the remove button takes the text colour through the button's own outline (`--umbra-tag-focus-color`). The tag no longer declares the global `--umbra-focus-color` on itself, which overrode a value an app had set on an ancestor.
- The hover and press tints of the remove button use the shared steps `--umbra-state-hover-darken` and `--umbra-state-press-darken`.
- Every block passes `className` and `style` to its element, and every part carries `data-part` with its name as written here (plan/decisions/07-customisation.md). `Tag.Icon` dropped them before. The placeholder shown while `loading` carries `data-part="skeleton"`.

Resolved 2026-10-10:

- Three variants (`outline`, `subtle`, `solid`) instead of outline and solid only: the source shows all three.
- The stripe is a prop on any variant (`stripe`), not a fourth variant, so a solid code can carry it as in the source.
- `stripe` and `color` take any CSS colour; `stripe` also takes a tone name.
- A tag is not interactive (no `onPress`, no selected state): selectable chips belong to `SegmentedFilter`.
- The built-in remove icon is the provider's `close` icon.
- A truncated label shows its full text in a tooltip, on hover and on keyboard focus of the tag when it is a control. It is measured at that moment, so a label that fits has none (integration pass, `src/internal/TruncatedText.tsx`).
