import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { UmbraScope } from '../provider/UmbraProvider';
import { Blob, FloorPlan } from '../stories/backdrops';
import { Box, Boxes, Tile, Tiles } from '../stories/charts';
import { Log } from '../stories/placeholders';
import { Scatter, type ScatterSeries } from './Scatter';

const meta: Meta<typeof Scatter> = {
  title: 'Charts/Scatter',
  component: Scatter,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

// Fixed numbers, so every run draws the same.
const cloud = (count: number, seed: number, dx: number, dy: number) =>
  Array.from({ length: count }, (_, i) => ({
    x: dx + ((i * seed) % 41),
    y: dy + ((i * (seed + 6)) % 37),
  }));
const groups: ScatterSeries[] = [
  { id: 'a', label: 'Group A', data: cloud(14, 17, 5, 10) },
  { id: 'b', label: 'Group B', data: cloud(12, 23, 40, 45) },
  { id: 'c', label: 'Group C', data: cloud(9, 29, 55, 8) },
];
const sites: ScatterSeries[] = [
  {
    id: 'north',
    label: 'North',
    data: [
      { id: 'site-1', label: 'Site 1', x: 12, y: 64, size: 40 },
      { id: 'site-2', label: 'Site 2', x: 28, y: 38, size: 90 },
      { id: 'site-3', label: 'Site 3', x: 31, y: 41, size: 15 },
      { id: 'site-4', label: 'Site 4', x: 55, y: 72, size: 60 },
    ],
  },
  {
    id: 'south',
    label: 'South',
    data: [
      { id: 'site-5', label: 'Site 5', x: 44, y: 22, size: 25 },
      { id: 'site-6', label: 'Site 6', x: 70, y: 48, size: 120 },
      { id: 'site-7', label: 'Site 7', x: 86, y: 30, size: 50 },
    ],
  },
];
const places: ScatterSeries[] = [
  {
    id: 'team',
    label: 'Team 1',
    data: [
      [14, 30],
      [30, 12],
      [30, 48],
      [48, 30],
      [62, 14],
      [62, 46],
      [80, 30],
    ].map(([x, y], i) => ({ id: `p${i + 1}`, label: String(i + 1), x: x!, y: y! })),
  },
];
const day = (n: number) => new Date(Date.UTC(2026, 0, n));
const visits: ScatterSeries[] = [
  {
    id: 'web',
    label: 'Web',
    data: [2, 5, 9, 12, 16, 21, 27].map((n, i) => ({ x: day(n), y: 20 + ((i * 13) % 30) })),
  },
  {
    id: 'phone',
    label: 'Phone',
    data: [3, 7, 11, 18, 24].map((n, i) => ({ x: day(n), y: 8 + ((i * 9) % 20) })),
  },
];

/** Several series, bubbles, point labels, reference lines and bands, a time axis, and one series. */
export const Variants: Story = {
  render: () => (
    <Tiles>
      <Tile title="Three series" id="series">
        <Scatter aria-label="Cost against time, by group" series={groups} xTitle="Time" yTitle="Cost" />
      </Tile>
      <Tile title="Bubbles, with labels" id="bubbles">
        <Scatter
          aria-label="Sites by distance, score and orders"
          series={sites}
          xTitle="Distance"
          yTitle="Score"
          sizeLabel="Orders"
          xDomain={[0, 100]}
          yDomain={[0, 80]}
          labels
        />
      </Tile>
      <Tile title="Reference line and band" id="annotations">
        <Scatter
          aria-label="Cost against time"
          series={groups.slice(0, 2)}
          annotations={[
            { type: 'line', value: 40, label: 'Budget' },
            { type: 'band', axis: 'x', from: 20, to: 35, label: 'Target' },
          ]}
        />
      </Tile>
      <Tile title="Dates on the x axis" id="time">
        <Scatter aria-label="Visits by day" series={visits} yTitle="Visits" />
      </Tile>
      <Tile title="One series, formatted values" id="one">
        <Scatter
          aria-label="Cost against time"
          series={groups.slice(0, 1)}
          formatValue={(v) => `${v} k`}
          formatX={(x) => `${+x} h`}
        />
      </Tile>
      <Tile title="Markers chosen by the app" id="markers">
        <Scatter
          aria-label="Cost against time"
          series={[
            { ...groups[0]!, marker: 'triangle', color: 'var(--umbra-color-series-5)' },
            { ...groups[2]!, marker: 'diamond' },
          ]}
          legend="end"
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
      <Tiles columns={3}>
        <Tile title="Loading">
          <Scatter aria-label="Cost against time" series={groups} loading />
        </Tile>
        <Tile title="Empty, with a description">
          <Scatter
            aria-label="Cost against time"
            series={[]}
            empty={{ title: 'Nothing measured yet', description: 'Points appear after the first run.' }}
          />
        </Tile>
        <Tile title="Error">
          <Scatter
            aria-label="Cost against time"
            series={groups}
            error={`The points could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
          />
        </Tile>
      </Tiles>
    );
  },
};

/** What the chart keeps as its slot shrinks: the legend goes first, then the point labels, the axis titles, the axes. */
export const Shrink: Story = {
  render: () => (
    <Boxes>
      {(
        [
          [420, 270, 'everything'],
          [330, 230, 'no legend'],
          [270, 180, 'no point labels'],
          [210, 140, 'no axis titles'],
          [140, 80, 'no axes'],
        ] as const
      ).map(([width, height, note]) => (
        <Box key={width} width={width} height={height} note={note}>
          <Scatter
            aria-label="Sites by distance, score and orders"
            series={sites}
            xTitle="Distance"
            yTitle="Score"
            xDomain={[0, 100]}
            yDomain={[0, 80]}
            labels
          />
        </Box>
      ))}
    </Boxes>
  ),
};

/** Keyboard, tooltip, `onAction` with the id of a point, and switching series off in the legend. */
export const Interaction: Story = {
  render: function Render() {
    const [hidden, setHidden] = useState<string[]>([]);
    const [pressed, setPressed] = useState('none');
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button onPress={() => setHidden([])}>Show all</Button>
          <Log>
            Hidden: {hidden.join(', ') || 'none'}. Pressed: {pressed}.
          </Log>
        </div>
        <Tiles columns={2}>
          <Tile title="Controlled" id="controlled">
            <Scatter
              aria-label="Sites by distance, score and orders"
              series={sites}
              xTitle="Distance"
              yTitle="Score"
              sizeLabel="Orders"
              xDomain={[0, 100]}
              yDomain={[0, 80]}
              hiddenIds={hidden}
              onHiddenChange={setHidden}
              onAction={setPressed}
            />
          </Tile>
          <Tile title="One series hidden at first" id="uncontrolled">
            <Scatter aria-label="Cost against time, by group" series={groups} defaultHiddenIds={['c']} />
          </Tile>
        </Tiles>
      </div>
    );
  },
};

/** Over a drawing the app supplies: the `backdrop` part is sized to the plot, and `axes={false}` gives it the whole of it. */
export const OverBackdrop: Story = {
  render: () => (
    <Tiles columns={2}>
      <Tile title="Numbered places on a floor plan, no axes" id="plain">
        <Scatter
          aria-label="Places of Team 1"
          series={places}
          xDomain={[0, 100]}
          yDomain={[0, 60]}
          axes={false}
          labels
          legend={false}
          parts={{ backdrop: <FloorPlan /> }}
        />
      </Tile>
      <Tile title="Bubbles on a map, with axes" id="axes">
        <Scatter
          aria-label="Sites by position and orders"
          series={sites}
          xDomain={[0, 100]}
          yDomain={[0, 80]}
          sizeLabel="Orders"
          parts={{ backdrop: <Blob /> }}
        />
      </Tile>
    </Tiles>
  ),
};

/** Tokens, every kind of part, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Tiles>
      <Tile title="Tokens" id="tokens">
        <UmbraScope
          tokens={{
            'scatter-bubble-opacity': '0.2',
            'chart-grid': 'var(--umbra-color-base-border-subtle)',
            'chart-point-scale': '1.4',
          }}
        >
          <Scatter aria-label="Sites" series={sites} xDomain={[0, 100]} yDomain={[0, 80]} />
        </UmbraScope>
      </Tile>
      <Tile title="Parts: a replaced legend, no tooltip" id="parts">
        <Scatter
          aria-label="Cost against time, by group"
          series={groups}
          parts={{ legend: <span data-custom-legend="">Three groups of runs</span>, tooltip: null }}
        />
      </Tile>
      <Tile title="Parts: functions, and a replaced skeleton" id="functions">
        <div
          style={{
            display: 'grid',
            gridTemplateRows: 'minmax(0, 2fr) minmax(0, 1fr)',
            height: '100%',
            gap: 8,
          }}
        >
          <Scatter
            aria-label="Sites"
            series={sites}
            parts={{
              tooltip: (p) => <strong data-custom-tooltip="">{`${p.title}: ${p.rows[0]?.value}`}</strong>,
              backdrop: () => <Blob />,
            }}
          />
          <Scatter
            aria-label="Sites"
            series={sites}
            loading
            parts={{ skeleton: <span>Loading the points…</span> }}
          />
        </div>
      </Tile>
      <Tile title="Blocks, composed by hand: points and a band only" id="blocks">
        <Scatter.Root
          aria-label="Cost against time"
          series={groups.slice(0, 2)}
          legend={false}
          annotations={[{ type: 'band', from: 30, to: 50, label: 'Target' }]}
        >
          <Scatter.Annotations />
          <Scatter.Points />
        </Scatter.Root>
      </Tile>
    </Tiles>
  ),
};
