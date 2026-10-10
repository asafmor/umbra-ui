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

`--umbra-badge-bg`, `--umbra-badge-fg`, `--umbra-badge-size`, `--umbra-badge-dot-size`, `--umbra-badge-padding-x`, `--umbra-badge-radius`, `--umbra-badge-font`, `--umbra-badge-ring`, `--umbra-badge-ring-width`, `--umbra-badge-offset` (how far an anchored badge overhangs).

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
| `decorative` | boolean | `false` | Draws the count from an attribute, so it is not text of the page, and hides the badge from assistive technology. For a badge inside a control whose own name already holds the count. |
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

Resolved 2026-10-11:

- **A ring on filled surfaces.** A violet badge had almost no edge on a violet-like brand bar or on an `accent` button. The badge draws a 1px ring (`--umbra-badge-ring`, `--umbra-badge-ring-width`), transparent by default. A filled surface sets it to its own text colour, which has 4.5:1 or more against the fill, so the badge keeps at least 3:1 at its edge on any brand: `TopBar`, the band of `Card` and `PageHeader`, and the `primary` and `accent` buttons (a badge inside the button, and one anchored on its corner). Checked on the four brands of `Shell/App shell > Brands`.

Resolved 2026-10-10:

- Default tone is `accent` (violet), as in the source. This is the one default colour of a count, also on a control: `IconButton` draws its `badge` with this component (integration pass), no longer in magenta.
- `label` accepts a string or a function of the count.
- A count of 0 is hidden unless `showZero`.
- One placement (top trailing corner), adjustable by `--umbra-badge-offset`; no placement prop.
- No live-region announcement of a changing count; the app announces what changed where it matters.
