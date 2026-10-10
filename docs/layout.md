# Layout

The layout system is the main feature of umbra-ui. The app fills the window, the page never scrolls,
and components show less as space shrinks.

## The pieces

| Component    | Role                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `AppShell`   | Exactly the window. Holds the bars and one `Page`.                   |
| `Page`       | The area under the bars. Adds the outer margin and the context tint. |
| `PageHeader` | In the `header` of a `Page`: fixed above the content.                |
| `ActionBar`  | In the `footer` of a `Page`: fixed below the content.                |
| `Columns`    | Shares its width among its children.                                 |
| `Stack`      | Shares its height among its children.                                |
| `Card`       | Fills the slot it is given. Its body scrolls inside.                 |
| `Slot`       | Puts any element of yours into a `Columns` or `Stack`.               |
| `ScrollArea` | A region that scrolls inside its slot.                               |

`Columns` and `Stack` nest freely.

```tsx
<Page>
  <Columns>
    <Card title="Inbox" />
    <Stack size={2}>
      <Card title="Updates" />
      <Card title="Schedule" />
    </Stack>
    <Stack>
      <Card title="Budget" priority={1} />
      <Card title="Payroll" />
      <Card title="This week" />
    </Stack>
  </Columns>
</Page>
```

## How space is shared

These props work on every child of `Columns` or `Stack`: `Card`, `Columns`, `Stack` and `Slot`, and also
`Tabs`, `Accordion`, `VerticalNav` and `SummaryTile`, which can sit beside cards.

| Prop             | Meaning                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| none             | Children share the space equally.                                                                                  |
| `size={2}`       | A weight: twice the share of a sibling with `size={1}`.                                                            |
| `size="content"` | Takes the size of its content; the rest is shared by the others.                                                   |
| `priority={n}`   | Who gives way first when space runs out. Higher stays longer. Default `0`; equal priorities give way from the end. |
| `minHeight={n}`  | The height the child needs, in pixels. A card's default follows the density level (72, 88 or 104).                 |
| `label="…"`      | The tab label in tab mode. A card uses its title.                                                                  |

- Gaps come from the density level. `gap={3}` on `Columns` or `Stack` picks a step of the spacing scale.
- Nothing overflows its slot: every child can shrink.
- A child can be wrapped, for example in `UmbraScope`, and still takes part in the layout.
- A `Card` with `size="content"` is as tall as its header plus its content. When the stack is too short
  for that, it takes what is left and scrolls inside.

## What happens as space shrinks

In this order, innermost first:

| Level        | Rule                                                                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Component | Each component has its own compact modes. A card header hides its subtitle, then moves its actions into one menu, then truncates its title. Text truncates with an ellipsis.           |
| 2. Card body | Content taller than the card scrolls inside it: a thin thumb, no track.                                                                                                                |
| 3. Stack     | When the cards of a stack cannot all have their minimum height, the lowest-priority cards collapse to their header. Clicking a collapsed header opens the card's content in a popover. |
| 4. Columns   | Below 1024 x 600, `Columns` shows one child at a time, with tabs.                                                                                                                      |

Rule 3 in detail:

- While all cards fit, each open card is at least its minimum height.
- When they do not fit, cards collapse one at a time, lowest `priority` first, until the rest fit.
- Only a card with a header can collapse. A card collapsed by the layout shows an "expand" icon.
- The card with the highest priority goes last. When it cannot have its minimum height even with every
  other card collapsed, it stays open, takes the space that is left and scrolls inside. It collapses too
  only when that space is less than one and a half times its header.
- It happens instantly while the window is resized.
- `overflow="keep"` on a `Stack` turns it off.

Rule 4 in detail:

- The window is "narrow" when it is under 1024 wide **or** under 600 high. `AppShell` sets `data-narrow`.
- Every `Columns` then shows tabs. `narrow="keep"` on a `Columns` keeps its columns.

## A header and a footer for the page

`Page` takes a `header` and a `footer`. Both stay fixed, and the content shares what is left.

```tsx
<Page
  header={<PageHeader title="Orders" subtitle="Region A" actions={<Button>Export</Button>} />}
  footer={<ActionBar status="3 unsaved changes" primary={{ label: 'Save' }} />}
>
  <Columns>
    <Card title="Open" />
    <Card title="Sent" />
  </Columns>
</Page>
```

## Letting the user collapse a card

```tsx
<Card title="Notes" collapsible defaultCollapsed />
```

A collapsed card shows only its header and gives its space to its siblings. Control it with `collapsed`
and `onCollapsedChange`.

## Sizing your own content

Every card is a CSS size container, so content can respond to the card's own width and height:

```css
@container (max-width: 300px) {
  .secondary-column {
    display: none;
  }
}
@container (max-height: 150px) {
  .footnote {
    display: none;
  }
}
```

A card that takes the size of its content (`size="content"`, or collapsed) is a width-only container.

## Checking that the page does not scroll

The rule is tested, not assumed. `npm run test:visual` opens every story at 1920 x 1080, 1280 x 720 and
1024 x 600, at all three densities, and fails if the document is larger than the window.
`npm run test:examples` does the same for the three example apps, down to 900 x 560.

In an app of your own, the check is four lines in any browser test:

```tsx
const overflow = () => {
  const d = document.documentElement;
  return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight };
};
// Both must be 0 at every window size you support.
```

## Next

- [Recipes](recipes.md): [three columns and a stack](recipes.md#2-three-columns-and-a-stack-that-collapses),
  [tab mode](recipes.md#3-tab-mode-below-the-minimum-window).
- [Theming](theming.md): density, which sets the gaps and the minimum height of a card.
- `examples/dashboard`: a stack that collapses at small heights, in an app.
