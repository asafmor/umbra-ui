# Button

**Tier** 0 · **Group** Inputs · **Status** spec approved 2026-10-10

## Purpose

Triggers an action. Text, with an optional icon.

## Not for

- An icon with no text: use `IconButton`.
- Navigation that looks like text: use `Link`.
- Choosing among options: use `SegmentedFilter` or `Tabs`.
- A button with a dropdown of related actions: use `SplitButton`.

## Evidence

Magenta "Continue" (1), violet "Begin Introduction" beside neutral "Decline Introduction" (14), neutral "Copy / Paste / Clear" with a disabled one (38). The source mixes magenta and violet for main actions (6 vs 9); the library fixes one rule.

## Anatomy

| Part | Content | Default |
|---|---|---|
| `iconStart` | icon | hidden |
| `label` | text | shown |
| `iconEnd` | icon | hidden |
| `spinner` | replaces `iconStart` while loading | hidden |

## Variants and states

| `variant` | Look | Rule |
|---|---|---|
| `primary` | magenta | The single main action of a screen or overlay. At most one visible at a time. |
| `accent` | violet | The confirming action of a group when it is not the screen's main action |
| `neutral` (default) | raised surface with a border | Everything else |
| `ghost` | no surface until hover | Low-emphasis actions in dense areas |
| `danger` | danger-coloured text and border on a raised surface (white on the danger colour would not reach 4.5:1) | Destructive actions |

States: hover, pressed, focus, disabled, loading. Height follows the density level; there is no `size` prop, except `size="small"` for use inside table cells.

## Customisation

### 1. Tokens

`--umbra-button-height`, `--umbra-button-radius`, `--umbra-button-padding-x`, and per variant `--umbra-button-<variant>-bg` / `-fg` / `-border`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `children` | node | — | The label |
| `variant` | see above | `neutral` | |
| `iconStart` / `iconEnd` | node | — | |
| `size` | `default` \| `small` | `default` | |
| `loading` | boolean | `false` | Shows the spinner and blocks presses |
| `loadingLabel` | string | "Loading" | What a screen reader hears while loading |
| `disabled` | boolean | `false` | |
| `href` | string | — | Renders a link that looks like a button |
| `shortcut` | shortcut id | — | Binds the key, and shows the key hint in its `Tooltip` (or at the end of its row in an overflow menu) |
| `fullWidth` | boolean | `false` | |
| `collapseTo` | `icon` | — | Hides the label when space is short (see below) |
| `type` | `button` \| `submit` \| `reset` | `button` | |
| `onPress` | function, no arguments | — | |

### 3. Parts

`iconStart`, `label`, `iconEnd`, `spinner`.

### 4. Blocks

None.

## Behaviour as space shrinks

The label truncates with an ellipsis. With `collapseTo="icon"` and an icon set, the label hides when the button does not fit, and the button behaves as an `IconButton` (the label becomes its tooltip and accessible name). It shows the label again when its container grows. Among actions that moved into an overflow menu a button is a `menuitem` row (`plan/specs/Menu.md`): its icon, its label and its key hint; a link button is a link row, and a disabled or loading button a disabled row.

## Interaction and accessibility

- `Enter` and `Space` activate it.
- A loading button stays focusable and announces that it is busy: its spinner is a progress element named by `loadingLabel`, which becomes part of the button's name.
- `primary`, `accent` and `danger` darken on hover instead of lightening, so their text keeps 4.5:1.
- Text contrast on every variant is at least 4.5:1 (checked for `primary` and `accent` in `tokens.json`).

## Open questions

None.
