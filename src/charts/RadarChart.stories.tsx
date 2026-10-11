import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Boxes, Tile, Tiles } from '../stories/charts';
import { Log } from '../stories/placeholders';
import type { ChartPoint } from './internal/Frame';
import { RadarChart, type RadarAxis, type RadarSeries } from './RadarChart';

const meta: Meta<typeof RadarChart> = {
  title: 'Charts/RadarChart',
  component: RadarChart,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const axes: RadarAxis[] = [
  'Speed',
  'Quality',
  'Cost',
  'Reach',
  'Support',
  'Safety',
  'Growth',
  'Reliability',
].map((label) => ({ id: label.toLowerCase(), label }));
const six = axes.slice(0, 6);
const site: RadarSeries = { id: 'site', label: 'Site 1', values: [14, 13, 11, 11, 13, 14, 14, 13] };
const regions: RadarSeries[] = [
  { id: 'a', label: 'Region 1', values: [16, 12, 9, 14, 11, 15] },
  { id: 'b', label: 'Region 2', values: [10, 15, 14, 8, 16, 11] },
  { id: 'c', label: 'Region 3', values: [7, 9, 17, 12, 8, 13] },
];

/** One series with its values printed, several series, both grids, and per-axis maximums. */
export const Variants: Story = {
  render: () => (
    <Tiles>
      <Tile title="One series, values on the labels" id="single">
        <RadarChart aria-label="Site 1 ratings" axes={axes} series={[site]} max={20} rings={2} labels />
      </Tile>
      <Tile title="Several series" id="several">
        <RadarChart aria-label="Region ratings" axes={six} series={regions} max={20} />
      </Tile>
      <Tile title="Circle grid" id="circle">
        <RadarChart
          aria-label="Region ratings"
          axes={six}
          series={regions.slice(0, 2)}
          max={20}
          grid="circle"
          rings={4}
        />
      </Tile>
      <Tile title="Outlines only" id="outline">
        <RadarChart
          aria-label="Region ratings"
          axes={six}
          series={regions.slice(0, 2)}
          max={20}
          filled={false}
        />
      </Tile>
      <Tile title="A maximum per axis" id="max">
        <RadarChart
          aria-label="Site 1 against its limits"
          labels
          axes={[
            { id: 'orders', label: 'Orders', max: 500 },
            { id: 'staff', label: 'Staff', max: 40 },
            { id: 'rating', label: 'Rating', max: 10 },
            { id: 'hours', label: 'Hours', max: 2000 },
            { id: 'sites', label: 'Sites', max: 12 },
          ]}
          series={[{ id: 'site', label: 'Site 1', values: [410, 28, 7.5, 1250, 9] }]}
        />
      </Tile>
      <Tile title="Three axes, turned" id="three">
        <RadarChart
          aria-label="Plan and actual"
          axes={axes.slice(0, 3)}
          startAngle={60}
          max={20}
          series={[
            { id: 'plan', label: 'Plan', values: [15, 15, 15] },
            { id: 'actual', label: 'Actual', values: [18, 11, 14] },
          ]}
        />
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
          <RadarChart aria-label="Region ratings" axes={six} series={regions} loading />
        </Tile>
        <Tile title="Empty">
          <RadarChart aria-label="Region ratings" axes={six} series={[]} />
        </Tile>
        <Tile title="Error">
          <RadarChart
            aria-label="Region ratings"
            axes={six}
            series={regions}
            error={`The ratings could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
          />
        </Tile>
        <Tile title="Missing values sit at the centre">
          <RadarChart
            aria-label="Region ratings"
            axes={six}
            max={20}
            series={[{ id: 'a', label: 'Region 1', values: [16, null, 9, 14, null, 15] }]}
          />
        </Tile>
      </Tiles>
    );
  },
};

const full = <RadarChart aria-label="Site 1 ratings" axes={axes} series={[site]} max={20} labels legend />;

/** What the chart keeps as its slot shrinks: legend, then the values, then the axis labels. */
export const Shrink: Story = {
  render: () => (
    <Boxes>
      <Box width={380} height={300} note="everything">
        {full}
      </Box>
      <Box width={280} height={230} note="no legend">
        {full}
      </Box>
      <Box width={210} height={170} note="no values">
        {full}
      </Box>
      <Box width={140} height={120} note="no labels">
        {full}
      </Box>
      <Box width={56} height={56} note="mark">
        {full}
      </Box>
      <Box width={230} height={200} note="long labels truncate">
        <RadarChart
          aria-label="Ratings"
          axes={['Customer satisfaction', 'Delivery reliability', 'Cost per order', 'Response time'].map(
            (l) => ({
              id: l,
              label: l,
            }),
          )}
          series={[{ id: 's', label: 'Site 1', values: [14, 12, 9, 16] }]}
          max={20}
          startAngle={45}
        />
      </Box>
    </Boxes>
  ),
};

/** Hover or focus a value; arrow keys move around the axes and between series. */
export const Interaction: Story = {
  render: function Render() {
    const [pressed, setPressed] = useState<ChartPoint | null>(null);
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', height: '100%', gap: 8 }}>
        <Log>
          Pressed: {pressed ? `${pressed.seriesLabel}, ${String(pressed.x)}, ${pressed.value}` : 'nothing'}.
        </Log>
        <Tiles columns={2}>
          <Tile title="Several series" id="several">
            <RadarChart
              aria-label="Region ratings"
              axes={six}
              series={regions}
              max={20}
              onPointPress={setPressed}
            />
          </Tile>
          <Tile title="One series" id="single">
            <RadarChart aria-label="Site 1 ratings" axes={axes} series={[site]} max={20} labels />
          </Tile>
        </Tiles>
      </div>
    );
  },
};

/** Parts replaced, hidden and wrapped, and the chart composed from its blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Tiles>
      <Tile title="Legend at the side">
        <RadarChart aria-label="Region ratings" axes={six} series={regions} max={20} legend="end" />
      </Tile>
      <Tile title="Legend part hidden">
        <RadarChart
          aria-label="Region ratings"
          axes={six}
          series={regions}
          max={20}
          parts={{ legend: null }}
        />
      </Tile>
      <Tile title="Tooltip part as a function" id="tooltip">
        <RadarChart
          aria-label="Region ratings"
          axes={six}
          series={regions}
          max={20}
          parts={{ tooltip: (p) => `${p.title}: ${p.rows.map((r) => r.value).join(' / ')}` }}
        />
      </Tile>
      <Tile title="Blocks: no axis labels">
        <RadarChart.Root aria-label="Region ratings" axes={six} series={regions.slice(0, 1)} max={20}>
          <RadarChart.Grid rings={5} shape="circle" />
          <RadarChart.Series />
        </RadarChart.Root>
      </Tile>
      <Tile title="Blocks: the app's own ring">
        <RadarChart.Root
          aria-label="Region ratings"
          axes={six}
          series={regions.slice(0, 2)}
          max={20}
          legend={false}
        >
          <RadarChart.Grid rings={1} />
          <circle cx="50%" cy="50%" r="3" fill="var(--umbra-color-fixed-accent-text)" />
          <RadarChart.Series filled={false} />
          <RadarChart.AxisLabels />
        </RadarChart.Root>
      </Tile>
      <Tile title="Legend replaced by a node">
        <RadarChart
          aria-label="Region ratings"
          axes={six}
          series={regions.slice(0, 2)}
          max={20}
          legend={<span style={{ font: 'var(--umbra-font-label)' }}>Region 1 against Region 2</span>}
        />
      </Tile>
    </Tiles>
  ),
};
