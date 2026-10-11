# MediaCard

**Tier** 2 · **Group** Data display · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A card for one article or item: a picture, a title, a few quiet details, and its own link. Three looks: `hero` (large picture, large title), `compact` (small picture at the side) and `pair` (two sides around a centre).

## Not for

- A container for any content with a header and a scrolling body: use `Card`.
- A row of a list: use `ListItem` (its `pair` variant is the row form of this card's `pair`).
- One large value that navigates: use `SummaryTile`.
- Two sides compared on several metrics: use `Comparison`.

## Evidence

Hero: a 16:9 picture above a bold title of one or two lines, sometimes a two-line excerpt, and a row with a clock and an age, a category, a tag and an arrow button at the end (1, 2, 5, 27, 30, 31). Compact: a square thumbnail of about 48px beside a two-line title and the same row, the row cut short with an ellipsis when narrow (1, 2, 5, 27, 31). A small card with a date at the start and a status at the end of its first line, then two entities each with a mark and a value, in a strip of ten about 110 to 170px wide (5, 28, 30). No picture, name or sentence of the source is used: the library ships no image, and a picture that is missing is a drawn placeholder.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `image` | the picture: any node, an `src`, or the drawn placeholder | shown in `hero` and `compact` |
| `title` | the headline, a heading; the card's link when it has one | shown |
| `description` | a paragraph, clamped to a number of lines | hidden |
| `meta` | a quiet line: a time, a source | hidden |
| `category` | a category: text becomes a `Tag` | hidden |
| `actions` | controls of the card, at the end of the last line | hidden |
| `pair` | `pair` only: the two sides and the centre | shown when `opposite` is set |
| `skeleton` | the placeholders while loading | shown when `loading` |

`meta`, `category` and `actions` share one line, the `footer`: under the text in `hero` and `compact`, above the two sides in `pair`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `compact` (default), `hero`; `pair` is set by `opposite` | `compact`: the picture is a square at the start, the text beside it. `hero`: the picture is above the text at 16:9, and takes the room that is left in a taller slot. `pair`: no picture and no heading; the first side is `title` with `side`, the second is `opposite`, `center` between them. |
| `imagePlacement` | `above` (default), `behind` | `hero` only. `behind`: the picture fills the card and the text lies on a scrim at the bottom. |

States: hover and pressed (only when the card is a link or a button), focus, loading.

## Customisation

### 1. Tokens

`--umbra-media-card-bg`, `--umbra-media-card-border`, `--umbra-media-card-radius`, `--umbra-media-card-padding`, `--umbra-media-card-gap`, `--umbra-media-card-color`, `--umbra-media-card-secondary-color`, `--umbra-media-card-title-font`, `--umbra-media-card-thumb-size` (the compact picture, 56px), `--umbra-media-card-image-ratio` (16 / 9), `--umbra-media-card-image-min-height` (48px: below it the picture goes), `--umbra-media-card-scrim`, `--umbra-media-card-placeholder-bg`, `--umbra-media-card-placeholder-fg`, `--umbra-media-card-focus-offset` (inwards, because the card clips; passed on as the private `--focus-offset`).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `variant` | see above | `compact` | |
| `imagePlacement` | see above | `above` | |
| `image` | node | — | The picture: an `<img>`, an `<svg>`, a chart. Wins over `src`. |
| `src` / `alt` | string | — / "" | The picture's address and what it shows. A missing or failed picture is the placeholder. |
| `title` | node | — | The headline; in `pair`, the first side's title |
| `headingLevel` | 2–6 | 3 | |
| `titleLines` / `descriptionLines` | number | 2 / 2 | The most lines before an ellipsis |
| `description` | node | — | |
| `meta` | node | — | |
| `category` | node | — | Text becomes a small `Tag` (filled when the picture is behind) |
| `actions` | node | — | |
| `side` | `{ leading?, meta? }` | — | `pair`: the mark and the value of the first side |
| `opposite` | `{ title, leading?, meta? }` | — | `pair`: the second side. Sets the variant. |
| `center` | node | — | `pair`: what stands between the sides |
| `href` / `renderLink` / `onPress` | string / function / function | — | Makes the whole card a link (through the app's router with `renderLink`, which receives `LinkRenderProps`) or a button |
| `loading` | boolean | `false` | Skeletons in the card's final layout |
| `aria-label` | string | — | Names a card that has no title |
| `size`, `priority`, `minWidth`, `minHeight`, `label` | slot props | — | As a child of `Columns`, `Stack` or `HorizontalScroller` (`plan/layout.md`) |

### 3. Parts

`image`, `title`, `description`, `meta`, `category`, `actions`, `pair`, `skeleton`.

### 4. Blocks

`MediaCard.Root`, `MediaCard.Image` (`src`, `alt`, or children), `MediaCard.Content`, `MediaCard.Title` (`headingLevel`, `lines`, `href`, `renderLink`, `onPress`), `MediaCard.Description` (`lines`), `MediaCard.Footer`, `MediaCard.Meta`, `MediaCard.Category`, `MediaCard.Actions`, `MediaCard.Pair` (`side`, `opposite`, `center`, and the link props).

## Behaviour as space shrinks

The card fills its slot. Text never leaves it: the title and the description wrap to their number of lines and end in an ellipsis, the meta line is one line with an ellipsis.

By the card's width (a container query):

| Step | Trigger | Result |
|---|---|---|
| 1 | Narrower than 220px | `description` and `category` hide |
| 2 | Narrower than 160px | The picture of a `compact` card and `meta` hide; the title is what is left |

A `pair` card follows the `pair` row of `ListItem`: the marks hide under 200px and the values under 140px of its row.

By the card's height, when its slot is shorter than its content (measured, `useFitLevel`; a card that is as tall as its content is never short):

| Step | Trigger | Result |
|---|---|---|
| 1 | Shorter than the content | `hero`: the picture gives up height, down to 48px |
| 2 | Still too short | `description` is one line |
| 3 | Still too short | `description` hides |
| 4 | Still too short | `meta` hides (and its line, when nothing else is on it) |
| 5 | Still too short | The picture hides. With the picture behind, it stays as the background and only its reserved room goes. |

Each step is a function of the size alone: growing starts again from everything, and a size gives the same result on the way down, on the way up and on a fresh load. The steps restart when a web font arrives.

## Interaction and accessibility

- The root is an `article` named by its title (in `pair`, by the text of its two sides), or by `aria-label`.
- **One control for the card, no control inside another.** With `href` or `onPress` the title is a link or a button whose hit area is stretched over the whole card (the way `ListItem` does it); a `pair` card has no heading, so it gets a link or button of its own, named by the two sides, that covers the card. Controls in `actions` lie above that area and stay separate, valid controls: a press on one does not open the card. Tab order: the card, then its actions.
- The focus ring is drawn around the card, inside its edge, because the card clips.
- A title cut short shows all of it in a tooltip, on hover and on keyboard focus of the card's link.
- **Text over a picture** (`imagePlacement="behind"`): the text lies on a scrim (`color.base.scrim`, 72% of near black) and all of it takes the primary text colour, which gives 7:1 or more over a white picture; the secondary colour would give 4.1:1, so it is not used there. A text `category` is a filled `Tag`, which has its own background. The scrim fades out above the text, where there is no text. `tests/visual/data-tier2.spec.ts` holds 4.5:1 for every text on every tint.
- A picture given with `alt` is an image with that name; without it, it is decoration. The placeholder is decoration.
- Hover lightens the card one step and press darkens it, only when the card is a link or a button; with the picture behind, the picture lightens.
- Loading sets `aria-busy`; the skeleton has the picture's place and the text's lines, so nothing moves when the content arrives.
- Right to left: the picture of a compact card is at the right, the actions at the left, and the first side of a pair at the right.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **The third variant is `pair`, in `ListItem`'s words** (`opposite`, `center`, a side's `title`, `leading` and `meta`), and it is a thin composition: `MediaCard.Pair` is the `pair` row of `ListItem` built from its blocks, so its layout and its narrow steps are the row's. The card adds the footer line above it, the border, the link over the whole card, the slot and the loading state.
- **The details are one line**: time and source (`meta`), then the category, then the actions at the end, as in the evidence. A category above the title was not added.
- **A missing picture is a placeholder**, not an empty card: `parts={{ image: null }}` is how a card has no picture.
- **Height steps are measured.** A container query on height needs a container with a height of its own, which a card in flowing content does not have; one small hook (`src/internal/useFitLevel.ts`, the vertical counterpart of `useShrinkLevel`) does it for this card and for `Comparison`.
- **The order of the height steps**: description, then meta, then the picture, as the brief states. A card of about 100px therefore shows its title alone.
- **`hero` grows its picture** in a slot taller than the content, so the card fills its slot like every layout child; `size="content"` keeps the 16:9 picture.
- **No `selected` and no `disabled` state**: nothing in the evidence, and a card in a selectable collection belongs to the collection that owns the selection.
