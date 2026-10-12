# HorizontalScroller

**Tier** 2 · **Group** Layout · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A row of cards or tiles that is wider than its place and scrolls sideways inside itself. The page never scrolls sideways.

## Not for

- A row of controls that must all stay reachable at once: use `ShortcutBar` or an overflow menu.
- A strip of days: use `WeekStrip`.
- Columns of a page: use `Columns`.

## Evidence

5: a strip of eleven small cards under the page header, the last one cut by the edge. No arrow and no scrollbar is drawn; the cut card is the only sign that there is more.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `track` | the list of items, in a horizontal `ScrollArea` | shown |
| `item` | one cell | — |
| fade | the items fade out at an edge that has more: a mask on the row, not a part | shown while there is more |
| `previous` / `next` | icon buttons over the two edges | shown while there is more on that side |
| `skeleton` | placeholder items | while `loading` |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `scrollbar` | `none`, `hover`, `auto` | `none` (the source): no thumb at all. The others are the `ScrollArea`'s |
| `snap` | `true`, `false` | Scrolling comes to rest at the start of an item |

States: `loading`, `empty`, `error`.

## Customisation

### 1. Tokens

`--umbra-horizontal-scroller-gap` (follows the density), `--umbra-horizontal-scroller-item-width`, `--umbra-horizontal-scroller-button-size`, `--umbra-horizontal-scroller-skeleton-height`, `--umbra-horizontal-scroller-fade-size`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `itemWidth` | number \| CSS length | each item's own width | The width of every item |
| `gap` | a step of the spacing scale | by density | |
| `scrollbar` / `snap` | see above | `none` / `true` | |
| `fade` | boolean | `true` | |
| `onReachEnd` | function | — | As on `ScrollArea`: for loading more |
| `size`, `priority`, `minWidth`, `minHeight`, `label` | | `size="content"` | The slot props. With a number as `size`, or a height from outside, the items stretch to it |
| `loading`, `empty`, `error`, `onRetry`, `retryLabel` | | | The shared data states |
| `skeletonItems` | number | 6 | |
| `previousLabel` / `nextLabel` | string | English text | |
| `aria-label` | string | "Items" | Names the list |

### 3. Parts

`previous`, `next`, `skeleton`. `previous` and `next` receive `{ label, onPress }`; `null` hides a button.

### 4. Blocks

`HorizontalScroller.Root`, `HorizontalScroller.Item`. `Root` takes everything but the children's wrapping; the all-in-one wraps each child in an `Item`, except a child that is an `Item` already (integration pass, 2026-10-11: it was wrapped twice, a list item inside a list item).

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The items are wider than the row | The row scrolls; a fade and a button show at each edge that has more |
| 2 | Narrower than one item | The item is cut by the edge and reached by scrolling; it is never squeezed |

The row fills its slot's width. Its height is its content's (`size="content"`, the default), and nothing in it wraps. An item that fills its slot and has no height of its own (a `Card`) needs the row to be given a height: a number as `size`, or a `Card` with `size="content"`.

## Interaction and accessibility

- The track is a list (`role="list"`, named by `aria-label`), each cell a list item: a screen reader hears the count, which the cut edge only hints at.
- **Buttons.** `previous` and `next` scroll by one view less one item, to the start of an item. They show only while there is more on their side, over the edge, above the fade. When the one in use goes (the end was reached), focus moves to the other.
- **Keyboard.** The items keep their natural tab order, and the browser brings a focused item into view. On top of that, `ArrowLeft` and `ArrowRight` move the focus to the first control of the previous or next item, and `Home` and `End` to the first and last; a text field, a slider or a composite inside an item keeps its own arrow keys. When no item has a control, the row itself is a tab stop and the arrow keys scroll it (the `ScrollArea` rule).
- **Wheel.** A sideways wheel or trackpad gesture, and `Shift` with the wheel, scroll the row. A vertical wheel is left alone: it scrolls whatever is around the row.
- **Right to left.** The row starts from the right; the buttons, their arrows and the arrow keys follow what is drawn.
- Scrolling by a button is smooth, and instant under reduced motion.
- Loading sets `aria-busy`.

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Buttons over the edges, not in a header**: the row has no header of its own, and a button beside the edge it scrolls needs no explaining. The source has none; `parts={{ previous: null, next: null }}` gives that look.
- **No scrollbar by default**, as in the source: the buttons, the keyboard, the wheel and touch all scroll it. `scrollbar="hover"` or `"auto"` brings the thin thumb back.
- **List semantics, not a `region`**: a page with several rows would fill with landmarks.
- **Natural tab order plus arrow keys, not one tab stop.** The items are the app's own nodes and may hold several controls each; taking them out of the tab order would mean rewriting their `tabindex`. The arrow keys are an accelerator.
- **Snap is `proximity`**, so a free scroll is not pulled back across a wide item; the buttons compute an item's start themselves.
- **Reuses `ScrollArea`** with `axis="horizontal"` for the thumb, `onReachEnd`, the focusable viewport and the knowledge of which edge has more.
- **The fade is a mask, not a colour.** The `ScrollArea`'s fade is a gradient of the card's background, which is right inside a card. A row sits on the page's gradient, a card or a brand band, and no one colour fits them all, so the items themselves fade to transparent (`mask-image`). It is therefore not a part: `fade={false}` turns it off.
- **A new layout context**: the items are the row's, so a `Stack` around the row neither counts nor collapses them.

Changed 2026-10-11 (fix pass of review 2):

- **A control that uses the arrow keys keeps them** (SL-5): the trigger of a `Select` is one (it changes the value), besides fields, sliders, tabs and radios. `Tab` moves on from it. **A checkbox or a `Toggle` does not use them** (SL-19), so the arrow keys move on from it to the next item.
- **A button that goes hands the focus on, whatever the button is** (SL-7): the default one or the app's own through `parts`. It goes to the other button, else to the first control of the row, else to the row (`holdFocus`, `src/internal/focus.ts`).
- **`--umbra-horizontal-scroller-button-size`** sizes the two buttons (SL-6): it had no effect.
