# Columns and Stack

**Tier** 0 · **Group** Layout · **Status** spec approved 2026-10-10

## Purpose

The two layout primitives. `Columns` shares its width among its children; `Stack` shares its height. They nest freely and are how every page is laid out. Full rules are in `../layout.md`.

## Not for

- Flowing content that wraps (tag lists, toolbars): plain CSS or a later `Inline` helper.
- A page that should scroll: this library does not do that.

## Evidence

Screenshot 1: three columns of about 30 / 45 / 25, the right one a stack of five cards. Screenshot 14: two columns, list and detail. Screenshot 32: nine regions in a grid of stacks.

## Anatomy

No visual parts. Each renders one flex container; children are placed in slots.

## Variants and states

| Variant | On | Values | Notes |
|---|---|---|---|
| `narrow` | `Columns` | `tabs`, `keep` | What happens below the minimum window. `tabs` shows one child at a time. |
| `overflow` | `Stack` | `collapse`, `keep` | `collapse` shrinks the lowest-priority cards to their headers when they cannot all fit. |

## Customisation

### 1. Tokens

`--umbra-layout-gap` (from density).

### 2. Props

On `Columns` and `Stack`:

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `gap` | space token | density | Overrides the gap |
| `narrow` (`Columns`) | see above | `tabs` | |
| `overflow` (`Stack`) | see above | `collapse` | |

On every child (all umbra-ui layout-aware components accept these; wrap anything else in `Slot`):

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `size` | number \| `"content"` | `1` | Weight of the share, or hug the content |
| `priority` | number | source order, first is highest | Which child gives way first |
| `minWidth` / `minHeight` | number | per component and density | Below this, the parent applies its shrink rule |
| `label` | string | the child's title | Tab label when `Columns` is in tab mode |

### 3. Parts

`tabs` (the tab strip shown by `Columns` in tab mode).

### 4. Blocks

`Slot`: gives `size`, `priority`, `minWidth`, `minHeight` and `label` to any element that is not an umbra-ui component.

## Behaviour as space shrinks

| Component | Trigger | Result |
|---|---|---|
| `Stack` | Sum of the children's `minHeight` exceeds its height | Lowest-priority cards collapse to their header until the rest fit |
| `Columns` | Window below the minimum (`data-narrow` on the shell) | One child at a time, with tabs |
| both | Otherwise | Children shrink in proportion to `size`; each child applies its own rules |

## Interaction and accessibility

- In tab mode, `Columns` follows the tabs pattern: one tab stop, arrow keys, each column a `tabpanel`.
- DOM order always equals visual order.

## Open questions

- Whether `Columns` should also collapse low-priority columns before reaching tab mode (for example hide an aside at medium widths).
