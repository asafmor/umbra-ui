# Skeleton

**Tier** 0 · **Group** Data display · **Status** spec approved 2026-10-10

## Purpose

A grey placeholder in the shape of content that is still loading, so the layout does not move when the data arrives. Every data component builds its `loading` state from it.

## Not for

- An action in progress: use the `loading` state of `Button`.
- Content that does not exist: use `EmptyState`.

## Evidence

Not in the screenshots. Defined in `../interaction.md` (loading: skeletons, no spinners by default).

## Anatomy

One element per shape. No parts.

## Variants and states

| `shape` | Use |
|---|---|
| `text` | One or more lines of text; the last line is shorter |
| `block` | Images, charts, any rectangle |
| `circle` | Avatars and icons |

| Variant | Values | Notes |
|---|---|---|
| `animation` | `pulse`, `none` | `none` is forced when reduced motion is on |

## Customisation

### 1. Tokens

`--umbra-skeleton-bg`, `--umbra-skeleton-highlight`, `--umbra-skeleton-radius`.

### 2. Props

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `shape` | see above | `text` | |
| `lines` | number | 1 | For `text` |
| `width` / `height` | number \| string | fills the slot | |
| `animation` | see above | `pulse` | |

### 3. Parts

None. Components that use it expose their own `skeleton` part (see `Card`), so an app can replace a component's whole loading look.

### 4. Blocks

None.

## Behaviour as space shrinks

Fills the slot it is given. A component's skeleton follows the same shrink rules as its real content (a table skeleton shows as many rows and columns as the real table would).

## Interaction and accessibility

- Hidden from assistive technology; the loading component itself carries `aria-busy` and one "Loading" announcement.
- A skeleton that stays for less than 200ms is not shown, to avoid a flash.

## Open questions

None.
