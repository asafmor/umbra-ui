# ListItem

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

The content of one row of a list: a title with optional lines above and below, and leading and trailing pieces. Used inside `List` (as `List.Item`) and by itself.

## Not for

- A row of a table with columns: use `DataTable`.
- A label and a value: use `KeyValue`.
- A menu entry: use `Menu`.
- A clickable summary with one large value: use `SummaryTile`.

## Evidence

Message rows (1, 2, 13–16, 25, 27, 28): sender (small) above the title, tag top right, time bottom right; unread is bold with a dot before the time, read is dimmed, selected has a bar at the left edge; a background tint or stripe marks a category. Person rows with an avatar, a name and a role (14). Leaderboard rows with an avatar, a name and a value (24, 27, 29). Two-sided rows (24, 30, 33): a name, an icon and an optional value on each side of a small centre box, mirrored, with the centres in one column down the list. A ring or icon beside a bold title and a paragraph of two or three lines (8). The reference screen (`plan/reference/index.html`, `.item`) shows the message row.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `leading` | avatar or icon | hidden |
| `overline` | small line above the title | hidden |
| `title` | the main line | shown |
| `description` | second line under the title | hidden |
| `unread` | a dot with a text for assistive technology | shown when `unread` |
| `meta` | trailing text: a time, a value | hidden |
| `trailing` | trailing node: tags, a badge, actions | hidden |
| `center` | `pair` only: what stands between the two sides | hidden |
| `opposite` | `pair` only: the second side (its value, icon and title) | shown when `opposite` is set |

In a `pair` row the first side is `data-part="side"`; it holds the row's own `title`, `leading` and `meta`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `default`, `message`, `pair` | `default`: text on the left, `meta` then `trailing` on the right, centred. `message`: `overline` and `trailing` on the first line, `title` and `meta` on the second. `pair` (set by `opposite`): two sides of equal width around `center`; on the first side the title, the icon and the value run towards the centre, and the second side mirrors them. `overline`, `description`, `trailing` and the unread dot are not drawn in a pair row. |
| `size` | `default`, `compact` | `default` is the density's list row (56 / 72 / 84px); `compact` is one control high, for leaderboards |

States: hover, pressed, selected, unread, read, accent, disabled, focus.

| State | Look |
|---|---|
| `selected` | violet fill, plus a 3px stripe at the leading edge in a lighter violet (the fixed violet mixed with 35% white), which is the cue that is not colour |
| `unread` true | bold title, plus a dot and a hidden text ("Unread") |
| `unread` false | title in the muted colour (read). Unset: no read state |
| `accent` | a 3px stripe in the given colour at the leading edge, after the selection stripe; `accentLabel` is read by assistive technology |
| `disabled` | 40% opacity, no hover or press |

## Customisation

### 1. Tokens

`--umbra-list-item-bg`, `--umbra-list-item-color`, `--umbra-list-item-secondary-color`, `--umbra-list-item-read-color`, `--umbra-list-item-unread-color`, `--umbra-list-item-hover-bg`, `--umbra-list-item-selected-bg`, `--umbra-list-item-selected-stripe`, `--umbra-list-item-stripe-width`, `--umbra-list-item-min-height`, `--umbra-list-item-padding-x`, `--umbra-list-item-padding-y`, `--umbra-list-item-gap`, `--umbra-list-item-title-font`, `--umbra-list-item-center-bg`, `--umbra-list-item-focus-offset` (the ring offset of controls in `trailing`, inwards by default because the part clips). The minimum height follows the density level. Hover and press use the global mix steps `--umbra-state-hover-lighten` and `--umbra-state-press-darken`.

`--umbra-list-item-focus-offset` is the default offset of the rings inside (inwards, because it clips), passed on as the private `--focus-offset`: `--umbra-focus-offset` set by the app on any ancestor wins over it (2026-10-11).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | The main line |
| `description` | node | — | Second line |
| `descriptionLines` | number | 1 | The most lines the description wraps to before it ends in an ellipsis: a media row (icon or image, title, paragraph) |
| `opposite` | `{ title, leading?, meta? }` | — | The second side of a two-sided row; sets the `pair` variant |
| `center` | node | — | What stands between the two sides: a short text or an icon |
| `overline` | node | — | Small line above the title |
| `leading` | node | — | Avatar or icon |
| `meta` | node | — | Trailing text |
| `trailing` | node | — | Tags, a badge, actions |
| `variant` | see above | `default` | |
| `size` | see above | `default` | |
| `selected` | boolean | `false` | |
| `unread` | boolean | — | See states |
| `unreadLabel` | string | "Unread" | Text of the dot for assistive technology |
| `accent` | CSS colour | — | Edge stripe that carries a category |
| `accentLabel` | string | — | The category, for assistive technology |
| `disabled` | boolean | `false` | |
| `href` / `onPress` | string / function | — | Makes the whole row a link or a button |
| `interactive` | boolean | from `href` / `onPress` | Hover and press feedback; `List` sets it |
| `highlightChanges` | boolean | off | The `meta` text flashes softly once when it changes: green when a number rose, red when it fell, neutral otherwise, with a ▲ or ▼ sign as the cue that is not colour. No flash under reduced motion; the sign stays for four seconds. Never counted up or down. |
| `increasedLabel` / `decreasedLabel` | string | "increased" / "decreased" | What a screen reader hears with the sign |

### 3. Parts

`leading`, `overline`, `title`, `description`, `unread`, `meta`, `trailing`, `center`, `opposite`. In a pair row `leading` and `meta` are asked for once per side.

### 4. Blocks

`ListItem.Root`, `ListItem.Leading`, `ListItem.Content`, `ListItem.Overline`, `ListItem.Title`, `ListItem.Description` (`lines`), `ListItem.End`, `ListItem.Unread`, `ListItem.Meta`, `ListItem.Trailing`, `ListItem.Side` (`opposite`), `ListItem.Center`. A pair row by hand: `Root variant="pair"` holding a `Side`, a `Center` and a `Side opposite`.

## Behaviour as space shrinks

By the row's own width (a container query), in both variants:

| Step | Trigger | Result |
|---|---|---|
| 1 | Any width | `title`, `overline` and `description` truncate with an ellipsis. A truncated title shows its full text in a tooltip, on hover and on keyboard focus of the row or its link. |
| 2 | Row narrower than 260px | `trailing` hides |
| 3 | Narrower than 200px | `description` hides; in a pair row the icons of both sides hide |
| 4 | Narrower than 140px | `meta` hides; the unread dot stays. A pair row is left with its two titles and its centre. |

In a pair row each side is half of the row less the centre, at every width, so a long name truncates on its own side and never moves the centre.

## Interaction and accessibility

- With `href` or `onPress` the title is a link or a button whose hit area covers the whole row, so the row is one control and controls in `trailing` stay separate, valid controls above it. The focus ring is drawn around the row, inwards.
- Inside a `List` the row itself is the control: `List.Item` passes `href` and `onPress` to the list, not to the title.
- Unread is carried by weight, a dot and a hidden text; a category by a stripe and `accentLabel`; selection by fill and stripe. None is colour alone.
- Both stripes are at the leading edge: the left in a left-to-right page, the right in a right-to-left one.
- A pair row reads in order: first title, its value, the centre, the other value, the other title. `href` and `onPress` make the first title the row's link or button.
- A selected row keeps the primary text colour, also when read, so text keeps 4.5:1 on the violet fill.
- Hover lightens the row one step and press darkens it, only when the row is interactive.

## Open questions

None.

Resolved 2026-10-11 (review fixes):

- **The selection stripe has 3:1** (review B2). It was the fixed violet, 2.17–2.19 against the selected fill and 2.56–2.59 against an unselected row. It is now that violet mixed with 35% white (`#977cea` as drawn), the recipe `SegmentedFilter` uses for its selected border. Measured from pixels of `Data/List > Inbox`:

  | Tint | Stripe against the selected fill | Stripe against an unselected row | Fill against the row (colour cue only) |
  |---|---|---|---|
  | violet | 5.02 | 5.95 | 1.19 |
  | teal | 5.00 | 5.89 | 1.18 |
  | green | 5.00 | 5.87 | 1.18 |
  | slate | 5.03 | 5.94 | 1.18 |

  The fill stays a quiet tint, as in the source; the stripe is what has to be seen without colour, and a test holds it at 3:1 on all four tints.
- **The stripes are pseudo-elements at `inset-inline-start`** (review B3), not an inset shadow, which is always on the left.
- **Two-sided and media rows** (review B9, the catalog's FixtureRow and MediaObject). The evidence has both on several screens, and neither could be laid out: there was one title, and `description` was one line. Added the `pair` variant (`opposite`, `center`, `ListItem.Side`, `ListItem.Center`) and `descriptionLines`. The names are neutral: a pair is any two things set against each other (a transfer between two places, plan against actual). A media row needs no variant: it is a large `leading`, a title and a description of several lines.
- **The shrink steps stay fixed pixels and do not follow the density level** (reviewer's note). The pieces that hide are a tag and a time in the label font, which grows by 1px from compact to spacious; steps in `em` would move by under 20px. Not worth a second rule to explain.
- The accent stripe's own contrast is the app's: it gives the colour. `accentLabel` is the cue that does not depend on it.

Resolved 2026-10-10:

- 2026-10-11: `highlightChanges` (plan/interaction.md, "Live updates"), the same as on `DataTable` and from the same code: `src/internal/useChangeHighlight.ts` and `ChangeHighlight.tsx`. It applies to `meta`, the one live value of a row; `changeValue` gives the number behind a formatted text. Tokens: `--umbra-change-up`, `--umbra-change-down`, `--umbra-change-neutral`.
- The shrink steps are fixed widths, not measured. Measuring would hide the tag and the time of every row with a long title, because the title "truncates last"; in the source long titles truncate while tags and times stay.
- The source tints the whole row by category; the library draws a stripe instead, so text contrast does not depend on the app's colour.
- Added `size="compact"`: the density's list row (72px) fits two-line rows; leaderboard rows in the source are one line.
- `unread={false}` dims the title (the source's read state); unset leaves it normal, for lists without a read state.
- In the `message` variant a `description` goes on a third line.
