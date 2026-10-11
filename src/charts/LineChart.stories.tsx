import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { actual, Box, Boxes, months, plan, Tile, Tiles } from '../stories/charts';
import { Log } from '../stories/placeholders';
import type { ChartPoint } from './internal/Frame';
import { LineChart, type LineSeries } from './LineChart';

const meta: Meta<typeof LineChart> = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const over = (values: (number | null)[]) => values.map((y, i) => ({ x: months[i]!, y }));
const planActual: LineSeries[] = [
  { id: 'plan', label: 'Plan', data: over(plan) },
  { id: 'actual', label: 'Actual', data: over(actual) },
];
// A running total over 45 minutes, held between events.
const running = (id: string, label: string, steps: [number, number][]): LineSeries => ({
  id,
  label,
  data: [[0, 0] as [number, number], ...steps, [45, steps.at(-1)![1]] as [number, number]].map(([x, y]) => ({
    x,
    y,
  })),
});
const levels = ['Tier C', 'Tier B', 'Tier A'];
const moved = 'var(--umbra-color-semantic-success)';
const dropped = 'var(--umbra-color-semantic-danger)';
const history: LineSeries[] = [
  {
    id: 'level',
    label: 'Service level',
    color: 'var(--umbra-color-base-text-secondary)',
    data: [
      { x: '2014', y: 'Tier C' },
      { x: '2015', y: 'Tier C' },
      { x: '2016', y: 'Tier B', color: moved, marker: 'triangle' },
      { x: '2017', y: 'Tier B' },
      { x: '2018', y: 'Tier B' },
      { x: '2019', y: 'Tier C', color: dropped, marker: 'diamond' },
      { x: '2020', y: 'Tier B', color: moved, marker: 'triangle' },
      { x: '2021', y: 'Tier B' },
      { x: '2022', y: 'Tier A', color: moved, marker: 'triangle' },
      { x: '2023', y: 'Tier A' },
      { x: '2024', y: 'Tier A' },
    ],
  },
];
const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n * 7));
const weekly: LineSeries[] = [
  { id: 'r1', label: 'Region 1', data: [30, 34, 33, 38, 44, 47, 52, 58].map((y, i) => ({ x: day(i), y })) },
  { id: 'r2', label: 'Region 2', data: [22, 21, 26, 25, 29, 28, 33, 31].map((y, i) => ({ x: day(i), y })) },
  { id: 'r3', label: 'Region 3', data: [12, 15, 14, 18, 17, 21, 20, 24].map((y, i) => ({ x: day(i), y })) },
];

/** Every variant: curves, an ordinal y axis, area, missing values, a time axis and annotations. */
export const Variants: Story = {
  render: () => (
    <Tiles>
      <Tile title="Plan and actual" id="plan">
        <LineChart
          aria-label="Orders, plan and actual"
          series={planActual}
          yTitle="Orders"
          annotations={[{ type: 'line', value: 75, label: 'Target' }]}
        />
      </Tile>
      <Tile title="Step lines" id="step">
        <LineChart
          aria-label="Running total, two teams"
          curve="step"
          points={false}
          series={[
            running('a', 'Team A', [
              [6, 0.1],
              [14, 0.45],
              [22, 0.5],
              [37, 0.72],
            ]),
            running('b', 'Team B', [
              [9, 0.05],
              [30, 0.15],
            ]),
          ]}
          xTitle="Minutes"
          annotations={[{ type: 'line', axis: 'x', value: 22.5, label: 'Half-way' }]}
        />
      </Tile>
      <Tile title="Ordinal levels" id="ordinal">
        <LineChart aria-label="Service level by year" series={history} yLevels={levels} />
      </Tile>
      <Tile title="Smooth area" id="area">
        <LineChart
          aria-label="Orders by month"
          curve="smooth"
          area
          series={[{ id: 'orders', label: 'Orders', data: over(actual) }]}
        />
      </Tile>
      <Tile title="Missing values" id="missing">
        <LineChart
          aria-label="Readings with gaps"
          series={[
            {
              id: 's1',
              label: 'Sensor 1',
              data: over([12, 14, null, null, 19, 22, 21, null, 25, null, 28, 30]),
            },
            { id: 's2', label: 'Sensor 2', data: over([8, 9, 11, 10, null, 13, 15, 14, 16, 18, 17, 19]) },
          ]}
        />
      </Tile>
      <Tile title="Time axis, direct labels" id="time">
        <LineChart
          aria-label="Weekly orders by region"
          series={weekly}
          labels
          legend={false}
          annotations={[{ type: 'band', from: 20, to: 35, label: 'Expected range' }]}
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
          <LineChart aria-label="Orders" series={planActual} loading />
        </Tile>
        <Tile title="Empty">
          <LineChart aria-label="Orders" series={[]} />
        </Tile>
        <Tile title="Error">
          <LineChart
            aria-label="Orders"
            series={planActual}
            error={`The orders could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
            retryLabel="Try again"
          />
        </Tile>
        <Tile title="Empty, with the app's own text">
          <LineChart aria-label="Orders" series={[]} empty="No orders in this period." />
        </Tile>
      </Tiles>
    );
  },
};

const full = (
  <LineChart aria-label="Orders, plan and actual" series={planActual} labels xTitle="Month" yTitle="Orders" />
);

/** What the chart keeps as its slot shrinks: legend, then labels, then axis titles, then the axes. */
export const Shrink: Story = {
  render: () => (
    <Boxes>
      <Box width={420} height={270} note="everything">
        {full}
      </Box>
      <Box width={330} height={230} note="no legend">
        {full}
      </Box>
      <Box width={270} height={180} note="no labels">
        {full}
      </Box>
      <Box width={210} height={140} note="no axis titles, fewer ticks">
        {full}
      </Box>
      <Box width={140} height={80} note="no axes">
        {full}
      </Box>
    </Boxes>
  ),
};

/** Hover or focus a point; arrow keys move between points; a legend item hides its series. */
export const Interaction: Story = {
  render: function Render() {
    const [pressed, setPressed] = useState<ChartPoint | null>(null);
    const [hidden, setHidden] = useState<string[]>([]);
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', height: '100%', gap: 8 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Button size="small" onPress={() => setHidden([])}>
            Show all
          </Button>
          <Log>
            Pressed: {pressed ? `${pressed.seriesLabel}, ${String(pressed.x)}, ${pressed.value}` : 'nothing'}.
            Hidden: {hidden.join(', ') || 'none'}.
          </Log>
        </div>
        <Tiles columns={2}>
          <Tile title="Controlled" id="controlled">
            <LineChart
              aria-label="Orders, plan and actual"
              series={planActual}
              hiddenIds={hidden}
              onHiddenChange={setHidden}
              onPointPress={setPressed}
              formatValue={(v) => `${v} orders`}
            />
          </Tile>
          <Tile title="Uncontrolled, one series hidden at first" id="uncontrolled">
            <LineChart
              aria-label="Weekly orders by region"
              series={weekly}
              defaultHiddenIds={['r3']}
              legend="top"
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
      <Tile title="Legend replaced by a node">
        <LineChart
          aria-label="Orders, plan and actual"
          series={planActual}
          legend={<span style={{ font: 'var(--umbra-font-label)' }}>Solid: plan. Dashed: actual.</span>}
        />
      </Tile>
      <Tile title="Legend at the side">
        <LineChart aria-label="Orders, plan and actual" series={planActual} legend="end" />
      </Tile>
      <Tile title="Tooltip part as a function" id="tooltip">
        <LineChart
          aria-label="Orders, plan and actual"
          series={planActual}
          parts={{
            legend: null,
            tooltip: (p) => (
              <>
                <b>{p.title}</b>: {p.rows.map((r) => `${r.label} ${r.value}`).join(' · ')}
              </>
            ),
          }}
        />
      </Tile>
      <Tile title="Blocks: lines only, with the app's own mark">
        <LineChart.Root aria-label="Orders, plan and actual" series={planActual} legend={false}>
          <LineChart.Series />
          <LineChart.Axes />
          <circle cx="50%" cy="20%" r="5" fill="var(--umbra-color-fixed-accent-text)" />
        </LineChart.Root>
      </Tile>
      <Tile title="Blocks: grid over the lines">
        <LineChart.Root aria-label="Orders, plan and actual" series={planActual} area legend={false}>
          <LineChart.Series />
          <LineChart.Grid />
          <LineChart.Axes />
        </LineChart.Root>
      </Tile>
      <Tile title="Empty part replaced">
        <LineChart aria-label="Orders" series={[]} parts={{ empty: <em>Nothing to draw yet.</em> }} />
      </Tile>
    </Tiles>
  ),
};
