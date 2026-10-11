// Tier 2 components used together and inside tier 1 containers, across the groups that built them.
// The behaviour is tested in tests/visual/integration-tier2.spec.ts.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Heatmap } from '../charts/Heatmap';
import { Sparkline } from '../charts/Sparkline';
import { Comparison } from '../data/Comparison';
import { KeyValue, KeyValueList } from '../data/KeyValue';
import { List } from '../data/List';
import { MediaCard } from '../data/MediaCard';
import { SequenceDots, type SequenceDotsItem } from '../data/SequenceDots';
import { SummaryTile } from '../data/SummaryTile';
import { ColorScaleEditor } from '../inputs/ColorScaleEditor';
import { Slider } from '../inputs/Slider';
import { SplitButton } from '../inputs/SplitButton';
import { StarRating } from '../inputs/StarRating';
import { Stepper } from '../inputs/Stepper';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { HorizontalScroller } from '../layout/HorizontalScroller';
import { Page } from '../layout/Page';
import { Stack } from '../layout/Stack';
import { WidgetBoard } from '../layout/WidgetBoard';
import { DivergingMeter } from '../meters/DivergingMeter';
import { PieIndicator } from '../meters/PieIndicator';
import { ActionBar } from '../overlays/ActionBar';
import { Modal } from '../overlays/Modal';
import { ShortcutsSheet } from '../overlays/ShortcutsSheet';
import { Spotlight } from '../overlays/Spotlight';
import { UmbraProvider, UmbraScope, type ContextTint, type Density } from '../provider/UmbraProvider';
import { AppShell } from '../shell/AppShell';
import { DataTable, type DataTableColumn } from '../table/DataTable';
import { Planner } from '../time/Planner';
import { october, thisWeek, TODAY } from '../time/samples';
import { WeekStrip } from '../time/WeekStrip';
import type { Threshold } from '../utils/thresholds';
import { Picture } from './pictures';
import { Log } from './placeholders';

const meta = { title: 'Integration/Tier 2' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

type Globals = { density?: Density; context?: ContextTint; direction?: string };

const runs = (tones: SequenceDotsItem['tone'][]): SequenceDotsItem[] =>
  tones.map((tone, i) => ({ id: `run-${i + 1}`, label: `Run ${i + 1}: ${tone}`, tone }));

interface Item {
  id: string;
  name: string;
  trend: number[];
  rating: number;
  runs: SequenceDotsItem[];
  ready: number;
  change: number;
}
const items: Item[] = [
  { id: 'item-1', name: 'Item 1', trend: [4, 6, 5, 8, 9], rating: 4.5, ready: 80, change: 12 },
  { id: 'item-2', name: 'Item 2', trend: [9, 7, 8, 4, 3], rating: 2, ready: 35, change: -30 },
  { id: 'item-3', name: 'Item 3', trend: [5, 5, 6, 5, 6], rating: 3, ready: 100, change: 0 },
  { id: 'item-4', name: 'Item 4', trend: [2, 4, 3, 7, 6], rating: 5, ready: 10, change: 45 },
].map((item, i) => ({
  ...item,
  runs: runs((['success', 'danger', 'warning', 'success'] as const).slice(0, 4 - (i % 2))),
}));

const columns = (onOpen: (name: string) => void): DataTableColumn<Item>[] => [
  { id: 'name', header: 'Name', accessor: 'name', rowHeader: true },
  {
    id: 'trend',
    header: 'Trend',
    cell: (item) => <Sparkline data={item.trend} aria-label={`Trend of ${item.name}`} lastPoint />,
  },
  {
    id: 'rating',
    header: 'Rating',
    width: { min: 128, flex: 1 },
    cell: (item) => <StarRating readOnly value={item.rating} aria-label={`Rating of ${item.name}`} />,
  },
  {
    id: 'runs',
    header: 'Runs',
    cell: (item) => <SequenceDots items={item.runs} aria-label={`Runs of ${item.name}`} />,
  },
  {
    id: 'ready',
    header: 'Ready',
    cell: (item) => <PieIndicator value={item.ready} layout="inline" aria-label={`Ready, ${item.name}`} />,
  },
  {
    id: 'change',
    header: 'Change',
    width: { min: 140, flex: 1 },
    cell: (item) => (
      <DivergingMeter value={item.change} min={-50} max={50} showValue aria-label={`Change, ${item.name}`} />
    ),
  },
  {
    id: 'open',
    header: 'Actions',
    width: { min: 176, flex: 1 },
    priority: 'always',
    cell: (item) => (
      <>
        <Button size="small" disabled>
          Archive
        </Button>{' '}
        <Button size="small" onPress={() => onOpen(item.name)}>
          Open
        </Button>
      </>
    ),
  },
];

function InDataDemo() {
  const [last, setLast] = useState('none');
  const [tour, setTour] = useState(false);
  const first = items[0]!;
  return (
    <AppShell>
      <Page>
        <Columns>
          <Stack size={2}>
            <Card
              title="Items"
              padding="none"
              actions={<Button onPress={() => setTour(true)}>Show me</Button>}
            >
              <DataTable
                aria-label="Items"
                data={items}
                getRowId={(item) => item.id}
                columns={columns(setLast)}
              />
            </Card>
            <Stack size="content">
              <Log>Opened: {last}</Log>
            </Stack>
          </Stack>
          <Card title="A scope: compact, teal">
            <UmbraScope density="compact" context="teal">
              <List aria-label="Items" height="content">
                <List.Item
                  id="row-1"
                  title="Trend"
                  trailing={<Sparkline data={first.trend} aria-label="Trend" interactive />}
                />
                <List.Item
                  id="row-2"
                  title="Rating"
                  trailing={<StarRating readOnly value={3.5} aria-label="Rating" />}
                />
                <List.Item
                  id="row-3"
                  title="Runs"
                  trailing={<SequenceDots items={first.runs} aria-label="Runs" />}
                />
                <List.Item
                  id="row-4"
                  title="Ready"
                  trailing={<PieIndicator value={80} layout="inline" aria-label="Ready" />}
                />
                <List.Item
                  id="row-5"
                  title="Change"
                  trailing={<DivergingMeter value={12} min={-50} max={50} showValue aria-label="Change" />}
                />
              </List>
              <KeyValueList aria-label="Facts">
                <KeyValue label="Trend" value={<Sparkline data={first.trend} aria-label="Trend" />} />
                <KeyValue label="Rating" value={<StarRating readOnly value={4} aria-label="Rating" />} />
                <KeyValue label="Runs" value={<SequenceDots items={first.runs} aria-label="Runs" />} />
                <KeyValue
                  label="Ready"
                  value={<PieIndicator value={35} layout="inline" aria-label="Ready" />}
                />
                <KeyValue
                  label="Change"
                  value={<DivergingMeter value={-30} min={-50} max={50} showValue aria-label="Change" />}
                />
              </KeyValueList>
              <SummaryTile
                title="Orders"
                value="90"
                caption={<Sparkline data={first.trend} variant="area" aria-label="Orders" />}
              />
            </UmbraScope>
          </Card>
        </Columns>
      </Page>
      <Spotlight
        open={tour}
        onOpenChange={setTour}
        target='tr[data-row-key="r:item-2"]'
        title="A row"
        placement="end"
      >
        Each row is one item.
      </Spotlight>
    </AppShell>
  );
}

/**
 * The small tier 2 pieces where data is listed: in the cells of a `DataTable` (with a spotlight on a
 * row), and in a `ListItem`, a `KeyValue` and a `SummaryTile` inside a scope of another density and tint.
 */
export const InData: Story = { render: () => <InDataDemo /> };

const news = [1, 2, 3, 4, 5, 6].map((n) => (
  <HorizontalScroller.Item key={n}>
    <MediaCard
      title={`Story ${n}`}
      description="A short text about what happened."
      image={<Picture />}
      meta="2 h ago"
      actions={
        <>
          <Button size="small">Save</Button>
          <Button size="small">Share</Button>
        </>
      }
    />
  </HorizontalScroller.Item>
));

const scale: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Fair' },
  { from: 70, tone: 'success', label: 'Good' },
];

const saveItems = [
  { id: 'copy', label: 'Save a copy' },
  { id: 'draft', label: 'Save as draft' },
];
const pages = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

const controls = (name: string) => (
  <>
    <SplitButton items={saveItems} onAction={() => {}} size="small">
      Save
    </SplitButton>
    <Stepper options={pages} defaultValue="week" size="small" aria-label={`View, ${name}`} />
    <Slider defaultValue={40} size="small" aria-label={`Zoom, ${name}`} style={{ width: 120 }} />
  </>
);
/** A control inside a component of the app: a row of actions cannot see into it. */
const Wrapped = () => <Stepper options={pages} defaultValue="day" size="small" aria-label="Wrapped" />;

const planner = (label: string) => (
  <Planner
    aria-label={label}
    today={TODAY}
    defaultMonth="2026-10"
    items={october}
    renderWeek={(week) => <Button size="small">Copy week {week.index + 1}</Button>}
    parts={{
      toolbar: (p) => (
        <Planner.Toolbar
          {...p}
          actions={
            <>
              <Button>Copy month</Button>
              <Button>Clear</Button>
              <Wrapped />
            </>
          }
        />
      ),
    }}
  />
);
const week = (label: string) => (
  <WeekStrip aria-label={label} today={TODAY} startDate="2026-10-11" items={thisWeek} />
);

function CompositionsDemo({ globals }: { globals: Globals }) {
  const [bands, setBands] = useState<readonly Threshold[]>(scale);
  const [level, setLevel] = useState(55);
  const [tour, setTour] = useState(false);
  const [saved, setSaved] = useState(0);
  return (
    <UmbraProvider
      density={globals.density}
      context={globals.context}
      locale={globals.direction === 'rtl' ? 'he' : undefined}
      shortcuts={[
        { id: 'app.save', keys: 'Mod+S', label: 'Save the plan', group: 'Plan' },
        { id: 'app.tour', keys: 'Shift+T', label: 'Show the tour', group: 'Plan' },
      ]}
    >
      <AppShell>
        <Page>
          <Stack>
            <Columns>
              <Stack label="Plan">
                <Card title="Plan" padding="none" priority={1} minHeight={300} actions={controls('card')}>
                  {planner('Plan')}
                </Card>
                <Card title="This week" padding="none" priority={2} minHeight={200}>
                  {week('This week')}
                </Card>
              </Stack>
              <Stack label="News">
                <HorizontalScroller aria-label="News" itemWidth={220} size="content">
                  {news}
                </HorizontalScroller>
                <WidgetBoard aria-label="Board" minColumnWidth={200}>
                  {[1, 2, 3].map((n) => (
                    <WidgetBoard.Widget key={n} id={`widget-${n}`} title={`Widget ${n}`}>
                      <MediaCard variant="compact" title={`Story ${n}`} meta="Today" image={<Picture />} />
                    </WidgetBoard.Widget>
                  ))}
                </WidgetBoard>
              </Stack>
              <Card title="One scale (compact, teal)" label="Scale">
                <UmbraScope density="compact" context="teal">
                  <ColorScaleEditor
                    aria-label="Scale"
                    value={bands}
                    defaultValue={scale}
                    onChange={setBands}
                  />
                  <Slider aria-label="Level" value={level} onChange={setLevel} thresholds={bands} showValue />
                  <PieIndicator value={level} thresholds={bands} label="Level" showValue />
                  <Sparkline
                    data={[20, 45, level, 75, 90]}
                    variant="bars"
                    domain={[0, 100]}
                    thresholds={bands}
                    aria-label="Levels"
                  />
                  <div style={{ height: 120 }}>
                    <Heatmap
                      aria-label="Levels by region"
                      columns={['Q1', 'Q2', 'Q3']}
                      rows={['Region 1', 'Region 2']}
                      values={[
                        [10, 45, level],
                        [75, 90, 30],
                      ]}
                      thresholds={bands}
                      legend={false}
                    />
                  </div>
                </UmbraScope>
              </Card>
            </Columns>
            <Stack size="content">
              <ActionBar
                status={`Saved ${saved} times`}
                actions={
                  <>
                    {controls('bar')}
                    <Button shortcut="app.save" onPress={() => setSaved((n) => n + 1)}>
                      Save now
                    </Button>
                    <Button shortcut="app.tour" onPress={() => setTour(true)}>
                      Tour
                    </Button>
                    <ShortcutsSheet trigger={<Button>Keys</Button>} />
                    <Modal trigger={<Button>In a modal</Button>} title="Plan" size="lg">
                      {week('This week, in the modal')}
                      {planner('Plan, in the modal')}
                    </Modal>
                  </>
                }
              />
            </Stack>
          </Stack>
        </Page>
        <Spotlight
          open={tour}
          onOpenChange={setTour}
          target={`[data-umbra="planner"] [data-cell][data-date="${TODAY}"]`}
          title="Today"
        >
          The plan opens on today.
        </Spotlight>
      </AppShell>
    </UmbraProvider>
  );
}

/**
 * Larger pieces together: a `Planner` and a `WeekStrip` in cards of one `Stack` (and in a `Modal`), a
 * `SplitButton`, a `Stepper` and a `Slider` in a card header and an `ActionBar`, `MediaCard`s in a
 * `HorizontalScroller` and a `WidgetBoard`, a `ShortcutsSheet` that lists the buttons' shortcuts, a
 * `Spotlight` on a day, and one `ColorScaleEditor` whose value colours a `Slider`, a `PieIndicator`, a
 * `Sparkline` and a `Heatmap` inside a scope of another density and tint.
 */
export const Compositions: Story = {
  render: (_, { globals }) => <CompositionsDemo globals={globals as Globals} />,
};

/**
 * Content-sized cards in a stack that is too short for everything: they give way (their bodies scroll)
 * before a collapsed card loses any of its header, and a `Comparison` in one keeps its rows. Beside
 * them: a `Sparkline` in the `trend` slot of a `SummaryTile`, and a selected `MediaCard`.
 */
export const ContentCards: Story = {
  render: () => (
    <AppShell>
      <Page>
        <Columns>
          <Stack>
            <Card title="Week" size="content" padding="none">
              {/* One slot a day for two items: the second is the "+1" beside the date. */}
              <WeekStrip
                aria-label="Week"
                today={TODAY}
                startDate="2026-10-11"
                items={thisWeek}
                slotsPerDay={1}
              />
            </Card>
            <Card title="Sites" size="content">
              <Comparison
                aria-label="Site A and Site B"
                sides={[{ name: 'Site A' }, { name: 'Site B' }]}
                showBars
                rows={[
                  { id: 'score', label: 'Score', values: [82, 76] },
                  { id: 'time', label: 'On time', values: [91, 84] },
                  { id: 'returns', label: 'Returns', values: [4, 9], lowerIsBetter: true },
                ]}
              />
            </Card>
            <Card title="Team" padding="none" minHeight={160} priority={2}>
              <List aria-label="Team">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <List.Item key={n} id={`person-${n}`} title={`Person ${n}`} />
                ))}
              </List>
            </Card>
            <Card title="Notes" minHeight={160} priority={1}>
              Collapsed first.
            </Card>
          </Stack>
          <Stack>
            <Stack size="content" style={{ height: 96 }}>
              <SummaryTile
                title="Load"
                value="72%"
                trend={<Sparkline data={[4, 6, 5, 8, 9]} aria-label="Load, five weeks" />}
              />
            </Stack>
            <MediaCard selected title="Story 1" meta="Chosen" image={<Picture />} onPress={() => {}} />
            <MediaCard title="Story 2" meta="Not chosen" image={<Picture />} onPress={() => {}} />
          </Stack>
        </Columns>
      </Page>
    </AppShell>
  ),
};
