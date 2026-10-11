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
5. **A component that fills takes its content's height where there is none to fill** (decided 2026-10-11). `DataTable`, `List` and the charts fill their slot. In a parent without a height of its own (flowing content in a card body, the popover of a collapsed card, a modal body, an accordion panel) they are as tall as their content instead of zero pixels. The shared `height` prop makes it explicit: `fill` (default), `content`, or a number of pixels.
6. **One recorded exception: in a `WidgetBoard` a card hugs its content** (decided 2026-10-11, Milestone 2). Everywhere else a card fills its slot and its body scrolls. On a board each card is as tall as its header plus its content (`size="content"`), the cards are packed in columns counted from the board's own width, and it is the board that fills its slot and scrolls inside. A `HorizontalScroller` is the same idea sideways: its items keep their width, the row fills its slot's width and scrolls inside, and it is as tall as its items unless it is given a share of the height. Both start a new layout context: a `Stack` around them does not count or collapse what is inside.
7. **Nothing overflows its slot.** A child can always shrink (`min-width: 0; min-height: 0`); what it does when small is decided by the rules below.

## What happens as space shrinks

Applied in this order, innermost first:

| Level | Rule |
|---|---|
| 1. Component | Each component owns its compact modes. `DataTable` drops columns by `priority`; text truncates with an ellipsis; a `Card` hides secondary header parts. |
| 2. Card body | If content is still taller than the card, the card body scrolls inside (thin thumb, no track). |
| 3. Stack | If the cards in a `Stack` cannot all keep their minimum height, the lowest-`priority` cards collapse to their header. Clicking a collapsed header opens the card's content in an anchored `Popover`. The highest-priority card is the last to go, and it stays open when it cannot keep its minimum even with every other card collapsed: it takes the space that is left and scrolls inside (decided 2026-10-11), so a column is not left with headers only. It collapses too only when that space is less than one and a half times its **collapsed** header (the height the card would have once collapsed: title row and equal padding, without subtitle or actions), which is no room for content. The same measure is used whether the card is open or collapsed at that moment, so the result is a function of the stack's height and its cards alone: resizing never flips a card back and forth, and a fresh load at a size gives what a resize to that size gives (decided 2026-10-11). |
| 4. Columns | Below the minimum window size, `Columns` shows one child at a time, with tabs to switch. It does the same in any window when its children cannot all have their `minWidth` (decided 2026-10-11). |

- **`priority`** is a prop on any child of `Stack` or `Columns`, and on table columns. Higher stays longer. The default follows source order (first = highest).
- **Minimum window**: designed for about 1024 × 600 and up. Below that (narrower than 1024 or shorter than 600), rule 4 applies. Phones are not a design target.

## End-user control

- A card can be **collapsible** (`collapsible` prop, off by default). A collapsed card shows only its header and gives its space to its siblings.
- No drag-to-resize dividers.

## Mechanism

- `Columns` and `Stack` are CSS flex containers; `size` maps to `flex-grow` with a zero basis.
- Every slot has a definite width and height, so slots can be CSS size containers (`container-type: size`) and components can use container queries on both width and height. Level 1 needs no JavaScript in most cases.
- Level 3 needs measurement (a `ResizeObserver` in `Stack`), because it compares the available height with the sum of the children's minimum heights.
- A card the layout has collapsed keeps its content mounted: hidden and inert in the card, and moved (the same elements) into the popover while that is open. Text typed in it, scroll positions and component state survive a resize (decided 2026-10-11).
- Level 1 rules that need measuring use one hook (`src/internal/useShrinkLevel.ts`). What a row shows is a function of its width alone: growing restarts from everything visible, shrinking only adds steps, rows restart together so they give way in their fixed order, and a restart waits while a menu opened from the row is showing.

- The fallback of rule 5 is plain CSS: the root's `height: 100%` computes to `auto` in a parent without a height, and the part that scrolls or draws has a content size (`flex-basis: auto`, or `contain-intrinsic-block-size` for a chart's plot) that only counts then.

## Open details

- Minimum height and width per component, per density level. Decided for `Card`: 72 / 88 / 104px high.
- Default column priorities for `DataTable`.
- Tab labels for rule 4: taken from a `label` prop on each `Columns` child.
- The page presets to ship (candidates from the screenshots: list + detail; list + main + aside; main + aside).
