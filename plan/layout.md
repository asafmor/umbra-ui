# Layout model (decided 2026-10-10)

The layout system is the library's main feature: the app fills the window, never scrolls as a page, and components show less as space shrinks.

## Primitives

| Primitive | Role |
|---|---|
| `AppShell` | Exactly the window size (`100dvw` × `100dvh`), overflow hidden. Holds TopBar, SubNav and one `Page`. |
| `Page` | The area under the bars. Applies the context tint and outer padding. |
| `Columns` | Splits its space horizontally among children. |
| `Stack` | Splits its space vertically among children. |
| `Card` | Fills the slot it is given. Its body is a `ScrollArea`. |

`Columns` and `Stack` nest freely. A few ready-made page presets will be built on top of them, not instead of them.

```tsx
<Page>
  <Columns>
    <Stack size={1}>
      <Card title="Messages" />
    </Stack>
    <Stack size={2}>
      <Card title="News" />
      <Card title="Fixtures" />
    </Stack>
    <Stack size={1}>
      <Card /> <Card /> <Card />
    </Stack>
  </Columns>
</Page>
```

## Sizing rules

1. **Equal split by default.** Children of `Columns` or `Stack` share the space equally with no props.
2. **`size={n}` is a weight.** A child with `size={2}` gets twice the share of a sibling with `size={1}`.
3. **`size="content"` hugs.** The child takes the size of its content and the rest is shared by the others.
4. **Gaps come from the density level**, not from props.
5. **Nothing overflows its slot.** A child can always shrink (`min-width: 0; min-height: 0`); what it does when small is decided by the rules below.

## What happens as space shrinks

Applied in this order, innermost first:

| Level | Rule |
|---|---|
| 1. Component | Each component owns its compact modes. `DataTable` drops columns by `priority`; text truncates with an ellipsis; a `Card` hides secondary header parts. |
| 2. Card body | If content is still taller than the card, the card body scrolls inside (thin thumb, no track). |
| 3. Stack | If the cards in a `Stack` cannot all keep their minimum height, the lowest-`priority` cards collapse to their header. Clicking a collapsed header opens the card's content in an anchored `Popover`. |
| 4. Columns | Below the minimum window size, `Columns` shows one child at a time, with tabs to switch. |

- **`priority`** is a prop on any child of `Stack` or `Columns`, and on table columns. Higher stays longer. The default follows source order (first = highest).
- **Minimum window**: designed for about 1024 × 600 and up. Below that (narrower than 1024 or shorter than 600), rule 4 applies. Phones are not a design target.

## End-user control

- A card can be **collapsible** (`collapsible` prop, off by default). A collapsed card shows only its header and gives its space to its siblings.
- No drag-to-resize dividers.

## Mechanism

- `Columns` and `Stack` are CSS flex containers; `size` maps to `flex-grow` with a zero basis.
- Every slot has a definite width and height, so slots can be CSS size containers (`container-type: size`) and components can use container queries on both width and height. Level 1 needs no JavaScript in most cases.
- Level 3 needs measurement (a `ResizeObserver` in `Stack`), because it compares the available height with the sum of the children's minimum heights.

## Open details

- Minimum height and width per component, per density level. Decided for `Card`: 72 / 88 / 104px high.
- Default column priorities for `DataTable`.
- Tab labels for rule 4: taken from a `label` prop on each `Columns` child.
- The page presets to ship (candidates from the screenshots: list + detail; list + main + aside; main + aside).
