# IconButton

**Tier** 0 · **Group** Inputs · **Status** spec approved 2026-10-10

## Purpose

A button that shows only an icon. For compact, familiar actions in bars, headers and table rows.

## Not for

- An action whose meaning is not obvious from an icon: use `Button`.
- A decorative icon that does nothing: use the icon alone.

## Evidence

History arrows and bar icons (1: bookmark, settings), list tools (14: star, search, more), month arrows (38), expand icons on cards (38).

## Anatomy

| Part | Content |
|---|---|
| `icon` | the icon |
| `badge` | optional count or dot at the corner |

## Variants and states

| Variant | Values | Notes |
|---|---|---|
| `variant` | `neutral`, `ghost` (default), `accent`, `primary`, `danger` | Same meaning as `Button` |
| `shape` | `square`, `circle` | |

States: hover, pressed, focus, disabled, loading, and `pressed` on/off when used as a toggle (for example a star).

## Customisation

### 1. Tokens

`--umbra-icon-button-size` (equals the control height of the density level), `--umbra-icon-size`, plus the `Button` variant colours.

The badge is the public `Badge`, so its colours are Badge's tokens (`--umbra-badge-bg`, `--umbra-badge-fg`). It is smaller on a button; `--umbra-icon-button-badge-size` (14px), `--umbra-icon-button-badge-dot-size` (8px), `--umbra-icon-button-badge-padding-x` (3px) and `--umbra-icon-button-badge-font` set its size. They are defaults, passed to `Badge` as private properties: `--umbra-badge-size`, `--umbra-badge-dot-size`, `--umbra-badge-padding-x` or `--umbra-badge-font` set by the app on any ancestor win (2026-10-11).

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `icon` | node | — | |
| `label` | string | — | **Required.** Accessible name and tooltip text |
| `variant` / `shape` | see above | `ghost` / `square` | |
| `pressed` / `onPressedChange` | boolean / function | — | Toggle behaviour |
| `badge` | number \| `true` | — | Count, or a dot |
| `tooltip` | boolean \| node | `true` | Shows `label` in a `Tooltip` on hover and focus |
| `shortcut` | shortcut id | — | |
| `disabled` / `loading` | boolean | `false` | |
| `onPress` | function | — | |

### 3. Parts

`icon`, `badge`, `tooltip`.

### 4. Blocks

None.

## Behaviour as space shrinks

Does not shrink. Its container decides whether to move it into an overflow menu, where it is a `menuitem` with its icon and `label` (the count of a badge stays in its name). A toggle is a `menuitemcheckbox` with a check at the end of the row.

## Interaction and accessibility

- `label` is required by the type, so an unnamed icon button cannot be written.
- A toggle exposes `aria-pressed`, and a toggled-on button is outlined, so the state does not depend on colour. The accent text colour is applied on `ghost` and `neutral` only.
- `loadingLabel` (default "Loading") names the busy state, as on `Button`.
- The badge is hidden from assistive technology; a count is part of the button's name (the full count, also above 99, where the badge shows "99+"). The count is drawn from an attribute (`Badge`'s `decorative`), not as text in the button, where it would read as a visible label that the name does not start with.
- The hit area is at least 24 × 24px at every density level.

## Open questions

None.

Resolved in the integration pass:

- The `badge` is drawn by the public `Badge` (same `data-part="badge"` wrapper, same accessible name). Its default colour is Badge's violet `accent`, not magenta: one default colour for a count on a control. On an `accent` button, which is the same violet, set `--umbra-badge-bg`.
