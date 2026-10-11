# ScheduleSlot

**Tier** 2 · **Group** Time · **Status** spec written 2026-10-11 (approved under the owner's delegation)

## Purpose

A coloured chip for one entry of a schedule: an icon and a label, coloured by a category the app defines.

## Not for

- A category label that is not an entry in time: use `Tag`.
- A status with a dot: use `StatusIndicator`.
- A number coloured by how good it is: use `ValuePill`.
- An entry with several fields (the source's fixture chip with two codes and a side): compose it from the blocks, or give the `slot` part of the holder your own node.

## Evidence

Tinted, bordered chips with an icon and a label, one colour per family of entry, grey and quieter for rest and travel (22, 37, 38); small icon-only squares in the week strips, some filled, some outlined (1, 2, 4, 11, 17, 27); a selected chip with a light outline (22); labels clipped (37) or cut with an ellipsis (38). `plan/reference/index.html` draws the slot as a bar with a coloured stripe on its start edge: the look taken here.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `icon` | the category's icon (any node) | hidden |
| `label` | the text | shown; `emptyLabel` without one |
| `skeleton` | placeholder while `loading` | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `filled`, `outlined`, `empty` | `filled`: tinted, with a stripe on the start edge. `outlined`: the border only. `empty`: dashed and muted, for free or rest time |
| colour | `tone`, `series`, `color` | `tone`: the six meanings of `Tone`. `series`: 1 to 8 of the series palette, for categories without a meaning. `color`: any CSS colour. `color` wins over `series`, which wins over `tone` |
| `size` | `default`, `small` | table row height plus 2px (24 / 28 / 34 by density); `small` is 6px under the row height, never under 16px |
| `display` | `auto`, `full`, `icon` | below |
| element | button, link, static | `onPress`; `href` (with `renderLink`); neither |

States: hover and pressed (button and link), focus (ring drawn inwards), `selected` (a ring in the text colour, and `selectedLabel` for screen readers), `disabled`, `loading`, no value.

**Colour is never the only cue.** The label is always there for assistive technology. Drawn, a slot shows its label, or in icon-only mode its icon with the label in a tooltip. A slot without an icon keeps its label in every mode. The colour is only ever a tint and a border behind text in the base text colour, so contrast does not depend on the colour chosen.

**No value**: without a label (`null`, `undefined`, `''`) the slot takes the `empty` look and shows `emptyLabel` (an em dash).

## Customisation

### 1. Tokens

`--umbra-schedule-slot-height`, `--umbra-schedule-slot-padding-x`, `--umbra-schedule-slot-gap`, `--umbra-schedule-slot-radius`, `--umbra-schedule-slot-font`, `--umbra-schedule-slot-bg`, `--umbra-schedule-slot-fg`, `--umbra-schedule-slot-border`, `--umbra-schedule-slot-stripe`, `--umbra-schedule-slot-stripe-width`, `--umbra-schedule-slot-selected-ring`. The icon is sized through the private `--icon-size`; the app's `--umbra-icon-size` wins. No new global token: the series palette is the category palette.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label |
| `icon` | node | — | |
| `tone` / `series` / `color` | `Tone` / 1–8 / string | `neutral` | Colour, as above |
| `variant` | see above | `filled` | |
| `size` | `default` \| `small` | `default` | |
| `display` | `auto` \| `full` \| `icon` | `auto` | |
| `fullWidth` | boolean | `false` | Fills its container |
| `selected` / `selectedLabel` | boolean / string | `false` / "Selected" | |
| `disabled` | boolean | `false` | |
| `onPress` | function | — | Makes it a button |
| `href` / `renderLink` | string / function | — | Makes it a link; `renderLink` receives `LinkRenderProps` |
| `loading` | boolean | `false` | A placeholder of the slot's size |
| `emptyLabel` | node | "—" | |
| `aria-label` | string | — | For a label that is not text. On a static slot the element becomes an image, since a name on a plain element is not read |

### 3. Parts

`icon`, `label`, `skeleton`.

### 4. Blocks

`ScheduleSlot.Root`, `ScheduleSlot.Icon`, `ScheduleSlot.Label`. `Root` takes `tooltip`, the text shown while the label is hidden or cut (the all-in-one passes its label).

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | label wider than the slot | the label ends in an ellipsis; the whole label is in a tooltip, on hover and on keyboard focus |
| 2 | `display="icon"`, or `auto` in a day 64px or narrower | icon only: the label is hidden from sight, stays the accessible name, and is in the tooltip. Without an icon the label stays (step 1) |

Step 2 of `auto` is a container query on the day around the slot (`umbra-schedule`, set by `WeekStrip` and `Planner`); alone, `auto` is `full`. Whether the tooltip is needed is asked when the pointer or the focus arrives, so nothing is measured while rendering. The slot never grows past its container.

## Interaction and accessibility

- A button is a `<button>`, a link an `<a>` (or the app's router link), a static slot a `<span>`. `Enter` and `Space` press the button.
- An interactive slot is never under 24px high (WCAG 2.5.8).
- The tooltip repeats the label, so it is not wired as a description.
- In a `WeekStrip` or `Planner` the slot is static and the grid cell around it takes the press and the focus: a cell has one thing to activate, and the grid stays one tab stop.
- Right to left: the stripe is on the right and the icon comes first from the right (logical properties).

## Open questions

None.

Resolved 2026-10-11 (under the owner's delegation):

- **Three ways to colour**, all on one slot: `tone` for a meaning, `series` for the app's own categories from the palette that is already colour-blind checked, `color` for anything else. No new palette token.
- **The stripe look** of the reference is `filled`; the source's outlined squares are `outlined`; rest and travel are `empty`.
- **Icon only is CSS**: the label is taken out of sight by a container query, not by measuring, so a strip of 21 slots costs nothing as it resizes. The 64px limit is fixed in the stylesheet (a container query cannot read a token).
- **Selected is a ring, not violet**: the fill already carries the category, so a second fill would hide it. The ring is a shape, which is the cue that is not colour.
- **The source's multi-field fixture chip is not a variant**: it is domain-specific. The blocks and the holders' `slot` part cover it.
