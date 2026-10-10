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

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `icon` | node | — | |
| `label` | string | — | **Required.** Accessible name and tooltip text |
| `variant` / `shape` | see above | `ghost` / `square` | |
| `pressed` / `onPressedChange` | boolean / function | — | Toggle behaviour |
| `badge` | number \| `true` | — | Count, or a dot |
| `tooltip` | boolean \| node | `true` | Shows `label` on hover and focus |
| `shortcut` | shortcut id | — | |
| `disabled` / `loading` | boolean | `false` | |
| `onPress` | function | — | |

### 3. Parts

`icon`, `badge`, `tooltip`.

### 4. Blocks

None.

## Behaviour as space shrinks

Does not shrink. Its container decides whether to move it into an overflow menu, where it appears as a menu item with its icon and `label`.

## Interaction and accessibility

- `label` is required by the type, so an unnamed icon button cannot be written.
- A toggle exposes `aria-pressed`.
- The hit area is at least 24 × 24px at every density level.

## Open questions

None.
