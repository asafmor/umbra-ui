import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Avatar } from '../data/Avatar';
import { Badge } from '../data/Badge';
import { EntityIcon } from '../data/EntityIcon';
import { Link } from '../data/Link';
import { Box } from '../data/samples';
import { StatusIndicator, type Status } from '../data/StatusIndicator';
import { Tag } from '../data/Tag';
import { TrendArrow } from '../data/TrendArrow';
import { ValuePill } from '../data/ValuePill';
import { Checkbox } from '../inputs/Checkbox';
import { Select } from '../inputs/Select';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { LevelMeter } from '../meters/LevelMeter';
import { ProgressBar } from '../meters/ProgressBar';
import { Log } from '../stories/placeholders';
import {
  actionsColumn,
  DataTable,
  numberColumn,
  type DataTableColumn,
  type DataTableRowAccent,
  type DataTableSort,
} from './DataTable';
import {
  orders,
  people,
  regions,
  sites,
  sum,
  type Order,
  type Person,
  type Region,
  type Site,
} from './samples';

const meta = {
  title: 'Data/DataTable',
  parameters: { frame: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const fill = { height: '100%' };
const footer = (children: ReactNode) => ({ footer: <Card.Footer>{children}</Card.Footer> });

/** A leading mark and a name on one line; the name is cut when the cell is narrow. */
function Pair({ lead, children }: { lead: ReactNode; children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '100%',
        verticalAlign: 'middle',
      }}
    >
      {lead}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </span>
  );
}

// --- Ranking -------------------------------------------------------------------------------------------

// The stripe says how a region stands against its plan. The first cell shows the meaning in a tooltip.
const standing = (region: Region): DataTableRowAccent | undefined =>
  region.revenue >= 6000
    ? { color: 'var(--umbra-color-semantic-info)', label: 'Ahead of plan' }
    : region.returned >= 5
      ? { color: 'var(--umbra-color-semantic-warning)', label: 'Many returns' }
      : region.revenue < 3000
        ? { color: 'var(--umbra-color-semantic-danger)', label: 'Behind plan' }
        : undefined;

const rank = (region: Region) => regions.indexOf(region) + 1;
const count = (id: 'shipped' | 'pending' | 'returned', header: string, priority: number) =>
  numberColumn<Region>({ id, header, accessor: id, width: 84, priority, sortable: true });

const rankingColumns: DataTableColumn<Region>[] = [
  numberColumn({
    id: 'rank',
    header: '#',
    headerLabel: 'Rank',
    description: 'Place by revenue',
    accessor: rank,
    align: 'start',
    width: 64,
    priority: 'always',
    sortable: true,
    sortDescFirst: false,
  }),
  { id: 'name', header: 'Region', accessor: 'name', rowHeader: true, priority: 'always', sortable: true },
  numberColumn({
    id: 'orders',
    header: 'Ord',
    headerLabel: 'Orders',
    accessor: 'orders',
    width: 64,
    priority: 1,
    sortable: true,
  }),
  count('shipped', 'Shipped', 2),
  count('pending', 'Pending', 1),
  count('returned', 'Returned', 2),
  numberColumn({
    id: 'revenue',
    header: 'Revenue',
    description: 'In thousands',
    accessor: 'revenue',
    format: (value) => new Intl.NumberFormat('en').format(value as number),
    width: 88,
    priority: 3,
    sortable: true,
  }),
];

const scheduleColumns: DataTableColumn<Order>[] = [
  { id: 'item', header: 'Item', accessor: 'item', rowHeader: true, priority: 'always' },
  { id: 'owner', header: 'Owner', accessor: 'owner', priority: 2 },
  {
    id: 'state',
    header: 'Status',
    accessor: 'state',
    priority: 3,
    cell: (order) => (
      <StatusIndicator status={stateStatus[order.state]}>{stateLabel[order.state]}</StatusIndicator>
    ),
  },
  { id: 'category', header: 'Category', accessor: 'category', priority: 1 },
];
const stateStatus: Record<Order['state'], Status> = { open: 'warning', packed: 'info', sent: 'success' };
const stateLabel: Record<Order['state'], string> = { open: 'Open', packed: 'Packed', sent: 'Sent' };
const fewOrders = orders(14);

/** A ranking: edge stripes that carry a standing (named in a tooltip on the first cell), one highlighted row, striped rows and sortable headers. */
export const Ranking: Story = {
  render: () => (
    <Columns style={fill}>
      <Card title="Ranking" padding="none">
        <DataTable
          aria-label="Ranking"
          data={regions}
          getRowId={(region) => region.id}
          columns={rankingColumns}
          striped
          dividers={false}
          highlightedRowIds={['r5']}
          highlightLabel="Your region"
          rowAccent={standing}
        />
      </Card>
      <Card title="Schedule" padding="none">
        <DataTable
          aria-label="Schedule"
          data={fewOrders}
          getRowId={(order) => order.id}
          columns={scheduleColumns}
        />
      </Card>
    </Columns>
  ),
};

// --- People --------------------------------------------------------------------------------------------

const statusOf: Record<Person['status'], { status: Status; label: string }> = {
  active: { status: 'success', label: 'Active' },
  away: { status: 'warning', label: 'Away' },
  offline: { status: 'neutral', label: 'Offline' },
};
const team = people(24);

function PeopleCard() {
  const [selected, setSelected] = useState<string[]>(['p2']);
  const [last, setLast] = useState('none');
  const columns = useMemo<DataTableColumn<Person>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessor: 'name',
        rowHeader: true,
        priority: 'always',
        sortable: true,
        width: { min: 150, flex: 2 },
        cell: (person) => <Pair lead={<Avatar size="xs" name={person.name} alt="" />}>{person.name}</Pair>,
      },
      { id: 'team', header: 'Team', accessor: 'team', priority: 1, sortable: true },
      {
        id: 'role',
        header: 'Role',
        accessor: 'role',
        priority: 2,
        sortable: true,
        cell: (person) => <Tag size="small">{person.role}</Tag>,
      },
      {
        id: 'status',
        header: 'Status',
        accessor: 'status',
        priority: 3,
        sortable: true,
        cell: (person) => (
          <StatusIndicator status={statusOf[person.status].status}>
            {statusOf[person.status].label}
          </StatusIndicator>
        ),
      },
      numberColumn({
        id: 'score',
        header: 'Score',
        tooltip: 'Average of the last five reviews',
        accessor: 'score',
        priority: 2,
        sortable: true,
        cell: (person) => <ValuePill size="small" shape="square" value={person.score} />,
      }),
      actionsColumn<Person>({
        width: 110,
        cell: (person) => (
          <>
            <IconButton
              icon={<Pencil />}
              label={`Edit ${person.name}`}
              onPress={() => setLast(`Edit ${person.id}`)}
            />
            <IconButton
              icon={<Trash2 />}
              label={`Remove ${person.name}`}
              onPress={() => setLast(`Remove ${person.id}`)}
            />
          </>
        ),
        menu: () => [
          { id: 'duplicate', label: 'Duplicate' },
          { id: 'move', label: 'Move to another team' },
          { id: 'archive', label: 'Archive', danger: true },
        ],
        menuLabel: (person) => `More actions for ${person.name}`,
        onMenuAction: (id, person) => setLast(`${id} ${person.id}`),
      }),
    ],
    [],
  );
  return (
    <Card
      title="People"
      padding="none"
      style={fill}
      parts={footer(
        <Log>
          Selected: {selected.join(', ') || 'none'} · Last action: {last}
        </Log>,
      )}
    >
      <DataTable
        aria-label="People"
        data={team}
        getRowId={(person) => person.id}
        columns={columns}
        selectionMode="multiple"
        selectedIds={selected}
        onSelectionChange={setSelected}
        selectRowLabel={(person) => `Select ${person.name}`}
        onRowAction={(person) => setLast(`Open ${person.id}`)}
        isRowDisabled={(person) => person.id === 'p4'}
        defaultSort={[{ id: 'name', direction: 'asc' }]}
      />
    </Card>
  );
}

/** A table of people: avatars, tags, status, a value pill, row actions, multiple selection and a row action. */
export const People: Story = { render: () => <PeopleCard /> };

// --- Numeric -------------------------------------------------------------------------------------------

const number = new Intl.NumberFormat('en');
const format = (value: unknown) => number.format(value as number);
const total = (key: keyof Site) => (rows: Site[]) =>
  number.format(sum(rows.map((row) => row[key] as number)));
const year = (site: Site) => site.q1 + site.q2 + site.q3 + site.q4;
const quarter = (id: 'q1' | 'q2' | 'q3' | 'q4', header: string) =>
  numberColumn<Site>({
    id,
    header,
    accessor: id,
    format,
    sortable: true,
    width: 104,
    footer: total(id),
    aggregate: total(id),
  });

/** No column of these may hide: the table scrolls sideways instead. */
const always = <Row,>(columns: DataTableColumn<Row>[]) =>
  columns.map((column) => ({ ...column, priority: 'always' as const }));

const numericColumns = always<Site>([
  {
    id: 'name',
    header: 'Site',
    accessor: 'name',
    rowHeader: true,
    pin: 'start',
    priority: 'always',
    width: 150,
    sortable: true,
    footer: 'Total',
  },
  { id: 'area', header: 'Area', accessor: 'area', priority: 'always', width: 110, sortable: true },
  quarter('q1', 'Q1'),
  quarter('q2', 'Q2'),
  quarter('q3', 'Q3'),
  quarter('q4', 'Q4'),
  numberColumn({
    id: 'year',
    header: 'Year',
    accessor: year,
    format,
    sortable: true,
    width: 110,
    footer: (rows) => number.format(sum(rows.map(year))),
  }),
  numberColumn({
    id: 'target',
    header: 'Target',
    accessor: 'target',
    format,
    width: 110,
    footer: total('target'),
  }),
  numberColumn({ id: 'staff', header: 'Staff', accessor: 'staff', width: 96, footer: total('staff') }),
  numberColumn({
    id: 'cost',
    header: 'Cost',
    description: 'Cost per unit',
    accessor: 'cost',
    width: 96,
    pin: 'end',
    footer: (rows) => (sum(rows.map((row) => row.cost)) / rows.length).toFixed(1),
  }),
]);

const numericGroups = [
  { id: 'h1', header: 'First half', columns: ['q1', 'q2'] },
  { id: 'h2', header: 'Second half', columns: ['q3', 'q4'] },
  { id: 'plan', header: 'Plan', columns: ['year', 'target'] },
];
const allSites = sites(40);

/**
 * A dense table of numbers: the first column pinned at the start and the last at the end, headers that
 * span columns, and a footer of totals. No column may hide, so the table scrolls sideways when narrow.
 */
export const Numeric: Story = {
  render: () => (
    <Card title="Output by site" padding="none" style={fill}>
      <DataTable
        caption="Output by site and quarter, in units"
        showCaption
        data={allSites}
        getRowId={(site) => site.id}
        columns={numericColumns}
        columnGroups={numericGroups}
        striped
      />
    </Card>
  ),
};

// --- Sorting -------------------------------------------------------------------------------------------

const sortColumns: DataTableColumn<Person>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    rowHeader: true,
    priority: 'always',
    sortable: true,
    width: { min: 80 },
  },
  { id: 'team', header: 'Team', accessor: 'team', sortable: true, width: { min: 80 } },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
    sortable: true,
    width: { min: 80 },
    description: 'Sorted by seniority, not by name',
    sortFn: (a, b) =>
      ['Analyst', 'Planner', 'Reviewer', 'Lead'].indexOf(a.role) -
      ['Analyst', 'Planner', 'Reviewer', 'Lead'].indexOf(b.role),
  },
  numberColumn({ id: 'score', header: 'Score', accessor: 'score', sortable: true }),
  numberColumn({ id: 'tasks', header: 'Tasks', accessor: 'tasks' }),
];
const eight = people(8);
const describe = (sort: DataTableSort[]) => sort.map((s) => `${s.id} ${s.direction}`).join(', ') || 'none';

function SortCard({ title, multi, manual }: { title: string; multi?: boolean; manual?: boolean }) {
  const [sort, setSort] = useState<DataTableSort[]>(multi ? [{ id: 'team', direction: 'asc' }] : []);
  return (
    <Card title={title} padding="none" parts={footer(<Log>Sort: {describe(sort)}</Log>)}>
      <DataTable
        aria-label={title}
        data={eight}
        getRowId={(person) => person.id}
        columns={sortColumns}
        sort={sort}
        onSortChange={setSort}
        multiSort={multi}
        manualSorting={manual}
      />
    </Card>
  );
}

/**
 * Sorting. A header cycles ascending, descending, unsorted (a number column starts descending). With
 * `multiSort`, Shift+click adds a column. With `manualSorting` the order is reported and not applied.
 */
export const Sorting: Story = {
  render: () => (
    <Columns style={fill}>
      <SortCard title="Single sort" />
      <SortCard title="Multiple sort" multi />
      <SortCard title="Manual sort" manual />
    </Columns>
  ),
};

// --- Cell widgets --------------------------------------------------------------------------------------

function WidgetsCard() {
  const [checked, setChecked] = useState<string[]>(['p1', 'p3']);
  const [last, setLast] = useState('none');
  const columns = useMemo(
    () =>
      always<Person>([
        {
          id: 'name',
          header: 'Avatar',
          accessor: 'name',
          rowHeader: true,
          priority: 'always',
          width: { min: 130, flex: 1 },
          cell: (p) => <Pair lead={<Avatar size="xs" name={p.name} alt="" />}>{p.name}</Pair>,
        },
        {
          id: 'team',
          header: 'EntityIcon',
          accessor: 'team',
          width: { min: 110, flex: 1 },
          cell: (p) => <EntityIcon name={p.team} label />,
        },
        {
          id: 'role',
          header: 'Tag',
          accessor: 'role',
          width: 96,
          cell: (p) => <Tag size="small">{p.role}</Tag>,
        },
        {
          id: 'status',
          header: 'Status',
          accessor: 'status',
          width: 96,
          cell: (p) => (
            <StatusIndicator status={statusOf[p.status].status}>{statusOf[p.status].label}</StatusIndicator>
          ),
        },
        numberColumn({
          id: 'score',
          header: 'Pill',
          accessor: 'score',
          width: 64,
          cell: (p) => <ValuePill size="small" shape="square" value={p.score} />,
        }),
        numberColumn({
          id: 'tasks',
          header: 'Badge',
          accessor: 'tasks',
          width: 64,
          cell: (p) => <Badge count={p.tasks} showZero tone="neutral" label={(n) => `${n} tasks`} />,
        }),
        numberColumn({
          id: 'change',
          header: 'Trend',
          accessor: 'change',
          width: 72,
          cell: (p) => (
            <TrendArrow
              direction={p.change > 0 ? 'up' : p.change < 0 ? 'down' : 'flat'}
              positive="up"
              value={Math.abs(p.change)}
            />
          ),
        }),
        {
          id: 'progress',
          header: 'ProgressBar',
          accessor: 'progress',
          width: { min: 130, flex: 1 },
          cell: (p) => (
            <ProgressBar
              layout="inline"
              size="thin"
              value={p.progress}
              showValue
              aria-label={`Progress of ${p.name}`}
            />
          ),
        },
        {
          id: 'level',
          header: 'LevelMeter',
          accessor: 'level',
          width: 120,
          cell: (p) => (
            <LevelMeter
              size="small"
              value={p.level}
              min={1}
              max={5}
              steps={5}
              aria-label={`Level of ${p.name}`}
            />
          ),
        },
        {
          id: 'link',
          header: 'Link',
          width: 80,
          cell: (p) => (
            <Link href={`#${p.id}`} tone="accent">
              Profile
            </Link>
          ),
        },
        {
          id: 'done',
          header: 'Checkbox',
          width: 80,
          align: 'center',
          cell: (p) => (
            <Checkbox
              size="small"
              aria-label={`${p.name} is done`}
              checked={checked.includes(p.id)}
              onChange={(on) => setChecked((ids) => (on ? [...ids, p.id] : ids.filter((id) => id !== p.id)))}
            />
          ),
        },
        actionsColumn<Person>({
          width: 132,
          cell: (p) => (
            <>
              <Button size="small" onPress={() => setLast(`Assign ${p.id}`)}>
                Assign
              </Button>
              <IconButton
                icon={<Trash2 />}
                label={`Remove ${p.name}`}
                onPress={() => setLast(`Remove ${p.id}`)}
              />
            </>
          ),
        }),
      ]),
    [checked],
  );
  return (
    <Card
      title="Cell widgets"
      padding="none"
      style={fill}
      parts={footer(
        <Log>
          Done: {checked.join(', ') || 'none'} · Last action: {last}
        </Log>,
      )}
    >
      <DataTable aria-label="Cell widgets" data={people(12)} getRowId={(p) => p.id} columns={columns} />
    </Card>
  );
}

/** The library's own components in cells, at table density. */
export const CellWidgets: Story = { render: () => <WidgetsCard /> };

// --- Row features --------------------------------------------------------------------------------------

const basicColumns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', accessor: 'name', rowHeader: true, priority: 'always' },
  { id: 'team', header: 'Team', accessor: 'team', priority: 1 },
  { id: 'role', header: 'Role', accessor: 'role', priority: 2 },
  numberColumn({ id: 'score', header: 'Score', accessor: 'score', priority: 3 }),
];
const teamColour: Record<string, DataTableRowAccent> = {
  'Team 1': { color: 'var(--umbra-color-series-1)', label: 'Team 1' },
  'Team 2': { color: 'var(--umbra-color-series-2)', label: 'Team 2' },
  'Team 3': { color: 'var(--umbra-color-series-3)', label: 'Team 3' },
};

function ActionCard() {
  const [last, setLast] = useState('none');
  return (
    <Card title="Row action and disabled rows" padding="none" parts={footer(<Log>Last action: {last}</Log>)}>
      <DataTable
        aria-label="Row action"
        data={eight}
        getRowId={(person) => person.id}
        columns={basicColumns}
        onRowAction={(person) => setLast(`Opened ${person.id}`)}
        isRowDisabled={(person) => person.id === 'p3'}
      />
    </Card>
  );
}

/** Highlight, accent stripes, stripes with no dividers, a row action, disabled rows and rows that are links. */
export const RowFeatures: Story = {
  render: () => (
    <Columns style={fill}>
      <Stack>
        <Card title="Highlight and accent" padding="none">
          <DataTable
            aria-label="Highlight and accent"
            data={eight}
            getRowId={(person) => person.id}
            columns={basicColumns}
            rowHighlight={(person) => person.id === 'p2' || person.id === 'p6'}
            highlightLabel="Yours"
            rowAccent={(person) => teamColour[person.team]}
          />
        </Card>
        <Card title="Striped, no dividers" padding="none">
          <DataTable
            aria-label="Striped"
            data={eight}
            getRowId={(person) => person.id}
            columns={basicColumns}
            striped
            dividers={false}
          />
        </Card>
      </Stack>
      <Stack>
        <ActionCard />
        <Card title="Rows that are links" padding="none">
          <DataTable
            aria-label="Rows that are links"
            data={eight}
            getRowId={(person) => person.id}
            columns={basicColumns}
            rowHref={(person) => `#${person.id}`}
          />
        </Card>
      </Stack>
    </Columns>
  ),
};

// --- Selection -----------------------------------------------------------------------------------------

function SelectionCard({ mode }: { mode: 'single' | 'multiple' }) {
  const [selected, setSelected] = useState<string[]>(mode === 'single' ? ['p2'] : ['p2', 'p3']);
  const [last, setLast] = useState('none');
  const title = mode === 'single' ? 'Single selection' : 'Multiple selection';
  return (
    <Card
      title={title}
      padding="none"
      parts={footer(
        <Log>
          Selected: {selected.join(', ') || 'none'} · Opened: {last}
        </Log>,
      )}
    >
      <DataTable
        aria-label={title}
        data={people(10)}
        getRowId={(person) => person.id}
        columns={basicColumns}
        selectionMode={mode}
        selectedIds={selected}
        onSelectionChange={setSelected}
        selectRowLabel={(person) => `Select ${person.name}`}
        onRowAction={(person) => setLast(person.id)}
        isRowDisabled={(person) => person.id === 'p5'}
      />
    </Card>
  );
}

/** Selection: a click or Space toggles a row, Shift selects a range, the header checkbox selects all. */
export const Selection: Story = {
  render: () => (
    <Columns style={fill}>
      <SelectionCard mode="multiple" />
      <SelectionCard mode="single" />
    </Columns>
  ),
};

// --- Grouping ------------------------------------------------------------------------------------------

const orderColumns: DataTableColumn<Order>[] = [
  { id: 'item', header: 'Item', accessor: 'item', rowHeader: true, priority: 'always', sortable: true },
  { id: 'owner', header: 'Owner', accessor: 'owner', priority: 1, sortable: true },
  numberColumn({
    id: 'quantity',
    header: 'Qty',
    headerLabel: 'Quantity',
    accessor: 'quantity',
    priority: 2,
    sortable: true,
    aggregate: (rows) => sum(rows.map((row) => row.quantity)),
  }),
  numberColumn({
    id: 'amount',
    header: 'Amount',
    accessor: 'amount',
    format,
    priority: 3,
    sortable: true,
    width: 96,
    aggregate: (rows) => number.format(sum(rows.map((row) => row.amount))),
  }),
];
const groupedOrders = orders(36);
const stateGroups = [
  { key: 'open', title: 'Open' },
  { key: 'packed', title: 'Packed', meta: 'Leaves today' },
  { key: 'sent', title: 'Sent' },
  { key: 'returned', title: 'Returned' },
];

function CollapsibleCard() {
  const [collapsed, setCollapsed] = useState<string[]>(['packed']);
  return (
    <Card
      title="Collapsible groups"
      padding="none"
      parts={footer(<Log>Collapsed: {collapsed.join(', ') || 'none'}</Log>)}
    >
      <DataTable
        aria-label="Orders by status"
        data={groupedOrders}
        getRowId={(order) => order.id}
        columns={orderColumns}
        groupBy="state"
        groups={stateGroups}
        collapsibleGroups
        collapsedGroups={collapsed}
        onCollapsedGroupsChange={setCollapsed}
      />
    </Card>
  );
}

/**
 * Groups: header rows with a title, a count and the group's totals, which stick while their rows scroll.
 * Sorting works inside each group. Listed groups come first, in order, also when they are empty.
 */
export const Grouping: Story = {
  render: () => (
    <Columns style={fill}>
      <CollapsibleCard />
      <Card title="Groups by a function" padding="none">
        <DataTable
          aria-label="Orders by category"
          data={groupedOrders}
          getRowId={(order) => order.id}
          columns={orderColumns.map((column) => ({ ...column, aggregate: undefined }))}
          groupBy={(order) => order.category}
          selectionMode="multiple"
          defaultSort={[{ id: 'amount', direction: 'desc' }]}
        />
      </Card>
    </Columns>
  ),
};

// --- Narrowing -----------------------------------------------------------------------------------------

const narrowColumns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', accessor: 'name', rowHeader: true, priority: 'always', width: { min: 110 } },
  { id: 'team', header: 'Team', accessor: 'team', priority: 3, width: { min: 90 } },
  { id: 'role', header: 'Role', accessor: 'role', priority: 2, width: { min: 90 } },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    priority: 1,
    width: { min: 100 },
    cell: (person) => (
      <StatusIndicator status={statusOf[person.status].status}>
        {statusOf[person.status].label}
      </StatusIndicator>
    ),
  },
  numberColumn({ id: 'tasks', header: 'Tasks', accessor: 'tasks', priority: 1, width: 64 }),
  numberColumn({ id: 'score', header: 'Score', accessor: 'score', priority: 4, width: 64 }),
];
const five = people(5);

function NarrowBox({ width, expandable }: { width: number; expandable?: boolean }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const label = `${expandable ? 'expandable ' : ''}${width}`;
  return (
    <div>
      <Box
        width={width}
        height={expandable ? 250 : 170}
        label={`${label}: hidden ${hidden.join(', ') || 'none'}`}
      >
        <DataTable
          aria-label={`Table ${label} wide`}
          data={five}
          getRowId={(person) => person.id}
          columns={narrowColumns}
          onHiddenColumnsChange={setHidden}
          expandableHidden={expandable}
        />
      </Box>
    </div>
  );
}

/**
 * Columns hide by `priority` as the table narrows: lowest first, equal priorities from the end. `always`
 * never hides. With `expandableHidden`, each row can show its hidden columns under it.
 */
export const Narrowing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      <NarrowBox width={560} />
      <NarrowBox width={440} />
      <NarrowBox width={330} />
      <NarrowBox width={240} />
      <NarrowBox width={150} />
      <NarrowBox width={330} expandable />
    </div>
  ),
};

// --- States --------------------------------------------------------------------------------------------

function RetryCard() {
  const [failed, setFailed] = useState(true);
  return (
    <Card title="Error, with retry" padding="none">
      <DataTable
        aria-label="Error, with retry"
        data={failed ? [] : five}
        getRowId={(person) => person.id}
        columns={basicColumns}
        error={failed && { title: 'People did not load', description: 'The server did not answer.' }}
        onRetry={() => setFailed(false)}
      />
    </Card>
  );
}

function MoreCard() {
  const [count, setCount] = useState(20);
  const rows = useMemo(() => people(count), [count]);
  return (
    <Card title="Loading more" padding="none" parts={footer(<Log>Rows: {count}</Log>)}>
      <DataTable
        aria-label="Loading more"
        data={rows}
        getRowId={(person) => person.id}
        columns={basicColumns}
        loadingMore={count < 60}
        onReachEnd={() => setCount((c) => Math.min(60, c + 20))}
      />
    </Card>
  );
}

/** Loading (skeleton rows in the real columns), empty, error with a retry button, and loading more at the end. */
export const States: Story = {
  render: () => (
    <Columns style={fill}>
      <Stack>
        <Card title="Loading" padding="none">
          <DataTable
            aria-label="Loading"
            data={[]}
            getRowId={(person: Person) => person.id}
            columns={basicColumns}
            selectionMode="multiple"
            loading
            skeletonRows={5}
          />
        </Card>
        <Card title="Empty" padding="none">
          <DataTable
            aria-label="Empty"
            data={[]}
            getRowId={(person: Person) => person.id}
            columns={basicColumns}
            empty={{ title: 'No people yet', description: 'People you add appear here.' }}
          />
        </Card>
      </Stack>
      <Stack>
        <RetryCard />
        <MoreCard />
      </Stack>
    </Columns>
  ),
};

// --- 10,000 rows ---------------------------------------------------------------------------------------

const manyOrders = orders(10000);
const manyColumns: DataTableColumn<Order>[] = [
  { id: 'item', header: 'Item', accessor: 'item', rowHeader: true, priority: 'always', sortable: true },
  { id: 'category', header: 'Category', accessor: 'category', priority: 2, sortable: true },
  { id: 'owner', header: 'Owner', accessor: 'owner', priority: 1, sortable: true },
  {
    id: 'state',
    header: 'Status',
    accessor: 'state',
    priority: 3,
    sortable: true,
    cell: (order) => (
      <StatusIndicator status={stateStatus[order.state]}>{stateLabel[order.state]}</StatusIndicator>
    ),
  },
  numberColumn({
    id: 'quantity',
    header: 'Qty',
    headerLabel: 'Quantity',
    accessor: 'quantity',
    priority: 2,
    sortable: true,
  }),
  numberColumn({
    id: 'amount',
    header: 'Amount',
    accessor: 'amount',
    format,
    priority: 4,
    sortable: true,
    width: 96,
    footer: (rows) => number.format(sum(rows.map((row) => row.amount))),
  }),
];

function ManyCard() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <Card
      title="10,000 orders"
      padding="none"
      style={fill}
      parts={footer(
        <Log>
          Selected: {selected.length > 6 ? `${selected.length} rows` : selected.join(', ') || 'none'}
        </Log>,
      )}
    >
      <DataTable
        aria-label="10,000 orders"
        data={manyOrders}
        getRowId={(order) => order.id}
        columns={manyColumns}
        selectionMode="multiple"
        selectedIds={selected}
        onSelectionChange={setSelected}
        selectRowLabel={(order) => `Select ${order.item}`}
        striped
      />
    </Card>
  );
}

/** Ten thousand rows. Only the rows in view are in the page; sorting, selection and the keyboard reach all of them. */
export const Virtualised: Story = { render: () => <ManyCard /> };

// --- Live updates --------------------------------------------------------------------------------------

function LiveCard() {
  const [step, setStep] = useState(0);
  const rows = useMemo(
    () =>
      people(8).map((person, i) => ({
        ...person,
        score: person.score + (i === 0 ? step * 3 : i === 1 ? -step * 2 : 0),
        role: i === 2 && step % 2 ? 'Lead' : person.role,
      })),
    [step],
  );
  return (
    <Card
      title="Live values"
      padding="none"
      style={fill}
      actions={
        <Button size="small" onPress={() => setStep(step + 1)}>
          Update values
        </Button>
      }
      parts={footer(<Log>Updates: {step}</Log>)}
    >
      <DataTable
        aria-label="Live values"
        data={rows}
        getRowId={(person) => person.id}
        columns={basicColumns}
        highlightChanges
      />
    </Card>
  );
}

/**
 * `highlightChanges`: a changed value flashes once, green with ▲ when it went up and red with ▼ when it
 * went down; text that changed flashes neutral. With reduced motion there is no flash, only the sign.
 */
export const LiveUpdates: Story = { render: () => <LiveCard /> };

// --- Right to left -------------------------------------------------------------------------------------

/** Right to left: the pinned columns swap sides, and the left and right arrow keys follow what is seen. */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" style={fill}>
      <Card title="Output by site" padding="none" style={fill}>
        <DataTable
          aria-label="Output by site"
          data={allSites}
          getRowId={(site) => site.id}
          columns={numericColumns}
          selectionMode="multiple"
        />
      </Card>
    </div>
  ),
};

// --- Parts and blocks ----------------------------------------------------------------------------------

function BlocksCard() {
  const [descending, setDescending] = useState(false);
  const [selected, setSelected] = useState<string[]>(['p2']);
  const [open, setOpen] = useState(true);
  const rows = [...five].sort((a, b) => (descending ? b.score - a.score : a.score - b.score));
  const toggle = (id: string) =>
    setSelected((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));
  return (
    <Card title="Blocks" padding="none" parts={footer(<Log>Selected: {selected.join(', ') || 'none'}</Log>)}>
      <DataTable.Root aria-label="Composed by hand" multiselectable>
        <DataTable.Header>
          <DataTable.Row>
            <DataTable.HeaderCell>Name</DataTable.HeaderCell>
            <DataTable.HeaderCell>Team</DataTable.HeaderCell>
            <DataTable.HeaderCell
              align="end"
              sort={descending ? 'desc' : 'asc'}
              onSort={() => setDescending(!descending)}
            >
              Score
            </DataTable.HeaderCell>
          </DataTable.Row>
        </DataTable.Header>
        <DataTable.Body>
          <DataTable.GroupRow
            title="Everyone"
            count={rows.length}
            colSpan={3}
            collapsible
            collapsed={!open}
            onCollapsedChange={(collapsed) => setOpen(!collapsed)}
          />
          {open &&
            rows.map((person, i) => (
              <DataTable.Row
                key={person.id}
                rowKey={person.id}
                selected={selected.includes(person.id)}
                striped={i % 2 === 0}
                onSelect={() => toggle(person.id)}
              >
                <DataTable.Cell rowHeader>{person.name}</DataTable.Cell>
                <DataTable.Cell>{person.team}</DataTable.Cell>
                <DataTable.Cell align="end" numeric>
                  {person.score}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
        </DataTable.Body>
        <DataTable.Footer>
          <DataTable.Row>
            <DataTable.Cell rowHeader colSpan={2}>
              Total
            </DataTable.Cell>
            <DataTable.Cell align="end" numeric>
              {sum(rows.map((person) => person.score))}
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable.Footer>
      </DataTable.Root>
    </Card>
  );
}

const partColumns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', accessor: 'name', rowHeader: true, priority: 'always', sortable: true },
  { id: 'team', header: 'Team', accessor: 'team' },
  numberColumn({ id: 'score', header: 'Score', accessor: 'score', sortable: true, footer: 'not shown' }),
];

/** Parts replaced by a function, by a node and by `null`; and a table composed by hand from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={fill}>
      <Stack>
        <Card title="Parts: function, node and null" padding="none">
          <DataTable
            aria-label="Parts"
            data={five}
            getRowId={(person) => person.id}
            columns={partColumns}
            defaultSort={[{ id: 'score', direction: 'desc' }]}
            parts={{
              // A function receives the default part's props.
              cell: ({ row, column, ...cell }) => (
                <DataTable.Cell
                  {...cell}
                  style={column.id === 'score' && row.score > 80 ? { fontWeight: 700 } : undefined}
                />
              ),
              row: ({ row, ...props }) => <DataTable.Row {...props} data-team={row.team} />,
              // A node replaces the part.
              sortIndicator: (
                <span data-part="sortIndicator" aria-hidden="true">
                  ↕
                </span>
              ),
              // null hides it.
              footer: null,
            }}
          />
        </Card>
        <Card title="Parts: skeleton and empty" padding="none">
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DataTable
                aria-label="Custom skeleton"
                data={[]}
                getRowId={(person: Person) => person.id}
                columns={partColumns}
                loading
                skeletonRows={3}
                parts={{ skeleton: ({ rowIndex }) => (rowIndex === 0 ? '…' : '·') }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DataTable
                aria-label="Custom empty state"
                data={[]}
                getRowId={(person: Person) => person.id}
                columns={partColumns}
                parts={{ empty: <p style={{ margin: 16 }}>A custom empty state.</p> }}
              />
            </div>
          </div>
        </Card>
      </Stack>
      <BlocksCard />
    </Columns>
  ),
};

// --- Wrapping text -------------------------------------------------------------------------------------

interface Note {
  id: string;
  item: string;
  owner: string;
  note: string;
}
const noteTexts = [
  'Packed and waiting for the carrier.',
  'The customer asked for delivery after the tenth; the label was printed again with the new date and the old one was destroyed.',
  'Two units were replaced before packing.',
  'Held for a check of the address, which has no building number. Person C called twice and left a message.',
];
const notesOf = (count: number): Note[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `n${i + 1}`,
    item: `Item ${i + 1}`,
    owner: `Person ${String.fromCharCode(65 + ((i * 7) % 26))}`,
    note: noteTexts[i % noteTexts.length]!,
  }));
const noteColumns = (wrap: boolean): DataTableColumn<Note>[] => [
  { id: 'item', header: 'Item', accessor: 'item', rowHeader: true, priority: 'always', width: 88 },
  { id: 'note', header: 'Note', accessor: 'note', wrap, priority: 'always', width: { min: 140, flex: 1 } },
  { id: 'owner', header: 'Owner', accessor: 'owner', priority: 'always', width: 96 },
];
const wrapping = noteColumns(true);
const oneLine = noteColumns(false);
const fewNotes = notesOf(6);
const manyNotes = notesOf(210);

/**
 * Column `wrap`: the text takes the lines it needs and the row grows with it. Without it (the default)
 * the text is one line, cut with an ellipsis. A table with a wrapping column is not virtualised by
 * `virtualize="auto"`, because its rows are not one height: all 210 rows are in the page.
 */
export const Wrapping: Story = {
  render: () => (
    <Columns style={fill}>
      <Stack>
        <Card title="Wrapping" padding="none">
          <DataTable aria-label="Wrapping" data={fewNotes} getRowId={(note) => note.id} columns={wrapping} />
        </Card>
        <Card title="One line" padding="none">
          <DataTable aria-label="One line" data={fewNotes} getRowId={(note) => note.id} columns={oneLine} />
        </Card>
      </Stack>
      <Card title="210 wrapping rows" padding="none">
        <DataTable
          aria-label="210 wrapping rows"
          data={manyNotes}
          getRowId={(note) => note.id}
          columns={wrapping}
          striped
        />
      </Card>
    </Columns>
  ),
};

// --- Virtualisation and sticky groups, set by hand -------------------------------------------------------

const forty = people(40);
const twoHundredTen = orders(210);
// Text only: 210 rows are all in the page, and each one is checked for accessibility.
const textColumns = scheduleColumns.filter((column) => column.id !== 'state');

/**
 * `virtualize` set by hand: on for a short table, off for a long one (every row is in the page).
 * And `stickyGroups={false}`: group header rows scroll away with their rows.
 */
export const VirtualizeAndSticky: Story = {
  render: () => (
    <Columns style={fill}>
      <Card title="virtualize, 40 rows" padding="none">
        <DataTable
          aria-label="Virtualised by hand"
          data={forty}
          getRowId={(person) => person.id}
          columns={basicColumns}
          virtualize
        />
      </Card>
      <Card title="virtualize off, 210 rows" padding="none">
        <DataTable
          aria-label="Not virtualised"
          data={twoHundredTen}
          getRowId={(order) => order.id}
          columns={textColumns}
          virtualize={false}
        />
      </Card>
      <Card title="Groups that do not stick" padding="none">
        <DataTable
          aria-label="Groups that do not stick"
          data={groupedOrders}
          getRowId={(order) => order.id}
          columns={orderColumns}
          groupBy="state"
          groups={stateGroups}
          stickyGroups={false}
        />
      </Card>
    </Columns>
  ),
};

// --- Virtualisation with groups and with detail rows -----------------------------------------------------

const threeThousand = orders(3000);
const sixHundred = orders(600);
const wideColumns: DataTableColumn<Order>[] = [
  { id: 'item', header: 'Item', accessor: 'item', rowHeader: true, priority: 'always', width: { min: 110 } },
  { id: 'category', header: 'Category', accessor: 'category', priority: 2, width: { min: 150 } },
  { id: 'owner', header: 'Owner', accessor: 'owner', priority: 1, width: { min: 150 } },
  {
    id: 'state',
    header: 'Status',
    accessor: 'state',
    priority: 1,
    width: { min: 150 },
    cell: (order) => (
      <StatusIndicator status={stateStatus[order.state]}>{stateLabel[order.state]}</StatusIndicator>
    ),
  },
  numberColumn({ id: 'amount', header: 'Amount', accessor: 'amount', format, priority: 3, width: 96 }),
];

function VirtualGroupsCard() {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  return (
    <Card
      title="3,000 orders in groups"
      padding="none"
      style={fill}
      parts={footer(<Log>Collapsed: {collapsed.join(', ') || 'none'}</Log>)}
    >
      <DataTable
        aria-label="3,000 orders in groups"
        data={threeThousand}
        getRowId={(order) => order.id}
        columns={orderColumns}
        groupBy="category"
        collapsibleGroups
        collapsedGroups={collapsed}
        onCollapsedGroupsChange={setCollapsed}
      />
    </Card>
  );
}

/**
 * Virtualised tables with rows of more than one kind: group header rows (the header of the group at the
 * top stays rendered so it can stick), and the detail rows of `expandableHidden`, whose heights are
 * measured one by one.
 */
export const VirtualisedGroups: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <VirtualGroupsCard />
      </div>
      <div style={{ width: 400, flex: 'none' }}>
        <Card title="600 orders, details under a row" padding="none" style={fill}>
          <DataTable
            aria-label="600 orders with details"
            data={sixHundred}
            getRowId={(order) => order.id}
            columns={wideColumns}
            expandableHidden
          />
        </Card>
      </div>
    </div>
  ),
};

// --- A Select in a cell ----------------------------------------------------------------------------------

const roleOptions = ['Analyst', 'Planner', 'Reviewer', 'Lead'].map((role) => ({ id: role, label: role }));

function SelectCard() {
  const [roles, setRoles] = useState<Record<string, string>>({});
  const columns = useMemo<DataTableColumn<Person>[]>(
    () => [
      { id: 'name', header: 'Name', accessor: 'name', rowHeader: true, priority: 'always' },
      { id: 'team', header: 'Team', accessor: 'team', priority: 1 },
      {
        id: 'role',
        header: 'Role',
        accessor: (person) => roles[person.id] ?? person.role,
        priority: 'always',
        width: 150,
        cell: (person, { value }) => (
          <Select
            aria-label={`Role of ${person.name}`}
            variant="inCell"
            size="small"
            fullWidth
            options={roleOptions}
            value={value as string}
            onChange={(role) => setRoles((all) => ({ ...all, [person.id]: role }))}
          />
        ),
      },
      numberColumn({ id: 'tasks', header: 'Tasks', accessor: 'tasks', priority: 2 }),
    ],
    [roles],
  );
  const changed = Object.entries(roles).map(([id, role]) => `${id} ${role}`);
  return (
    <Card
      title="A Select in a cell"
      padding="none"
      style={fill}
      parts={footer(<Log>Changed: {changed.join(', ') || 'none'}</Log>)}
    >
      <DataTable aria-label="Roles" data={eight} getRowId={(person) => person.id} columns={columns} />
    </Card>
  );
}

/**
 * A `Select` in a cell. The cell is the tab stop: Enter opens the list, the arrow keys and Enter choose,
 * Escape closes the list and, pressed again, returns to the cell.
 */
export const SelectInCell: Story = { render: () => <SelectCard /> };

// --- The mark for hidden columns -------------------------------------------------------------------------

/**
 * While columns are hidden for lack of width, a mark in the header says how many ("+3"); its tooltip, on
 * hover and on keyboard focus, lists them. The `hiddenIndicator` part replaces it (a function or a node)
 * or, with `null`, removes it together with its narrow column.
 */
export const HiddenColumns: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      <Box width={330} height={170} label="The mark">
        <DataTable
          aria-label="With the mark"
          data={five}
          getRowId={(person) => person.id}
          columns={narrowColumns}
        />
      </Box>
      <Box width={330} height={170} label="A function">
        <DataTable
          aria-label="With a custom mark"
          data={five}
          getRowId={(person) => person.id}
          columns={narrowColumns}
          hiddenColumnsLabel={(count) => `${count} more columns`}
          parts={{ hiddenIndicator: ({ children }) => <strong aria-hidden="true">{children}</strong> }}
        />
      </Box>
      <Box width={330} height={170} label="null: no mark and no column">
        <DataTable
          aria-label="Without the mark"
          data={five}
          getRowId={(person) => person.id}
          columns={narrowColumns}
          parts={{ hiddenIndicator: null }}
        />
      </Box>
    </div>
  ),
};
