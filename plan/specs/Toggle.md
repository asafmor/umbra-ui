# Toggle

**Tier** 1 · **Group** Inputs · **Status** spec written 2026-10-10 (approved under the owner's delegation)

## Purpose

A switch for a setting that takes effect at once: on or off.

## Not for

- A choice that is sent with a form and applies on "Save": use `Checkbox`.
- Choosing between two named views ("List" / "Grid"): use `SegmentedFilter`.
- A button that stays pressed (pin, bookmark): use `IconButton`.

## Evidence

Off: dark track with a light outline, knob at the start (12, 39). On: filled track, knob at the end, sometimes with an "On" text beside it (20, 26, 28, 40). The label is at the start in every source example. The on colour differs between screens (green, magenta); the library uses the fixed violet.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `track` | the track and its thumb; the thumb carries a check mark while on | shown |
| `label` | the label | shown when there are children |
| `description` | a second line under the label | hidden |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `size` | `default`, `small` | `default` follows the density level (18 / 22 / 26px high). `small` is for table cells and toolbars and keeps the label on one line. |
| `labelPosition` | `end`, `start` | `start`: the text takes the room and the switch sits at the end, as in the source |

States: off, on, hover, pressed, focus (ring around the track), disabled, read-only.

On is shown by the thumb's position and by the check mark on it, never by colour alone.

## Customisation

### 1. Tokens

`--umbra-toggle-height`, `--umbra-toggle-small-height`, `--umbra-toggle-width`, `--umbra-toggle-radius`, `--umbra-toggle-border`, `--umbra-toggle-bg`, `--umbra-toggle-selected-bg`, `--umbra-toggle-thumb-bg`, `--umbra-toggle-selected-thumb-bg`, `--umbra-toggle-thumb-inset`, `--umbra-toggle-mark-color`, `--umbra-toggle-gap`.

Shared with the other inputs: `--umbra-field-description-color`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label |
| `description` | node | — | A second line |
| `checked` / `defaultChecked` / `onChange` | boolean / boolean / `(checked) => void` | — | Controlled or uncontrolled state |
| `disabled` / `readOnly` | boolean | `false` | |
| `size` | `default` \| `small` | `default` | |
| `labelPosition` | `end` \| `start` | `end` | |
| `name` / `value` | string | — | Form support: sent only while on |
| `id` | string | — | |
| `aria-label` | string | — | Names a toggle with no visible label |

### 3. Parts

`track`, `label`, `description`.

### 4. Blocks

`Toggle.Root`, `Toggle.Track`, `Toggle.Label`, `Toggle.Description`. `Toggle.Track` takes children as the mark on its thumb.

## Behaviour as space shrinks

The switch keeps its size. The label and description wrap; a `small` toggle truncates its label with an ellipsis instead. With `labelPosition="start"` in a slot wider than its text, the switch stays at the end of the slot.

## Interaction and accessibility

- Built on React Aria `Switch`: a native checkbox input with the `switch` role inside a `<label>`.
- `Space` toggles. A click on the label or the description toggles it. The name is the label alone; the description is its description.
- The pointer target is at least 24px high at every size.
- The thumb slides in 100ms, and not at all with reduced motion.
- Read-only: focusable, no hover response, does not change.
- Inside a `FormField` a bare toggle takes the field's id, label, description and `disabled`.
- A toggle has no invalid state: it always has a valid value.

## Open questions

None.

Resolved 2026-10-10:

- The default `labelPosition` is `end`, the same side as `Checkbox` and `Radio`, so mixed lists line up. The source's look (label at the start, switch at the end of the row) is `labelPosition="start"`, or a bare toggle in a `FormField`.
- On is violet (selected), not the source's green or magenta: magenta is reserved for the primary action.
- The on-state mark is a check on the thumb, not an "On" text beside the switch: it needs no translation and no extra room.
- No `required` or `invalid`: a switch cannot be left unanswered.
