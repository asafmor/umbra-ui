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

Message rows (1, 2, 13–16, 25, 27, 28): sender (small) above the title, tag top right, time bottom right; unread is bold with a dot before the time, read is dimmed, selected has a bar at the left edge; a background tint or stripe marks a category. Person rows with an avatar, a name and a role (14). Leaderboard rows with an avatar, a name and a value (24, 27, 29). The reference screen (`plan/reference/index.html`, `.item`) shows the message row.

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

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `default`, `message` | `default`: text on the left, `meta` then `trailing` on the right, centred. `message`: `overline` and `trailing` on the first line, `title` and `meta` on the second |
| `size` | `default`, `compact` | `default` is the density's list row (56 / 72 / 84px); `compact` is one control high, for leaderboards |

States: hover, pressed, selected, unread, read, accent, disabled, focus.

| State | Look |
|---|---|
| `selected` | violet fill, plus a 3px violet stripe at the leading edge |
| `unread` true | bold title, plus a dot and a hidden text ("Unread") |
| `unread` false | title in the muted colour (read). Unset: no read state |
| `accent` | a 3px stripe in the given colour at the leading edge, after the selection stripe; `accentLabel` is read by assistive technology |
| `disabled` | 40% opacity, no hover or press |

## Customisation

### 1. Tokens

`--umbra-list-item-bg`, `--umbra-list-item-color`, `--umbra-list-item-secondary-color`, `--umbra-list-item-read-color`, `--umbra-list-item-unread-color`, `--umbra-list-item-hover-bg`, `--umbra-list-item-selected-bg`, `--umbra-list-item-selected-stripe`, `--umbra-list-item-stripe-width`, `--umbra-list-item-min-height`, `--umbra-list-item-padding-x`, `--umbra-list-item-padding-y`, `--umbra-list-item-gap`, `--umbra-list-item-title-font`. The minimum height follows the density level.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `title` | node | — | The main line |
| `description` | node | — | Second line |
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

### 3. Parts

`leading`, `overline`, `title`, `description`, `unread`, `meta`, `trailing`.

### 4. Blocks

`ListItem.Root`, `ListItem.Leading`, `ListItem.Content`, `ListItem.Overline`, `ListItem.Title`, `ListItem.Description`, `ListItem.End`, `ListItem.Unread`, `ListItem.Meta`, `ListItem.Trailing`.

## Behaviour as space shrinks

By the row's own width (a container query), in both variants:

| Step | Trigger | Result |
|---|---|---|
| 1 | Any width | `title`, `overline` and `description` truncate with an ellipsis |
| 2 | Row narrower than 260px | `trailing` hides |
| 3 | Narrower than 200px | `description` hides |
| 4 | Narrower than 140px | `meta` hides; the unread dot stays |

## Interaction and accessibility

- With `href` or `onPress` the title is a link or a button whose hit area covers the whole row, so the row is one control and controls in `trailing` stay separate, valid controls above it. The focus ring is drawn around the row, inwards.
- Inside a `List` the row itself is the control: `List.Item` passes `href` and `onPress` to the list, not to the title.
- Unread is carried by weight, a dot and a hidden text; a category by a stripe and `accentLabel`; selection by fill and stripe. None is colour alone.
- A selected row keeps the primary text colour, also when read, so text keeps 4.5:1 on the violet fill.
- Hover lightens the row one step and press darkens it, only when the row is interactive.

## Open questions

None.

Resolved 2026-10-10:

- The shrink steps are fixed widths, not measured. Measuring would hide the tag and the time of every row with a long title, because the title "truncates last"; in the source long titles truncate while tags and times stay.
- The source tints the whole row by category; the library draws a stripe instead, so text contrast does not depend on the app's colour.
- Added `size="compact"`: the density's list row (72px) fits two-line rows; leaderboard rows in the source are one line.
- `unread={false}` dims the title (the source's read state); unset leaves it normal, for lists without a read state.
- In the `message` variant a `description` goes on a third line.
