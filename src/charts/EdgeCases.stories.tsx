import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { DivergingMeter } from '../meters/DivergingMeter';
import { LevelMeter } from '../meters/LevelMeter';
import { PieIndicator } from '../meters/PieIndicator';
import { ProgressBar } from '../meters/ProgressBar';
import { Modal } from '../overlays/Modal';
import { Tile, Tiles } from '../stories/charts';
import { BarChart } from './BarChart';
import { DonutChart } from './DonutChart';
import { Heatmap } from './Heatmap';
import { LineChart } from './LineChart';
import { RadarChart } from './RadarChart';
import { Scatter, type ScatterSeries } from './Scatter';
import { Sparkline } from './Sparkline';

// What the charts and meters do with input an app should not give, at the edges of their scales, and
// with a great many marks. The rule for bad input is in plan/decisions/03-charts.md.
const meta: Meta = {
  title: 'Charts/Edge cases',
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const bad = [10, NaN, Infinity, null, 30, -Infinity, 20];
const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const stack = { display: 'grid', gap: 8, alignContent: 'start' } as const;

/**
 * A value that is not a finite number (`NaN`, `Infinity`, `null`) is "no value": it is left out, and the
 * rest is drawn. A series or segment whose id is already taken is left out too. Each warns in development.
 */
export const InvalidInput: Story = {
  render: () => (
    <Tiles columns={4}>
      <Tile title="LineChart" id="line">
        <LineChart
          aria-label="Line"
          series={[
            { id: 'a', label: 'Orders', data: bad.map((y, i) => ({ x: names[i]!, y })) },
            { id: 'a', label: 'Same id', data: names.map((x) => ({ x, y: 5 })) },
          ]}
        />
      </Tile>
      <Tile title="BarChart" id="bar">
        <BarChart
          aria-label="Bar"
          categories={names}
          series={[
            { id: 'a', label: 'Orders', values: bad },
            { id: 'a', label: 'Same id', values: names.map(() => 5) },
          ]}
        />
      </Tile>
      <Tile title="DonutChart" id="donut">
        <DonutChart
          aria-label="Donut"
          data={[
            { id: 'a', label: 'Region 1', value: 30 },
            { id: 'b', label: 'Region 2', value: NaN },
            { id: 'c', label: 'Region 3', value: Infinity },
            { id: 'a', label: 'Same id', value: 20 },
            { id: 'd', label: 'Region 4', value: 50 },
          ]}
        />
      </Tile>
      <Tile title="RadarChart" id="radar">
        <RadarChart
          aria-label="Radar"
          axes={names.slice(0, 5).map((label) => ({ id: label, label }))}
          series={[
            { id: 'a', label: 'Orders', values: [4, NaN, Infinity, null, 3] },
            { id: 'a', label: 'Same id', values: [1, 1, 1, 1, 1] },
          ]}
        />
      </Tile>
      <Tile title="Heatmap, with two rows and two columns of one name" id="heatmap">
        <Heatmap
          aria-label="Heatmap"
          rows={['A', 'A', 'B']}
          columns={['x', 'y', 'y']}
          values={[
            [Infinity, 1, 2],
            [2, NaN, 3],
            [null, 4, -Infinity],
          ]}
          steps={NaN}
        />
      </Tile>
      <Tile title="Heatmap of points" id="binned">
        <Heatmap
          aria-label="Binned"
          bins={3}
          points={[
            { x: NaN, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: Infinity },
            { x: 3, y: 3, value: NaN },
            { x: 3, y: 2 },
          ]}
        />
      </Tile>
      <Tile title="Scatter" id="scatter">
        <Scatter
          aria-label="Scatter"
          series={[
            {
              id: 'a',
              label: 'Group 1',
              data: [
                { x: 1, y: 1 },
                { x: NaN, y: 2 },
                { x: 3, y: Infinity },
                { x: 5, y: 5, size: NaN },
              ],
            },
            { id: 'a', label: 'Same id', data: [{ x: 2, y: 2 }] },
          ]}
        />
      </Tile>
      <Tile title="Sparkline and meters" id="small">
        <div style={stack}>
          <Sparkline data={bad} interactive />
          <ProgressBar label="Not a number" value={NaN} showValue />
          <ProgressBar label="Infinite" value={Infinity} showValue />
          <LevelMeter label="Infinite level" value={Infinity} showValue />
          <PieIndicator label="Infinite share" value={Infinity} showValue />
          <DivergingMeter label="Infinite change" value={-Infinity} showValue />
        </div>
      </Tile>
    </Tiles>
  ),
};

const under: ScatterSeries[] = [
  { id: 'small', label: 'Small', data: [{ x: 5, y: 5, size: 1, label: 'Small point' }] },
  { id: 'large', label: 'Large', data: [{ x: 5, y: 5, size: 100, label: 'Large bubble' }] },
];
const spread: ScatterSeries[] = [
  { id: 'a', label: 'Group 1', data: [0, 1, 2, 3, 4, 5, 6].map((v) => ({ x: v, y: v, id: `p${v}` })) },
];

/** The ends of a scale: a value below the first band, a point under a bubble, points outside a domain, points on the edge of a plot without axes, and a difference of two fractions. */
export const ScaleEdges: Story = {
  render: () => (
    <Tiles columns={4}>
      <Tile title="A value below the first band" id="below">
        <Heatmap
          aria-label="Below"
          rows={['A', 'B']}
          columns={['x', 'y', 'z']}
          values={[
            [2, 12, 25],
            [5, 15, 40],
          ]}
          thresholds={[
            { from: 10, tone: 'warning', label: 'Busy' },
            { from: 20, tone: 'danger', label: 'Full' },
          ]}
        />
      </Tile>
      <Tile title="A point under a bubble of a later series" id="under">
        <Scatter aria-label="Under" series={under} xDomain={[0, 10]} yDomain={[0, 10]} legend={false} />
      </Tile>
      <Tile title="Points outside the domains" id="outside">
        <Scatter aria-label="Outside" series={spread} xDomain={[2, 4]} yDomain={[2, 4]} />
      </Tile>
      <Tile title="No axes: points on the edge" id="edge">
        <Scatter aria-label="Edge" series={spread} xDomain={[0, 6]} yDomain={[0, 6]} axes={false} />
      </Tile>
      <Tile title="A difference of fractions" id="fraction">
        <DivergingMeter label="Fraction" value={0.3} origin={0.1} min={0} max={1} showValue />
      </Tile>
    </Tiles>
  ),
};

const state = { data: {}, loading: { loading: true }, error: { error: 'Not loaded.' } } as const;

/** The app changes what a chart shows while the keyboard is in it: the focus stays on the chart. */
export const StateChange: Story = {
  render: function Render() {
    const [now, setNow] = useState<keyof typeof state>('data');
    const common = { ...state[now], 'aria-describedby': 'edge-note' };
    const line = [{ id: 'a', label: 'Orders', data: names.map((x, i) => ({ x, y: 10 + i * 3 })) }];
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(Object.keys(state) as (keyof typeof state)[]).map((name) => (
            <Button key={name} data-set={name} onPress={() => setNow(name)}>
              {name}
            </Button>
          ))}
          <span id="edge-note">Figures of this year.</span>
        </div>
        <Tiles columns={4}>
          <Tile title="LineChart" id="line">
            <LineChart aria-label="Line" series={line} {...common} />
          </Tile>
          <Tile title="BarChart" id="bar">
            <BarChart
              aria-label="Bar"
              categories={names}
              series={[{ id: 'a', label: 'Orders', values: [3, 5, 2, 6, 4, 7, 5] }]}
              {...common}
            />
          </Tile>
          <Tile title="DonutChart" id="donut">
            <DonutChart
              aria-label="Donut"
              data={[
                { id: 'a', label: 'Region 1', value: 30 },
                { id: 'b', label: 'Region 2', value: 50 },
              ]}
              {...common}
            />
          </Tile>
          <Tile title="RadarChart" id="radar">
            <RadarChart
              aria-label="Radar"
              axes={names.slice(0, 5).map((label) => ({ id: label, label }))}
              series={[{ id: 'a', label: 'Orders', values: [4, 3, 5, 2, 3] }]}
              {...common}
            />
          </Tile>
          <Tile title="Heatmap" id="heatmap">
            <Heatmap
              aria-label="Heatmap"
              rows={['A', 'B']}
              columns={['x', 'y', 'z']}
              values={[
                [1, 2, 3],
                [4, 5, 6],
              ]}
              {...common}
            />
          </Tile>
          <Tile title="Scatter" id="scatter">
            <Scatter aria-label="Scatter" series={spread} {...common} />
          </Tile>
          <Tile title="Sparkline" id="sparkline">
            <Sparkline
              data={[3, 5, 2, 6, 4]}
              interactive
              loading={now === 'loading'}
              aria-label="Sparkline"
              aria-describedby="edge-note"
            />
          </Tile>
        </Tiles>
      </div>
    );
  },
};

// 5,000 marks each, from fixed arithmetic: every run draws the same.
const many: ScatterSeries[] = [0, 1].map((s) => ({
  id: `g${s}`,
  label: `Group ${s + 1}`,
  data: Array.from({ length: 2500 }, (_, i) => ({
    x: ((i * 37 + s * 11) % 1000) / 10,
    y: ((i * 53 + s * 29) % 997) / 10,
    label: `Point ${s * 2500 + i + 1}`,
  })),
}));
const wide = Array.from({ length: 100 }, (_, i) => `c${i + 1}`);
const tall = Array.from({ length: 50 }, (_, i) => `r${i + 1}`);
const grid = tall.map((_, r) => wide.map((_, c) => (r * 7 + c * 13) % 97));

/** Five thousand marks: the chart still answers a resize and a key within a frame or two. */
export const ManyMarks: Story = {
  render: () => (
    <Tiles columns={2}>
      <Tile title="Scatter: 5,000 points with labels" id="scatter">
        <Scatter aria-label="Many points" series={many} labels />
      </Tile>
      <Tile title="Heatmap: 5,000 cells" id="heatmap">
        <Heatmap aria-label="Many cells" rows={tall} columns={wide} values={grid} />
      </Tile>
    </Tiles>
  ),
};

/** In a modal body beside other content, a chart that fills takes its content height: the body does not scroll. */
export const InModal: Story = {
  render: () => (
    <Modal defaultOpen size="sm" trigger={<Button>Open</Button>} title="Orders">
      <p style={{ margin: 0 }}>The orders of this year, by month.</p>
      <LineChart
        aria-label="Chart in a modal"
        series={[{ id: 'a', label: 'Orders', data: names.map((x, i) => ({ x, y: 10 + i * 3 })) }]}
      />
    </Modal>
  ),
};
