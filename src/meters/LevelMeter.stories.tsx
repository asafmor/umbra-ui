import type { Meta, StoryObj } from '@storybook/react-vite';
import { UmbraScope } from '../provider/UmbraProvider';
import { LevelMeter, type LevelMeterLevel } from './LevelMeter';
import type { Zone } from './scale';
import { Board, Panel, Width } from './storyKit';

const meta = {
  title: 'Meters/LevelMeter',
  component: LevelMeter,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof LevelMeter>;
export default meta;
type Story = StoryObj<typeof meta>;

const levels: LevelMeterLevel[] = [
  { id: 'none', label: 'None', tone: 'ramp-1' },
  { id: 'basic', label: 'Basic', tone: 'ramp-2' },
  { id: 'fair', label: 'Fair', tone: 'ramp-3' },
  { id: 'good', label: 'Good', tone: 'ramp-4' },
  { id: 'expert', label: 'Expert', tone: 'ramp-5' },
];

const zones: Zone[] = [
  { from: 0, to: 40, tone: 'danger', label: 'Poor' },
  { from: 40, to: 70, tone: 'warning', label: 'Fair' },
  { from: 70, to: 100, tone: 'success', label: 'Good' },
];

/** Numeric and named scales, the range, the comparison marker, zones, end labels, tones and sizes. */
export const Variants: Story = {
  render: () => (
    <Board>
      <Panel title="Numeric scale">
        <LevelMeter aria-label="Skill level" value={70} />
        <LevelMeter label="Skill level" value={7} max={10} steps={11} showValue />
        <LevelMeter label="Capacity" value={35} steps={21} minLabel="0" maxLabel="100" showValue />
      </Panel>
      <Panel title="Named levels">
        <LevelMeter label="Skill level" levels={levels} value="basic" showValue />
        <LevelMeter label="Skill level" levels={levels} value="good" showValue />
        <LevelMeter label="By index" levels={levels} value={4} minLabel="None" maxLabel="Expert" />
      </Panel>
      <Panel title="Range">
        <LevelMeter label="Estimate" range={[40, 65]} valueLabel="40 – 65" />
        <LevelMeter label="Estimate with a value" range={[40, 65]} value={58} showValue />
        <LevelMeter label="Named range" levels={levels} range={['basic', 'good']} value="fair" showValue />
      </Panel>
      <Panel title="Comparison">
        <LevelMeter label="Capacity" value={62} compare={45} compareLabel="Last month" showValue />
        <LevelMeter
          label="Skill level"
          levels={levels}
          value="fair"
          compare="expert"
          compareLabel="Goal"
          showValue
        />
      </Panel>
      <Panel title="Zones">
        {[22, 55, 88].map((value) => (
          <LevelMeter key={value} label="Capacity" value={value} zones={zones} showValue />
        ))}
      </Panel>
      <Panel title="Tones, sizes, no box">
        <LevelMeter label="Small, info" size="small" tone="info" value={50} />
        <LevelMeter label="Default, neutral" tone="neutral" value={50} />
        <LevelMeter label="Large, success" size="large" tone="success" value={50} />
        <LevelMeter label="No box" boxed={false} value={50} />
      </Panel>
    </Board>
  ),
};

/** Zero, full, values outside the scale, a negative scale, no value and loading. */
export const EdgeValues: Story = {
  render: () => (
    <Board>
      <Panel title="Zero and full">
        <LevelMeter label="Zero" value={0} showValue />
        <LevelMeter label="Full" value={100} showValue />
      </Panel>
      <Panel title="Outside the scale">
        <LevelMeter label="Over" value={140} showValue />
        <LevelMeter label="Negative" value={-20} showValue />
        <LevelMeter label="Range past the end" range={[80, 130]} value={90} showValue />
      </Panel>
      <Panel title="Scale from -50 to 50">
        <LevelMeter label="Balance" min={-50} max={50} value={-20} minLabel="-50" maxLabel="50" showValue />
        <LevelMeter label="Balance" min={-50} max={50} value={0} compare={30} showValue />
      </Panel>
      <Panel title="No value, unknown level, one step">
        <LevelMeter label="No value" />
        <LevelMeter label="Unknown level" levels={levels} value="missing" />
        <LevelMeter label="One level" levels={levels.slice(0, 1)} value="none" showValue />
      </Panel>
      <Panel title="Loading">
        <LevelMeter label="Skill level" value={70} showValue loading />
        <LevelMeter aria-label="Capacity" value={70} size="small" loading />
      </Panel>
    </Board>
  ),
};

/** Vertical meters fill the height they are given; the scale runs from the bottom to the top. */
export const Vertical: Story = {
  render: () => (
    <Panel title="Vertical" style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', gap: 'var(--umbra-space-8)', height: 220 }}>
        <LevelMeter orientation="vertical" aria-label="Skill level" value={70} />
        <LevelMeter
          orientation="vertical"
          aria-label="Capacity"
          value={35}
          minLabel="0"
          maxLabel="100"
          showValue
        />
        <LevelMeter
          orientation="vertical"
          aria-label="Capacity"
          value={62}
          compare={45}
          zones={zones}
          showValue
        />
        <LevelMeter orientation="vertical" aria-label="Estimate" range={[40, 65]} value={58} size="large" />
        <LevelMeter orientation="vertical" aria-label="Skill level" levels={levels} value="good" showValue />
        <LevelMeter orientation="vertical" aria-label="Capacity" value={70} size="small" boxed={false} />
        <LevelMeter orientation="vertical" aria-label="Capacity" value={70} showValue loading />
        <div data-height="60" style={{ height: 60, alignSelf: 'end' }}>
          <LevelMeter
            orientation="vertical"
            aria-label="Short"
            value={70}
            steps={21}
            minLabel="0"
            maxLabel="100"
          />
        </div>
      </div>
    </Panel>
  ),
};

const rows = [
  { name: 'Person A', level: 'expert', load: 82 },
  { name: 'Person B', level: 'fair', load: 47 },
  { name: 'Person C', level: 'basic', load: 15 },
  { name: 'Person D', level: 'good', load: 64 },
];

/** In table cells, with the small size. */
export const InCell: Story = {
  render: () => (
    <Panel title="Team" style={{ maxWidth: 720 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--umbra-font-table-cell)' }}>
        <thead>
          <tr style={{ color: 'var(--umbra-color-base-text-muted)' }}>
            <th style={{ textAlign: 'start' }}>Name</th>
            <th style={{ textAlign: 'start', width: 180 }}>Skill level</th>
            <th style={{ textAlign: 'start', width: 180 }}>Capacity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ height: 'var(--umbra-density-table-row)' }}>
              <td>{row.name}</td>
              <td style={{ paddingInlineEnd: 'var(--umbra-space-5)' }}>
                <LevelMeter
                  aria-label={`${row.name} skill level`}
                  size="small"
                  levels={levels}
                  value={row.level}
                  showValue
                />
              </td>
              <td style={{ paddingInlineEnd: 'var(--umbra-space-5)' }}>
                <LevelMeter aria-label={`${row.name} capacity`} size="small" value={row.load} zones={zones} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  ),
};

/** As the width shrinks: the end labels hide, then every 2nd tick stays, then every 5th. The marker and the band always stay. */
export const Shrink: Story = {
  render: () => (
    <Board columns={2}>
      <Panel title="21 ticks: 360, 240, 150 and 90px wide">
        {[360, 240, 150, 90].map((px) => (
          <Width key={px} px={px}>
            <LevelMeter
              label="Capacity"
              value={60}
              range={[30, 80]}
              steps={21}
              minLabel="Empty"
              maxLabel="Full"
            />
          </Width>
        ))}
      </Panel>
      <Panel title="A long label truncates last: 200 and 110px wide">
        {[200, 110].map((px) => (
          <Width key={px} px={px}>
            <LevelMeter label="Capacity used this year" value={60} steps={11} showValue />
          </Width>
        ))}
      </Panel>
    </Board>
  ),
};

/** The four layers: tokens, props, parts (a node, `null`, a function) and blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Board>
      <UmbraScope
        tokens={{
          'level-meter-height': '24px',
          'level-meter-radius': '12px',
          'level-meter-track': 'var(--umbra-color-base-surface3)',
          'level-meter-border': 'transparent',
          'level-meter-tick': 'var(--umbra-color-base-border-control)',
          'level-meter-tick-lit': 'var(--umbra-color-base-text-primary)',
          'level-meter-marker': 'var(--umbra-color-value-ramp-5)',
          'level-meter-marker-width': '5px',
          'level-meter-band': 'var(--umbra-color-semantic-info)',
          'level-meter-length': '160px',
        }}
      >
        <Panel title="Tokens">
          <LevelMeter label="Capacity" value={60} range={[30, 80]} showValue />
          <LevelMeter label="Skill level" value={3} max={10} steps={11} />
        </Panel>
      </UmbraScope>
      <Panel title="Parts">
        <LevelMeter
          label="A node replaces the label"
          value={60}
          showValue
          parts={{ label: <strong>Replaced label</strong> }}
        />
        <LevelMeter
          label="null hides the end labels and the band"
          value={60}
          range={[30, 80]}
          minLabel="0"
          maxLabel="100"
          parts={{ minLabel: null, maxLabel: null, band: null }}
        />
        <LevelMeter
          label="A function adjusts the value"
          value={60}
          showValue
          parts={{ value: () => <LevelMeter.Value>60 of 100</LevelMeter.Value> }}
        />
        <LevelMeter
          label="A replaced skeleton"
          value={60}
          loading
          parts={{ skeleton: <span style={{ color: 'var(--umbra-color-base-text-muted)' }}>Loading…</span> }}
        />
      </Panel>
      <Panel title="Blocks, composed by hand">
        <LevelMeter.Root value={60} compare={40} compareLabel="Before" zones={zones} size="large">
          <LevelMeter.Value />
          <LevelMeter.Strip>
            <LevelMeter.Marker kind="compare" />
            <LevelMeter.Marker />
          </LevelMeter.Strip>
          <LevelMeter.Label>Value first, label last</LevelMeter.Label>
        </LevelMeter.Root>
        <LevelMeter.Root range={[20, 50]} aria-label="Estimate">
          <LevelMeter.EndLabel end="min">Low</LevelMeter.EndLabel>
          <LevelMeter.Strip>
            <LevelMeter.Band />
          </LevelMeter.Strip>
          <LevelMeter.EndLabel end="max">High</LevelMeter.EndLabel>
        </LevelMeter.Root>
      </Panel>
    </Board>
  ),
};
