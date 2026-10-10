import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Boxes, Tile, Tiles } from '../stories/charts';
import { Log } from '../stories/placeholders';
import { DonutChart, type DonutSegment } from './DonutChart';
import type { ChartPoint } from './internal/Frame';

const meta: Meta<typeof DonutChart> = {
  title: 'Charts/DonutChart',
  component: DonutChart,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const channels: DonutSegment[] = [
  { id: 'web', label: 'Web', value: 48 },
  { id: 'phone', label: 'Phone', value: 26 },
  { id: 'partner', label: 'Partners', value: 18 },
  { id: 'other', label: 'Other', value: 8 },
];
const thresholds = [
  { from: 0, tone: 'danger' as const },
  { from: 50, tone: 'warning' as const },
  { from: 80, tone: 'success' as const },
];
const row = { display: 'flex', gap: 12, height: '100%' };
const cell = { flex: 1, minWidth: 0 };

/** One value against a total, with tones and thresholds, a gauge, and segments. */
export const Variants: Story = {
  render: () => (
    <Tiles>
      <Tile title="One value" id="single">
        <DonutChart label="Budget used" value={81} centerLabel="of budget" />
      </Tile>
      <Tile title="Tone from thresholds" id="thresholds">
        <div style={row}>
          {[34, 58, 92].map((value) => (
            <div key={value} style={cell}>
              <DonutChart label={`Completion ${value}%`} value={value} thresholds={thresholds} />
            </div>
          ))}
        </div>
      </Tile>
      <Tile title="Gauge, value of a total" id="gauge">
        <DonutChart
          label="Orders shipped"
          value={640}
          max={800}
          startAngle={-120}
          sweep={240}
          tone="info"
          centerValue="640"
          centerLabel="of 800 orders"
        />
      </Tile>
      <Tile title="Segments" id="segments">
        <DonutChart label="Orders by channel" data={channels} centerValue="100" centerLabel="orders" />
      </Tile>
      <Tile title="Segments with direct labels" id="labels">
        <DonutChart label="Orders by channel" data={channels} labels legend={false} />
      </Tile>
      <Tile title="Thick, square ends, no gap" id="thick">
        <div style={row}>
          <div style={cell}>
            <DonutChart label="Capacity used" value={62} thickness={22} roundedCaps={false} tone="warning" />
          </div>
          <div style={cell}>
            <DonutChart label="Orders by channel" data={channels} thickness={30} gap={0} legend={false} />
          </div>
        </div>
      </Tile>
    </Tiles>
  ),
};

/** Loading, no data, and an error with a retry action. */
export const States: Story = {
  render: function Render() {
    const [tries, setTries] = useState(0);
    return (
      <Tiles columns={2}>
        <Tile title="Loading">
          <DonutChart label="Budget used" value={81} loading />
        </Tile>
        <Tile title="Empty">
          <DonutChart label="Orders by channel" data={[]} />
        </Tile>
        <Tile title="Error">
          <DonutChart
            label="Budget used"
            value={81}
            error={`The budget could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
          />
        </Tile>
        <Tile title="Zero and full">
          <div style={row}>
            <div style={cell}>
              <DonutChart label="Nothing used" value={0} />
            </div>
            <div style={cell}>
              <DonutChart label="All used" value={100} tone="success" />
            </div>
          </div>
        </Tile>
      </Tiles>
    );
  },
};

const single = <DonutChart label="Budget used" value={81} centerLabel="of budget" />;
const segments = (
  <DonutChart label="Orders by channel" data={channels} labels centerValue="100" centerLabel="orders" />
);

/** What the ring keeps as its slot shrinks: legend and labels, then the centre caption, then the value. */
export const Shrink: Story = {
  render: () => (
    <Boxes>
      <Box width={320} height={260} note="everything">
        {segments}
      </Box>
      <Box width={190} height={180} note="no legend, no labels">
        {segments}
      </Box>
      <Box width={110} height={100} note="no caption">
        {segments}
      </Box>
      <Box width={56} height={56} note="ring">
        {segments}
      </Box>
      <Box width={220} height={200}>
        {single}
      </Box>
      <Box width={110} height={100}>
        {single}
      </Box>
      <Box width={80} height={80}>
        {single}
      </Box>
      <Box width={48} height={48}>
        {single}
      </Box>
    </Boxes>
  ),
};

/** Hover or focus a segment; arrow keys move between segments; a legend item hides its segment. */
export const Interaction: Story = {
  render: function Render() {
    const [pressed, setPressed] = useState<ChartPoint | null>(null);
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', height: '100%', gap: 8 }}>
        <Log>Pressed: {pressed ? `${pressed.seriesLabel}, ${pressed.value}` : 'nothing'}.</Log>
        <Tiles columns={2}>
          <Tile title="Segments" id="segments">
            <DonutChart label="Orders by channel" data={channels} onPointPress={setPressed} legend="end" />
          </Tile>
          <Tile title="One value" id="single">
            <DonutChart label="Budget used" value={81} onPointPress={setPressed} />
          </Tile>
        </Tiles>
      </div>
    );
  },
};

/** Parts replaced, hidden and wrapped, and the ring composed from its blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Tiles>
      <Tile title="Centre part replaced by a node">
        <DonutChart
          label="Budget used"
          value={81}
          parts={{
            center: (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
                81 / 100
              </text>
            ),
          }}
        />
      </Tile>
      <Tile title="Centre part hidden">
        <DonutChart label="Budget used" value={81} parts={{ center: null }} />
      </Tile>
      <Tile title="Centre part as a function">
        <DonutChart
          label="Budget used"
          value={81}
          centerLabel="of budget"
          parts={{ center: (p) => <DonutChart.Center value={<>≈ {p.value}</>} label={p.label} /> }}
        />
      </Tile>
      <Tile title="Blocks: segments without a track">
        <DonutChart.Root label="Orders by channel" data={channels} legend={false}>
          <DonutChart.Segments />
          <DonutChart.Center value="4" label="channels" />
        </DonutChart.Root>
      </Tile>
      <Tile title="Legend part hidden, tooltip replaced" id="tooltip">
        <DonutChart
          label="Orders by channel"
          data={channels}
          parts={{ legend: null, tooltip: (p) => `${p.title}: ${p.rows[0]?.value}` }}
        />
      </Tile>
      <Tile title="Colours and fills set per segment">
        <DonutChart
          label="Tasks by state"
          data={[
            {
              id: 'done',
              label: 'Done',
              value: 60,
              color: 'var(--umbra-color-semantic-success)',
              marker: 'square',
            },
            {
              id: 'late',
              label: 'Late',
              value: 25,
              color: 'var(--umbra-color-semantic-danger)',
              marker: 'stripes',
            },
            {
              id: 'open',
              label: 'Open',
              value: 15,
              color: 'var(--umbra-color-base-text-secondary)',
              marker: 'dots',
            },
          ]}
        />
      </Tile>
    </Tiles>
  ),
};
