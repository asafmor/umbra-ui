# EntityIcon

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A small mark that identifies an entity next to its name: a logo, a flag or a category glyph. When there is no image or icon, it generates a coloured square with the entity's letters. It can render the name beside the mark.

## Not for

- A person: use `Avatar`.
- An icon that triggers an action: use `IconButton`.
- A status or a value shown by colour: use `StatusIndicator` or `ValuePill`. The generated colour identifies; it does not carry data.

## Evidence

Small marks of about 14px before names in table rows and lists, and about 32px in bars and headers (1, 12, 24); about 50–56px in banners and wide rows (13, 16); flags before country names and codes (5, 6, 15), and a rectangular flag in place of a round mark (38). Every mark in the source is an image; the generated mark is the library's own, so an app without images still gets distinct marks. No asset from the source is used.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `mark` | the image, or the icon, or the generated letters | shown |
| `label` | text next to the mark | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | none, `xs`, `sm`, `md`, `lg`, `xl` | 14 / 18 / 24 / 32 / 56px. With no size the mark is 1.25em, like an icon in text. |
| `shape` | `rounded`, `circle`, `square` | `square` has no radius, for flags |
| kind of mark | image, icon, generated | Chosen in that order from `src`, `icon`, `name` |

States: image failed (falls back to the icon, then to the generated mark).

## Customisation

### 1. Tokens

`--umbra-entity-icon-size`, `--umbra-entity-icon-radius`, `--umbra-entity-icon-gap`, `--umbra-entity-icon-bg` and `--umbra-entity-icon-fg` (the generated mark; setting the background turns the per-name colour off).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `src` | string | — | An image |
| `icon` | node | — | An icon, used when there is no image |
| `name` | string | — | The entity: names the mark, and gives the letters and colour of the generated mark |
| `alt` | string | `name` | Accessible name of the mark, when it differs |
| `label` | node \| `true` | — | Text next to the mark; `true` shows `name` |
| `size` | see above | follows the text | |
| `shape` | see above | `rounded` | |
| `letters` | 1 \| 2 | 1 up to `sm`, 2 from `md` | Letters in the generated mark |
| `color` | CSS colour | derived from `name` | Background of the generated mark. White text must keep 4.5:1 on it. |

### 3. Parts

`mark`, `label`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`EntityIcon.Root`, `EntityIcon.Mark`, `EntityIcon.Label`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The label does not fit | The label truncates with an ellipsis. The mark keeps its size. |
| 2 | Narrower than the mark | The mark is clipped by its container; it never shrinks. |

## Interaction and accessibility

- Not interactive.
- Without a label the mark is `role="img"`, named by `alt` or `name`. With a label the mark is decorative and hidden from assistive technology, so the name is read once.
- The generated colour is computed from the name: the same name always gives the same colour. White letters on it keep at least 4.5:1 for every name (unit-tested); the letters are the cue that is not colour.
- An image that fails to load falls back at once; a new `src` is tried again.

## Open questions

None.

Resolved 2026-10-10:

- The colour is a hash of the lower-cased name mapped to a hue at 60% saturation; the lightness starts at 42% and is lowered until white text reaches 4.5:1. It does not use the context tint, so an entity keeps its colour on every page.
- Letters are the first letters of the first and last words. One letter by default up to `sm`, where two would be unreadable.
- `label` is a prop of this component (with truncation), as the task set; there is no separate `EntityLabel`.
- With no `size` the mark scales with the font, so it fits table cells, list rows and headings without a prop.
- A given `color` is the app's responsibility for contrast; the library only checks the colours it generates.
