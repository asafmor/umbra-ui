# ActionBar

**Tier** 1 · **Group** Overlays · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

The bar at the bottom of a page, card or modal, with a status at the start and the actions at the end. As a floating bar it appears over the bottom of its container, for actions on selected rows.

## Not for

- A message with no actions of its own place: use `Banner`.
- Controls above content (filters, view switches): use the card's toolbar part.
- A message that leaves by itself: use `Toast`.
- The single main action of the app: use `PrimaryAction` in the `TopBar`.

## Evidence

Undo, Redo, Reset and a magenta Confirm with icons, at the bottom right of a panel (12); a dark red bar with a red top edge, a warning icon and "must respond" at the start, and two or three buttons at the end (14, 16); a bar pinned to the bottom of a card with a top border (7, 10, 33); a modal footer with two link-like actions at the start and four buttons at the end (21, 26); a page footer with controls at the start and Cancel plus a main action at the end (34).

## Anatomy

| Part | Content | Default |
|---|---|---|
| `status` | an icon for the tone, and a text | shown when `status` or `selectionCount` is set |
| `clear` | the button that clears the selection | shown when `onClearSelection` is set |
| `tertiary` | low-emphasis actions at the start, after the status | shown when `tertiary` is set |
| `actions` | the end group: `actions`, then `secondary`, then `primary` | shown when any of them is set |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `inline` (default), `floating` | In the flow; or over the bottom of its container, as wide as its content |
| `align` | `end` (default), `center`, `start` | Where the end group sits |
| `emphasis` | `default`, `strong` | `strong` fills the bar with a dark mix of the tone under an edge in the tone (the "must respond" look) |
| status `tone` | `neutral`, `info`, `success`, `warning`, `danger` | Colour and icon: speech bubble, circled i, circled check, triangle, octagon |

States of a floating bar: open, closed. An inline bar has no surface of its own: the card footer, the modal or the page gives it one.

## Customisation

### 1. Tokens

`--umbra-action-bar-bg`, `--umbra-action-bar-border`, `--umbra-action-bar-radius`, `--umbra-action-bar-gap`, `--umbra-action-bar-padding-x`, `--umbra-action-bar-padding-y`, `--umbra-action-bar-offset` (distance of a floating bar from the edges), `--umbra-action-bar-<tone>-color` (five).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `status` | node \| `{ tone?, text }` | — | The tone adds its icon |
| `actions` | node | — | Actions as nodes |
| `primary` / `secondary` / `tertiary` | node \| action \| action[] | — | The structured form. An action is `{ label, icon?, variant?, onPress?, href?, disabled?, loading? }` |
| `variant` | see above | `inline` | |
| `open` | boolean | `selectionCount > 0`, else `true` | Shows a floating bar |
| `selectionCount` | number | — | Sets the status text and opens a floating bar |
| `selectionLabel` | function of the count | "3 selected" | |
| `onClearSelection` / `clearLabel` | function / string | — / "Clear selection" | |
| `align` | see above | `end` | |
| `emphasis` | see above | `default` | |
| `aria-label` | string | "Actions" | Names the group |

Default button variants: `primary` for the primary group, `neutral` for secondary, `ghost` for tertiary.

### 3. Parts

`status`, `clear`, `tertiary`, `actions`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props.

### 4. Blocks

`ActionBar.Root` (takes `tone`), `ActionBar.Status`, `ActionBar.Clear`, `ActionBar.Actions`, `ActionBar.Group` (`kind`: primary, secondary, tertiary), `ActionBar.Action`.

## Behaviour as space shrinks

The bar measures itself; steps are taken back when it gets wider.

| Step | Trigger | Result |
|---|---|---|
| 0 | Less room than the content | The status text truncates with an ellipsis, down to its icon |
| 1 | Still too narrow | Secondary and tertiary actions that have an icon keep only the icon; the label becomes their name and tooltip (`data-compact`) |
| 2 | Still too narrow | The actions take a line of their own under the status and wrap further if they must (`data-wrap`) |

A primary action never loses its label, and no action is ever cut off. A button truncates its own label only when it alone is wider than the bar. Actions passed as plain nodes do not collapse; give them `collapseTo="icon"` or use the structured form.

## Interaction and accessibility

- The root is a `group` named by `aria-label`; it is not a landmark.
- The status is a `role="status"` region, so a change of its text is announced politely. The tone is never colour alone: each has its own icon.
- The actions are in plain tab order: tertiary, secondary, primary. No arrow-key movement.
- A floating bar stays in the page while closed, hidden and `inert`, so nothing in it can be reached and both directions can be animated in CSS.
- Motion of a floating bar: a fade and an 8px slide, 180ms, ease-out to enter and ease-in to leave. Reduced motion removes the slide and keeps the fade.
- While a floating bar leaves, it keeps the last count it showed.
- A floating bar is positioned against the nearest positioned ancestor: give the container `position: relative`. Inside a card body it sits over the bottom of the body by itself.
- Focus is not moved when a floating bar opens or closes.

## Open questions

None.

Resolved 2026-10-10:

- The structured groups take action objects, so the bar knows which actions have an icon to collapse to; nodes are accepted too.
- A third shrink step (the actions wrap) was added, so that the primary action is never clipped in a very narrow bar.
- "Must respond" is `emphasis="strong"` with a `danger` status, not a variant of its own; it works with every tone.
- An inline bar draws no border or background: `Card.Footer`, the modal footer or the page does.
- `role="toolbar"` with arrow keys was not used: the bar holds few actions, and plain tab order is what the task asked for.
- The tooltip of an icon-only action comes from the button's own tooltip; no menu is used at any step.
- The tone icons are imported directly, not through the provider's icon map, like `Banner`. Follow-up: the same map entries.
- No `dirtyCount` helper: write the text in `status`.

Resolved 2026-10-11 (review 2):

- A floating bar that closes while the focus is in it ("Clear selection") gives the focus back to the control it came from, or to the first control beside the bar (F18).
