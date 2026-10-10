# SegmentedFilter

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A row of joined segments that filters the content below it. One segment is selected, or several. A segment can carry a count.

## Not for

- Switching between views that each have their own panel: use `Tabs`.
- Choosing one of many options (more than about six): use `Select`.
- A single on/off setting: use `Switch` or `Checkbox`.
- Actions: use `Button`.

## Evidence

"All / New / Tasks (4) / Unread (8)" in a card toolbar, counts in the label (1, 2, 13, 14, 25, 27). Two segments with icons, one selected (3, 4, 6, 12, 17, 29). Full-width equal segments, also with none selected (20, 24). Four segments with the selected one in the section's colour (10). `plan/reference/index.html` shows it in the Inbox card. No source filter selects several at once; that is the library's own addition.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `item` | one segment: check, icon, label, count | one per entry of `items` |
| `check` | mark of a selected segment | shown in `multiple` mode only |
| `icon` | icon before the label | shown when the item has an `icon` |
| `label` | the text | shown; truncates |
| `count` | a number in parentheses | shown when the item has a `count` |
| `more` | button of the menu that holds the segments that do not fit | shown at the last shrink step only |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `selectionMode` | `single` (default), `multiple` | `single` is a radio group; `multiple` is a toolbar of toggle buttons |
| `size` | `default`, `small` | The height follows the density level; `small` is the height of a small button |
| `fullWidth` | boolean | Equal segments that fill the container |
| `all` | boolean | Adds a first segment that stands for "no filter" |

States: selected, hover, pressed, focus, disabled (one segment or the whole control), nothing selected.

Selected is the violet fill with a lighter edge and a heavier label, plus a bar under the label (`single`) or a check before it (`multiple`). The lighter edge also keeps two selected neighbours apart.

There is no loading, empty or error state: the control is an input, and its segments are known before any data arrives.

## Customisation

### 1. Tokens

`--umbra-segmented-filter-height`, `--umbra-segmented-filter-padding-x`, `--umbra-segmented-filter-radius`, `--umbra-segmented-filter-bg`, `--umbra-segmented-filter-fg`, `--umbra-segmented-filter-border`, `--umbra-segmented-filter-selected-bg`, `--umbra-segmented-filter-selected-fg`, `--umbra-segmented-filter-selected-border`, `--umbra-segmented-filter-min-item-width`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `items` | `{ id, label, count?, icon?, disabled? }[]` | — | The segments. Leave out to pass `SegmentedFilter.Item` children. |
| `selectionMode` | `single` \| `multiple` | `single` | |
| `value` / `defaultValue` | string \| `null` | `null` | `single`: the selected id. `null` selects none, or "All" with `all`. |
| `values` / `defaultValues` | string[] | `[]` | `multiple`: the selected ids. Empty selects "All" with `all`. |
| `onChange` | `(id \| null) => void`, or `(ids) => void` in `multiple` mode | — | Called when the selection changes |
| `all` | boolean | `false` | Adds the "All" segment |
| `allLabel` | string | "All" | Its label |
| `allCount` | number | — | Its count |
| `size` | `default` \| `small` | `default` | |
| `fullWidth` | boolean | `false` | |
| `disabled` | boolean | `false` | Disables every segment |
| `moreLabel` | string | "More" | Name of the button that opens the menu of segments that do not fit |
| `aria-label` / `aria-labelledby` | string | — | Names the group |

### 3. Parts

`item`, `check`, `icon`, `count`. Each accepts a node (replace), `null` (hide) or a function receiving the default part's props. `SegmentedFilter.Item` takes `check`, `icon` and `count` itself, for one segment.

### 4. Blocks

`SegmentedFilter.Root`, `SegmentedFilter.Item`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | The segments are wider than the control | The counts hide. They are still read with the label. |
| 2 | Still wider | The segments share the width equally and their labels truncate with an ellipsis |
| 3 | The segments reach their minimum width (4.5em) | The segments that do not fit move into a "more" menu, opened by a last, square segment (`moreLabel`). In `single` mode the selected segment always stays in the control: it takes the last place that fits, and the menu still lists it, with a check. In `multiple` mode the menu rows are checkboxes, and the button carries a bar while a segment inside it is selected. |

The control never grows past its container. When it gets room again it starts from step 0.

## Interaction and accessibility

- `single`: a `radiogroup` of `radio`s. `multiple`: a `toolbar` of buttons with `aria-pressed`.
- One tab stop. Left and Right move between segments and stop at the ends; Home and End jump to the first and last. A disabled segment is skipped. Space or Enter selects.
- Arrow keys move focus without selecting, so the content below is not filtered again on every key.
- In `single` mode the selected segment cannot be switched off. In `multiple` mode every segment toggles.
- With `all`: choosing "All" clears the others, choosing another segment leaves "All", and switching the last one off selects "All" again.
- A segment with a count and a text label is named "Unread, 4". With a label that is not text, the name is the label followed by the count in parentheses.
- The focus ring is drawn inwards, because the control clips.
- The "more" button is named by `moreLabel` ("More") and opens a menu of `menuitemradio` or `menuitemcheckbox` rows. Choosing a row selects (or toggles) that segment.
- Built on React Aria's `ToggleButtonGroup`.

## Open questions

None.

Resolved 2026-10-10:

- Counts are shown as "(4)" after the label, as in the source and the reference screen, not as a `Badge`.
- Arrow keys move focus only (the toolbar pattern); selection needs Space or Enter. Tab lands on the first segment, or on the one focused last.
- "All" is a prop (`all`, `allLabel`, `allCount`) and not an item: the control then knows that it means "no filter", so `value` is `null` and `values` is empty.
- `onChange` is one prop whose argument follows `selectionMode`; the props of the other mode are typed as `never`.
- Selecting changes the label's weight, so the segments beside it move by a pixel or two. Accepted; `fullWidth` segments do not move.
- The check of `multiple` mode is the provider's `check` icon, replaceable for one control through the `check` part.
- Step 3 is a "more" menu (the public `Menu`), not scrolling. The button is inside the group, so the arrow keys reach it as the last stop. A row shows the label and the count as "Archived (9)". The menu lists only the segments that are not drawn, plus the selected one when it was brought back into the control.
- The selected segment has a lighter violet edge instead of an edge in the fill colour, so two selected neighbours stay apart.
- No loading, empty or error state.
