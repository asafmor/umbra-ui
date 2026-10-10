# SummaryTile

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A compact tile that sums up one thing: an icon, a title and one value. The whole tile is one link or one button that opens the full view.

## Not for

- Content with a body, a toolbar or its own scrolling: use `Card`.
- A headline number that is not clickable: use `StatValue`.
- Several values: use a `Card` with a `KeyValueList`.
- A tile with more than one control inside: use `Card`; a link or button cannot hold another.

## Evidence

A row of four tiles above the main card: a square icon block, a condensed title and a value line that truncates (37); the same row with two wide tiles (38); six tiles with upper-case titles under a table (40). The source's expand icon at the end of each tile is left out: the whole tile is the control.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | an icon in a square block at the start | hidden |
| `title` | what the tile is about, in the card-title font | shown |
| `value` | the one value | shown |
| `trend` | a node after the value, for example a `TrendArrow` | hidden |
| `caption` | a secondary line under the value | hidden |
| `skeleton` | stands in for the value while loading | hidden |

The title, value line and caption sit in one column (the `Content` block); the value and trend share a line (the `Figure` block). The clickable surface inside the root is `data-part="surface"`.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| element | link (`href`), button (`onPress`), static (neither) | |

States: hover, pressed, focus, `selected`, `disabled`, `loading`.

## Customisation

### 1. Tokens

`--umbra-summary-tile-bg`, `--umbra-summary-tile-fg`, `--umbra-summary-tile-border`, `--umbra-summary-tile-radius`, `--umbra-summary-tile-padding`, `--umbra-summary-tile-caption-fg`, `--umbra-summary-tile-icon-size`, `--umbra-summary-tile-icon-bg`, `--umbra-summary-tile-selected-bg`, `--umbra-summary-tile-selected-fg`, `--umbra-summary-tile-min-height`, `--umbra-summary-tile-min-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `icon` | node | — | |
| `title` | node | — | |
| `value` | node | — | |
| `caption` | node | — | |
| `trend` | node | — | |
| `href` | string | — | Makes the tile a link |
| `onPress` | function, no arguments | — | Makes the tile a button |
| `selected` | boolean | — | The current tile |
| `disabled` | boolean | `false` | |
| `loading` | boolean | `false` | Skeletons in place of the value and caption |
| `size` | number \| `"content"` | `1` | Share of the parent's space (see `layout.md`) |
| `priority` / `minWidth` / `minHeight` / `label` | as every layout child | — | |
| `aria-label` | string | — | Names the tile when its content does not |

### 3. Parts

`icon`, `title`, `value`, `trend`, `caption`, `skeleton`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`SummaryTile.Root`, `SummaryTile.Icon`, `SummaryTile.Content`, `SummaryTile.Title`, `SummaryTile.Figure`, `SummaryTile.Value`, `SummaryTile.Trend`, `SummaryTile.Caption`.

## Behaviour as space shrinks

Container queries on the tile's own width.

| Step | Tile width at most | Result |
|---|---|---|
| 1 | any | The title, value and caption truncate with an ellipsis |
| 2 | 220px | The caption hides |
| 3 | 180px | The trend hides |
| 4 | 140px | The icon hides and the padding goes down one step |

- The title and the value never hide.
- A tile is a layout child: in `Columns` the tiles share the row, in a `Stack` they share the height by `size`. A tile shorter than its content clips it.
- In a plain CSS grid or block a tile is as wide as its cell and as tall as its content.
- With `size="content"` in `Columns` a tile is 160px wide (a token): it measures itself by container query, so it cannot take its width from its content.

## Interaction and accessibility

- The whole tile is one tab stop: a link with `href`, a button with `onPress`, plain content with neither. `Enter` activates both; `Space` a button.
- `selected` is `aria-current` on a link and `aria-pressed` on a button. It shows as the violet fill plus a bar along the bottom edge, so it does not depend on colour.
- Hover lightens the surface and press darkens it; a selected tile darkens on hover, so its light text keeps 4.5:1.
- The focus ring is drawn inside the tile, because tiles often sit edge to edge in a container that clips.
- `disabled` is 40% opacity, with no hover, press or focus.
- `loading` sets `aria-busy` and keeps the title, icon and control, so the tile can still be opened and nothing moves when the value arrives.
- The tile's name is its content (title, value, caption). `aria-label` replaces it; it should then contain the visible title.
- On a selected tile the caption takes the text colour of the fill (the secondary text colour would be under 4.5:1 on violet).

## Open questions

None.

Resolved 2026-10-10:

- The root is the layout slot and the surface inside it is the control. In tab mode the layout gives the slot the tab panel role, which a link or button must not carry.
- `selected` exists on links and buttons: a row of tiles often switches the view below it.
- The second cue for selected is a bar along the bottom edge.
- The tile has no trailing expand icon and no actions slot; the whole tile is the control. An app can add a decorative icon through the blocks.
- Hide order by width: caption, trend, icon. The shrink steps use width only: in a grid a tile has no definite height to query.
- A tile in a `Stack` cannot collapse to a header (it has none); it reports the density's list row height as its minimum.
- A loading tile stays clickable: the link is known before the value.
