# Recipes

Whole screens, from a first page to a table with bulk actions. Each sample is a complete `src/App.tsx`:
paste it into the app from [Getting started](getting-started.md), whose `main.tsx` loads the stylesheet
and the fonts and renders `<App />`.

| #   | Recipe                                                                          | Shows                                                |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | [A first page](#1-a-first-page)                                                 | Provider, shell, one card that scrolls inside        |
| 2   | [Three columns and a stack](#2-three-columns-and-a-stack-that-collapses)        | `size`, `priority`, `minHeight`, stack collapse      |
| 3   | [Tab mode](#3-tab-mode-below-the-minimum-window)                                | `label`, `tabsLabel`, `narrow="keep"`                |
| 4   | [A card with tabs and data states](#4-a-card-with-tabs-loading-empty-and-error) | Toolbar tabs, `loading`, `empty`, `error`, `onRetry` |
| 5   | [List and detail](#5-list-and-detail)                                           | `List` selection driving a pane with a `PageHeader`  |
| 6   | [A table with bulk actions](#6-a-table-with-sorting-selection-and-bulk-actions) | Sorting, selection, `ActionBar`, column priorities   |
| 7   | [Server-side data](#7-server-side-data)                                         | `manualSorting`, `loadingMore`, `onReachEnd`         |
| 8   | [A settings modal](#8-a-settings-modal)                                         | `Modal` with `VerticalNav` and `FormField`s          |
| 9   | [A command palette](#9-a-command-palette-and-shortcuts)                         | Commands, pages, shortcuts and key hints             |
| 10  | [Charts with a shared legend](#10-charts-with-a-shared-legend)                  | One `Legend` switching series in two charts          |
| 11  | [The shell with a router](#11-the-shell-with-a-router)                          | `renderLink`, history buttons, the primary action    |
| 12  | [Live updates](#12-live-updates)                                                | `highlightChanges`                                   |
| 13  | [One section in its own theme](#13-one-section-in-its-own-theme)                | `UmbraScope`                                         |

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

## Next

- `examples/dashboard`: many of these on one screen, with density and context switchers.
- `examples/advanced`: several screens with a router, a modal form and a custom component.
- [Customisation](customisation.md): when a recipe is close but not right.
