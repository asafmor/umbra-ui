# Badge

**Tier** 1 · **Group** Data · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A count or a dot that marks something new or pending, alone or on the corner of another element.

## Not for

- A word or code: use `Tag`.
- A value coloured by a threshold: use `ValuePill`.
- A status with a label: use `StatusIndicator`.
- A count on an `IconButton`: its own `badge` prop is shorter; `Badge` is for any other anchor.

## Evidence

A violet count circle on the corner of a shortcut chip (2, 3, 5, 7, 24, 25); a white unread dot beside a time (25); a filled square number beside a name (6).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `indicator` | the count text, or the dot | shown when there is a count above 0, or `dot` |

The root also holds the anchor (`children`), when there is one.

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| kind | count, `dot` | A count above `max` shows as "99+" |
| `tone` | `accent`, `neutral`, `info`, `success`, `warning`, `danger` | `accent` (default) is the fixed violet. `color` replaces it. |
| placement | standalone, anchored | Anchored when it has `children`: the indicator overhangs the top trailing corner |

States: hidden (count 0 without `showZero`).

## Customisation

### 1. Tokens

`--umbra-badge-bg`, `--umbra-badge-fg`, `--umbra-badge-size`, `--umbra-badge-dot-size`, `--umbra-badge-radius`, `--umbra-badge-font`, `--umbra-badge-offset` (how far an anchored badge overhangs).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `count` | number | — | The number |
| `dot` | boolean | `false` | A dot instead of a number |
| `max` | number | `99` | Counts above it show as "99+" |
| `showZero` | boolean | `false` | Shows a count of 0 |
| `tone` | see above | `accent` | |
| `color` | CSS colour | — | Custom colour; replaces `tone` |
| `label` | string \| function of the count | the full count | What a screen reader hears |
| `children` | node | — | The anchor |

### 3. Parts

`indicator`.

### 4. Blocks

`Badge.Root`, `Badge.Indicator`.

## Behaviour as space shrinks

A badge has a fixed size and does not shrink. Anchored, it takes no space of its own: it overhangs its anchor by `--umbra-badge-offset`, so a container that clips needs that much room around the anchor.

## Interaction and accessibility

- Not focusable. An anchored badge lets clicks through to its anchor.
- The visible text is hidden from screen readers when `label` differs from it; the label is read instead. By default the full count is read, also above `max` ("120", not "99+").
- A dot has no text: give `label` when it carries meaning ("Unread"). Without it the dot is decorative.
- The badge is read after its anchor, not as part of the anchor's name. To make it part of a button's name, put the count in the button's own label.
- Count text has at least 4.5:1 on every tone (white on violet, dark on the others).

## Open questions

None.

Resolved 2026-10-10:

- Default tone is `accent` (violet), as in the source. `IconButton`'s built-in badge is magenta; the two should be aligned in a later change to `IconButton` (not in this batch's scope).
- `label` accepts a string or a function of the count.
- A count of 0 is hidden unless `showZero`.
- One placement (top trailing corner), adjustable by `--umbra-badge-offset`; no placement prop.
- No live-region announcement of a changing count; the app announces what changed where it matters.
