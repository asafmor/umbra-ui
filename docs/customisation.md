# Customisation

Every component is changed through the same four layers. Try them in order and stop at the first that
is enough.

| Layer     | For                               | Costs you                                         |
| --------- | --------------------------------- | ------------------------------------------------- |
| 1. Tokens | The look: colour, size, spacing   | Nothing. A value.                                 |
| 2. Props  | Variants and behaviour            | Nothing. The component still does all the work.   |
| 3. Parts  | Replacing or hiding one piece     | That piece is yours. The rest stays.              |
| 4. Blocks | Building your own version by hand | The arrangement is yours, and so are its updates. |

The further down, the more of the component you own. A token keeps every later improvement of the
library; a hand-built version keeps only what its blocks do.

## One example through all four layers

The start: a row for an order, in a list.

```tsx
<ListItem
  title="Order 1042"
  description="Client 12 · 14 items"
  meta="2 h ago"
  trailing={<Tag tone="warning">Late</Tag>}
  unread
/>
```

### 1. Tokens: change the look

The row should be tighter, and its unread dot the colour of a warning. Both are tokens of `ListItem`
(the [tables](customisation-tables.md#listitem) list them). Set them on any ancestor:

```tsx
<UmbraScope
  tokens={{ 'list-item-padding-y': '2px', 'list-item-unread-color': 'var(--umbra-color-semantic-warning)' }}
>
  <ListItem title="Order 1042" description="Client 12 · 14 items" meta="2 h ago" unread />
</UmbraScope>
```

or in CSS, on an ancestor or on the row itself through `className`:

```css
.orders {
  --umbra-list-item-padding-y: 2px;
  --umbra-list-item-unread-color: var(--umbra-color-semantic-warning);
}
```

A component reads its tokens and never declares them, so the nearest ancestor that sets one wins.
[Theming](theming.md) covers the global tokens, and when to use CSS and when the `tokens` prop.

### 2. Props: change the variant or the behaviour

The row should look like a message, carry the colour of its category, and open the order.

```tsx
<ListItem
  variant="message"
  overline="Client 12"
  title="Order 1042"
  meta="2 h ago"
  accent="var(--umbra-color-series-2)"
  accentLabel="Wholesale"
  unread
  href="#/orders/1042"
/>
```

Props cover the common cases only. A component does not grow a prop for every piece; that is what the
next layer is for.

### 3. Parts: replace or hide one piece

Each component publishes a fixed list of part names. `ListItem` has `leading`, `overline`, `title`,
`description`, `meta`, `unread` and `trailing`. A part takes one of three things.

**A node** replaces the piece. Here a count takes the place of the unread dot:

```tsx
<ListItem
  title="Order 1042"
  description="Client 12 · 14 items"
  unread
  parts={{ unread: <Badge count={3} label={(n) => `${n} new notes`} /> }}
/>
```

**`null`** hides it. The title stays bold, the dot goes:

```tsx
<ListItem title="Order 1042" description="Client 12 · 14 items" unread parts={{ unread: null }} />
```

**A function** receives the props the default piece would have got, and returns what to render. Use it
to wrap the piece or to adjust it and keep the rest:

```tsx
<ListItem
  title="Order 1042"
  description="Client 12 · 14 items"
  href="#/orders/1042"
  parts={{
    // Keeps the link and the truncation of the default title, and adds a mark before the text.
    title: (props) => (
      <ListItem.Title {...props}>
        <StatusIndicator status="warning" aria-label="Late" /> {props.children}
      </ListItem.Title>
    ),
  }}
/>
```

A part that is left out is rendered as usual. Some parts are empty unless you give them, such as the
`toolbar` and `footer` of a `Card`:

```tsx
<Card title="Orders" parts={{ footer: <Card.Footer>12 open · 3 late</Card.Footer> }} />
```

### 4. Blocks: build your own version

The all-in-one component is itself built from its public blocks, so anything it does can be rebuilt by
hand. This row puts a meter where the description would be, which no prop or part offers:

```tsx
import { ListItem, ProgressBar, Tag } from 'umbra-ui';

export function OrderRow({ id, client, packed }: { id: number; client: string; packed: number }) {
  return (
    <ListItem.Root interactive>
      <ListItem.Content>
        <ListItem.Overline>{client}</ListItem.Overline>
        <ListItem.Title href={`#/orders/${id}`}>Order {id}</ListItem.Title>
        <ProgressBar value={packed} size="thin" aria-label="Packed" />
      </ListItem.Content>
      <ListItem.End>
        <ListItem.Meta>{packed}%</ListItem.Meta>
        <ListItem.Trailing>
          <Tag tone={packed < 50 ? 'warning' : 'success'}>{packed < 50 ? 'Behind' : 'On time'}</Tag>
        </ListItem.Trailing>
      </ListItem.End>
    </ListItem.Root>
  );
}
```

What the blocks still do for you: the root's states and density, the title's link that covers the row,
truncation, the order in which the end pieces hide. What is now yours: which pieces exist, and their
order.

Inside a `List`, pass a hand-built row as the children of `List.Item`. A function receives the row's
state to hand on to `ListItem.Root`:

```tsx
<List aria-label="Orders" selectionMode="single">
  <List.Item id="1042" textValue="Order 1042">
    {({ selected, disabled, interactive }) => (
      <ListItem.Root selected={selected} disabled={disabled} interactive={interactive}>
        <ListItem.Content>
          <ListItem.Title>Order 1042</ListItem.Title>
        </ListItem.Content>
      </ListItem.Root>
    )}
  </List.Item>
</List>
```

## `className`, `style` and `data-` attributes

Every component takes `className` and `style` on its root. For your own CSS, each one also marks itself:

| Attribute            | On                    | Example                                                          |
| -------------------- | --------------------- | ---------------------------------------------------------------- |
| `data-umbra`         | The root              | `[data-umbra='card']`, `[data-umbra='list-item']`                |
| `data-part`          | Each named piece      | `[data-part='header']`, `[data-part='title']`                    |
| State and variant    | The root or the piece | `data-selected`, `data-disabled`, `data-loading`, `data-tone`    |
| `data-umbra-density` | The provider, a scope | `[data-umbra-density='compact']`                                 |
| `data-umbra-context` | The provider, a scope | `[data-umbra-context='teal']` (presets only)                     |
| `data-narrow`        | `AppShell`            | Set below the minimum window; `Columns` then has `data-tab-mode` |

A state attribute is present while the state holds and absent otherwise. A few carry a value:
`data-collapsed` on a card is `user` (collapsed with its caret) or `layout` (collapsed by its stack).

```css
/* A card the layout has collapsed */
[data-umbra='card'][data-collapsed='layout'] [data-part='header'] {
  opacity: 0.8;
}

/* The title of a selected row, at the compact density only */
[data-umbra-density='compact'] [data-umbra='list-item'][data-selected] [data-part='title'] {
  letter-spacing: 0.01em;
}
```

- Use these attributes, not the library's class names: the class names are generated and change with
  every build.
- Prefer a token to a rule. A rule on `[data-part]` works until that piece is rearranged; a token is
  part of the component's contract.
- Do not change `display`, `position`, sizes or `overflow` on a root. The layout system relies on them.

## Reading the generated tables

[`customisation-tables.md`](customisation-tables.md) is built from the source by `npm run docs:tables`,
so it cannot be out of date. Each component has one section:

| Line       | Read it as                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| First line | What the component is for.                                                                                        |
| **Tokens** | Layer 1. The CSS variables it reads. Drop `--umbra-` for the `tokens` prop.                                       |
| The table  | Layer 2. Every prop with its type. `(required)` marks the few that are. `className` and `style` are always there. |
| **Parts**  | Layer 3. The names the `parts` prop takes. In the table, the `parts` row says `see Parts`.                        |
| **Blocks** | Layer 4. The pieces to build with. `none` means the component is one piece and stops at parts.                    |

- A token listed under several components is shared: `--umbra-focus-color` is read by everything that
  takes focus.
- `size`, `priority`, `minWidth`, `minHeight` and `label` in a table mean the component can be a direct
  child of `Columns` or `Stack` (see [Layout](layout.md)).
- The exact type of a part (what its function receives) is in the component's props type, for example
  `ListItemProps['parts']`. An editor shows it on hover.

## The naming rules

The same idea has the same name in every component, so a prop learned once works everywhere.

| Idea                  | Name                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A press               | `onPress`. A row or point chosen from a collection: `onAction(id)`. Never `onClick`.                                                                                             |
| State flags           | `disabled`, `readOnly`, `invalid`, `required`, `loading`, `selected`, `checked`, `pressed`, `open`, `collapsed`. No `is` prefix.                                                 |
| A changing value      | `value` / `defaultValue` / `onChange`                                                                                                                                            |
| Other state           | `<name>` / `default<Name>` / `on<Name>Change`: `collapsed`, `open`                                                                                                               |
| Lists of ids          | `<what>Ids`: `selectedIds`, `hiddenIds`, `expandedIds`. Items are identified by `id`.                                                                                            |
| Heading level         | `headingLevel`                                                                                                                                                                   |
| A built-in string     | `<what>Label`, with an English default: `moreLabel`, `closeLabel`, `retryLabel`                                                                                                  |
| Text of a number      | `formatValue`                                                                                                                                                                    |
| Size                  | `size`: the share of the parent's space on a layout child, the control size elsewhere. A layout child that also has a control size names it for the part: `tabSize`, `itemSize`. |
| Colour by meaning     | `tone`. A free colour is `color`. `variant` is the shape or look.                                                                                                                |
| Router link           | `renderLink(props)`                                                                                                                                                              |
| Loading, empty, error | `loading`, `empty`, `error`, `onRetry`, `retryLabel`                                                                                                                             |
| An icon               | Any node: `icon`, `iconStart`, `iconEnd`                                                                                                                                         |

## Router links

Everything that renders a link takes `renderLink`: `PrimaryNav`, `SubNav`, `VerticalNav`, `PageHeader`
(breadcrumbs), `ShortcutBar`, `Menu` and `Link`. It receives the props of the anchor the component
would have rendered, `href` included. Spread them on your router's link:

```tsx
import { Link as RouterLink } from 'react-router-dom';
import { Link, PrimaryNav, type NavLinkProps } from 'umbra-ui';

// One function for the whole app.
const renderLink = (props: NavLinkProps) => <RouterLink to={props.href} {...props} />;

export function Nav({ current }: { current: string }) {
  return (
    <>
      <PrimaryNav
        value={current}
        renderLink={renderLink}
        items={[
          { id: 'orders', label: 'Orders', href: '/orders' },
          { id: 'clients', label: 'Clients', href: '/clients' },
        ]}
      />
      <Link href="/orders/1042" renderLink={renderLink}>
        Order 1042
      </Link>
    </>
  );
}
```

- Spread **all** the props: they carry the class, `aria-current`, the keyboard handlers and the content.
- With `href` on the items, drive `value` from the route and leave `onChange` out.
- `CommandPalette` does not render links. It calls `navigate(href)`; pass your router's `navigate`.
- `HistoryButtons` use the browser history by default, which a history-based router follows. Give
  `onBack`, `onForward`, `canGoBack` and `canGoForward` for a router that keeps its own.
- Row links (`rowHref` of `DataTable`, `href` of `List.Item`, `Card`, `SummaryTile`, `Button`) are plain
  anchors. With a hash router they just work; with a history router, use `onRowAction`, `onAction` or
  `onPress` and call `navigate`.

`examples/advanced` does all of this with a small hash router of its own.

## Controlled and uncontrolled

Every piece of state a component holds can be left to it or taken over, with the same three names.

```tsx
import { useState } from 'react';
import { Card, Tabs } from 'umbra-ui';

const tabs = [
  { id: 'open', label: 'Open', content: 'Open orders' },
  { id: 'sent', label: 'Sent', content: 'Sent orders' },
];

export function Orders() {
  const [tab, setTab] = useState<string | null>('open');
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      {/* Uncontrolled: the component keeps the state. `default…` sets where it starts. */}
      <Tabs items={tabs} defaultValue="sent" />
      <Card title="Notes" collapsible defaultCollapsed />

      {/* Controlled: you keep it. The component shows what you pass and reports every change. */}
      <Tabs items={tabs} value={tab} onChange={setTab} />
      <Card title="Notes" collapsible collapsed={collapsed} onCollapsedChange={setCollapsed} />
    </>
  );
}
```

| State           | Controlled    | Start value          | Change              |
| --------------- | ------------- | -------------------- | ------------------- |
| A value         | `value`       | `defaultValue`       | `onChange`          |
| On or off       | `checked`     | `defaultChecked`     | `onChange`          |
| Open, collapsed | `open`        | `defaultOpen`        | `onOpenChange`      |
| Selected rows   | `selectedIds` | `defaultSelectedIds` | `onSelectionChange` |
| Sort order      | `sort`        | `defaultSort`        | `onSortChange`      |
| Hidden series   | `hiddenIds`   | `defaultHiddenIds`   | `onHiddenChange`    |

- Pass the controlled prop **or** the default, not both.
- A controlled prop without its change handler makes the component read-only in that respect.
- Controlling is what links components: the `selectedIds` of a `List` choosing what a detail pane
  shows, or one `hiddenIds` shared by a `Legend` and two charts ([recipes](recipes.md)).

## Translating built-in strings

The library writes few words of its own, and every one is a prop with an English default, named
`…Label`. Most are accessible names (what a screen reader hears for an icon-only button); a few are
visible.

```tsx
<Card
  title="Commandes"
  collapsible
  collapseLabel="Réduire"
  expandLabel="Développer"
  moreLabel="Autres actions"
  retryLabel="Réessayer"
/>
```

A label that depends on a number or a row is a function: `moreLabel={(n) => `${n} de plus`}`.

| Component                             | Strings                                                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppShell`                            | `skipLabel`                                                                                                                                                                                                         |
| `TopBar`                              | `searchLabel`, `backLabel`, `forwardLabel`, `moreLabel`                                                                                                                                                             |
| `PrimaryNav`, `SubNav`                | `moreLabel`, `submenuLabel(label)`                                                                                                                                                                                  |
| `VerticalNav`                         | `collapseLabel`, `expandLabel`                                                                                                                                                                                      |
| `HistoryButtons`                      | `backLabel`, `forwardLabel`, `entriesLabel`                                                                                                                                                                         |
| `PrimaryAction`                       | `loadingLabel`, `attentionLabel`, `menuLabel`                                                                                                                                                                       |
| `ShortcutBar`                         | `moreLabel(count)`, `moreName(count)`, `editLabel`                                                                                                                                                                  |
| `PageHeader`                          | `moreLabel`, `backLabel`, `breadcrumbsLabel`                                                                                                                                                                        |
| `Columns`                             | `tabsLabel`                                                                                                                                                                                                         |
| `Card`                                | `collapseLabel`, `expandLabel`, `moreLabel`, `retryLabel`                                                                                                                                                           |
| `SectionTitle`                        | `moreLabel`                                                                                                                                                                                                         |
| `GroupHeader`                         | `collapseLabel`, `expandLabel`, `moreLabel`                                                                                                                                                                         |
| `Button`, `IconButton`                | `loadingLabel`                                                                                                                                                                                                      |
| `List`                                | `loadingMoreLabel`, `retryLabel`                                                                                                                                                                                    |
| `ListItem`                            | `unreadLabel`, `accentLabel`                                                                                                                                                                                        |
| `DataTable`                           | `selectRowLabel(row)`, `selectAllLabel`, `highlightLabel`, `collapseGroupLabel`, `expandGroupLabel`, `showDetailsLabel`, `hideDetailsLabel`, `loadingMoreLabel`, `increasedLabel`, `decreasedLabel`, `retryLabel`   |
| `Banner`                              | `dismissLabel`                                                                                                                                                                                                      |
| `Tag`                                 | `removeLabel`, `stripeLabel`                                                                                                                                                                                        |
| `AvatarGroup`                         | `moreLabel(count)`                                                                                                                                                                                                  |
| `Legend`                              | `moreLabel(count)`, `allLabel`                                                                                                                                                                                      |
| `Link`                                | `externalLabel`                                                                                                                                                                                                     |
| `TrendArrow`                          | `upLabel`, `downLabel`, `flatLabel`                                                                                                                                                                                 |
| `ValuePill`                           | `levelLabel(level, steps)`, `emptyLabel`                                                                                                                                                                            |
| `ProgressBar`, `LevelMeter`           | `targetLabel`; `compareLabel`, `rangeLabel`                                                                                                                                                                         |
| Charts                                | `retryLabel`, `pointsLabel`, `legendLabel`                                                                                                                                                                          |
| `Tabs`                                | `moreLabel`, `closeLabel`                                                                                                                                                                                           |
| `SegmentedFilter`                     | `allLabel`, `moreLabel`                                                                                                                                                                                             |
| `TextField`                           | `clearLabel`                                                                                                                                                                                                        |
| `FormField`, `Checkbox`, `RadioGroup` | `requiredLabel`; `optionalLabel` on `FormField`                                                                                                                                                                     |
| `Menu`                                | `emptyLabel`                                                                                                                                                                                                        |
| `Popover`, `Modal`                    | `closeLabel`; `navLabel` on `Modal`                                                                                                                                                                                 |
| `ConfirmDialog`                       | `confirmLabel`, `cancelLabel`, `loadingLabel`                                                                                                                                                                       |
| `ActionBar`                           | `selectionLabel(count)`, `clearLabel`                                                                                                                                                                               |
| `CommandPalette`                      | `label`, `placeholder`, `emptyLabel`, `errorLabel`, `retryLabel`, `loadingLabel`, `recentLabel`, `shortcutsLabel`, `resultsLabel`, `backLabel`, and the footer hints `moveHint`, `runHint`, `backHint`, `closeHint` |

Also yours to translate: the default texts of the empty and error states (pass `empty` and `error`),
the `label` of each shortcut in the provider's `shortcuts`, and `aria-label` wherever a component asks
for one. The generated descriptions of charts are made of your own labels and of numbers in the
`locale` format; pass `description` to write one yourself.

In an app with many screens, wrap the components you use most once, with your strings filled in, and
import the wrappers.

## When not to customise

Reaching for layer 3 or 4 is sometimes a sign that another component already does the job.

| If you are…                                                 | Use                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Lining up several values per row in a `List`                | `DataTable`                                                                    |
| Rebuilding a card header to hold a title, facts and actions | `PageHeader` (`size="compact"` inside a card)                                  |
| Putting buttons in a `Popover`                              | `Menu`                                                                         |
| Asking yes or no in a `Modal`                               | `ConfirmDialog`                                                                |
| Switching views with a `SegmentedFilter`                    | `Tabs`. A filter narrows one view; tabs change it.                             |
| Styling a `Button` to look like text                        | `Link`                                                                         |
| Showing a number in a `Tag`                                 | `Badge` for a count, `ValuePill` for a graded value                            |
| Making a `StatValue` clickable                              | `SummaryTile`                                                                  |
| Placing a `Banner` with buttons at the bottom of a page     | `ActionBar`, in the `footer` of `Page`                                         |
| Hiding a card's header and border to get a bare box         | `Slot`                                                                         |
| Writing "nothing here" by hand in a card                    | The `empty` prop, or `EmptyState`                                              |
| Drawing your own spinner                                    | The `loading` prop: skeletons in the final layout                              |
| Recolouring selected rows or the primary button             | Nothing: those two colours are fixed ([why](theming.md#what-is-not-themeable)) |
| Letting the page scroll for one long screen                 | A card. Its body scrolls.                                                      |

If none fits and you are four layers deep, that is what the layers are for. Keep the blocks: they carry
the keyboard handling, the accessible names and the shrink rules that a `div` of your own would not.

## Next

- [Recipes](recipes.md): whole screens, from a first page to a table with bulk actions.
- [Theming](theming.md): the global tokens, fonts, icons and direction.
- `examples/advanced`: a component built from blocks and parts, in an app.
