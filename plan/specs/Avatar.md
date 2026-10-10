# Avatar

**Tier** 1 · **Group** Data display · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

Shows a person or an entity as a small picture: its image, or its initials, or a silhouette. `AvatarGroup` shows several as one overlapping row.

## Not for

- A logo, flag or category glyph next to a name: use `EntityIcon`.
- A large picture with a caption: use `MediaCard`.
- A status on its own: use `StatusIndicator`. The avatar only gives it a corner.

## Evidence

Round photos at about 18px in list rows (1), about 44px in table rows and 56px in a profile header (23), 48px (7) and 56px (3); a large cut-out portrait (6); a black silhouette where there is no photo (9, 12, 13, 14, 29), once in a squarer frame (35). The source has no initials and no group; both are the library's own. The library ships no photo: stories use initials and a drawn SVG.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `image` | the picture | shown when `src` is set and loads |
| `initials` | one or two letters from `name` | shown when there is no image |
| `fallback` | a silhouette icon | shown when there is no image and no name |
| `status` | a node at the bottom end corner | hidden |

`AvatarGroup`: the avatars, then `overflow`, a "+N" counter in the shape of an avatar, shown when some are not.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | none, `xs`, `sm`, `md`, `lg`, `xl` | 18 / 24 / 32 / 48 / 72px. With no size the avatar is as tall as a control (28 / 36 / 44px by density). |
| `shape` | `circle`, `square` | `square` has the control radius |
| `ring` | off, `true`, a colour | An outline with a gap; `true` is the accent colour |

States: image, initials, silhouette (chosen in that order); image failed.

## Customisation

### 1. Tokens

`--umbra-avatar-size`, `--umbra-avatar-bg`, `--umbra-avatar-fg`, `--umbra-avatar-fallback-fg`, `--umbra-avatar-radius` (square), `--umbra-avatar-ring`, `--umbra-avatar-status-size`, `--umbra-avatar-group-overlap` (a share of the size, default 0.16), `--umbra-avatar-group-border` (the line between overlapping avatars; set it to the colour of the surface behind).

### 2. Props

`Avatar`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `src` | string | — | The image |
| `alt` | string | `name` | Accessible name. `""` when the name is written next to the avatar |
| `name` | string | — | The person or entity; gives the initials |
| `size` | see above | follows density | |
| `shape` | see above | `circle` | |
| `ring` | boolean \| string | `false` | |
| `status` | node | — | For example a `StatusIndicator` dot |
| `fallbackIcon` | node | a person silhouette | Replaces the silhouette |

`AvatarGroup`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | `Avatar` elements | — | |
| `max` | number | all | Shows at most this many |
| `total` | number | number of children | The real number of members, when not all are given |
| `size` / `shape` | as `Avatar` | — | Apply to every avatar in the group |
| `moreLabel` | (count) => string | "N more" | Accessible name of the "+N" counter |
| `aria-label` | string | — | Names the group |

### 3. Parts

`Avatar`: `image`, `initials`, `fallback`, `status`. `AvatarGroup`: `overflow`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`Avatar.Root`, `Avatar.Image`, `Avatar.Initials`, `Avatar.Fallback`, `Avatar.Status`; `AvatarGroup.Root`, `AvatarGroup.Overflow`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | — | A single avatar has a fixed size and never shrinks; the layout around it gives way first. |
| 2 | An `AvatarGroup` is wider than its container | One more avatar moves into "+N" at a time, until the row fits. The first avatar always stays. |
| 3 | Not even one avatar and the counter fit | The row is clipped at its end. |

## Interaction and accessibility

- Not interactive. To make one a link or a button, wrap it.
- The image is an `<img>` with `alt`. Initials and the silhouette are `role="img"` named by `alt` or `name`; with neither they are hidden from assistive technology.
- When the name is written next to the avatar, pass `alt=""` so it is not read twice.
- An image that fails to load falls back at once; a new `src` is tried again.
- A group is `role="group"`; its counter is an image named by `moreLabel`.
- Initials are white on the third surface (above 4.5:1). A status node carries its own name and non-colour cue.

## Open questions

None.

Resolved 2026-10-10:

- Initials are the first letters of the first and last words of `name`, upper-cased.
- With no `size` the avatar follows the density level through the control height, rather than a second size scale per density.
- Initials use one neutral surface, not a colour per name: a row of faces and initials stays calm. A generated colour is `EntityIcon`'s job.
- `ring` takes `true` or a colour, so it can show a state or a team without a new prop.
- The group has no popover listing the hidden members; it only counts them. An app that needs the list wraps the counter through `parts.overflow`.
- Avatars in a group overlap by 16% of their size, so two-letter initials stay readable.
- `AvatarGroup` is part of this spec and has no catalog row of its own.
