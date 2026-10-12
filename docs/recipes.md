# Recipes

Whole screens, from a first page to a planner and a board of widgets. Each sample is a complete `src/App.tsx`:
paste it into the app from [Getting started](getting-started.md), whose `main.tsx` loads the stylesheet
and the fonts and renders `<App />`.

| #   | Recipe                                                                          | Shows                                                             |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | [A first page](#1-a-first-page)                                                 | Provider, shell, one card that scrolls inside                     |
| 2   | [Three columns and a stack](#2-three-columns-and-a-stack-that-collapses)        | `size`, `priority`, `minHeight`, stack collapse                   |
| 3   | [Tab mode](#3-tab-mode-below-the-minimum-window)                                | `label`, `tabsLabel`, `narrow="keep"`                             |
| 4   | [A card with tabs and data states](#4-a-card-with-tabs-loading-empty-and-error) | Toolbar tabs, `loading`, `empty`, `error`, `onRetry`              |
| 5   | [List and detail](#5-list-and-detail)                                           | `List` selection driving a pane with a `PageHeader`               |
| 6   | [A table with bulk actions](#6-a-table-with-sorting-selection-and-bulk-actions) | Sorting, selection, `ActionBar`, column priorities                |
| 7   | [Server-side data](#7-server-side-data)                                         | `manualSorting`, `loadingMore`, `onReachEnd`                      |
| 8   | [A settings modal](#8-a-settings-modal)                                         | `Modal` with `VerticalNav` and `FormField`s                       |
| 9   | [A command palette](#9-a-command-palette-and-shortcuts)                         | Commands, pages, shortcuts and key hints                          |
| 10  | [Charts with a shared legend](#10-charts-with-a-shared-legend)                  | One `Legend` switching series in two charts                       |
| 11  | [The shell with a router](#11-the-shell-with-a-router)                          | `renderLink`, history buttons, the primary action                 |
| 12  | [Live updates](#12-live-updates)                                                | `highlightChanges`                                                |
| 13  | [One section in its own theme](#13-one-section-in-its-own-theme)                | `UmbraScope`                                                      |
| 14  | [A planner page](#14-a-planner-page)                                            | `Planner`, `WeekStrip`, ISO dates, the locale                     |
| 15  | [A table with sparklines](#15-a-table-with-sparklines-and-rating-cells)         | `sparklineColumn`, `PieIndicator`, `DivergingMeter`, `StarRating` |
| 16  | [A board of widgets](#16-a-board-of-widgets)                                    | `WidgetBoard`, `HorizontalScroller`, `MediaCard`                  |
| 17  | [A tour and the shortcuts](#17-a-tour-and-the-sheet-of-shortcuts)               | `Spotlight`, `ShortcutsSheet`                                     |
| 18  | [A settings form](#18-a-settings-form-with-a-slider-a-stepper-and-a-scale)      | `Slider`, `Stepper`, `ColorScaleEditor`                           |
| 19  | [Charts over a backdrop](#19-charts-over-a-backdrop)                            | `Scatter` and `Heatmap` with a `backdrop`                         |
| 20  | [Remember a user's columns](#20-remember-a-users-columns)                       | `columnMenu`, `columnState`, saving it in the app's own storage   |

## 1. A first page

The provider, the shell, and one card. The card fills the page; its sixty rows scroll inside it, and the
page itself never does.

```tsx
import { AppShell, Card, Page, TopBar, UmbraProvider } from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider brand="#2a2f8f" context="violet">
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Orders">
            {Array.from({ length: 60 }, (_, i) => (
              <p key={i} style={{ margin: '0 0 8px' }}>
                Order {1000 + i}
              </p>
            ))}
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

## 2. Three columns and a stack that collapses

- `size` is a weight: the middle column is twice as wide as the others.
- The stack holds five cards. When they cannot all have their minimum height, the lowest `priority`
  collapses to its header first; equal priorities go from the end. A collapsed header opens its content
  in a popover.
- `minHeight` says what one card needs. The default follows the density level.

Make the window shorter to see it happen.

```tsx
import { AppShell, Card, Columns, Page, Stack, TopBar, UmbraProvider } from 'umbra-ui';

const rows = (count: number, name: string) =>
  Array.from({ length: count }, (_, i) => (
    <p key={i} style={{ margin: '0 0 8px' }}>
      {name} {i + 1}
    </p>
  ));

export function App() {
  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns>
            <Card title="Inbox">{rows(40, 'Message')}</Card>
            <Card title="Summary" size={2}>
              {rows(12, 'Update')}
            </Card>
            <Stack label="Status">
              <Card title="Budget" tone="neutral" priority={2} minHeight={140}>
                Stays open longest, and needs 140 pixels.
              </Card>
              <Card title="Schedule" tone="neutral" priority={1}>
                {rows(3, 'Day')}
              </Card>
              <Card title="Stock" tone="neutral">
                Collapses third.
              </Card>
              <Card title="Returns" tone="neutral">
                Collapses second.
              </Card>
              <Card title="Notes" tone="neutral">
                Collapses first.
              </Card>
            </Stack>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

`overflow="keep"` on the `Stack` turns the rule off: the cards then shrink below their minimum.

## 3. Tab mode below the minimum window

Under 1024 wide or 600 high, every `Columns` shows one child at a time, with tabs.

- A card's tab is labelled by its title. Anything else needs `label`: a `Stack`, a nested `Columns`, a
  card without a title.
- `tabsLabel` names the tab strip for a screen reader.
- `narrow="keep"` keeps one `Columns` side by side, for a pair that only makes sense together.

```tsx
import { AppShell, Card, Columns, Page, Stack, TopBar, UmbraProvider } from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns tabsLabel="Sections of the overview">
            {/* Tab: "Orders" */}
            <Card title="Orders" size={2}>
              Shown first in tab mode.
            </Card>
            {/* Tab: "Before and after". The two cards stay side by side inside it. */}
            <Columns label="Before and after" narrow="keep">
              <Card title="Before">Last quarter</Card>
              <Card title="After">This quarter</Card>
            </Columns>
            {/* Tab: "Status" */}
            <Stack label="Status">
              <Card title="Budget" tone="neutral">
                64.0M available
              </Card>
              <Card title="Stock" tone="neutral">
                1,204 items
              </Card>
            </Stack>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

`AppShell` has `data-narrow` while the window is below the minimum, for CSS of your own.

## 4. A card with tabs, loading, empty and error

- The tab list sits in the card's `toolbar` part, the panel in its body, and `Tabs.Root` around the card
  joins them.
- `loading` shows a skeleton in place of the body. `error` and `empty` replace it with a message: text,
  a node, or `{ title, description, icon, action }`.
- `onRetry` adds the retry button to the error.

The fake request below is slow, returns nothing for "Late", and fails the first time "Sent" is asked for.

```tsx
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell, Card, IconButton, Page, Tabs, TopBar, UmbraProvider } from 'umbra-ui';

const counts: Record<string, number> = { open: 24, late: 0, sent: 8 };
let failedOnce = false;

function fetchOrders(tab: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (tab === 'sent' && !failedOnce) {
        failedOnce = true;
        reject(new Error('timeout'));
      } else resolve(Array.from({ length: counts[tab] ?? 0 }, (_, i) => `Order ${1000 + i}`));
    }, 700),
  );
}

export function App() {
  const [tab, setTab] = useState('open');
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [orders, setOrders] = useState<string[]>([]);

  useEffect(() => {
    let current = true;
    setStatus('loading');
    fetchOrders(tab).then(
      (rows) => {
        if (!current) return;
        setOrders(rows);
        setStatus('ready');
      },
      () => current && setStatus('error'),
    );
    return () => {
      current = false;
    };
  }, [tab, attempt]);

  const reload = () => setAttempt((n) => n + 1);

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Tabs.Root value={tab} onChange={setTab} variant="button-group" tabSize="small">
            <Card
              title="Orders"
              actions={<IconButton icon={<RefreshCw />} label="Refresh" onPress={reload} />}
              loading={status === 'loading'}
              error={
                status === 'error' && {
                  title: 'Orders did not load',
                  description: 'The server did not answer in time.',
                }
              }
              onRetry={reload}
              empty={
                orders.length === 0 && {
                  title: 'No orders here',
                  description: 'Orders past their date appear in this tab.',
                }
              }
              parts={{
                toolbar: (
                  <Card.Toolbar>
                    <Tabs.List aria-label="Orders by state">
                      <Tabs.Tab id="open">Open</Tabs.Tab>
                      <Tabs.Tab id="late">Late</Tabs.Tab>
                      <Tabs.Tab id="sent">Sent</Tabs.Tab>
                    </Tabs.List>
                  </Card.Toolbar>
                ),
              }}
            >
              <Tabs.Panel id={tab}>
                {orders.map((order) => (
                  <p key={order} style={{ margin: '0 0 8px' }}>
                    {order}
                  </p>
                ))}
              </Tabs.Panel>
            </Card>
          </Tabs.Root>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

`List`, `DataTable`, `KeyValueList` and the charts take the same `loading`, `empty`, `error` and
`onRetry`. Inside a card, set them on whichever holds the data, not on both.

## 5. List and detail

The list's selection is controlled, and the detail pane is drawn from it.

- `selectionBehavior="replace"`: a click selects one row, and the arrow keys move the selection, so the
  detail follows the keyboard.
- The pane's header is a `PageHeader` with `size="compact"`: title, facts and actions, shedding detail
  as the pane narrows.
- In tab mode the two cards become two tabs; `label` names the second one.
- The search is a `SearchField` in the card's toolbar, which stays above the rows as they scroll.

```tsx
import { useState } from 'react';
import {
  AppShell,
  Avatar,
  Button,
  Card,
  Columns,
  KeyValueList,
  List,
  Page,
  PageHeader,
  SearchField,
  Tag,
  TopBar,
  UmbraProvider,
} from 'umbra-ui';

const clients = Array.from({ length: 40 }, (_, i) => ({
  id: `client-${i + 1}`,
  name: `Client ${i + 1}`,
  region: `Region ${'ABCD'[i % 4]}`,
  orders: 3 + ((i * 7) % 20),
  onHold: i % 5 === 0,
}));

export function App() {
  const [selected, setSelected] = useState<(string | number)[]>(['client-1']);
  const [query, setQuery] = useState('');
  const client = clients.find((c) => c.id === selected[0]);
  const shown = clients.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns>
            <Card
              title="Clients"
              padding="none"
              parts={{
                toolbar: (
                  <Card.Toolbar>
                    <SearchField
                      label="Search clients"
                      placeholder="Search clients"
                      value={query}
                      onChange={setQuery}
                    />
                  </Card.Toolbar>
                ),
              }}
            >
              <List
                aria-label="Clients"
                items={shown}
                empty="No client matches"
                selectionMode="single"
                selectionBehavior="replace"
                selectedIds={selected}
                onSelectionChange={setSelected}
                renderItem={(c) => (
                  <List.Item
                    id={c.id}
                    title={c.name}
                    description={c.region}
                    meta={`${c.orders} orders`}
                    leading={<Avatar name={c.name} alt="" size="sm" />}
                  />
                )}
              />
            </Card>
            <Card size={2} label="Details" aria-label="Client details" empty={!client && 'Select a client'}>
              {client && (
                <>
                  <PageHeader
                    size="compact"
                    headingLevel={2}
                    overline="Client"
                    title={client.name}
                    subtitle={client.region}
                    media={<Avatar name={client.name} alt="" />}
                    tags={
                      <Tag tone={client.onHold ? 'warning' : 'success'}>
                        {client.onHold ? 'On hold' : 'Active'}
                      </Tag>
                    }
                    meta={[
                      { label: 'Orders', value: client.orders },
                      { label: 'Since', value: '2024' },
                    ]}
                    actions={<Button>Edit</Button>}
                  />
                  <KeyValueList
                    aria-label="Contact"
                    items={[
                      { label: 'Contact', value: `Person ${client.orders}` },
                      { label: 'Email', value: `${client.id}@example.com` },
                      { label: 'Payment terms', value: '30 days' },
                    ]}
                  />
                </>
              )}
            </Card>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

To keep the selection in the address, read `selected` from the route and navigate in
`onSelectionChange`. `examples/advanced` does that.

## 6. A table with sorting, selection and bulk actions

- **Columns** are data. `sortable` makes a header sort; `numberColumn` is the shorthand for a column of
  numbers (aligned to the end, tabular figures, largest first).
- **Priorities**: as the table narrows, columns hide lowest `priority` first, and `'always'` never
  hides. Here the region goes first, then the status.
- **Selection** is controlled, so the bar can count it and clear it.
- **The bulk bar** is a floating `ActionBar`: it enters when the first row is selected. Its container
  needs `position: relative`.
- Keep `data` and `columns` stable between renders: state, a memo, or a constant outside the component.
- **The search** is a `SearchField` in the card's toolbar. It filters the rows before the table sees
  them; the selection keeps the rows it had.

```tsx
import { Archive, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ActionBar,
  AppShell,
  Card,
  DataTable,
  numberColumn,
  Page,
  SearchField,
  Tag,
  TopBar,
  UmbraProvider,
  type DataTableColumn,
} from 'umbra-ui';

interface Order {
  id: string;
  client: string;
  region: string;
  status: 'Open' | 'Packed' | 'Sent';
  items: number;
  total: number;
}

const statuses = ['Open', 'Packed', 'Sent'] as const;
const orders: Order[] = Array.from({ length: 60 }, (_, i) => ({
  id: `${1000 + i}`,
  client: `Client ${1 + ((i * 7) % 23)}`,
  region: `Region ${'ABCD'[i % 4]}`,
  status: statuses[i % 3]!,
  items: 1 + ((i * 5) % 17),
  total: 120 + ((i * 137) % 900),
}));

const columns: DataTableColumn<Order>[] = [
  {
    id: 'id',
    header: 'Order',
    accessor: 'id',
    sortable: true,
    rowHeader: true,
    priority: 'always',
    width: 88,
  },
  { id: 'client', header: 'Client', accessor: 'client', sortable: true, priority: 3 },
  { id: 'region', header: 'Region', accessor: 'region', sortable: true, priority: 1 },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    sortable: true,
    priority: 2,
    cell: (order) => (
      <Tag
        size="small"
        tone={order.status === 'Sent' ? 'success' : order.status === 'Packed' ? 'info' : 'neutral'}
      >
        {order.status}
      </Tag>
    ),
  },
  numberColumn({ id: 'items', header: 'Items', accessor: 'items', sortable: true, priority: 2 }),
  numberColumn({ id: 'total', header: 'Total', accessor: 'total', sortable: true, priority: 'always' }),
];

export function App() {
  const [rows, setRows] = useState(orders);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const words = query.trim().toLowerCase();
    return words ? rows.filter((order) => `${order.id} ${order.client}`.toLowerCase().includes(words)) : rows;
  }, [rows, query]);
  const remove = () => {
    setRows((all) => all.filter((order) => !selected.includes(order.id)));
    setSelected([]);
  };

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card
            title="Orders"
            padding="none"
            style={{ position: 'relative' }}
            parts={{
              toolbar: (
                <Card.Toolbar>
                  <SearchField
                    label="Search orders"
                    placeholder="Order or client"
                    value={query}
                    onChange={setQuery}
                  />
                </Card.Toolbar>
              ),
            }}
          >
            <DataTable
              aria-label="Orders"
              data={shown}
              columns={columns}
              getRowId={(order) => order.id}
              defaultSort={[{ id: 'total', direction: 'desc' }]}
              selectionMode="multiple"
              selectedIds={selected}
              onSelectionChange={setSelected}
              selectRowLabel={(order) => `Select order ${order.id}`}
              empty={
                query
                  ? { title: 'No order matches', description: 'Try another order number or client.' }
                  : { title: 'No orders', description: 'Every order has been archived or deleted.' }
              }
            />
            <ActionBar
              variant="floating"
              aria-label="Selected orders"
              selectionCount={selected.length}
              onClearSelection={() => setSelected([])}
              secondary={{ label: 'Delete', icon: <Trash2 />, variant: 'danger', onPress: remove }}
              primary={{ label: 'Archive', icon: <Archive />, variant: 'accent', onPress: remove }}
            />
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- An action that cannot be undone belongs behind a `ConfirmDialog`.
- A column of row actions: `actionsColumn({ menu: (row) => [...], onMenuAction })`.
- `expandableHidden` gives each row a control that shows the values of its hidden columns.
- The end user can show, hide, move, pin and resize the columns: [recipe 20](#20-remember-a-users-columns).

## 7. Server-side data

When the server sorts and pages, the table shows what it is given.

- `manualSorting`: the headers still show and report the sort, but the table does not reorder. Keep
  `sort` in state and fetch on `onSortChange`.
- `loading` shows skeleton rows for the first page. `loadingMore` adds one after the last row while the
  next page is on its way.
- `onReachEnd` is called when the table is scrolled to its end.
- The search text goes to the server too. `SearchField` reports every key in `onChange` and the
  finished search in `onSubmit` (Enter, or a cleared field): fetch on the second, or debounce the first.

The fake server below holds 500 rows and answers after half a second.

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  AppShell,
  Card,
  DataTable,
  numberColumn,
  Page,
  SearchField,
  TopBar,
  UmbraProvider,
  type DataTableColumn,
  type DataTableSort,
} from 'umbra-ui';

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

const all: Product[] = Array.from({ length: 500 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Product ${i + 1}`,
  stock: (i * 37) % 400,
  price: 5 + ((i * 53) % 195),
}));

/** Stands in for the server: searches, sorts, cuts one page, and takes its time. */
function fetchPage(search: string, sort: DataTableSort[], offset: number, limit = 50) {
  const words = search.trim().toLowerCase();
  const found = words ? all.filter((product) => product.name.toLowerCase().includes(words)) : all;
  const by = sort[0];
  const sorted = by
    ? [...found].sort((a, b) => {
        const [x, y] = [a[by.id as keyof Product], b[by.id as keyof Product]];
        const order =
          typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return by.direction === 'asc' ? order : -order;
      })
    : found;
  return new Promise<{ rows: Product[]; total: number }>((resolve) =>
    setTimeout(() => resolve({ rows: sorted.slice(offset, offset + limit), total: found.length }), 500),
  );
}

const columns: DataTableColumn<Product>[] = [
  { id: 'name', header: 'Product', accessor: 'name', sortable: true, rowHeader: true },
  numberColumn({ id: 'stock', header: 'In stock', accessor: 'stock', sortable: true }),
  numberColumn({ id: 'price', header: 'Price', accessor: 'price', sortable: true }),
];

export function App() {
  const [sort, setSort] = useState<DataTableSort[]>([{ id: 'stock', direction: 'desc' }]);
  // What is typed, and what was last sent to the server.
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // An answer to an earlier request (an older sort or search) is dropped.
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    setLoading(true);
    setLoadingMore(false);
    fetchPage(search, sort, 0).then((page) => {
      if (id !== request.current) return;
      setRows(page.rows);
      setTotal(page.total);
      setLoading(false);
    });
  }, [search, sort]);

  const loadMore = () => {
    if (loading || loadingMore || rows.length >= total) return;
    const id = ++request.current;
    setLoadingMore(true);
    fetchPage(search, sort, rows.length).then((page) => {
      if (id !== request.current) return;
      setRows((loaded) => [...loaded, ...page.rows]);
      setLoadingMore(false);
    });
  };

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card
            title="Products"
            subtitle={`${rows.length} of ${total} loaded`}
            padding="none"
            parts={{
              toolbar: (
                <Card.Toolbar>
                  <SearchField
                    label="Search products"
                    placeholder="Search products"
                    value={text}
                    onChange={setText}
                    onSubmit={setSearch}
                    onClear={() => setSearch('')}
                  />
                </Card.Toolbar>
              ),
            }}
          >
            <DataTable
              aria-label="Products"
              data={rows}
              columns={columns}
              getRowId={(product) => product.id}
              manualSorting
              sort={sort}
              onSortChange={setSort}
              loading={loading}
              loadingMore={loadingMore}
              onReachEnd={loadMore}
            />
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

`List` has the same `loadingMore` and `onReachEnd`, and so has `ScrollArea` (`onReachEnd`) for content
of your own.

## 8. A settings modal

- `nav` makes the modal two columns. Below the minimum window the navigation folds behind a toggle
  (`navLabel`).
- `FormField` pairs a label, a description and an error with one control, and wires up their ids.
  `layout="row"` with `surface` is the settings-list look.
- The footer is an `ActionBar`. `Modal.Close` is a button that also closes the modal.
- `onRequestClose` can refuse to close, here while the name is empty.
- One choice of a few goes in a `RadioGroup`; one of many, in a `Select` (`searchable` for a long list).

```tsx
import { Settings } from 'lucide-react';
import { useState } from 'react';
import {
  ActionBar,
  AppShell,
  Card,
  FormField,
  IconButton,
  Modal,
  Page,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Toggle,
  TopBar,
  UmbraProvider,
  VerticalNav,
} from 'umbra-ui';

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'alerts', label: 'Alerts' },
];
const timeZones = ['UTC', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC-5', 'UTC-8'].map((zone) => ({
  id: zone,
  label: zone,
}));

export function App() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('profile');
  const [name, setName] = useState('Person A');
  const [zone, setZone] = useState('UTC+1');
  const [summary, setSummary] = useState('weekly');
  const [sound, setSound] = useState(true);
  const nameError = name.trim() === '' ? 'Enter a name.' : undefined;

  return (
    <UmbraProvider>
      <AppShell
        topBar={
          <TopBar
            logo="U"
            actions={<IconButton icon={<Settings />} label="Settings" onPress={() => setOpen(true)} />}
          />
        }
      >
        <Page>
          <Card title="Profile">
            {name || 'No name'} · {zone} · {summary} summary · sound {sound ? 'on' : 'off'}
          </Card>
        </Page>
      </AppShell>

      <Modal
        open={open}
        onOpenChange={setOpen}
        onRequestClose={() => !nameError}
        size="lg"
        height="fill"
        icon={<Settings />}
        title="Settings"
        description="Changes apply at once."
        navLabel="Sections"
        nav={
          <VerticalNav
            aria-label="Settings sections"
            items={sections}
            value={section}
            onChange={setSection}
          />
        }
        footer={<ActionBar primary={<Modal.Close variant="primary">Done</Modal.Close>} />}
      >
        {section === 'profile' ? (
          <>
            <FormField
              layout="row"
              surface
              label="Display name"
              description="Shown to the people you share with."
              required
              error={nameError}
            >
              <TextField value={name} onChange={setName} />
            </FormField>
            <FormField layout="row" surface label="Time zone" description="Used for dates and reminders.">
              <Select options={timeZones} value={zone} onChange={setZone} />
            </FormField>
          </>
        ) : (
          <>
            <FormField layout="row" surface label="Sound" description="Play a sound when a report is ready.">
              <Toggle checked={sound} onChange={setSound} />
            </FormField>
            <FormField layout="row" surface label="Summary" description="How often the summary is sent.">
              <RadioGroup orientation="horizontal" value={summary} onChange={setSummary}>
                <Radio value="daily">Daily</Radio>
                <Radio value="weekly">Weekly</Radio>
              </RadioGroup>
            </FormField>
          </>
        )}
      </Modal>
    </UmbraProvider>
  );
}
```

For a plain `<select>` or `<input>`, give `FormField` a function and spread what it receives:
`{(control) => <select {...control}>…</select>}`.

## 9. A command palette and shortcuts

- **Shortcuts** are registered once, on the provider. `Mod` is Command on macOS and Ctrl elsewhere.
- A `Button` with `shortcut="id"` takes over that key while it is mounted, and shows the keys in its
  tooltip. Without such a button, the shortcut's own `action` runs.
- **The palette** goes in the `commandPalette` prop of `TopBar`, which adds the search trigger. `Mod+K`
  opens it.
- A command has an `href` (the palette calls `navigate`), an `onRun`, or `children`, which makes it a
  page of further commands.
- `includeShortcuts` lists every registered shortcut that has a label, with its keys.

```tsx
import { Plus, Rows3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AppShell,
  Button,
  Card,
  CommandPalette,
  Page,
  TopBar,
  UmbraProvider,
  type Command,
  type Density,
  type Shortcut,
} from 'umbra-ui';

const densities: Density[] = ['compact', 'default', 'spacious'];

export function App() {
  const [density, setDensity] = useState<Density>('default');
  const [orders, setOrders] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [place, setPlace] = useState('#/overview');

  // Stable, so the registry is not rebuilt on every render.
  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { id: 'app.newOrder', keys: 'Mod+Shift+O', label: 'New order' },
      {
        id: 'app.nextDensity',
        keys: 'Shift+D',
        label: 'Next density',
        action: () => setDensity((d) => densities[(densities.indexOf(d) + 1) % densities.length]!),
      },
    ],
    [],
  );

  const newOrder = () => setOrders((n) => n + 1);
  const commands: Command[] = [
    { id: 'overview', label: 'Overview', section: 'Go to', href: '#/overview' },
    { id: 'orders', label: 'Orders', section: 'Go to', href: '#/orders', keywords: ['sales'] },
    {
      id: 'new-order',
      label: 'New order',
      section: 'Actions',
      icon: <Plus />,
      shortcut: 'app.newOrder',
      onRun: newOrder,
    },
    {
      id: 'density',
      label: 'Density',
      description: 'Spacing and text size',
      section: 'Actions',
      icon: <Rows3 />,
      children: densities.map((d) => ({ id: d, label: d, onRun: () => setDensity(d) })),
    },
  ];

  return (
    <UmbraProvider density={density} shortcuts={shortcuts}>
      <AppShell
        topBar={
          <TopBar
            logo="U"
            commandPalette={
              <CommandPalette
                commands={commands}
                includeShortcuts
                recent={recent}
                onRun={(command) =>
                  setRecent((ids) => [command.id, ...ids.filter((id) => id !== command.id)])
                }
                navigate={setPlace}
              />
            }
          />
        }
      >
        <Page>
          <Card
            title="Try it"
            actions={
              <Button shortcut="app.newOrder" onPress={newOrder}>
                New order
              </Button>
            }
          >
            Place: {place}. Orders created: {orders}. Density: {density}.
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- For results looked up as the user types (people, records), add `onQuery`. It may return a promise; a
  late answer is dropped.
- A bare key such as `Shift+D` does not fire while the user types in a field. A combination with Ctrl,
  Command or Alt does. `whenTyping` overrides either.
- Reserved keys: `Mod+K` (palette), `?`, `Alt+ArrowLeft` and `Alt+ArrowRight` (history). Register a
  shortcut with the same id (`umbra.commandPalette`, …) to move one.

## 10. Charts with a shared legend

Charts come from their own entry, `umbra-ui/charts`, so an app without charts does not load them.

- Both charts get `legend={false}` and the same controlled `hiddenIds`.
- One `Legend` with `interactive` owns the switching. Its `onHighlight` could drive a highlight too.
- Series take the palette by position, so the same order in the legend and in both charts gives the
  same colours.
- A chart fills the slot it is in: here, a card. Where there is no height to fill it is 240px tall, and
  `height` sets another (see [Layout](layout.md#tables-lists-and-charts-where-there-is-no-height-to-fill)).
- The legend sits in a card of its own with `size="content"`: as tall as the legend, above both charts.

```tsx
import { useState } from 'react';
import { AppShell, Card, Columns, Legend, Page, PageHeader, Stack, TopBar, UmbraProvider } from 'umbra-ui';
import { BarChart, LineChart } from 'umbra-ui/charts';

const regions = [
  { id: 'a', label: 'Region A' },
  { id: 'b', label: 'Region B' },
  { id: 'c', label: 'Region C' },
];
const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
const orders = (region: number, week: number) => 20 + region * 6 + ((region * 13 + week * 7) % 23);

const perWeek = regions.map((region, r) => ({
  ...region,
  data: weeks.map((x, w) => ({ x, y: orders(r, w) })),
}));
const lastMonth = regions.map((region, r) => ({
  ...region,
  values: weeks.slice(4).map((_, w) => orders(r, w + 4) * 12),
}));

export function App() {
  const [hidden, setHidden] = useState<string[]>([]);

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page header={<PageHeader title="Orders by region" subtitle="The last eight weeks" />}>
          <Stack>
            <Card aria-label="Regions" size="content">
              <Legend
                aria-label="Regions"
                items={regions}
                marker="square"
                interactive
                hiddenIds={hidden}
                onHiddenChange={setHidden}
              />
            </Card>
            <Columns>
              <Card title="Orders per week">
                <LineChart
                  aria-label="Orders per week, by region"
                  series={perWeek}
                  yTitle="Orders"
                  legend={false}
                  hiddenIds={hidden}
                />
              </Card>
              <Card title="Revenue, last four weeks">
                <BarChart
                  aria-label="Revenue of the last four weeks, by region"
                  categories={weeks.slice(4)}
                  series={lastMonth}
                  variant="stacked"
                  legend={false}
                  hiddenIds={hidden}
                />
              </Card>
            </Columns>
          </Stack>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

Left alone, each chart draws its own legend below itself when it has more than one series, and switches
its own series.

## 11. The shell with a router

`renderLink` plugs the router's link into everything that navigates. This sample uses React Router
(`npm install react-router-dom`); render it inside a `<BrowserRouter>`.

- The items carry `href`. `value` comes from the route, and `onChange` is not needed.
- `history` on the `TopBar` shows back and forward buttons on the browser history, which the router
  follows. `Alt+ArrowLeft` and `Alt+ArrowRight` press them.
- The palette is given the router's `navigate`.
- `PrimaryAction` is the one main action of the app. Its label should say what happens next.

```tsx
import { Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppShell,
  Card,
  CommandPalette,
  Page,
  PrimaryAction,
  PrimaryNav,
  SubNav,
  TopBar,
  UmbraProvider,
  type NavItem,
  type LinkRenderProps,
} from 'umbra-ui';

const sections: NavItem[] = [
  { id: 'orders', label: 'Orders', href: '/orders' },
  { id: 'clients', label: 'Clients', href: '/clients' },
  { id: 'reports', label: 'Reports', href: '/reports' },
];
const pages: Record<string, NavItem[]> = {
  orders: [
    { id: 'open', label: 'Open', href: '/orders/open' },
    { id: 'sent', label: 'Sent', href: '/orders/sent' },
  ],
};

const renderLink = (props: LinkRenderProps) => <Link to={props.href} {...props} />;

export function App() {
  const navigate = useNavigate();
  // At '/' both parts are empty strings, so a destructuring default would not apply.
  const parts = useLocation().pathname.split('/');
  const section = parts[1] || 'orders';
  const page = parts[2] || 'open';

  return (
    <UmbraProvider brand="#2a2f8f">
      <AppShell
        topBar={
          <TopBar
            logo="U"
            history
            nav={<PrimaryNav items={sections} value={section} renderLink={renderLink} />}
            commandPalette={
              <CommandPalette
                navigate={navigate}
                commands={sections.map((s) => ({
                  id: s.id,
                  label: String(s.label),
                  section: 'Go to',
                  href: `/${s.id}`,
                }))}
              />
            }
            primaryAction={
              <PrimaryAction label="New order" icon={<Plus />} onPress={() => navigate('/orders/new')} />
            }
          />
        }
        subNav={
          pages[section] && (
            <SubNav label="Orders" items={pages[section]} value={page} renderLink={renderLink} />
          )
        }
      >
        <Page>
          <Card title={`${section} / ${page}`}>The route decides what is shown here.</Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

A router that keeps its own history: pass `history={<HistoryButtons onBack={…} onForward={…}
canGoBack={…} canGoForward={…} />}` instead of `true`. `examples/advanced` has a hash router of forty
lines that shows the whole pattern without a dependency.

## 12. Live updates

`highlightChanges` on a `DataTable` flashes a cell once when its value changes: green with a plus for
up, red with a minus for down. Nothing counts or slides, and with reduced motion nothing flashes.

- It is opt-in: `true` for every column with an `accessor`, or a list of column ids.
- The same prop is on `StatValue`, `KeyValue`, `ValuePill`, `SummaryTile`, `ListItem` (its `meta`),
  `ProgressBar` and `LevelMeter`, as a boolean: `<StatValue label="Orders" value={orders} highlightChanges />`.
- Rows are matched by `getRowId`, so the order may change between updates.
- Update the data immutably: a new array, new objects for the rows that changed.

```tsx
import { useEffect, useState } from 'react';
import {
  AppShell,
  Card,
  DataTable,
  numberColumn,
  Page,
  TopBar,
  UmbraProvider,
  type DataTableColumn,
} from 'umbra-ui';

interface Line {
  id: string;
  name: string;
  queue: number;
  rate: number;
}

const start: Line[] = Array.from({ length: 12 }, (_, i) => ({
  id: `line-${i + 1}`,
  name: `Line ${i + 1}`,
  queue: 10 + ((i * 7) % 30),
  rate: 80 + ((i * 11) % 40),
}));

const columns: DataTableColumn<Line>[] = [
  { id: 'name', header: 'Line', accessor: 'name', rowHeader: true },
  numberColumn({ id: 'queue', header: 'Queue', accessor: 'queue', sortable: true }),
  numberColumn({ id: 'rate', header: 'Per hour', accessor: 'rate', sortable: true }),
];

export function App() {
  const [lines, setLines] = useState(start);

  // Stands in for a feed: every two seconds a few lines change by a fixed pattern.
  useEffect(() => {
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      setLines((all) =>
        all.map((line, i) =>
          (i + tick) % 4 === 0
            ? { ...line, queue: Math.max(0, line.queue + (((tick + i) % 3) - 1) * 4) }
            : line,
        ),
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Lines" padding="none">
            <DataTable
              aria-label="Lines"
              data={lines}
              columns={columns}
              getRowId={(line) => line.id}
              highlightChanges={['queue']}
            />
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

For a single figure, show the direction beside it:

```tsx
<StatValue label="In stock" value="1,204" trend={<TrendArrow direction="up" value="+12" />} />
```

## 13. One section in its own theme

`UmbraScope` takes the provider's `context`, `density`, `brand` and `tokens` for one subtree. It adds
no box, so it can wrap a child of `Columns` or `Stack`.

- The middle column is teal and compact; the cards around it are not touched.
- A popover or menu opened from inside the scope keeps its theme.
- For a whole page, `context` on `Page` is shorter, and the frame follows it.

```tsx
import {
  AppShell,
  Button,
  Card,
  Columns,
  Page,
  Popover,
  Stack,
  TopBar,
  UmbraProvider,
  UmbraScope,
} from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider brand="#2a2f8f" context="violet">
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns>
            <Card title="Orders">The app's own tint and density.</Card>
            <UmbraScope context="teal" density="compact" tokens={{ 'card-radius': '2px' }}>
              <Stack label="Stock">
                <Card title="Stock" tone="tinted" priority={1}>
                  Teal, compact, squarer.
                </Card>
                <Card
                  title="Reorder"
                  actions={
                    <Popover trigger={<Button size="small">Rules</Button>} title="Reorder rules">
                      This popover is teal and compact too.
                    </Popover>
                  }
                >
                  Three products are below their level.
                </Card>
              </Stack>
            </UmbraScope>
            <Card title="Notes">Back to the app's theme.</Card>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

[Theming](theming.md) lists what a scope can change, and what nothing can.

## 14. A planner page

A month of days with two slots each, the controls of each week beside it, and the selected week in a
card of its own.

- **Dates are ISO strings** (`'2026-10-05'`, and `'2026-10'` for a month), never `Date` objects: no time
  zone can move an item to the day before.
- **The locale decides** the names of months and weekdays, the first day of the week and the direction.
  `weekStartsOn` (0 is Sunday) overrides the first day where the locale should not decide.
- `today` defaults to the day it is where the user is. Pass it when the server's day is the one that counts.
- A day has a fixed number of slots, `slotsPerDay`. An item names its `slot`, or takes the next free one.

```tsx
import { ClipboardList, Truck } from 'lucide-react';
import { useState } from 'react';
import {
  AppShell,
  Button,
  Card,
  Columns,
  Page,
  Planner,
  Select,
  TopBar,
  UmbraProvider,
  WeekStrip,
  type IsoDate,
  type PlannerWeek,
  type ScheduleItem,
} from 'umbra-ui';

// Each kind has an icon, so none is told from the others by colour alone.
const delivery = { label: 'Delivery', tone: 'success', icon: <Truck /> } as const;
const planning = { label: 'Planning', tone: 'info', icon: <ClipboardList /> } as const;

const initial: ScheduleItem[] = [
  { id: 'a', date: '2026-10-05', slot: 0, ...planning },
  { id: 'b', date: '2026-10-06', slot: 0, ...delivery },
  { id: 'c', date: '2026-10-06', slot: 1, ...planning },
  { id: 'd', date: '2026-10-14', slot: 1, ...delivery },
  { id: 'e', date: '2026-10-22', slot: 0, ...delivery },
];
const locales = ['en-GB', 'en-US', 'de', 'he'].map((id) => ({ id, label: id }));

export function App() {
  const [locale, setLocale] = useState('en-GB');
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<IsoDate | null>('2026-10-06');

  const clear = (week: PlannerWeek) =>
    setItems((all) => all.filter((item) => item.date < week.start || item.date > week.end));
  // A press on a day's header or on one of its free slots adds a delivery there.
  const add = (date: IsoDate) =>
    setItems((all) => [...all, { id: `${date}-${all.length}`, date, ...delivery }]);

  return (
    <UmbraProvider locale={locale}>
      <AppShell
        topBar={
          <TopBar
            logo="U"
            actions={
              <Select
                aria-label="Language"
                size="small"
                options={locales}
                value={locale}
                onChange={(id) => id && setLocale(id)}
              />
            }
          />
        }
      >
        <Page>
          <Columns>
            <Card title="Schedule" size={3}>
              <Planner
                aria-label="Schedule"
                today="2026-10-10"
                items={items}
                slotsPerDay={2}
                minMonth="2026-09"
                maxMonth="2026-12"
                selectedDate={selected}
                onSelectedDateChange={setSelected}
                onDayAction={add}
                onAction={(id) => setItems((all) => all.filter((item) => item.id !== id))}
                renderWeek={(week) => (
                  <Button size="small" disabled={week.items.length === 0} onPress={() => clear(week)}>
                    Clear
                  </Button>
                )}
              />
            </Card>
            <Card title="Week">
              <WeekStrip
                aria-label="The selected week"
                today="2026-10-10"
                date={selected ?? '2026-10-10'}
                items={items}
                slotsPerDay={2}
                selectedDate={selected}
                onSelectedDateChange={setSelected}
              />
            </Card>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- `renderWeek` is the side column: whatever stands beside each week. It receives the week's `start`,
  `end`, `days` and `items`. As the planner narrows, the column becomes a button that opens the same
  content.
- There is no drag and no built-in copy and paste: they are buttons of yours in `renderWeek`, or in
  the toolbar (`parts={{ toolbar: (p) => <Planner.Toolbar {...p} actions={…} /> }}`).
- A day draws `slotsPerDay` items. A further item of that day is counted beside the date ("+2"), with
  the items it stands for in its name and its tooltip (`hiddenItemsLabel`). Set `slotsPerDay` for your
  busiest day.
- The grid is one tab stop. Arrow keys move between days and slots, Page Up and Page Down change the
  month, Enter activates a slot or goes into the side column.
- Slots show an icon and a label, then the icon alone when a day is too narrow (`slotDisplay`). A slot
  without an icon always keeps its label.
- The dates, and the text written for them, are Gregorian whatever calendar the locale prefers. The
  digits and the names are the locale's: try `he` above, which also turns the page right to left.

## 15. A table with sparklines and rating cells

Cells that draw their value: the run of a number, a level, a change and a rating.

```tsx
import {
  AppShell,
  Card,
  DataTable,
  DivergingMeter,
  numberColumn,
  Page,
  PieIndicator,
  StarRating,
  TopBar,
  UmbraProvider,
  type DataTableColumn,
} from 'umbra-ui';
import { sparklineColumn } from 'umbra-ui/charts';

interface Site {
  id: string;
  name: string;
  /** Twelve weekly scores, 0 to 100. */
  weeks: number[];
  used: number;
  change: number;
  rating: number;
}

const sites: Site[] = Array.from({ length: 30 }, (_, i) => ({
  id: `s${i}`,
  name: `Site ${i + 1}`,
  weeks: Array.from({ length: 12 }, (_, w) => 20 + ((i * 23 + w * w * 5) % 75)),
  used: (i * 37) % 101,
  change: ((i * 13) % 41) - 20,
  rating: 1 + ((i * 3) % 9) / 2,
}));

const columns: DataTableColumn<Site>[] = [
  {
    id: 'name',
    header: 'Site',
    accessor: 'name',
    width: { min: 80, flex: 1 },
    priority: 'always',
    rowHeader: true,
    sortable: true,
  },
  sparklineColumn<Site>({
    id: 'weeks',
    header: 'Twelve weeks',
    values: (site) => site.weeks,
    sparkline: { variant: 'bars', thresholds: [40, 70] },
    priority: 3,
    sortable: true,
  }),
  numberColumn<Site>({
    id: 'score',
    header: 'Score',
    accessor: (site) => site.weeks[11]!,
    width: 72,
    priority: 'always',
    sortable: true,
  }),
  {
    id: 'used',
    header: 'In use',
    accessor: 'used',
    width: 88,
    priority: 2,
    sortable: true,
    cell: (site) => (
      <PieIndicator value={site.used} thresholds showValue layout="inline" size="small" aria-label="In use" />
    ),
  },
  {
    id: 'change',
    header: 'Change',
    accessor: 'change',
    width: 120,
    priority: 1,
    sortable: true,
    cell: (site) => (
      <DivergingMeter
        value={site.change}
        min={-20}
        max={20}
        layout="inline"
        size="thin"
        showValue
        formatValue={(value) => `${value > 0 ? '+' : ''}${value}%`}
        aria-label="Change on last quarter"
      />
    ),
  },
  {
    id: 'rating',
    header: 'Rating',
    accessor: 'rating',
    width: 96,
    priority: 0,
    sortable: true,
    cell: (site) => <StarRating readOnly size="small" value={site.rating} aria-label="Rating" />,
  },
];

export function App() {
  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Sites" padding="none">
            <DataTable
              aria-label="Sites"
              data={sites}
              getRowId={(site) => site.id}
              columns={columns}
              striped
            />
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- `sparklineColumn` comes from `umbra-ui/charts`, so a table without one loads no chart code. The
  column sorts by the last value of the run; `sparkline` is the props of every cell's `Sparkline`, or a
  function of the row.
- A meter in a cell has no visible label: give it an `aria-label`, the name of the column.
- `PieIndicator` drops its text when the cell is too narrow for it, and keeps the disc. Its root is a
  `div`, so it cannot stand inside a `<p>`.
- A `StarRating` with `readOnly` is a picture with a text name, not a control: it draws any fraction.
  Without `readOnly` it is a radio group, and `step={0.5}` lets the user choose halves.
- A `Sparkline` is as wide as its container. Where the container is only as wide as its content (the
  `trend` slot of a `SummaryTile`, the `trailing` slot of a list row) it has a width of its own,
  `--umbra-sparkline-width` (4rem).

## 16. A board of widgets

A row of cards to pick from, and under it a board of widgets of different heights. Both scroll inside
themselves: the row sideways, the board down.

```tsx
import { useState } from 'react';
import {
  AppShell,
  HorizontalScroller,
  KeyValueList,
  MediaCard,
  Page,
  ProgressBar,
  Stack,
  TopBar,
  UmbraProvider,
  WidgetBoard,
} from 'umbra-ui';
import { BarChart } from 'umbra-ui/charts';

const regions = ['North', 'South', 'East', 'West', 'Centre', 'Coast', 'Islands'];
const orders = (region: number) => [0, 1, 2, 3].map((quarter) => 20 + ((region * 17 + quarter * 31) % 60));

export function App() {
  const [region, setRegion] = useState(0);
  // Kept by the app: store it with the user's settings to bring the board back as it was left.
  const [collapsed, setCollapsed] = useState<string[]>(['notes']);

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Stack>
            <HorizontalScroller aria-label="Regions" itemWidth={240}>
              {regions.map((name, i) => (
                <MediaCard
                  key={name}
                  title={name}
                  category={i === region ? 'Shown' : undefined}
                  meta={`${4 + ((i * 5) % 9)} sites`}
                  onPress={() => setRegion(i)}
                />
              ))}
            </HorizontalScroller>
            <WidgetBoard
              aria-label={`Widgets of ${regions[region]}`}
              minColumnWidth={280}
              collapsedIds={collapsed}
              onCollapsedChange={setCollapsed}
            >
              <WidgetBoard.Widget id="orders" title="Orders by quarter" span={2}>
                <BarChart
                  aria-label="Orders by quarter"
                  height={200}
                  categories={['Q1', 'Q2', 'Q3', 'Q4']}
                  series={[{ id: 'orders', label: 'Orders', values: orders(region) }]}
                />
              </WidgetBoard.Widget>
              <WidgetBoard.Widget id="capacity" title="Capacity">
                <ProgressBar label="In use" kind="meter" value={orders(region)[3]!} thresholds showValue />
              </WidgetBoard.Widget>
              <WidgetBoard.Widget id="facts" title="Facts">
                <KeyValueList
                  aria-label="Facts"
                  items={[
                    { key: 'sites', label: 'Sites', value: 4 + ((region * 5) % 9) },
                    { key: 'people', label: 'People', value: 30 + region * 7 },
                    { key: 'lead', label: 'Lead', value: 'Person A' },
                  ]}
                />
              </WidgetBoard.Widget>
              <WidgetBoard.Widget id="notes" title="Notes">
                Nothing new this week.
              </WidgetBoard.Widget>
            </WidgetBoard>
          </Stack>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- The row is as tall as its cards and the board takes the rest: `HorizontalScroller` is the one
  component whose `size` defaults to `"content"` ([Layout](layout.md#a-board-of-widgets-and-a-row-that-scrolls-sideways)).
- Each child of the row is one item. A `MediaCard` without a picture draws a placeholder; `image` takes
  any node and `src` an address.
- A widget is a `Card` that is as tall as its content, so the chart inside has a `height`.
- `span` makes a widget wider; a span wider than the board is cut to its width. `columns` fixes the
  number of columns in place of `minColumnWidth`.
- A widget collapses to its header, and "Collapse all" does all of them. There is no drag to reorder.
- `onReachEnd` on the row is the place to load more.

## 17. A tour and the sheet of shortcuts

Two kinds of help: a tour that lights one element after another, and a sheet that lists every keyboard
shortcut.

```tsx
import { CircleHelp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AppShell,
  Button,
  Card,
  Columns,
  CommandPalette,
  IconButton,
  Page,
  ShortcutsSheet,
  Spotlight,
  TopBar,
  UmbraProvider,
  type Shortcut,
  type SpotlightStep,
} from 'umbra-ui';

// A step points at an element of the page: a selector, a ref, or a function that returns the element.
const steps: SpotlightStep[] = [
  { target: '.tour-inbox', title: 'Your inbox', body: 'New messages arrive here, the newest first.' },
  { target: '.tour-summary', title: 'The summary', body: 'What changed since you last looked.' },
  {
    target: '.tour-help',
    title: 'Keyboard shortcuts',
    body: 'Press ? anywhere to see them all.',
    placement: 'bottom end',
  },
];

export function App() {
  const [touring, setTouring] = useState(true);
  const [toured, setToured] = useState(0);
  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { id: 'app.tour', keys: 'Shift+T', label: 'Take the tour', group: 'Help' },
      { id: 'app.refresh', keys: 'R', label: 'Refresh', group: 'Inbox', action: () => {} },
    ],
    [],
  );

  return (
    <UmbraProvider shortcuts={shortcuts}>
      <AppShell
        topBar={
          <TopBar
            logo="U"
            commandPalette={<CommandPalette commands={[]} includeShortcuts />}
            actions={
              <span className="tour-help">
                <ShortcutsSheet
                  trigger={<IconButton icon={<CircleHelp />} label="Keyboard shortcuts" />}
                  extra={[
                    {
                      title: 'In a list',
                      items: [
                        { label: 'Move between rows', keys: ['ArrowUp', 'ArrowDown'] },
                        { label: 'Open the row', keys: 'Enter' },
                      ],
                    },
                  ]}
                />
              </span>
            }
          />
        }
      >
        <Page>
          <Columns>
            <Card title="Inbox" className="tour-inbox">
              Three new messages.
            </Card>
            <Card
              title="Summary"
              size={2}
              className="tour-summary"
              actions={
                <Button shortcut="app.tour" onPress={() => setTouring(true)}>
                  Tour
                </Button>
              }
            >
              Tours finished: {toured}.
            </Card>
          </Columns>
        </Page>
      </AppShell>
      <Spotlight
        open={touring}
        onOpenChange={setTouring}
        steps={steps}
        onFinish={() => setToured((n) => n + 1)}
      />
    </UmbraProvider>
  );
}
```

The tour:

- While it is open nothing but the callout can be used. `interactive` on the spotlight, or on one step,
  lets the user press the target itself.
- Escape and a press on the dim close it (`dismissable={false}` turns that off). `onFinish` runs only
  when the last step is ended with its button: that is the moment to remember that the user has seen it.
- A step whose target is not in the page is skipped, with a warning in development. A target can be
  marked with a `data-` attribute of yours: a component passes it to its root element.
- Without `steps` it is one coach mark: `target`, `title` and the text as children.
- It is drawn on `layer-spotlight`, above a modal and below the command palette, so a step can point
  into an open modal.
- The ring follows its target when the window is resized, something scrolls or a transition ends. A
  target that moves in another way is followed at the next of those.

The sheet:

- It lists the shortcuts of the provider that have a `label` and can run now, under their `group`, and
  the library's own keys. `extra` adds sections for keys that are not shortcuts, such as those of a table.
- `?` opens and closes it while a `ShortcutsSheet` is mounted, except while the user types in a field.
  `shortcut={null}` binds no key; `open` and `onOpenChange` control it.
- `includeShortcuts` on the palette lists the same shortcuts as commands.
- Its search matches every word typed; it does not rank or correct as the palette does.

## 18. A settings form with a slider, a stepper and a scale

Settings that take effect while the modal is open: the bands of a scale, a target on it, and how many
bars the chart shows.

```tsx
import { useState } from 'react';
import {
  ActionBar,
  AppShell,
  Button,
  Card,
  ColorScaleEditor,
  FormField,
  Modal,
  Page,
  Slider,
  Stepper,
  TopBar,
  UmbraProvider,
  type Threshold,
} from 'umbra-ui';
import { BarChart } from 'umbra-ui/charts';

const defaults: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Fair' },
  { from: 70, tone: 'success', label: 'Good' },
];
const scores = [77, 55, 33, 89, 67, 45, 23, 79, 57, 35, 91, 69];
const periods = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'This quarter' },
];

export function App() {
  const [open, setOpen] = useState(false);
  const [bands, setBands] = useState(defaults);
  const [target, setTarget] = useState(60);
  const [range, setRange] = useState<[number, number]>([20, 90]);
  const [count, setCount] = useState(8);
  const [period, setPeriod] = useState('month');
  const shown = scores.slice(0, count);

  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Score by site" actions={<Button onPress={() => setOpen(true)}>Settings</Button>}>
            <BarChart
              aria-label="Score by site"
              categories={shown.map((_, i) => `S${i + 1}`)}
              series={[{ id: 'score', label: 'Score', values: shown }]}
              thresholds={bands}
              valueDomain={[0, 100]}
              annotations={[
                { type: 'line', value: target, label: 'Target' },
                { type: 'band', from: range[0], to: range[1], label: 'Expected' },
              ]}
            />
          </Card>
        </Page>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Settings"
          footer={<ActionBar primary={{ label: 'Done', variant: 'accent', onPress: () => setOpen(false) }} />}
        >
          <FormField label="Bands" layout="stacked">
            <ColorScaleEditor
              value={bands}
              onChange={setBands}
              defaultValue={defaults}
              min={0}
              max={100}
              step={5}
            />
          </FormField>
          <FormField label="Target">
            <Slider value={target} onChange={setTarget} step={5} showValue thresholds={bands} />
          </FormField>
          <FormField label="Expected" description="Two thumbs: a range.">
            <Slider value={range} onChange={setRange} step={5} showValue />
          </FormField>
          <FormField label="Sites shown">
            <Stepper value={count} onChange={setCount} min={4} max={12} step={2} />
          </FormField>
          <FormField label="Period">
            <Stepper options={periods} value={period} onChange={setPeriod} />
          </FormField>
        </Modal>
      </AppShell>
    </UmbraProvider>
  );
}
```

- The value of the `ColorScaleEditor` is the `thresholds` list itself
  ([Theming](theming.md#colour-by-value-one-thresholds-list)), so the chart needs nothing more than the
  same state.
- A `Slider` is a number with one thumb and `[from, to]` with two. `onChange` runs while it moves;
  `onChangeEnd` once, when a drag or a key press ends: the place to save.
- With `thresholds`, the fill of a slider takes the band of its value and its text the band's label.
- A `Stepper` walks through numbers (`min`, `max`, `step`) or through `options`. Options wrap around by
  default and numbers do not (`wrap`).
- A press on the label of a `FormField` focuses a native control only. It does not focus the value of a
  `Stepper`, a `Slider` or a `ColorScaleEditor`; the label still names them.
- A stop's free colour is picked in the browser's own colour field.

## 19. Charts over a backdrop

Points on a drawing of yours: a floor plan, a map, a diagram. `Scatter` and `Heatmap` take it as the
`backdrop` part and size it to the plot.

```tsx
import { AppShell, Card, Columns, Page, TopBar, UmbraProvider } from 'umbra-ui';
import { Heatmap, Scatter, type ScatterSeries } from 'umbra-ui/charts';

// The drawing has its own coordinates, 100 by 60. The charts are given the same domains.
const line = {
  fill: 'none',
  stroke: 'var(--umbra-color-base-border-control)',
  // The drawing is stretched; its lines keep their width.
  vectorEffect: 'non-scaling-stroke',
} as const;

function FloorPlan() {
  return (
    <svg viewBox="0 0 100 60" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
      <rect x="1" y="1" width="98" height="58" {...line} />
      <path d="M1 22h30v-21M69 1v20h30M42 59v-12h16v12" {...line} />
      <circle cx="50" cy="28" r="7" {...line} />
    </svg>
  );
}

const visits = Array.from({ length: 160 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 60 }));
const teams: ScatterSeries[] = ['Team 1', 'Team 2'].map((label, t) => ({
  id: `team-${t}`,
  label,
  data: Array.from({ length: 6 }, (_, i) => ({
    x: 8 + ((t * 31 + i * 23) % 84),
    y: 6 + ((t * 17 + i * 19) % 48),
    size: 4 + ((t * 3 + i * 5) % 14),
    label: `Place ${t * 6 + i + 1}`,
  })),
}));

export function App() {
  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns>
            <Card title="Orders by place">
              <Scatter
                aria-label="Orders by place"
                series={teams}
                xDomain={[0, 100]}
                yDomain={[0, 60]}
                axes={false}
                sizeLabel="Orders"
                parts={{ backdrop: <FloorPlan /> }}
              />
            </Card>
            <Card title="Visits">
              <Heatmap
                aria-label="Visits by position"
                points={visits}
                bins={[10, 6]}
                xDomain={[0, 100]}
                yDomain={[0, 60]}
                axes={false}
                labels={false}
                parts={{ backdrop: <FloorPlan /> }}
              />
            </Card>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- The backdrop is stretched to the plot, so draw it to stretch (`preserveAspectRatio="none"`) or give
  the card the proportions of the drawing.
- `axes={false}` leaves out the axis lines, the grid and the tick labels: the plot is the drawing.
  Keep the axes when the positions are measurements a reader needs.
- `xDomain` and `yDomain` tie the data to the drawing. Without them the charts fit the data, and the
  points no longer sit where the drawing says.
- A `size` in a point makes it a bubble; `sizeLabel` names that value in the tooltip.
- The `Heatmap` sums `points` into `bins`. Over a backdrop its cells are a little transparent
  (`--umbra-heatmap-backdrop-opacity`).
- The drawing is decoration to a screen reader: the points and cells are read from the data.

## 20. Remember a user's columns

The end user can show, hide, move, pin and resize the columns of every `DataTable`: from the columns
button at the end of the header row, from the menu of each header, and by dragging a header's edge.
What they did is one value, `columnState`. The table keeps it while the page lives; to keep it longer,
hold it yourself and save it wherever your app saves things. The table ships no storage.

```tsx
import { useEffect, useState } from 'react';
import {
  AppShell,
  Card,
  DataTable,
  numberColumn,
  Page,
  TopBar,
  UmbraProvider,
  type DataTableColumn,
  type DataTableColumnState,
} from 'umbra-ui';

interface Order {
  id: string;
  client: string;
  region: string;
  owner: string;
  items: number;
  total: number;
}

const orders: Order[] = Array.from({ length: 40 }, (_, i) => ({
  id: `Order ${1001 + i}`,
  client: `Client ${(i % 7) + 1}`,
  region: `Region ${(i % 4) + 1}`,
  owner: `Person ${String.fromCharCode(65 + (i % 5))}`,
  items: 1 + ((i * 7) % 12),
  total: 120 + ((i * 131) % 900),
}));

// Defined once, outside the component: the table asks for stable columns.
const columns: DataTableColumn<Order>[] = [
  { id: 'id', header: 'Order', accessor: 'id', rowHeader: true, priority: 'always', hideable: false },
  { id: 'client', header: 'Client', accessor: 'client', sortable: true, priority: 3 },
  { id: 'region', header: 'Region', accessor: 'region', sortable: true, priority: 2 },
  { id: 'owner', header: 'Owner', accessor: 'owner', priority: 1 },
  numberColumn({ id: 'items', header: 'Items', accessor: 'items', priority: 1 }),
  numberColumn({
    id: 'total',
    header: 'Total',
    accessor: 'total',
    sortable: true,
    priority: 4,
    minWidth: 64,
  }),
];

/** State that is read from `localStorage` once and written back on every change. */
function useSavedColumns(key: string) {
  const [state, setState] = useState<DataTableColumnState>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '{}') as DataTableColumnState;
    } catch {
      // No storage, or a value that is not JSON: start from the columns as they are defined.
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage is full or blocked: the choice lasts for this visit.
    }
  }, [key, state]);
  return [state, setState] as const;
}

export function App() {
  const [columnState, setColumnState] = useSavedColumns('orders.columns');
  return (
    <UmbraProvider>
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Orders" padding="none">
            <DataTable
              aria-label="Orders"
              data={orders}
              getRowId={(order) => order.id}
              columns={columns}
              columnMenu
              columnState={columnState}
              onColumnStateChange={setColumnState}
            />
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- `columnState` is plain JSON: `order` (column ids), `visibility` (`false` hides a column at any
  width; `true` is a column the user ticked, which the table then never hides for lack of room),
  `widths` (pixels, as in a column's `width`) and `pins`. Every member is optional and `{}` means "as
  the columns are defined". Save it per user and per table.
- The saved value survives a change of your columns: an id it does not know is ignored, and a column
  it has never seen takes its place after the one before it in `columns`.
- "Reset" in the column menu returns to `defaultColumnState`, or to `{}`.
- `columnMenu` keeps the columns button in the header always. Without it the button appears when a
  column is not shown, and "Columns…" in the menu of any header opens the same list.
- `columnMenu={false}` takes the controls away; `resizableColumns={false}` and
  `reorderableColumns={false}` take one of them away. Per column: `hideable`, `reorderable`,
  `resizable`, `minWidth` and `maxWidth`.
- Nothing needs a drag: a column moves with Alt + Arrow Up or Down on its handle, or from the menus,
  and "Resize" in a header's menu hands the arrow keys to the handle (Enter keeps, Escape cancels).
- Every string is a prop (`columnsLabel`, `hideColumnLabel`, `noRoomLabel`, …): see the table of
  built-in strings in [Customisation](customisation.md).
- To put the list somewhere else (a toolbar, a drawer), render `DataTable.ColumnMenu` yourself with
  `columnMenu={false}`.

## Next

- `examples/dashboard`: many of these on one screen, with density and context switchers.
- `examples/advanced`: several screens with a router, a modal form, a planner, a tour and a custom
  component.
- The "Pages" stories of the Storybook: a planning page and an analysis page that put these together.
- [Customisation](customisation.md): when a recipe is close but not right.
