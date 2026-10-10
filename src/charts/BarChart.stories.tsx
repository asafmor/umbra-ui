import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Box, Boxes, months, quarters, regions, Tile, Tiles } from '../stories/charts';
import { Log } from '../stories/placeholders';
import { BarChart, type BarSeries } from './BarChart';
import type { ChartPoint } from './internal/Frame';

const meta: Meta<typeof BarChart> = {
  title: 'Charts/BarChart',
  component: BarChart,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const planActual: BarSeries[] = [
  { id: 'plan', label: 'Plan', values: [120, 135, 150, 160] },
  { id: 'actual', label: 'Actual', values: [112, 141, 147, 171] },
];
const channels: BarSeries[] = [
  { id: 'web', label: 'Web', values: [42, 48, 55, 61] },
  { id: 'phone', label: 'Phone', values: [28, 26, 24, 21] },
  { id: 'partner', label: 'Partners', values: [14, 18, 22, 27] },
];
const flow: BarSeries[] = [
  { id: 'in', label: 'Inbound', values: [14, 22, 18, 9, 4, 0, 6, 12, 19, 24, 16, 8] },
  { id: 'out', label: 'Outbound', values: [3, 0, 6, 14, 21, 26, 17, 9, 4, 0, 5, 11] },
];
const change = [{ id: 'change', label: 'Change', values: [12, -4, 8, -9, 3] }];

/** Every variant: grouped, stacked, diverging, horizontal, and colour by sign or by threshold. */
export const Variants: Story = {
  render: () => (
    <Tiles>
      <Tile title="Grouped, with value labels" id="grouped">
        <BarChart label="Orders, plan and actual" categories={quarters} series={planActual} labels />
      </Tile>
      <Tile title="Stacked" id="stacked">
        <BarChart
          label="Orders by channel"
          categories={quarters}
          series={channels}
          variant="stacked"
          labels
          yTitle="Orders"
        />
      </Tile>
      <Tile title="Diverging" id="diverging">
        <BarChart
          label="Inbound and outbound by month"
          categories={months}
          series={flow}
          variant="diverging"
        />
      </Tile>
      <Tile title="Horizontal" id="horizontal">
        <BarChart
          label="Orders by region, plan and actual"
          orientation="horizontal"
          categories={regions.slice(0, 4)}
          series={planActual}
          labels
        />
      </Tile>
      <Tile title="Colour by sign, with a reference line" id="sign">
        <BarChart
          label="Change against last year, by region"
          categories={regions}
          series={change}
          colorBy="sign"
          labels
          formatValue={(v) => `${v > 0 ? '+' : ''}${v}%`}
          annotations={[{ type: 'line', value: 10, label: 'Goal' }]}
        />
      </Tile>
      <Tile title="Colour by threshold" id="thresholds">
        <BarChart
          label="Completion by region"
          orientation="horizontal"
          categories={regions}
          series={[{ id: 'done', label: 'Completed', values: [92, 71, 48, 85, 33] }]}
          thresholds={[
            { from: 0, color: 'var(--umbra-color-semantic-danger)', marker: 'stripes' },
            { from: 50, color: 'var(--umbra-color-semantic-warning)', marker: 'dots' },
            { from: 80, color: 'var(--umbra-color-semantic-success)', marker: 'square' },
          ]}
          valueDomain={[0, 100]}
          labels
          formatValue={(v) => `${v}%`}
          annotations={[{ type: 'band', from: 80, to: 100, label: 'On track' }]}
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
          <BarChart label="Orders" categories={quarters} series={planActual} loading />
        </Tile>
        <Tile title="Loading, horizontal">
          <BarChart
            label="Orders"
            categories={quarters}
            series={planActual}
            orientation="horizontal"
            loading
          />
        </Tile>
        <Tile title="Empty">
          <BarChart label="Orders" categories={[]} series={[]} empty="No orders in this period." />
        </Tile>
        <Tile title="Error">
          <BarChart
            label="Orders"
            categories={quarters}
            series={planActual}
            error={`The orders could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
          />
        </Tile>
      </Tiles>
    );
  },
};

const full = (orientation?: 'horizontal') => (
  <BarChart
    label="Orders, plan and actual"
    orientation={orientation}
    categories={months.slice(0, 8)}
    series={[
      { id: 'plan', label: 'Plan', values: [40, 44, 48, 52, 56, 60, 64, 68] },
      { id: 'actual', label: 'Actual', values: [42, 48, 45, 53, 60, 58, 66, 71] },
    ]}
    variant="stacked"
    labels
    xTitle={orientation ? 'Orders' : 'Month'}
    yTitle={orientation ? 'Month' : 'Orders'}
  />
);

/** What the chart keeps as its slot shrinks: legend, then value labels, then axis titles, then the axes. */
export const Shrink: Story = {
  render: () => (
    <Boxes>
      <Box width={420} height={270} note="everything">
        {full()}
      </Box>
      <Box width={330} height={230} note="no legend">
        {full()}
      </Box>
      <Box width={270} height={180} note="no value labels">
        {full()}
      </Box>
      <Box width={210} height={140} note="no axis titles, fewer ticks">
        {full()}
      </Box>
      <Box width={140} height={80} note="no axes">
        {full()}
      </Box>
      <Box width={330} height={230} note="horizontal">
        {full('horizontal')}
      </Box>
      <Box width={210} height={120} note="horizontal">
        {full('horizontal')}
      </Box>
    </Boxes>
  ),
};

/** Hover or focus a bar; arrow keys move between bars; a legend item hides its series. */
export const Interaction: Story = {
  render: function Render() {
    const [pressed, setPressed] = useState<ChartPoint | null>(null);
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', height: '100%', gap: 8 }}>
        <Log>
          Pressed: {pressed ? `${pressed.seriesLabel}, ${String(pressed.x)}, ${pressed.value}` : 'nothing'}.
        </Log>
        <Tiles columns={2}>
          <Tile title="Vertical" id="vertical">
            <BarChart
              label="Orders, plan and actual"
              categories={quarters}
              series={planActual}
              onPointPress={setPressed}
            />
          </Tile>
          <Tile title="Horizontal" id="horizontal">
            <BarChart
              label="Orders by channel"
              orientation="horizontal"
              categories={quarters}
              series={channels}
              onPointPress={setPressed}
            />
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
      <Tile title="Legend on top">
        <BarChart label="Orders by channel" categories={quarters} series={channels} legend="top" />
      </Tile>
      <Tile title="Legend part hidden, markers set per series">
        <BarChart
          label="Orders, plan and actual"
          categories={quarters}
          series={[
            { ...planActual[0]!, marker: 'dots', color: 'var(--umbra-color-base-text-secondary)' },
            { ...planActual[1]!, marker: 'square' },
          ]}
          parts={{ legend: null }}
        />
      </Tile>
      <Tile title="Tooltip part as a function" id="tooltip">
        <BarChart
          label="Orders by channel"
          categories={quarters}
          series={channels}
          variant="stacked"
          parts={{ tooltip: (p) => `${p.title}: ${p.rows.find((r) => r.active)?.value}` }}
        />
      </Tile>
      <Tile title="Blocks: bars and axes only">
        <BarChart.Root
          label="Orders, plan and actual"
          categories={quarters}
          series={planActual}
          legend={false}
        >
          <BarChart.Bars />
          <BarChart.Axes />
        </BarChart.Root>
      </Tile>
      <Tile title="Blocks: labels without a grid">
        <BarChart.Root
          label="Orders by channel"
          categories={quarters}
          series={channels}
          variant="stacked"
          labels
        >
          <BarChart.Bars />
          <BarChart.Axes />
          <BarChart.ValueLabels />
        </BarChart.Root>
      </Tile>
      <Tile title="Error part replaced">
        <BarChart
          label="Orders"
          categories={quarters}
          series={planActual}
          error="Failed"
          parts={{ error: (p) => <strong role="alert">Could not load: {p.children}</strong> }}
        />
      </Tile>
    </Tiles>
  ),
};
