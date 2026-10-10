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
| `gap` | step of the space scale, `0`–`9` | density | Overrides the gap |
| `tabsLabel` (`Columns`) | string | "Columns" | Accessible name of the tab strip |
| `narrow` (`Columns`) | see above | `tabs` | |
| `overflow` (`Stack`) | see above | `collapse` | |

On every child (all umbra-ui layout-aware components accept these; wrap anything else in `Slot`):

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `size` | number \| `"content"` | `1` | Weight of the share, or hug the content |
| `priority` | number | `0` | Which child gives way first. Higher stays longer; equal priorities give way from the end of the source order. |
| `minHeight` | number | per component and density | The height the child needs. A `Stack` holds its open children at it while they all fit, and collapses cards when they do not. |
| `minWidth` | number | — | Reserved. `Columns` has no rule that uses it in Milestone 0, so it has no effect. |
| `label` | string | the child's title, when it is text | Tab label when `Columns` is in tab mode. A child without one gets its number and a development warning. |

### 3. Parts

`tabs` (the tab strip shown by `Columns` in tab mode).

### 4. Blocks

`Slot` (exported as a component): gives `size`, `priority`, `minWidth`, `minHeight` and `label` to any element that is not an umbra-ui component.

## Behaviour as space shrinks

| Component | Trigger | Result |
|---|---|---|
| `Stack` | Sum of the children's `minHeight` (plus gaps) exceeds its height | Lowest-priority cards collapse to their header until the rest fit. Only cards with a header can collapse. A collapsed card is exactly as tall as its header and the open cards share the rest. If even that is not enough, the minimums are dropped and everything shrinks, collapsed headers too. |
| `Columns` | Window below the minimum (`data-narrow` on the shell) | One child at a time, with tabs |
| both | Otherwise | Children shrink in proportion to `size`; each child applies its own rules |

## Interaction and accessibility

- In tab mode, `Columns` follows the tabs pattern: one tab stop, arrow keys, each column a `tabpanel`.
- DOM order always equals visual order.
- Children are found through React context, not by direct parentage, so a child may be wrapped (for example in `UmbraScope`).

## Open questions

None.

Resolved 2026-10-10:

- `Columns` does not collapse low-priority columns before tab mode in Milestone 0.
- Approved after Milestone 0: in narrow mode every `Columns` becomes tabs, nested ones too; `narrow="keep"` opts one out.
