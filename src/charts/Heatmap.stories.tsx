import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { UmbraScope } from '../provider/UmbraProvider';
import { FloorPlan } from '../stories/backdrops';
import { Box, Boxes, Tile, Tiles } from '../stories/charts';
import { Log } from '../stories/placeholders';
import type { Threshold } from '../utils/thresholds';
import { Heatmap, type HeatmapPoint } from './Heatmap';
import type { ChartPoint } from './internal/Frame';

const meta: Meta<typeof Heatmap> = {
  title: 'Charts/Heatmap',
  component: Heatmap,
  parameters: { frame: 'padded' },
};
export default meta;
type Story = StoryObj;

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hours = ['08', '09', '10', '11', '12', '13', '14', '15'];
const load = [
  [4, 12, 28, 35, 22, 18, 30, 14],
  [6, 18, 33, 41, 25, 20, 36, 16],
  [3, 10, 24, 30, null, 15, 27, 11],
  [8, 21, 38, 48, 29, 24, 40, 19],
  [2, 7, 15, 20, 12, 9, 16, 5],
];
const bands: Threshold[] = [
  { from: 0, tone: 'success', label: 'Quiet' },
  { from: 20, tone: 'warning', label: 'Busy' },
  { from: 35, tone: 'danger', label: 'Full' },
];
// A fixed scatter of points, denser towards one corner: no random numbers, so every run draws the same.
const visits: HeatmapPoint[] = Array.from({ length: 160 }, (_, i) => ({
  x: ((i * 37) % 100) * (0.4 + ((i * 7) % 10) / 16),
  y: ((i * 53) % 60) * (0.35 + ((i * 3) % 10) / 15),
}));

const base = { rows: days, columns: hours, values: load };

/** Named rows and columns, binned points, thresholds, a scale where low is good, and cells without printed values. */
export const Variants: Story = {
  render: () => (
    <Tiles>
      <Tile title="Categories, with the value in each cell" id="categories">
        <Heatmap aria-label="Orders by day and hour" {...base} xTitle="Hour" yTitle="Day" />
      </Tile>
      <Tile title="Size in place of the printed value" id="sizes">
        <Heatmap aria-label="Orders by day and hour" {...base} labels={false} />
      </Tile>
      <Tile title="Thresholds" id="thresholds">
        <Heatmap aria-label="Load by day and hour" {...base} thresholds={bands} />
      </Tile>
      <Tile title="Points, binned 10 by 6" id="binned">
        <Heatmap
          aria-label="Visits by position"
          points={visits}
          bins={[10, 6]}
          xDomain={[0, 100]}
          yDomain={[0, 60]}
          xTitle="Distance"
          yTitle="Height"
        />
      </Tile>
      <Tile title="Low is good, three steps" id="lower">
        <Heatmap aria-label="Waiting time by day and hour" {...base} steps={3} lowerIsBetter labels={false} />
      </Tile>
      <Tile title="A fixed scale, formatted values" id="domain">
        <Heatmap
          aria-label="Capacity used by day and hour"
          rows={days.slice(0, 3)}
          columns={hours.slice(0, 5)}
          values={load.slice(0, 3).map((row) => row.slice(0, 5))}
          valueDomain={[0, 100]}
          formatValue={(v) => `${v}%`}
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
          <Heatmap aria-label="Orders" {...base} loading />
        </Tile>
        <Tile title="Empty, with a description">
          <Heatmap
            aria-label="Orders"
            rows={days}
            columns={hours}
            values={[]}
            empty={{ title: 'No orders in this period', description: 'Choose a longer period to see more.' }}
          />
        </Tile>
        <Tile title="Error">
          <Heatmap
            aria-label="Orders"
            {...base}
            error={`The orders could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
          />
        </Tile>
      </Tiles>
    );
  },
};

/** What the chart keeps as its slot shrinks: the legend goes first, then the printed values, the axis titles, the axes. */
export const Shrink: Story = {
  render: () => (
    <Boxes>
      {(
        [
          [420, 270, 'everything'],
          [330, 230, 'no legend'],
          [270, 180, 'no printed values'],
          [210, 140, 'no axis titles'],
          [140, 80, 'no axes'],
        ] as const
      ).map(([width, height, note]) => (
        <Box key={width} width={width} height={height} note={note}>
          <Heatmap
            aria-label="Orders by day and hour"
            rows={days}
            columns={hours.slice(0, 6)}
            values={load.map((row) => row.slice(0, 6))}
            xTitle="Hour"
            yTitle="Day"
          />
        </Box>
      ))}
    </Boxes>
  ),
};

/** Keyboard, tooltip, pressing a cell, and switching steps of the scale off in the legend. */
export const Interaction: Story = {
  render: function Render() {
    const [hidden, setHidden] = useState<string[]>([]);
    const [pressed, setPressed] = useState<ChartPoint | null>(null);
    return (
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Button onPress={() => setHidden([])}>Show all</Button>
          <Log>
            Hidden: {hidden.join(', ') || 'none'}. Pressed:{' '}
            {pressed ? `${pressed.seriesLabel}, ${String(pressed.x)}, ${pressed.value}` : 'none'}.
          </Log>
        </div>
        <Tiles columns={2}>
          <Tile title="Controlled" id="controlled">
            <Heatmap
              aria-label="Orders by day and hour"
              {...base}
              hiddenIds={hidden}
              onHiddenChange={setHidden}
              onPointPress={setPressed}
              formatValue={(v) => `${v} orders`}
              labels={false}
            />
          </Tile>
          <Tile title="Bands, one hidden at first" id="uncontrolled">
            <Heatmap
              aria-label="Load by day and hour"
              {...base}
              thresholds={bands}
              defaultHiddenIds={['step-0']}
            />
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
      <Tile title="Visits on a floor plan, no axes" id="plain">
        <Heatmap
          aria-label="Visits by position"
          points={visits}
          bins={[14, 8]}
          xDomain={[0, 100]}
          yDomain={[0, 60]}
          axes={false}
          labels={false}
          parts={{ backdrop: <FloorPlan /> }}
        />
      </Tile>
      <Tile title="With axes" id="axes">
        <Heatmap
          aria-label="Visits by position"
          points={visits}
          bins={[10, 6]}
          xDomain={[0, 100]}
          yDomain={[0, 60]}
          labels={false}
          legend={false}
          parts={{ backdrop: <FloorPlan /> }}
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
            'heatmap-high': 'var(--umbra-color-series-2)',
            'heatmap-low': 'var(--umbra-color-base-surface1)',
            'heatmap-cell-radius': '0',
            'heatmap-cell-border': 'transparent',
          }}
        >
          <Heatmap aria-label="Orders by day and hour" {...base} />
        </UmbraScope>
      </Tile>
      <Tile title="Parts: a replaced legend, no tooltip" id="parts">
        <Heatmap
          aria-label="Orders by day and hour"
          {...base}
          parts={{
            legend: <span data-custom-legend="">Orders per hour, from few to many</span>,
            tooltip: null,
          }}
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
          <Heatmap
            aria-label="Orders by day and hour"
            {...base}
            labels={false}
            parts={{
              tooltip: (p) => <strong data-custom-tooltip="">{`${p.title}: ${p.rows[0]?.value}`}</strong>,
              empty: (p) => <div data-custom-empty="">{p.children}</div>,
            }}
          />
          <Heatmap
            aria-label="Orders"
            {...base}
            loading
            parts={{ skeleton: <span>Loading the grid…</span> }}
          />
        </div>
      </Tile>
      <Tile title="Blocks, composed by hand: no axes" id="blocks">
        <Heatmap.Root aria-label="Orders by day and hour" {...base} legend={false} axes={false}>
          <Heatmap.Cells />
          <Heatmap.ValueLabels />
        </Heatmap.Root>
      </Tile>
    </Tiles>
  ),
};
