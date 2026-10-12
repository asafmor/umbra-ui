import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { Heatmap } from '../charts/Heatmap';
import { Sparkline } from '../charts/Sparkline';
import { ValuePill } from '../data/ValuePill';
import { DivergingMeter } from '../meters/DivergingMeter';
import { LevelMeter } from '../meters/LevelMeter';
import { PieIndicator } from '../meters/PieIndicator';
import { ProgressBar } from '../meters/ProgressBar';
import { Board, Panel } from '../meters/storyKit';
import type { Threshold } from '../utils/thresholds';

const meta = {
  title: 'Foundation/Thresholds',
  parameters: { frame: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// A tone, a tone, a free colour and a step of the value ramp: every component takes all of them.
const bands: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Medium' },
  { from: 70, color: '#5aa9ff', label: 'High' },
  { from: 90, tone: 'ramp-5', label: 'Top' },
];
// One value in each band.
const values = [25, 55, 80, 95];
const regions = ['Region 1', 'Region 2', 'Region 3', 'Region 4'];

const row = { display: 'flex', gap: 'var(--umbra-space-4)', alignItems: 'center' };
function Sample({ id, height, children }: { id: string; height?: number; children: ReactNode }) {
  return (
    <div data-sample={id} style={height ? { ...row, height } : { display: 'grid', gap: row.gap }}>
      {children}
    </div>
  );
}

/**
 * One threshold list, every component. `thresholds` is the same ascending list of
 * `{ from, tone?, color?, label? }` everywhere: the same value lands in the same band (`data-band`),
 * with the same colour, a cue that is not colour (a pattern, or the label), and the band's label.
 */
export const OneList: Story = {
  name: 'One list, every component',
  render: () => (
    <Board>
      <Panel title="ValuePill">
        <Sample id="pill" height={28}>
          {values.map((value) => (
            <ValuePill key={value} value={value} thresholds={bands} showLevel />
          ))}
        </Sample>
      </Panel>
      <Panel title="ProgressBar">
        <Sample id="bar">
          {values.map((value, i) => (
            <ProgressBar
              key={value}
              label={regions[i]}
              kind="meter"
              layout="inline"
              value={value}
              thresholds={bands}
              showValue
            />
          ))}
        </Sample>
      </Panel>
      <Panel title="LevelMeter">
        <Sample id="meter">
          {values.map((value, i) => (
            <LevelMeter
              key={value}
              aria-label={regions[i]}
              size="small"
              value={value}
              thresholds={bands}
              showValue
            />
          ))}
        </Sample>
      </Panel>
      <Panel title="BarChart">
        <Sample id="bars" height={150}>
          <BarChart
            aria-label="Completion by region"
            orientation="horizontal"
            categories={regions}
            series={[{ id: 'done', label: 'Completed', values }]}
            thresholds={bands}
            valueDomain={[0, 100]}
            labels
          />
        </Sample>
      </Panel>
      <Panel title="DonutChart">
        <Sample id="donut" height={110}>
          {values.map((value, i) => (
            <div key={value} style={{ flex: 1, minWidth: 0, height: '100%' }}>
              <DonutChart aria-label={regions[i]} value={value} thresholds={bands} />
            </div>
          ))}
        </Sample>
      </Panel>
      <Panel title="Shorthand and lower is better">
        <Sample id="shorthand" height={28}>
          {values.map((value) => (
            <ValuePill key={value} value={value} thresholds={[40, 70, 90]} />
          ))}
        </Sample>
        <ProgressBar label="Numbers" kind="meter" layout="inline" value={55} thresholds={[40, 70, 90]} />
        <ProgressBar
          label="Lower is better"
          kind="meter"
          layout="inline"
          value={25}
          thresholds={bands}
          lowerIsBetter
          showValue
        />
      </Panel>
    </Board>
  ),
};

/**
 * The same list on the components of tier 2: `PieIndicator`, `DivergingMeter`, the bars and the last
 * point of a `Sparkline`, and the cells of a `Heatmap`. The same values land in the same bands.
 */
export const Tier2: Story = {
  name: 'One list, the tier 2 meters and charts',
  render: () => (
    <Board>
      <Panel title="PieIndicator">
        <Sample id="pie">
          {values.map((value, i) => (
            <PieIndicator key={value} label={regions[i]} value={value} thresholds={bands} showValue />
          ))}
        </Sample>
        <Sample id="pie-low">
          <PieIndicator label="Lower is better" value={25} thresholds={bands} lowerIsBetter showValue />
        </Sample>
      </Panel>
      <Panel title="DivergingMeter">
        <Sample id="diverging">
          {values.map((value, i) => (
            <DivergingMeter
              key={value}
              label={regions[i]}
              min={0}
              max={100}
              origin={50}
              value={value}
              thresholds={bands}
              formatValue={String}
              showValue
            />
          ))}
        </Sample>
        <Sample id="diverging-low">
          <DivergingMeter
            label="Lower is better"
            min={0}
            max={100}
            origin={50}
            value={25}
            thresholds={bands}
            lowerIsBetter
            formatValue={String}
            showValue
          />
        </Sample>
      </Panel>
      <Panel title="Sparkline and Heatmap">
        <Sample id="spark" height={28}>
          <Sparkline data={values} variant="bars" domain={[0, 100]} thresholds={bands} />
          <Sparkline data={values} domain={[0, 100]} thresholds={bands} lastPoint />
        </Sample>
        <Sample id="heat" height={110}>
          <Heatmap
            aria-label="Completion by region"
            rows={['Completed']}
            columns={regions}
            values={[values]}
            thresholds={bands}
            legend={false}
          />
        </Sample>
      </Panel>
    </Board>
  ),
};
