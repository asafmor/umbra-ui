import type { Meta, StoryObj } from '@storybook/react-vite';
import { months, plan, actual, quarters, regions, Tile, Tiles } from '../stories/charts';
import { BarChart } from './BarChart';
import { DonutChart } from './DonutChart';
import { Heatmap } from './Heatmap';
import { LineChart } from './LineChart';
import { RadarChart } from './RadarChart';
import { Scatter } from './Scatter';

const meta: Meta = {
  title: 'Charts/Right to left',
  parameters: { frame: 'padded' },
  // A right-to-left locale on the provider: the page, the legends and the cards mirror.
  globals: { direction: 'rtl' },
};
export default meta;
type Story = StoryObj;

const over = (values: number[]) => values.map((y, i) => ({ x: months[i]!, y }));
const channels = [
  { id: 'web', label: 'Web', values: [42, 48, 55, 61] },
  { id: 'phone', label: 'Phone', values: [28, 26, 24, 21] },
];
const axes = ['Speed', 'Quality', 'Cost', 'Reach', 'Support', 'Safety'].map((label) => ({
  id: label.toLowerCase(),
  label,
}));

/**
 * The plot does not mirror: values still grow to the right and upwards, time still runs to the right,
 * and labels stay beside their marks. What is around the plot (the legend, the card) follows the page.
 * A label in a right-to-left script is still drawn in its own direction.
 */
export const AllCharts: Story = {
  render: () => (
    <Tiles columns={2}>
      <Tile title="Line" id="line">
        <LineChart
          aria-label="Orders, plan and actual"
          series={[
            { id: 'plan', label: 'Plan', data: over(plan) },
            { id: 'actual', label: 'Actual', data: over(actual) },
          ]}
          yTitle="Orders"
          xTitle="Month"
          labels
        />
      </Tile>
      <Tile title="Bars, sideways" id="bar">
        <BarChart
          aria-label="Orders by channel"
          orientation="horizontal"
          categories={[...regions.slice(0, 3), 'אזור 4']}
          series={channels}
          labels
          legend="end"
        />
      </Tile>
      <Tile title="Donut" id="donut">
        <DonutChart
          aria-label="Orders by quarter"
          data={quarters.map((label, i) => ({ id: label, label, value: [48, 26, 18, 8][i]! }))}
          labels
          legend="start"
        />
      </Tile>
      <Tile title="Radar" id="radar">
        <RadarChart
          aria-label="Site 1 ratings"
          axes={axes}
          series={[{ id: 'site', label: 'Site 1', values: [14, 13, 11, 11, 13, 14] }]}
          max={20}
          labels
        />
      </Tile>
    </Tiles>
  ),
};

/**
 * The tier 2 charts follow the same rule: the heatmap's columns and the scatter's x axis still run to
 * the right, and the legends and cards around them mirror.
 */
export const HeatmapAndScatter: Story = {
  render: () => (
    <Tiles columns={2}>
      <Tile title="Heatmap" id="heatmap">
        <Heatmap
          aria-label="Orders by region and quarter"
          rows={[...regions.slice(0, 3), 'אזור 4']}
          columns={quarters}
          values={[
            [12, 18, 25, 31],
            [8, 14, 11, 20],
            [22, 27, 35, 40],
            [5, 9, 16, 12],
          ]}
          xTitle="Quarter"
        />
      </Tile>
      <Tile title="Scatter" id="scatter">
        <Scatter
          aria-label="Cost against time"
          series={[
            {
              id: 'a',
              label: 'Group A',
              data: [10, 25, 40, 55].map((x, i) => ({ x, y: 12 + i * 9, label: `Run ${i + 1}` })),
            },
            { id: 'b', label: 'Group B', data: [15, 35, 60].map((x, i) => ({ x, y: 40 - i * 11 })) },
          ]}
          xTitle="Time"
          yTitle="Cost"
          labels
        />
      </Tile>
    </Tiles>
  ),
};
