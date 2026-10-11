import type { Meta, StoryObj } from '@storybook/react-vite';
import { SummaryTile } from '../data/SummaryTile';
import { Card } from '../layout/Card';
import { Panel } from '../meters/storyKit';
import { Modal } from '../overlays/Modal';
import { UmbraScope } from '../provider/UmbraProvider';
import { months } from '../stories/charts';
import { DataTable, numberColumn, type DataTableColumn } from '../table/DataTable';
import type { Threshold } from '../utils/thresholds';
import { Sparkline, sparklineColumn } from './Sparkline';

const meta: Meta<typeof Sparkline> = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const run = [42, 48, 45, 53, 60, 58, 66, 71, 69, 78, 84, 90];
const dip = [64, 61, 66, 58, 49, 52, 44, 47, 41, 38, 43, 36];
const scores = [6.4, 7.1, 5.2, 8.3, 6.9];
const outcomes = [1, 1, -1, 0, 1, -1, -1, 1, 1, 1];
const bands: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Poor' },
  { from: 6, tone: 'warning', label: 'Fair' },
  { from: 7, tone: 'success', label: 'Good' },
];

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 'var(--umbra-space-4)',
  alignItems: 'start',
} as const;
const list = { display: 'grid', gap: 'var(--umbra-space-3)' } as const;

function Sample({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      data-sample={title}
      style={{ display: 'grid', gridTemplateColumns: '11rem minmax(0, 1fr)', alignItems: 'center' }}
    >
      <span style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}>
        {title}
      </span>
      {children}
    </div>
  );
}

/** The four variants and their options: markers, a reference, thresholds, tones and curves. */
export const Variants: Story = {
  render: () => (
    <div style={grid}>
      <Panel title="Line and area">
        <div style={list}>
          <Sample title="Line">
            <Sparkline data={run} />
          </Sample>
          <Sample title="Last point">
            <Sparkline data={run} lastPoint />
          </Sample>
          <Sample title="Lowest and highest">
            <Sparkline data={dip} extremes tone="warning" />
          </Sample>
          <Sample title="Area">
            <Sparkline data={run} variant="area" />
          </Sample>
          <Sample title="Smooth, step">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--umbra-space-3)' }}>
              <Sparkline data={dip} curve="smooth" />
              <Sparkline data={dip} curve="step" />
            </div>
          </Sample>
        </div>
      </Panel>
      <Panel title="Bars">
        <div style={list}>
          <Sample title="Bars">
            <Sparkline data={scores} variant="bars" domain={[0, 10]} />
          </Sample>
          <Sample title="By threshold">
            <Sparkline data={scores} variant="bars" domain={[0, 10]} thresholds={bands} />
          </Sample>
          <Sample title="Below zero">
            <Sparkline data={[4, 7, -3, 5, -6, 2, 8]} variant="bars" tone="info" />
          </Sample>
          <Sample title="Signed: a run of outcomes">
            <Sparkline data={outcomes} variant="signed" />
          </Sample>
        </div>
      </Panel>
      <Panel title="Reference, tones, height">
        <div style={list}>
          <Sample title="Reference line">
            <Sparkline data={run} reference={60} lastPoint />
          </Sample>
          <Sample title="Reference band">
            <Sparkline data={dip} reference={[45, 60]} />
          </Sample>
          <Sample title="Last point by threshold">
            <Sparkline data={[5, 5.6, 6.2, 6.8, 7.4]} domain={[0, 10]} thresholds={bands} lastPoint />
          </Sample>
          <Sample title="Tone, colour">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--umbra-space-3)' }}>
              <Sparkline data={run} tone="success" />
              <Sparkline data={run} color="var(--umbra-color-series-5)" />
            </div>
          </Sample>
          <Sample title="40px high">
            <Sparkline data={run} variant="area" style={{ height: 40 }} />
          </Sample>
        </div>
      </Panel>
    </div>
  ),
};

/** Loading, no values, one value, and missing values. */
export const States: Story = {
  render: () => (
    <Panel title="States" style={{ maxWidth: 420 }}>
      <div style={list}>
        <Sample title="Loading">
          <Sparkline data={run} loading aria-label="Orders" />
        </Sample>
        <Sample title="No values">
          <Sparkline data={[]} />
        </Sample>
        <Sample title="Only missing values">
          <Sparkline data={[null, null]} emptyLabel="n/a" noValueLabel="Not measured" />
        </Sample>
        <Sample title="One value">
          <Sparkline data={[42]} />
        </Sample>
        <Sample title="Missing values">
          <Sparkline data={[42, 48, null, 53, null, 58, null, null, 69, 78]} />
        </Sample>
        <Sample title="Missing, as bars">
          <Sparkline data={[42, 48, null, 53, null, 58, null, null, 69, 78]} variant="bars" />
        </Sample>
        <Sample title="All the same">
          <Sparkline data={[5, 5, 5, 5]} />
        </Sample>
      </div>
    </Panel>
  ),
};

interface Item {
  id: string;
  name: string;
  orders: number;
  trend: number[];
  scores: (number | null)[];
  outcomes: number[];
}
const items: Item[] = [
  { id: 'i1', name: 'Item 1', orders: 90, trend: run, scores: [6.4, 7.1, 5.2, 8.3, 6.9], outcomes },
  {
    id: 'i2',
    name: 'Item 2',
    orders: 36,
    trend: dip,
    scores: [7.4, 7.9, 8.1, 6.6, 7.2],
    outcomes: [-1, -1, 0, 1, -1],
  },
  {
    id: 'i3',
    name: 'Item 3',
    orders: 58,
    trend: [50, 52, 49, 55, 57, 54, 58],
    scores: [5.1, null, 4.8],
    outcomes: [1, 0, 0, 1],
  },
  { id: 'i4', name: 'Item 4', orders: 0, trend: [], scores: [], outcomes: [] },
];
const columns: DataTableColumn<Item>[] = [
  { id: 'name', header: 'Name', accessor: 'name', rowHeader: true, sortable: true },
  numberColumn({ id: 'orders', header: 'Orders', accessor: 'orders', sortable: true }),
  sparklineColumn({
    id: 'trend',
    header: 'Trend',
    values: (item) => item.trend,
    sparkline: { lastPoint: true },
    sortable: true,
    width: 120,
  }),
  sparklineColumn({
    id: 'scores',
    header: 'Last scores',
    values: (item) => item.scores,
    sparkline: { variant: 'bars', domain: [0, 10], thresholds: bands },
  }),
  sparklineColumn({
    id: 'outcomes',
    header: 'Outcomes',
    values: (item) => item.outcomes,
    sparkline: (item) => ({ variant: 'signed', 'aria-label': `Outcomes of ${item.name}` }),
  }),
];

/** `sparklineColumn` makes a `DataTable` column of sparklines; the column sorts by the last value. */
export const InTable: Story = {
  render: () => (
    <Card title="Items" padding="none" style={{ maxWidth: 720, height: '100%' }}>
      <DataTable aria-label="Items" data={items} getRowId={(item) => item.id} columns={columns} />
    </Card>
  ),
};

/** `SummaryTile` takes any node: a sparkline as its caption shows where the value came from. */
export const InSummaryTile: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 240px))',
        gap: 'var(--umbra-space-4)',
      }}
    >
      <SummaryTile title="Orders" value="90" caption={<Sparkline data={run} variant="area" lastPoint />} />
      <SummaryTile title="Returns" value="36" caption={<Sparkline data={dip} tone="warning" extremes />} />
      <SummaryTile
        title="Scores"
        value="6.9"
        caption={<Sparkline data={scores} variant="bars" domain={[0, 10]} thresholds={bands} />}
      />
    </div>
  ),
};

/** `interactive`: a tab stop; hover, focus and the arrow keys show the nearest value in a tooltip. */
export const Interactive: Story = {
  render: () => (
    <Panel title="Orders by month" style={{ maxWidth: 420 }}>
      <div style={list}>
        <Sample title="Line">
          <Sparkline data={run} labels={months} interactive lastPoint formatValue={(v) => `${v} orders`} />
        </Sample>
        <Sample title="Bars">
          <Sparkline data={scores} variant="bars" domain={[0, 10]} thresholds={bands} interactive />
        </Sample>
        <Sample title="A summary of the app's own">
          <Sparkline
            data={dip}
            formatSummary={(s, format) => `From ${format(s.first)} to ${format(s.last)}, ${s.trend}`}
            formatValue={(v) => `${v}%`}
          />
        </Sample>
      </div>
    </Panel>
  ),
};

/** Inside a modal the tooltip opens in the modal's layer. */
export const InModal: Story = {
  render: () => (
    <Modal defaultOpen size="sm" title="Orders" footer={<Modal.Close>Close</Modal.Close>}>
      <Sparkline data={run} labels={months} interactive />
    </Modal>
  ),
};

/** The page is right to left: like the charts, the drawing does not mirror, and the run still reads left to right. */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  render: () => (
    <Panel title="Sparkline" style={{ maxWidth: 420 }}>
      <div style={list}>
        <Sample title="Line">
          <Sparkline data={run} lastPoint />
        </Sample>
        <Sample title="Bars">
          <Sparkline data={scores} variant="bars" domain={[0, 10]} />
        </Sample>
      </div>
    </Panel>
  ),
};

/** Tokens, every kind of part, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <div style={grid}>
      <UmbraScope
        tokens={{
          'sparkline-height': '32px',
          'sparkline-color': 'var(--umbra-color-value-ramp-5)',
          'sparkline-line-width': '3px',
          'sparkline-marker': 'var(--umbra-color-semantic-warning)',
        }}
      >
        <Panel title="Tokens">
          <Sparkline data={run} lastPoint />
        </Panel>
      </UmbraScope>
      <Panel title="Parts">
        <div style={list}>
          <Sample title="A node replaces the reference">
            <Sparkline
              data={run}
              parts={{
                reference: (
                  <line x1="0" x2="100%" y1="50%" y2="50%" stroke="var(--umbra-color-semantic-warning)" />
                ),
              }}
            />
          </Sample>
          <Sample title="null hides the markers">
            <Sparkline data={run} lastPoint extremes parts={{ markers: null }} />
          </Sample>
          <Sample title="A function wraps the marks">
            <Sparkline
              data={run}
              parts={{
                marks: () => (
                  <g opacity="0.5">
                    <Sparkline.Marks />
                  </g>
                ),
              }}
            />
          </Sample>
          <Sample title="A replaced skeleton">
            <Sparkline data={run} loading aria-label="Orders" parts={{ skeleton: <span>Loading…</span> }} />
          </Sample>
        </div>
      </Panel>
      <Panel title="Blocks, composed by hand">
        <Sparkline.Root data={dip} variant="area" lastPoint reference={50}>
          <Sparkline.Marks />
          <Sparkline.Reference />
          <Sparkline.Markers />
        </Sparkline.Root>
      </Panel>
    </div>
  ),
};
