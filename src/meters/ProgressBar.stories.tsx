import type { Meta, StoryObj } from '@storybook/react-vite';
import { UmbraScope } from '../provider/UmbraProvider';
import { ProgressBar, type ProgressBarStackItem } from './ProgressBar';
import type { Threshold } from './scale';
import { Board, Panel, Width } from './storyKit';
import { LiveValues } from '../stories/live';

const meta = {
  title: 'Meters/ProgressBar',
  component: ProgressBar,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

const spending: ProgressBarStackItem[] = [
  { id: 'a', label: 'Region 1', value: 40 },
  { id: 'b', label: 'Region 2', value: 25 },
  { id: 'c', label: 'Region 3', value: 10 },
];

const bands: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Medium' },
  { from: 75, tone: 'success', label: 'High' },
];

const units = (value: number) => `${value} GB`;

/** The three variants, the target marker, the tones and the sizes. */
export const Variants: Story = {
  render: () => (
    <Board>
      <Panel title="Plain">
        <ProgressBar aria-label="Budget used" value={87} />
        <ProgressBar label="Budget used" value={64} showValue />
        <ProgressBar label="Storage" kind="meter" value={320} max={500} formatValue={units} showValue />
        <ProgressBar label="Upload" value={45} valueLabel="45 of 100 files" />
      </Panel>
      <Panel title="Segmented">
        <ProgressBar
          label="Steps done"
          value={3}
          max={5}
          segments={5}
          formatValue={(v) => `${v} of 5`}
          showValue
        />
        <ProgressBar label="Capacity" kind="meter" value={55} segments={10} tone="info" showValue />
        <ProgressBar label="Explicit stops" value={62} segments={[20, 50, 80]} tone="neutral" showValue />
      </Panel>
      <Panel title="Stacked">
        <ProgressBar label="Budget used" kind="meter" stack={spending} showValue />
        <ProgressBar
          label="Custom colours"
          kind="meter"
          size="thick"
          stack={[
            { id: 'a', label: 'Used', value: 30, color: 'var(--umbra-color-value-ramp-5)' },
            { id: 'b', label: 'Reserved', value: 45, tone: 'ramp-3' },
          ]}
          showValue
        />
      </Panel>
      <Panel title="Target">
        <ProgressBar label="Budget used" kind="meter" value={64} target={80} showValue />
        <ProgressBar
          label="Past the goal"
          tooltip={false}
          kind="meter"
          value={92}
          target={75}
          targetLabel="Goal"
          tone="success"
        />
      </Panel>
      <Panel title="Tones">
        {(['default', 'neutral', 'info', 'success', 'warning', 'danger'] as const).map((tone) => (
          <ProgressBar key={tone} label={tone} value={60} tone={tone} layout="inline" />
        ))}
      </Panel>
      <Panel title="Sizes">
        <ProgressBar label="Thin" value={50} size="thin" />
        <ProgressBar label="Default" value={50} />
        <ProgressBar label="Thick" value={50} size="thick" />
        <ProgressBar label="Thick, value inside" value={72} size="thick" showValue valuePlacement="inside" />
        <ProgressBar label="Short fill" value={4} size="thick" showValue valuePlacement="inside" />
      </Panel>
    </Board>
  ),
};

/** Colour by fill level. Each band also has a pattern, and its label joins the value. */
export const Thresholds: Story = {
  render: () => (
    <Board>
      <Panel title="Default thirds">
        {[12, 48, 86].map((value) => (
          <ProgressBar key={value} label="Capacity" kind="meter" value={value} thresholds showValue />
        ))}
      </Panel>
      <Panel title="Labelled bands">
        {[20, 55, 90].map((value) => (
          <ProgressBar
            key={value}
            label="Skill level"
            kind="meter"
            value={value}
            thresholds={bands}
            showValue
          />
        ))}
      </Panel>
      <Panel title="Inverted: low is good">
        {[20, 55, 90].map((value) => (
          <ProgressBar
            key={value}
            label="Budget used"
            kind="meter"
            value={value}
            thresholds={bands}
            invert
            showValue
          />
        ))}
      </Panel>
      <Panel title="Value ramp, segmented, thick">
        <ProgressBar
          label="Skill level"
          kind="meter"
          size="thick"
          value={7}
          max={10}
          segments={10}
          formatValue={(v) => `${v} / 10`}
          thresholds={[
            { from: 0, tone: 'ramp-2' },
            { from: 4, tone: 'ramp-3' },
            { from: 7, tone: 'ramp-4' },
          ]}
          showValue
        />
      </Panel>
    </Board>
  ),
};

/** Zero, full, values outside the scale, a scale that does not start at zero, no value, loading and unknown length. */
export const EdgeValues: Story = {
  render: () => (
    <Board columns={4}>
      <Panel title="Zero and full">
        <ProgressBar label="Zero" value={0} showValue />
        <ProgressBar label="Full" value={100} showValue />
      </Panel>
      <Panel title="Outside the scale">
        <ProgressBar label="Over: budget used" kind="meter" value={120} showValue thresholds={bands} invert />
        <ProgressBar label="Negative" kind="meter" value={-20} showValue />
        <ProgressBar label="Segmented, over" value={9} max={5} segments={5} showValue />
      </Panel>
      <Panel title="Scale from 20 to 80">
        <ProgressBar label="Below" kind="meter" value={10} min={20} max={80} formatValue={String} showValue />
        <ProgressBar
          label="Inside"
          kind="meter"
          value={50}
          min={20}
          max={80}
          formatValue={String}
          showValue
        />
        <ProgressBar
          label="No range"
          kind="meter"
          value={5}
          min={10}
          max={10}
          formatValue={String}
          showValue
        />
      </Panel>
      <Panel title="No value">
        <ProgressBar label="Not measured" kind="meter" value={null} showValue />
        <ProgressBar label="Not started" showValue emptyLabel="n/a" noValueLabel="Not available" />
        <ProgressBar label="Capacity" kind="meter" value={null} layout="inline" showValue target={80} />
      </Panel>
      <Panel title="Loading">
        <ProgressBar label="Budget used" value={64} showValue loading />
        <ProgressBar aria-label="Capacity" value={64} size="thick" loading />
        <ProgressBar label="Capacity" value={64} layout="inline" showValue loading />
      </Panel>
      <Panel title="Indeterminate">
        <ProgressBar label="Syncing" indeterminate />
        <ProgressBar label="Syncing" indeterminate size="thick" tone="info" />
      </Panel>
      <UmbraScope tokens={{ 'motion-scale': 0 }}>
        <Panel title="Indeterminate, reduced motion">
          <ProgressBar label="Syncing" indeterminate />
          <ProgressBar label="Syncing" indeterminate size="thick" tone="info" />
        </Panel>
      </UmbraScope>
    </Board>
  ),
};

/** Right to left: the bar fills from the right, and its gradient, its target and its stacked parts mirror with it. */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  render: () => (
    <Board>
      <Panel title="Fill and target">
        <ProgressBar label="Budget used" value={30} showValue target={80} />
        <ProgressBar label="Storage" kind="meter" value={64} showValue size="thick" valuePlacement="inside" />
        <ProgressBar label="Capacity" value={45} layout="inline" showValue />
      </Panel>
      <Panel title="Segmented and stacked">
        <ProgressBar label="Steps done" value={2} max={5} segments={5} tone="warning" showValue />
        <ProgressBar label="Budget used" kind="meter" stack={spending} showValue />
        <ProgressBar label="Score" kind="meter" value={20} thresholds={bands} showValue />
      </Panel>
      <UmbraScope tokens={{ 'motion-scale': 0 }}>
        <Panel title="Unknown length">
          <ProgressBar label="Syncing" indeterminate />
        </Panel>
      </UmbraScope>
    </Board>
  ),
};

const rows = [
  { name: 'Item 1', used: 18 },
  { name: 'Item 2', used: 52 },
  { name: 'Item 3', used: 77 },
  { name: 'Item 4', used: 100 },
  { name: 'Item 5', used: 0 },
];

/** `layout="inline"` in table cells: the bar fills the width of its cell. */
export const InCell: Story = {
  render: () => (
    <Panel title="Capacity by item" style={{ maxWidth: 720 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--umbra-font-table-cell)' }}>
        <thead>
          <tr style={{ textAlign: 'start', color: 'var(--umbra-color-base-text-muted)' }}>
            <th style={{ textAlign: 'start', width: '30%' }}>Name</th>
            <th style={{ textAlign: 'start' }}>Capacity</th>
            <th style={{ textAlign: 'start', width: 96 }}>Narrow</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ height: 'var(--umbra-density-table-row)' }}>
              <td>{row.name}</td>
              <td style={{ paddingInlineEnd: 'var(--umbra-space-5)' }}>
                <ProgressBar
                  aria-label={`${row.name} capacity`}
                  kind="meter"
                  layout="inline"
                  value={row.used}
                  thresholds
                  invert
                  showValue
                />
              </td>
              <td>
                <ProgressBar aria-label={`${row.name} capacity`} kind="meter" size="thin" value={row.used} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  ),
};

/** As the width shrinks: the value hides, then the label truncates. The bar always stays. */
export const Shrink: Story = {
  render: () => (
    <Board columns={2}>
      <Panel title="Block: 320, 150, 90 and 28px wide">
        {[320, 150, 90, 28].map((px) => (
          <Width key={px} px={px}>
            <ProgressBar label="Budget used this year" value={64} showValue />
          </Width>
        ))}
      </Panel>
      <Panel title="Inline: 320, 200, 120 and 60px wide">
        {[320, 200, 120, 60].map((px) => (
          <Width key={px} px={px}>
            <ProgressBar label="Budget used this year" value={64} layout="inline" showValue />
          </Width>
        ))}
      </Panel>
      <Panel title="Value inside: 200 and 60px wide">
        {[200, 60].map((px) => (
          <Width key={px} px={px}>
            <ProgressBar aria-label="Capacity" value={64} size="thick" showValue valuePlacement="inside" />
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
          'progress-bar-height': '10px',
          'progress-bar-radius': '2px',
          'progress-bar-fill': 'var(--umbra-color-value-ramp-5)',
          'progress-bar-track': 'var(--umbra-color-base-surface1)',
          'progress-bar-target': 'var(--umbra-color-semantic-warning)',
          'progress-bar-segment-gap': '4px',
        }}
      >
        <Panel title="Tokens">
          <ProgressBar label="Capacity" value={64} target={80} showValue />
          <ProgressBar label="Steps done" value={3} max={5} segments={5} />
        </Panel>
      </UmbraScope>
      <Panel title="Parts">
        <ProgressBar
          label="A node replaces the label"
          value={64}
          showValue
          parts={{ label: <strong style={{ gridArea: '1 / 1' }}>Replaced label</strong> }}
        />
        <ProgressBar
          label="null hides the value and the target"
          value={64}
          target={80}
          showValue
          parts={{ value: null, target: null }}
        />
        <ProgressBar
          label="A function adjusts the fill and the value"
          value={64}
          showValue
          parts={{
            fill: (p) => <ProgressBar.Fill {...p} tone="info" pattern="vertical" />,
            value: () => <ProgressBar.Value>64 of 100</ProgressBar.Value>,
          }}
        />
        <ProgressBar
          label="A replaced skeleton"
          value={64}
          loading
          parts={{ skeleton: <span style={{ color: 'var(--umbra-color-base-text-muted)' }}>Loading…</span> }}
        />
      </Panel>
      <Panel title="Blocks, composed by hand">
        <ProgressBar.Root value={64} target={80} kind="meter" layout="inline">
          <ProgressBar.Label>Capacity</ProgressBar.Label>
          <ProgressBar.Track>
            <ProgressBar.Target />
          </ProgressBar.Track>
        </ProgressBar.Root>
        <ProgressBar.Root value={3} max={8} segments={8} size="thick" formatValue={(v) => `${v} of 8`}>
          <ProgressBar.Label>Steps done</ProgressBar.Label>
          <ProgressBar.Value />
          <ProgressBar.Track fill={(p) => <ProgressBar.Fill {...p} tone="success" />} />
        </ProgressBar.Root>
      </Panel>
    </Board>
  ),
};

/** `highlightChanges`: press the button and each changed value flashes once, with a sign when a number rose or fell. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues kinds={['up', 'down', 'same']}>
      {(value) => <ProgressBar label="Orders" value={value as number} showValue highlightChanges />}
    </LiveValues>
  ),
};
