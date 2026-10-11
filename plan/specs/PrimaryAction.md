# PrimaryAction

**Tier** 1 · **Group** Shell · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

The one primary action of the app, at the end of the `TopBar`. Its label follows the state of the app: "Continue", then "Review 3 items" when something waits for the user.

## Not for

- The main action of a card, dialog or form: use `Button` with `variant="primary"`.
- A second action in the bar: use `IconButton`s in `actions`.
- A list of equal actions: use `Menu`.

## Evidence

1, 11, 22 (magenta-to-pink gradient, label at the start, a double chevron at the end, about 13% of the window width, the full height of the bar, touching the window edge), 13 and 24 (relabelled when something blocks progress; dimmed in 24), 30 (relabelled for the current context). `plan/reference/index.html` (`.primary-action`): the gradient from `primary` to `primaryEnd`.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `button` | the pressable area | shown |
| `label` | the text | shown; hidden when collapsed |
| `description` | a second, smaller line | hidden |
| `icon` | at the end, or at the start with `iconPosition="start"` | hidden |
| `spinner` | replaces `icon` while loading | hidden |
| `badge` | a count beside the label | hidden |
| `attention` | a still ring-and-dot marker | hidden |
| `menuTrigger` | a caret that opens the alternatives | shown with `menu` |

## Variants and states

No variants: it is always magenta with the gradient.

States: hover and pressed (the gradient darkens by one and two steps, so the text contrast only rises), focus (ring drawn inside, because it touches the window edge), disabled (40%), loading (spinner in place of the icon; presses and the shortcut do nothing; stays focusable), attention (marker), collapsed (icon only). Data attributes on the root: `data-collapsed`, `data-attention`, `data-loading`, `data-disabled`, `data-truncate`.

## Customisation

### 1. Tokens

`--umbra-primary-action-bg` (start of the gradient, defaults to `color.fixed.primary`), `--umbra-primary-action-bg-end` (`color.fixed.primaryEnd`), `--umbra-primary-action-fg`, `--umbra-primary-action-min-width` (180px), `--umbra-primary-action-min-height` (the control height), `--umbra-primary-action-padding-x`, `--umbra-primary-action-radius` (0), `--umbra-primary-action-caret-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `label` | string | — | Required. Also the tooltip and name when collapsed |
| `description` | node | — | Second line |
| `icon` | node | — | |
| `iconPosition` | `start` \| `end` | `end` | |
| `onPress` | function | — | |
| `href` | string | — | Renders a link |
| `loading` / `loadingLabel` | boolean / string | `false` / "Loading" | |
| `disabled` | boolean | `false` | |
| `shortcut` | shortcut id | — | Binds the key; the hint is in the tooltip |
| `badge` | number | — | A count; 0 shows nothing |
| `attention` / `attentionLabel` | boolean / string | `false` / "Needs attention" | The marker and what a screen reader hears for it |
| `menu` | menu rows | — | Alternative actions (same shape as `Menu` `items`) |
| `onMenuAction` | function (id) | — | |
| `menuLabel` | string | "More actions" | Name of the caret |
| `collapsed` | boolean | automatic | Forces icon only (or, with `false`, never) |

### 3. Parts

`icon`, `label`, `description`, `badge`, `attention`, `spinner`, `menuTrigger`.

### 4. Blocks

None. It is one control; its slot in the bar is `TopBar.PrimaryAction`.

## Behaviour as space shrinks

It fills the height of what holds it and never overflows it.

| Step | Result |
|---|---|
| 1 | `description` hides |
| 2 | With an icon: the label hides, the button is as wide as it is tall, the label becomes its tooltip and name, and the count or marker moves to the corner of the icon |
| — | Without an icon nothing can hide: the label truncates with an ellipsis |

In a `TopBar` step 2 is the bar's last shrink step (the bar decides; see `TopBar.md`). On its own it measures itself.

## Interaction and accessibility

- A `button`, or a link with `href`. `Enter` and `Space` activate it.
- Text on the gradient is at least 4.5:1 at both ends (white on `primary` 4.9:1, on `primaryEnd` 5.6:1; tested), also for the smaller description, which is not dimmed.
- The count and the attention text are part of the accessible name ("Review items 3", "Answer first Needs attention"). The marker is a shape, not a colour, and never animates.
- Loading: the spinner is a progress element named by `loadingLabel`, which becomes part of the name.
- The caret is a second button named by `menuLabel`; it opens a `Menu` (`plan/specs/Menu.md`).

## Open questions

None.

Resolved 2026-10-10:

- It does not reuse `Button`: the gradient, the two-line label and the split caret need their own element. It shares the spinner, tooltip, shortcut and menu with the rest of the library.
- The radius defaults to 0 and the focus ring is drawn inside, because its place is the end of the bar, against the window edge.
- `icon` sits at the end by default, as in the evidence; `iconPosition` moves it.
- `badge` and `attention` together show the count only: the count is the stronger statement.
- Hover is not animated: a gradient cannot transition without registering a global custom property.

Resolved 2026-10-11 (review 2):

- The minimum width (180px) applies to an action with nothing to hide (F31): truncating the label is a shrink step of its own, taken only when the action runs out of room. Before, such an action counted as out of steps from the start and was as narrow as its label (107px).
- **Blocks: none, as an exception to decision 07** (recorded there): it is one button with fixed inner parts, all replaceable through `parts`; a version built by hand is a `Button` in `TopBar.PrimaryAction`.
