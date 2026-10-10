# Radio

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

Covers `RadioGroup` and `Radio`. Absorbs RadioCardGroup, OptionTile and InstructionTile.

## Purpose

A choice of exactly one option among a few, all visible at once. An option is a dot with a label, or a card: a bordered tile with a title, a description and an icon or image.

## Not for

- More than about seven options, or little room: use `Select`.
- Switching the view of the content beside it: use `SegmentedFilter` or `Tabs`.
- Choosing a row of a table: `DataTable` has single selection.
- Section navigation that looks like a radio list (source: 21, 26): use `Tabs` (vertical) or a navigation list.
- A button inside an option (source 34, "Customise"): put it next to the group; an option is one control.

## Evidence

Radio dots in lists and tables (6, 7, 9). Option cards in a modal: mark, divider, icon, bold title, one-line description, the chosen one filled violet (34). Pictogram tiles in a grid, some locked (3, 29).

## Anatomy

`Radio`:

| Part | Content | Default |
|---|---|---|
| `mark` | the ring; holds a dot while chosen | shown |
| `media` | an icon or small image | `card` variant only, when `media` is set |
| `label` | the label; the title of a card | shown when there are children |
| `description` | a second line | hidden |

`RadioGroup`:

| Part | Content | Default |
|---|---|---|
| `label` | the group's label, and the required marker | hidden |
| `description` | a line under the label | hidden |
| `options` | the options | shown |
| `error` | an error icon and message | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` (group) | `default`, `card` | `card`: mark in its own cell behind a divider, media, bold title over a description clamped to two lines |
| `orientation` (group) | `vertical`, `horizontal` | sets the wrap direction of `default` options and which arrow keys move |
| `columns` (group) | number | a grid of at most that many columns. `card` options are always in a grid, one column by default. |

States: chosen (filled violet ring with a white dot; a chosen card also has a violet border, doubled by an inset line, and a violet tint), hover, pressed, focus (ring around the mark; around the whole card for `card`), disabled (per option or the whole group), read-only, invalid (danger border on the marks and on cards that are not chosen; the message has an icon), required (a text marker after the group label).

Chosen is shown by the dot, never by colour alone.

## Customisation

### 1. Tokens

`--umbra-radio-size`, `--umbra-radio-border`, `--umbra-radio-border-width`, `--umbra-radio-bg`, `--umbra-radio-selected-bg`, `--umbra-radio-mark-color`, `--umbra-radio-invalid-border`, `--umbra-radio-gap`.

Card: `--umbra-radio-card-bg`, `--umbra-radio-card-border`, `--umbra-radio-card-radius`, `--umbra-radio-card-padding`, `--umbra-radio-card-min-height`, `--umbra-radio-card-divider`, `--umbra-radio-card-media-size`, `--umbra-radio-card-description-lines`, `--umbra-radio-card-selected-bg`, `--umbra-radio-card-selected-border`.

Shared with the other inputs: the `--umbra-field-*` and `--umbra-option-group-*` tokens listed in `Checkbox.md`.

### 2. Props

`RadioGroup`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The options |
| `label` / `description` / `error` | node | — | `error` makes the group invalid |
| `value` / `defaultValue` / `onChange` | string / string / `(value) => void` | — | The chosen option's value |
| `variant` | `default` \| `card` | `default` | |
| `orientation` | `vertical` \| `horizontal` | `vertical` | |
| `columns` | number | — (`1` for cards) | |
| `disabled` / `readOnly` / `invalid` / `required` | boolean | `false` | |
| `requiredLabel` | string | "Required" | |
| `name` | string | — | Form support |
| `id` / `aria-label` | string | — | |

`Radio`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `value` (required) | string | — | |
| `children` | node | — | The label or card title |
| `description` | node | — | |
| `media` | node | — | Icon or small image of a card |
| `disabled` | boolean | `false` | |
| `aria-label` | string | — | Names an option with no visible label |

### 3. Parts

`Radio`: `mark`, `media`, `label`, `description`. `RadioGroup`: `label`, `description`, `options`, `error`.

### 4. Blocks

`Radio.Root`, `Radio.Mark`, `Radio.Media`, `Radio.Label`, `Radio.Description`. `RadioGroup.Root`, `RadioGroup.Label`, `RadioGroup.Description`, `RadioGroup.Options`, `RadioGroup.Error`.

A pictogram tile (source 3, 29) is composed from the blocks: `Radio.Root` with a large `Radio.Media` and a `Radio.Label`.

## Behaviour as space shrinks

| Step | Trigger | Result |
|---|---|---|
| 1 | Group with `columns` narrower than its columns need | A column is never narrower than 12em (`--umbra-option-group-min-option-width`), so columns drop one by one |
| 2 | Card narrower than its text | The title truncates with an ellipsis; the description clamps to two lines |
| 3 | Card content narrower than 11em | The media hides |
| 4 | `default` option narrower than its label | The label and description wrap; a `horizontal` group wraps onto more lines |

## Interaction and accessibility

- Built on React Aria `RadioGroup` and `Radio`: native radio inputs inside `<label>`s, in a `radiogroup` named by the group label.
- One tab stop: `Tab` lands on the chosen option, or the first when none is. Arrow keys move the focus and the choice together, wrap at the ends, and skip disabled options.
- A click anywhere on an option, including a card's description and media, chooses it. The name of an option is its label or title alone; its description, then the group's description and error, are its description.
- The pointer target is at least 24 by 24px for a `default` option; a card is one large target.
- An invalid group has `aria-invalid` and its error in `aria-describedby`. `required` uses the browser's form validation, as for `Checkbox`.
- Inside a `FormField` the group takes the field's label, description, error, `required` and `disabled`.

## Open questions

None.

Resolved 2026-10-10:

- `variant` is set on the group, not per option: mixed looks in one group are not supported.
- A chosen card keeps a dark, violet-tinted surface instead of the source's solid violet fill, so its description keeps the secondary text colour at 4.5:1 and the violet border and filled mark carry the state. The solid look is one token away (`--umbra-radio-card-selected-bg`).
- The chosen mark is a filled dot, in cards too (not a check), so one mark means "radio" everywhere.
- `media` is one prop for an icon or an image; it is shown by cards only.
- No per-option "locked" state: use `disabled`, and put a lock icon in the label if needed.
