// The overview: an inbox, a wide summary card and a stack of small neutral cards.
import { TrendingUp } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { RadarChart } from '../../charts';
import {
  Avatar,
  Banner,
  Button,
  Card,
  Columns,
  DataTable,
  KeyValueList,
  List,
  numberColumn,
  Page,
  ProgressBar,
  SectionTitle,
  SegmentedFilter,
  Stack,
  StatusIndicator,
  StatValue,
  Tag,
  TrendArrow,
  type DataTableColumn,
  type Status,
} from '../../index';
import {
  deliveries,
  insightAxes,
  insightValues,
  messageDays,
  messages,
  ownRegion,
  performers,
  regions,
  slotKinds,
  updates,
  week,
  type Delivery,
  type Message,
  type Region,
} from './data';
import type { Place } from './App';

export interface InboxProps {
  messageId: string;
  read: string[];
  onSelect: (id: string) => void;
}

const deliveryStatus: Record<Delivery['status'], { status: Status; label: string }> = {
  done: { status: 'success', label: 'Done' },
  missed: { status: 'danger', label: 'Missed' },
  late: { status: 'warning', label: 'Late' },
  planned: { status: 'neutral', label: 'Planned' },
};

const deliveryColumns: DataTableColumn<Delivery>[] = [
  { id: 'date', header: 'Date', accessor: 'date', width: 76, priority: 'always', rowHeader: true },
  { id: 'client', header: 'Client', accessor: 'client', width: { min: 72, flex: 1 }, priority: 'always' },
  { id: 'site', header: 'Site', accessor: 'site', width: 80, priority: 1 },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    width: 96,
    priority: 3,
    cell: (d) => (
      <StatusIndicator status={deliveryStatus[d.status].status}>
        {deliveryStatus[d.status].label}
      </StatusIndicator>
    ),
  },
  { id: 'channel', header: 'Channel', accessor: 'channel', width: 80, priority: 0 },
];

const count = (id: keyof Region & string, header: string, priority: number) =>
  numberColumn<Region>({ id, header, accessor: id, width: 52, priority, sortDescFirst: true });

const regionColumns: DataTableColumn<Region>[] = [
  numberColumn({ id: 'pos', header: 'Pos', accessor: 'pos', width: 52, align: 'start', priority: 'always' }),
  {
    id: 'name',
    header: 'Region',
    accessor: 'name',
    width: { min: 84, flex: 1 },
    priority: 'always',
    rowHeader: true,
  },
  count('orders', 'Ord', 2),
  count('won', 'Won', 1),
  count('open', 'Open', 0),
  count('lost', 'Lost', 0),
  count('points', 'Pts', 3),
];

/** The inbox card: a filter with counts above a grouped message list. */
export function InboxCard({ messageId, read, onSelect, onOpen }: InboxProps & { onOpen: () => void }) {
  const [filter, setFilter] = useState<string | null>(null);
  const isUnread = (m: Message) => m.unread && !read.includes(m.id);
  // The selected message stays in the "Unread" list after it was read, so the list does not move under the user.
  const shown = (m: Message) =>
    filter === null || (filter === 'unread' ? isUnread(m) || m.id === messageId : filter === m.kind);
  return (
    <Card
      title="Inbox"
      label="Inbox"
      size={3}
      padding="none"
      parts={{
        toolbar: (
          <Card.Toolbar>
            <SegmentedFilter
              aria-label="Filter the inbox"
              all
              value={filter}
              onChange={setFilter}
              items={[
                { id: 'new', label: 'New' },
                { id: 'task', label: 'Tasks', count: messages.filter((m) => m.kind === 'task').length },
                { id: 'unread', label: 'Unread', count: messages.filter(isUnread).length },
              ]}
            />
          </Card.Toolbar>
        ),
      }}
    >
      <List
        aria-label="Inbox"
        itemVariant="message"
        stickyHeaders
        selectionMode="single"
        selectionBehavior="replace"
        selectedIds={[messageId]}
        onSelectionChange={([id]) => id !== undefined && onSelect(String(id))}
        onAction={onOpen}
        empty="No messages match the filter"
        groups={messageDays
          .map(({ day, items }) => ({
            key: day,
            title: day,
            variant: 'strip' as const,
            items: items.filter(shown),
          }))
          .filter((group) => group.items.length > 0)}
        renderItem={(m) => (
          <List.Item
            id={m.id}
            overline={m.from}
            title={m.title}
            meta={m.time}
            trailing={
              <Tag size="small" variant="outline">
                {m.tag}
              </Tag>
            }
            unread={isUnread(m)}
          />
        )}
      />
    </Card>
  );
}

const flow: CSSProperties = {
  display: 'grid',
  gap: 'var(--umbra-space-4)',
  alignContent: 'start',
  minWidth: 0,
};
const news: CSSProperties = {
  display: 'grid',
  gap: 'var(--umbra-space-2)',
  justifyItems: 'start',
  padding: 'var(--umbra-space-5)',
  border: 'var(--umbra-border-width) solid var(--umbra-color-base-border-subtle)',
  borderRadius: 'var(--umbra-radius-card)',
  background: 'var(--umbra-context-card-tint-strong)',
};

// The summary: two columns of flowing sections in one card body, which scrolls as a whole.
const summaryColumns: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--umbra-space-6)',
  alignItems: 'start',
};

function SummaryCard({ go }: { go: (place: Place) => void }) {
  const accent = useMemo(
    () => (region: Region) =>
      region.pos <= 4
        ? { color: 'var(--umbra-color-semantic-info)', label: 'Top group' }
        : region.pos >= regions.length - 1
          ? { color: 'var(--umbra-color-semantic-danger)', label: 'Under review' }
          : undefined,
    [],
  );
  return (
    <Card aria-label="Summary" label="Summary" size={5}>
      <div style={summaryColumns}>
        <div style={flow}>
          <SectionTitle onOpen={() => go('overview/reports')}>Updates</SectionTitle>
          <div style={news}>
            <Tag variant="outline">Operations</Tag>
            <h4 style={{ margin: 0, font: 'var(--umbra-font-title)' }}>North region lands a new contract</h4>
            <span
              style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}
            >
              2d ago · Contracts
            </span>
          </div>
          <KeyValueList
            aria-label="More updates"
            striped
            items={updates.map((u) => ({ key: u.id, label: u.title, value: u.age }))}
          />
          <SectionTitle onOpen={() => go('overview/calendar')}>Delivery schedule</SectionTitle>
          <DataTable
            aria-label="Delivery schedule"
            height="content"
            data={deliveries}
            getRowId={(d) => d.id}
            columns={deliveryColumns}
            striped
          />
        </div>
        <div style={flow}>
          <SectionTitle onOpen={() => go('overview/reports')}>Regional ranking</SectionTitle>
          <DataTable
            aria-label="Regional ranking"
            height="content"
            data={regions}
            getRowId={(r) => r.id}
            columns={regionColumns}
            highlightedRowIds={[ownRegion]}
            highlightLabel="Your region"
            rowAccent={accent}
            striped
          />
          <SectionTitle onOpen={() => go('people/teams')}>Top performers</SectionTitle>
          <List aria-label="Top performers" height="content" striped itemSize="compact">
            {performers.map((p) => (
              <List.Item
                key={p.id}
                id={p.id}
                leading={<Avatar size="sm" name={p.who} alt="" />}
                title={p.label}
                description={p.who}
                meta={<b>{p.value}</b>}
              />
            ))}
          </List>
        </div>
      </div>
    </Card>
  );
}

const slotStatus: Status[] = ['info', 'success', 'warning', 'neutral'];

function WeekStrip() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: 'var(--umbra-space-2)',
      }}
    >
      {week.map(({ day, today, slots }) => (
        <div key={day} style={{ display: 'grid', gap: 'var(--umbra-space-2)', justifyItems: 'center' }}>
          {today ? (
            <Tag size="small" variant="solid" tone="accent">
              {day}
            </Tag>
          ) : (
            <span style={{ font: 'var(--umbra-font-label)' }}>{day}</span>
          )}
          {slots.map((kind, i) => (
            <StatusIndicator
              key={i}
              variant="dot"
              status={slotStatus[kind]!}
              aria-label={`${day}, slot ${i + 1}: ${slotKinds[kind]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusStack() {
  const [notice, setNotice] = useState(true);
  return (
    <Stack size={2.4} label="Status">
      <Card title="Next review" tone="neutral" priority={3}>
        <StatValue
          size="md"
          label="Site 20 depot · today"
          value="72%"
          caption="Preparation done"
          meter={<ProgressBar value={72} aria-label="Preparation done" />}
        />
      </Card>
      <Card
        title="Insights"
        tone="neutral"
        size={1.6}
        priority={4}
        minHeight={200}
        actions={
          <Tag size="small" tone="success" icon={<TrendingUp />}>
            Above average
          </Tag>
        }
      >
        <RadarChart
          aria-label="Insights"
          axes={insightAxes.map((axis) => ({ id: axis, label: axis }))}
          max={100}
          series={[
            { id: 'own', label: 'Region 5', values: insightValues.own },
            { id: 'average', label: 'Average', values: insightValues.average },
          ]}
        />
      </Card>
      <Card title="Project budget" tone="neutral" priority={2}>
        <StatValue
          label="Available"
          value="€64.0M"
          trend={<TrendArrow direction="up" positive="up" value="4%" />}
          caption="Spent this year · €9.5M"
          meter={<ProgressBar value={87} aria-label="Project budget left" />}
        />
      </Card>
      <Card title="Payroll budget" tone="neutral" priority={1}>
        <StatValue
          label="Available"
          value="€410K"
          unit="/ month"
          trend={<TrendArrow direction="down" positive="up" value="2%" />}
          caption="Committed · €500K / month"
          meter={<ProgressBar value={55} thresholds aria-label="Payroll budget left" />}
        />
      </Card>
      <Card title="This week" tone="neutral" priority={0}>
        <div style={flow}>
          <WeekStrip />
          {notice && (
            <Banner
              tone="warning"
              compact
              title="Quarter close"
              dismissible
              onDismiss={() => setNotice(false)}
              actions={<Button size="small">Plan</Button>}
            >
              6 days left to file reports
            </Banner>
          )}
        </div>
      </Card>
    </Stack>
  );
}

export function OverviewScreen({ go, ...inbox }: InboxProps & { go: (place: Place) => void }) {
  return (
    <Page>
      <Columns>
        <InboxCard {...inbox} onOpen={() => go('overview/inbox')} />
        <SummaryCard go={go} />
        <StatusStack />
      </Columns>
    </Page>
  );
}
