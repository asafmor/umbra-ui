import { Package, RefreshCw, RotateCcw, UserPlus, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AppShell,
  Avatar,
  Banner,
  Card,
  Columns,
  CommandPalette,
  DataTable,
  Legend,
  LevelMeter,
  List,
  numberColumn,
  Page,
  PrimaryAction,
  PrimaryNav,
  ProgressBar,
  SegmentedFilter,
  Slot,
  Stack,
  StatusIndicator,
  StatValue,
  SubNav,
  SummaryTile,
  TopBar,
  TrendArrow,
  UmbraProvider,
  type Command,
  type ContextPreset,
  type DataTableColumn,
  type Density,
  type Shortcut,
  type Status,
} from 'umbra-ui';
import { BarChart, DonutChart, LineChart } from 'umbra-ui/charts';
import { activity, channels, dashboardData, productLines, recentOrders, regions, type Order } from './data';

const densities: Density[] = ['compact', 'default', 'spacious'];
const contexts: ContextPreset[] = ['violet', 'teal', 'green', 'slate'];
const title = (id: string) => id[0]!.toUpperCase() + id.slice(1);
const money = (value: number) => `${value.toLocaleString('en-GB')}K`;

const orderStatus: Record<Order['status'], Status> = {
  Open: 'info',
  Packed: 'warning',
  Sent: 'success',
  Returned: 'danger',
};
const orderColumns: DataTableColumn<Order>[] = [
  { id: 'id', header: 'Order', accessor: 'id', width: 72, priority: 'always', rowHeader: true },
  { id: 'client', header: 'Client', accessor: 'client', sortable: true, priority: 2 },
  { id: 'region', header: 'Region', accessor: 'region', sortable: true },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    sortable: true,
    priority: 1,
    cell: (order) => <StatusIndicator status={orderStatus[order.status]}>{order.status}</StatusIndicator>,
  },
  numberColumn({ id: 'total', header: 'Total', accessor: 'total', sortable: true, priority: 3 }),
];

export function App() {
  const [channel, setChannel] = useState('all');
  const [density, setDensity] = useState<Density>('default');
  const [context, setContext] = useState<ContextPreset>('violet');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(true);
  // One legend switches the regions of both charts.
  const [hiddenRegions, setHiddenRegions] = useState<string[]>([]);

  const data = useMemo(() => dashboardData(channel), [channel]);
  const shown = (id: string) => !hiddenRegions.includes(id);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };
  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { id: 'app.refresh', keys: 'Shift+R', label: 'Refresh the data', action: refresh },
      {
        id: 'app.density',
        keys: 'Shift+D',
        label: 'Next density level',
        action: () => setDensity((d) => densities[(densities.indexOf(d) + 1) % densities.length]!),
      },
    ],
    [],
  );
  const commands = useMemo<Command[]>(
    () => [
      ...channels.map((c) => ({
        id: `channel-${c.id}`,
        label: `Show ${c.label.toLowerCase()}`,
        section: 'Channels',
        onRun: () => setChannel(c.id),
      })),
      ...densities.map((d) => ({
        id: `density-${d}`,
        label: `${title(d)} density`,
        section: 'Display',
        keywords: ['size', 'spacing'],
        onRun: () => setDensity(d),
      })),
      ...contexts.map((c) => ({
        id: `context-${c}`,
        label: `${title(c)} tint`,
        section: 'Display',
        keywords: ['colour', 'context', 'theme'],
        onRun: () => setContext(c),
      })),
      {
        id: 'refresh',
        label: 'Refresh the data',
        section: 'Actions',
        shortcut: 'app.refresh',
        onRun: refresh,
      },
      { id: 'notice', label: 'Show the notice again', section: 'Actions', onRun: () => setNotice(true) },
    ],
    [],
  );

  return (
    <UmbraProvider brand="#1d4b8f" context={context} density={density} shortcuts={shortcuts} locale="en-GB">
      <AppShell
        topBar={
          <TopBar
            logo="U"
            nav={<PrimaryNav items={channels} value={channel} onChange={setChannel} />}
            commandPalette={<CommandPalette commands={commands} includeShortcuts />}
            context={
              <>
                <b>Mon 12 Oct 2026</b>
                <br />
                Quarter close in 6 days
              </>
            }
            primaryAction={
              <PrimaryAction
                label="Refresh"
                icon={<RefreshCw />}
                loading={loading}
                shortcut="app.refresh"
                onPress={refresh}
              />
            }
          />
        }
        subNav={
          <SubNav
            label="Overview"
            end={
              <div style={{ display: 'flex', gap: 'var(--umbra-space-3)' }}>
                <SegmentedFilter
                  aria-label="Context"
                  size="small"
                  items={contexts.map((id) => ({ id, label: title(id) }))}
                  value={context}
                  onChange={(id: string | null) => id && setContext(id as ContextPreset)}
                />
                <SegmentedFilter
                  aria-label="Density"
                  size="small"
                  items={densities.map((id) => ({ id, label: title(id) }))}
                  value={density}
                  onChange={(id: string | null) => id && setDensity(id as Density)}
                />
              </div>
            }
          />
        }
      >
        <Page>
          <Stack overflow="keep">
            {notice && (
              <Slot size="content">
                <Banner
                  tone="warning"
                  compact
                  title="Stock is low on Line C."
                  dismissible
                  onDismiss={() => setNotice(false)}
                >
                  Three orders for Region B wait for a delivery due on Thursday.
                </Banner>
              </Slot>
            )}
            <Columns size="content" narrow="keep">
              <SummaryTile
                icon={<Wallet />}
                title="Revenue"
                value={money(data.total)}
                caption="This year"
                trend={<TrendArrow direction="up" value="8%" />}
                loading={loading}
              />
              <SummaryTile
                icon={<Package />}
                title="Orders"
                value={data.orderCount.toLocaleString('en-GB')}
                caption="This year"
                trend={<TrendArrow direction="up" value="3%" />}
                loading={loading}
              />
              <SummaryTile
                icon={<UserPlus />}
                title="New clients"
                value={data.newClients}
                caption="Last 30 days"
                trend={<TrendArrow direction="flat" value="0" />}
                loading={loading}
              />
              <SummaryTile
                icon={<RotateCcw />}
                title="Returns"
                value={data.returns}
                caption="Last 30 days"
                trend={<TrendArrow direction="up" positive="down" value="4" />}
                loading={loading}
              />
            </Columns>
            <Columns>
              {/* A chart needs more than a card's default minimum: below it, the second card gives way. */}
              <Stack size={2.2} label="Trends">
                <Card
                  title="Revenue by region"
                  priority={1}
                  minHeight={140}
                  parts={{
                    toolbar: (
                      <Card.Toolbar>
                        <Legend
                          aria-label="Regions"
                          items={regions}
                          interactive
                          hiddenIds={hiddenRegions}
                          onHiddenChange={setHiddenRegions}
                        />
                      </Card.Toolbar>
                    ),
                  }}
                >
                  <LineChart
                    aria-label="Revenue by region and month"
                    series={data.revenue}
                    hiddenIds={hiddenRegions}
                    legend={false}
                    formatValue={money}
                    loading={loading}
                  />
                </Card>
                <Card title="Orders by product line" minHeight={140}>
                  <BarChart
                    aria-label="Orders by product line and region"
                    variant="stacked"
                    categories={productLines}
                    series={data.orders}
                    hiddenIds={hiddenRegions}
                    legend={false}
                    loading={loading}
                  />
                </Card>
              </Stack>
              <Stack size={1.6} label="Activity">
                <Card title="Recent orders" padding="none" size={1.3} priority={1} minHeight={140}>
                  <DataTable
                    aria-label="Recent orders"
                    data={recentOrders}
                    getRowId={(order) => order.id}
                    columns={orderColumns}
                    defaultSort={[{ id: 'total', direction: 'desc' }]}
                    loading={loading}
                  />
                </Card>
                <Card title="Activity" padding="none" minHeight={140}>
                  <List
                    aria-label="Activity"
                    items={activity}
                    itemSize="compact"
                    loading={loading}
                    renderItem={(entry) => (
                      <List.Item
                        id={entry.id}
                        leading={<Avatar name={entry.who} alt="" size="sm" />}
                        title={entry.what}
                        description={entry.who}
                        meta={entry.when}
                      />
                    )}
                  />
                </Card>
              </Stack>
              {/* More cards than fit in a low window: the lowest priorities collapse to their headers. */}
              <Stack label="Status" gap={3}>
                <Card title="Year target" tone="neutral" priority={3} size={1.2}>
                  <StatValue
                    label="Reached"
                    value={data.target}
                    unit="%"
                    trend={<TrendArrow direction="up" value="4 pts" />}
                    meter={
                      <ProgressBar aria-label="Share of the year target" value={data.target} target={80} />
                    }
                    loading={loading}
                  />
                </Card>
                <Card title="Order status" tone="neutral" priority={2} size={1.6}>
                  <DonutChart
                    aria-label="Orders by status"
                    data={data.status}
                    centerValue={data.status.reduce((sum, segment) => sum + segment.value, 0)}
                    centerLabel="orders"
                    legend="end"
                    loading={loading}
                  />
                </Card>
                <Card title="Service level" tone="neutral" priority={1} size={1.2}>
                  <StatValue
                    label="Client rating"
                    value="4.2"
                    unit="/ 5"
                    meter={
                      <LevelMeter
                        aria-label="Client rating"
                        value={4.2}
                        min={1}
                        max={5}
                        thresholds={[
                          { from: 1, tone: 'danger', label: 'Low' },
                          { from: 2.5, tone: 'warning', label: 'Fair' },
                          { from: 3.8, tone: 'success', label: 'Good' },
                        ]}
                      />
                    }
                    loading={loading}
                  />
                </Card>
                <Card title="Stock cover" tone="neutral" size={1.2}>
                  <Stack gap={3} overflow="keep">
                    {regions.filter((region) => shown(region.id)).length === 0
                      ? 'Every region is switched off in the legend.'
                      : regions
                          .filter((region) => shown(region.id))
                          .map((region, i) => (
                            <Slot key={region.id} size="content">
                              <ProgressBar
                                label={region.label}
                                layout="inline"
                                kind="meter"
                                value={[82, 34, 58, 71][i % 4]}
                                thresholds
                                showValue
                                loading={loading}
                              />
                            </Slot>
                          ))}
                  </Stack>
                </Card>
              </Stack>
            </Columns>
          </Stack>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
