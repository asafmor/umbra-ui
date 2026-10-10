// The table page: one dense table as the main content, with a toolbar above it and a summary beside it.
import {
  Archive,
  CircleAlert,
  Clock,
  Download,
  Flag,
  Layers,
  PackageCheck,
  Plus,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DonutChart } from '../../charts';
import {
  actionsColumn,
  ActionBar,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Columns,
  DataTable,
  EntityIcon,
  Legend,
  LevelMeter,
  Link,
  numberColumn,
  Page,
  PageHeader,
  ProgressBar,
  SegmentedFilter,
  Stack,
  StatusIndicator,
  SummaryTile,
  Tag,
  Toggle,
  TrendArrow,
  ValuePill,
  VerticalNav,
  type DataTableColumn,
  type Status,
  type Tone,
} from '../../index';
import { money, orders, stages, sum, type Health, type Order } from './data';

const healthOf: Record<Health, { status: Status; label: string }> = {
  ok: { status: 'success', label: 'On track' },
  late: { status: 'warning', label: 'Late' },
  blocked: { status: 'danger', label: 'Blocked' },
};
const priorityTone: Record<Order['priority'], Tone> = { High: 'danger', Normal: 'neutral', Low: 'info' };
const me = 'Person A';
const stageGroups = stages.map((stage) => ({ key: stage }));

const views: [
  id: string,
  label: string,
  icon: React.ReactNode,
  test: (o: Order, flagged: boolean) => boolean,
][] = [
  ['all', 'All orders', <Layers key="a" />, () => true],
  ['mine', 'My orders', <UserRound key="m" />, (o) => o.owner === me],
  ['flagged', 'Flagged', <Flag key="f" />, (_, flagged) => flagged],
  ['late', 'Late', <Clock key="l" />, (o) => o.health === 'late'],
  ['blocked', 'Blocked', <CircleAlert key="b" />, (o) => o.health === 'blocked'],
];

const total = (pick: (o: Order) => number, format: (n: number) => string = String) => ({
  footer: (rows: Order[]) => format(sum(rows.map(pick))),
  aggregate: (rows: Order[]) => format(sum(rows.map(pick))),
});

export function OrdersScreen() {
  const [view, setView] = useState('all');
  const [health, setHealth] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(true);
  const [openOnly, setOpenOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [archived, setArchived] = useState<string[]>([]);
  const [flagChanges, setFlagChanges] = useState<Record<string, boolean>>({});

  const columns = useMemo<DataTableColumn<Order>[]>(() => {
    const flagged = (o: Order) => flagChanges[o.id] ?? o.flagged;
    return [
      {
        id: 'name',
        header: 'Order',
        accessor: 'name',
        rowHeader: true,
        pin: 'start',
        priority: 'always',
        sortable: true,
        width: 112,
        footer: (rows) => `${rows.length} orders`,
      },
      {
        id: 'client',
        header: 'Client',
        accessor: 'client',
        sortable: true,
        priority: 9,
        width: { min: 112, flex: 1 },
        cell: (o) => <EntityIcon name={o.client} label />,
      },
      {
        id: 'owner',
        header: 'Owner',
        accessor: 'owner',
        sortable: true,
        priority: 6,
        width: { min: 120, flex: 1 },
        cell: (o) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--umbra-space-2)', minWidth: 0 }}>
            <Avatar size="xs" name={o.owner} alt="" />
            {o.owner}
          </span>
        ),
      },
      { id: 'team', header: 'Team', accessor: 'team', sortable: true, priority: 2, width: 80 },
      { id: 'region', header: 'Region', accessor: 'region', sortable: true, priority: 3, width: 88 },
      {
        id: 'stage',
        header: 'Stage',
        accessor: 'stage',
        priority: 5,
        width: 96,
        sortable: true,
        sortFn: (a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage),
        cell: (o) => <Tag size="small">{o.stage}</Tag>,
      },
      {
        id: 'health',
        header: 'Status',
        accessor: 'health',
        priority: 10,
        width: 104,
        sortable: true,
        cell: (o) => (
          <StatusIndicator status={healthOf[o.health].status}>{healthOf[o.health].label}</StatusIndicator>
        ),
      },
      {
        id: 'priority',
        header: 'Priority',
        accessor: 'priority',
        priority: 4,
        width: 88,
        cell: (o) => (
          <Tag size="small" variant="outline" tone={priorityTone[o.priority]}>
            {o.priority}
          </Tag>
        ),
      },
      { id: 'channel', header: 'Channel', accessor: 'channel', priority: 0, width: 88 },
      { id: 'due', header: 'Due', accessor: 'due', priority: 7, width: 72 },
      numberColumn({
        id: 'daysOpen',
        header: 'Days',
        accessor: 'daysOpen',
        description: 'Days open',
        sortable: true,
        priority: 1,
        width: 64,
      }),
      numberColumn({
        id: 'quantity',
        header: 'Qty',
        accessor: 'quantity',
        sortable: true,
        priority: 3,
        width: 64,
        ...total((o) => o.quantity),
      }),
      numberColumn({
        id: 'amount',
        header: 'Amount',
        accessor: 'amount',
        format: (value) => money(value as number),
        sortable: true,
        priority: 11,
        width: 112,
        ...total((o) => o.amount, money),
      }),
      numberColumn({
        id: 'margin',
        header: 'Margin',
        accessor: 'margin',
        format: (value) => `${value}%`,
        sortable: true,
        priority: 2,
        width: 72,
      }),
      numberColumn({
        id: 'score',
        header: 'Score',
        accessor: 'score',
        sortable: true,
        priority: 8,
        width: 68,
        cell: (o) => <ValuePill size="small" shape="square" value={o.score} />,
      }),
      {
        id: 'progress',
        header: 'Progress',
        accessor: 'progress',
        priority: 5,
        width: { min: 128, flex: 1 },
        cell: (o) => (
          <ProgressBar
            layout="inline"
            size="thin"
            value={o.progress}
            showValue
            aria-label={`Progress of ${o.name}`}
          />
        ),
      },
      numberColumn({
        id: 'change',
        header: 'Trend',
        accessor: 'change',
        priority: 4,
        width: 68,
        cell: (o) => (
          <TrendArrow
            direction={o.change > 0 ? 'up' : o.change < 0 ? 'down' : 'flat'}
            positive="up"
            value={Math.abs(o.change)}
          />
        ),
      }),
      {
        id: 'level',
        header: 'Fit',
        accessor: 'level',
        priority: 1,
        width: 112,
        cell: (o) => (
          <LevelMeter
            size="small"
            value={o.level}
            min={1}
            max={5}
            steps={5}
            aria-label={`Fit of ${o.name}`}
          />
        ),
      },
      numberColumn({
        id: 'invoices',
        header: 'Inv',
        accessor: 'invoices',
        description: 'Invoices',
        priority: 2,
        width: 56,
        cell: (o) => <Badge count={o.invoices} showZero tone="neutral" label={(n) => `${n} invoices`} />,
      }),
      numberColumn({
        id: 'returns',
        header: 'Ret',
        accessor: 'returns',
        description: 'Returns',
        priority: 0,
        width: 56,
        ...total((o) => o.returns),
      }),
      {
        id: 'flagged',
        header: 'Flag',
        accessor: flagged,
        align: 'center',
        priority: 6,
        width: 56,
        cell: (o) => (
          <Checkbox
            size="small"
            aria-label={`Flag ${o.name}`}
            checked={flagged(o)}
            onChange={(on) => setFlagChanges((all) => ({ ...all, [o.id]: on }))}
          />
        ),
      },
      {
        id: 'invoice',
        header: 'Invoice',
        priority: 0,
        width: 72,
        cell: (o) => (
          <Link href={`#invoice-${o.id}`} tone="accent">
            Open
          </Link>
        ),
      },
      actionsColumn<Order>({
        width: 48,
        priority: 'always',
        menuLabel: (o) => `Actions for ${o.name}`,
        menu: () => [
          { id: 'flag', label: 'Flag', icon: <Flag /> },
          { id: 'archive', label: 'Archive', icon: <Archive />, danger: true },
        ],
        onMenuAction: (id, o) =>
          id === 'flag'
            ? setFlagChanges((all) => ({ ...all, [o.id]: true }))
            : setArchived((ids) => [...ids, o.id]),
      }),
    ];
  }, [flagChanges]);

  const live = useMemo(() => orders.filter((o) => !archived.includes(o.id)), [archived]);
  const isFlagged = (o: Order) => flagChanges[o.id] ?? o.flagged;
  const inView = useMemo(
    () => live.filter((o) => views.find(([id]) => id === view)![3](o, flagChanges[o.id] ?? o.flagged)),
    // Flag changes move rows in and out of the "Flagged" view only.
    [live, view, view === 'flagged' ? flagChanges : null], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const rows = useMemo(
    () => inView.filter((o) => (health === null || o.health === health) && (!openOnly || o.stage !== 'Sent')),
    [inView, health, openOnly],
  );
  const byStage = stages.map((stage) => ({
    id: stage,
    label: stage,
    value: rows.filter((o) => o.stage === stage).length,
  }));

  return (
    <Page
      header={
        <PageHeader
          headingLevel={1}
          media={<EntityIcon name="Orders" icon={<PackageCheck />} />}
          overline="Q3 2026"
          title="All orders"
          meta={[
            { label: 'Orders', value: live.length },
            { label: 'Value', value: money(sum(live.map((o) => o.amount))) },
            { label: 'Late', value: live.filter((o) => o.health === 'late').length },
          ]}
          actions={
            <>
              <Button iconStart={<Download />}>Export</Button>
              <Button variant="accent" iconStart={<Plus />}>
                New order
              </Button>
            </>
          }
        />
      }
    >
      <Columns>
        <Card
          title="Orders"
          label="Orders"
          size={4.5}
          padding="none"
          style={{ position: 'relative' }}
          parts={{
            toolbar: (
              <Card.Toolbar>
                <SegmentedFilter
                  aria-label="Filter by status"
                  size="small"
                  all
                  allCount={inView.length}
                  value={health}
                  onChange={setHealth}
                  items={(['ok', 'late', 'blocked'] as const).map((id) => ({
                    id,
                    label: healthOf[id].label,
                    count: inView.filter((o) => o.health === id).length,
                  }))}
                />
                <Toggle size="small" checked={grouped} onChange={setGrouped}>
                  Group by stage
                </Toggle>
                <Checkbox size="small" checked={openOnly} onChange={setOpenOnly}>
                  Hide sent
                </Checkbox>
                <span style={{ flex: 1 }} />
                <Button
                  size="small"
                  variant="ghost"
                  disabled={health === null && !openOnly}
                  onPress={() => {
                    setHealth(null);
                    setOpenOnly(false);
                  }}
                >
                  Reset
                </Button>
              </Card.Toolbar>
            ),
          }}
        >
          <DataTable
            aria-label="Orders"
            data={rows}
            getRowId={(o) => o.id}
            columns={columns}
            striped
            selectionMode="multiple"
            selectedIds={selected}
            onSelectionChange={setSelected}
            selectRowLabel={(o) => `Select ${o.name}`}
            groupBy={grouped ? 'stage' : undefined}
            groups={stageGroups}
            collapsibleGroups
            stickyGroups
            virtualize
            empty={{ title: 'No orders match', description: 'Change the view or reset the filters.' }}
          />
          <ActionBar
            variant="floating"
            aria-label="Selected orders"
            selectionCount={selected.length}
            onClearSelection={() => setSelected([])}
            secondary={[
              {
                label: 'Flag',
                icon: <Flag />,
                onPress: () =>
                  setFlagChanges((all) => ({
                    ...all,
                    ...Object.fromEntries(selected.map((id) => [id, true])),
                  })),
              },
            ]}
            primary={{
              label: 'Archive',
              icon: <Archive />,
              variant: 'accent',
              onPress: () => {
                setArchived((ids) => [...ids, ...selected]);
                setSelected([]);
              },
            }}
          />
        </Card>
        <Stack size={1.3} label="Summary">
          <Card title="Views" padding="none" priority={1} minHeight={216}>
            <VerticalNav
              aria-label="Views"
              value={view}
              onChange={(id) => {
                setView(id);
                setSelected([]);
              }}
              items={views.map(([id, label, icon, test]) => ({
                id,
                label,
                icon,
                badge: (
                  <Badge count={live.filter((o) => test(o, isFlagged(o))).length} tone="neutral" max={999} />
                ),
              }))}
            />
          </Card>
          <SummaryTile
            size="content"
            icon={<PackageCheck />}
            title="Shown value"
            value={money(sum(rows.map((o) => o.amount)))}
            caption={`${rows.length} orders`}
            trend={<TrendArrow direction="up" positive="up" value="6%" />}
          />
          <SummaryTile
            size="content"
            icon={<Clock />}
            title="Late"
            value={rows.filter((o) => o.health === 'late').length}
            caption="Past the due date"
            trend={<TrendArrow direction="down" positive="down" value="3" />}
            selected={health === 'late'}
            onPress={() => setHealth(health === 'late' ? null : 'late')}
          />
          <Card title="By stage" tone="neutral" priority={2} size={1.4} minHeight={192}>
            <DonutChart
              label="Orders by stage"
              data={byStage}
              centerValue={rows.length}
              centerLabel="orders"
              legend={<Legend aria-label="Stages" orientation="vertical" items={byStage} />}
            />
          </Card>
        </Stack>
      </Columns>
    </Page>
  );
}
