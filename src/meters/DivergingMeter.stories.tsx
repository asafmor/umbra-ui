import type { Meta, StoryObj } from '@storybook/react-vite';
import { UmbraScope } from '../provider/UmbraProvider';
import { LiveValues } from '../stories/live';
import type { Threshold } from '../utils/thresholds';
import { DivergingMeter } from './DivergingMeter';
import { Board, Panel, Width } from './storyKit';

const meta = {
  title: 'Meters/DivergingMeter',
  component: DivergingMeter,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof DivergingMeter>;
export default meta;
type Story = StoryObj<typeof meta>;

const bands: Threshold[] = [
  { from: -100, tone: 'danger', label: 'Much worse' },
  { from: -30, tone: 'warning', label: 'Worse' },
  { from: 0, tone: 'info', label: 'Better' },
  { from: 30, tone: 'success', label: 'Much better' },
];

/** Both directions, the neutral value, sizes, tones, thresholds, origins and the two layouts. */
export const Variants: Story = {
  render: () => (
    <Board>
      <Panel title="Direction and size of an effect">
        <DivergingMeter label="Understanding" value={18} />
        <DivergingMeter label="Risk" value={-12} />
        <DivergingMeter label="Condition" value={-45} />
        <DivergingMeter label="Fatigue" value={0} />
        <DivergingMeter label="Sharpness" value={70} />
      </Panel>
      <Panel title="With the value">
        <DivergingMeter label="Positive" value={40} showValue />
        <DivergingMeter label="Negative" value={-65} showValue />
        <DivergingMeter label="Neutral" value={0} showValue />
        <DivergingMeter
          label="Formatted"
          value={12}
          formatValue={(v) => `${v > 0 ? '+' : ''}${v}%`}
          showValue
        />
      </Panel>
      <Panel title="Sizes, and no tick">
        <DivergingMeter label="Thin" size="thin" value={40} />
        <DivergingMeter label="Default" value={-40} />
        <DivergingMeter label="Thick" size="thick" value={40} />
        <DivergingMeter label="No tick at the origin" value={-40} originTick={false} />
      </Panel>
      <Panel title="Tones and thresholds">
        <DivergingMeter label="Other tones" value={50} tone="info" negativeTone="warning" showValue />
        <DivergingMeter label="Other tones" value={-50} tone="info" negativeTone="warning" showValue />
        <DivergingMeter label="Cost: low is good" value={-50} lowerIsBetter showValue />
        <DivergingMeter label="Cost: low is good" value={50} lowerIsBetter showValue />
        <DivergingMeter label="Banded" value={-60} thresholds={bands} showValue />
        <DivergingMeter label="Banded" value={45} thresholds={bands} showValue />
      </Panel>
      <Panel title="Origin">
        <DivergingMeter label="Against a target of 60" min={0} max={100} origin={60} value={85} showValue />
        <DivergingMeter label="Against a target of 60" min={0} max={100} origin={60} value={25} showValue />
        <DivergingMeter label="Middle of 20 to 80" min={20} max={80} value={35} showValue />
      </Panel>
      <Panel title="Inline, for rows">
        <DivergingMeter label="Region 1" layout="inline" value={32} showValue />
        <DivergingMeter label="Region 2" layout="inline" value={-58} showValue />
        <DivergingMeter aria-label="Region 3 change" layout="inline" value={8} />
      </Panel>
    </Board>
  ),
};

/** The ends of the scale, values outside it, no value, and loading. */
export const EdgeValues: Story = {
  render: () => (
    <Board columns={4}>
      <Panel title="The ends">
        <DivergingMeter label="Lowest" value={-100} showValue />
        <DivergingMeter label="Highest" value={100} showValue />
      </Panel>
      <Panel title="Outside the scale">
        <DivergingMeter label="Over" value={140} showValue />
        <DivergingMeter label="Under" value={-140} showValue />
        <DivergingMeter label="No range" value={5} min={10} max={10} showValue />
      </Panel>
      <Panel title="No value">
        <DivergingMeter label="Not measured" value={null} showValue />
        <DivergingMeter label="Not rated" showValue emptyLabel="n/a" noValueLabel="Not available" />
      </Panel>
      <Panel title="Loading">
        <DivergingMeter label="Change" value={40} showValue loading />
        <DivergingMeter label="Change" value={40} layout="inline" showValue loading />
      </Panel>
    </Board>
  ),
};

/** The value hides first, then the label truncates. The bar keeps its minimum width. */
export const Shrink: Story = {
  render: () => (
    <Board columns={2}>
      <Panel title="Block: 320, 170, 90 and 28px wide">
        {[320, 170, 90, 28].map((px) => (
          <Width key={px} px={px}>
            <DivergingMeter label="Change since last month" value={-42} showValue />
          </Width>
        ))}
      </Panel>
      <Panel title="Inline: 320, 200, 120 and 60px wide">
        {[320, 200, 120, 60].map((px) => (
          <Width key={px} px={px}>
            <DivergingMeter label="Change since last month" value={-42} layout="inline" showValue />
          </Width>
        ))}
      </Panel>
    </Board>
  ),
};

/** Tokens, every kind of part, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Board>
      <UmbraScope
        tokens={{
          'diverging-meter-height': '10px',
          'diverging-meter-radius': '2px',
          'diverging-meter-track': 'var(--umbra-color-base-surface1)',
          'diverging-meter-origin': 'var(--umbra-color-semantic-warning)',
        }}
      >
        <Panel title="Tokens">
          <DivergingMeter label="Change" value={40} showValue />
          <DivergingMeter label="Change" value={-40} showValue />
        </Panel>
      </UmbraScope>
      <Panel title="Parts">
        <DivergingMeter
          label="A node replaces the label"
          value={40}
          showValue
          parts={{ label: <strong style={{ gridArea: '1 / 1' }}>Replaced label</strong> }}
        />
        <DivergingMeter
          label="null hides the value and the tick"
          value={-40}
          showValue
          parts={{ value: null, origin: null }}
        />
        <DivergingMeter
          label="A function adjusts the fill and the value"
          value={40}
          showValue
          parts={{
            fill: (p) => <DivergingMeter.Fill {...p} tone="accent" />,
            value: () => <DivergingMeter.Value>40 above plan</DivergingMeter.Value>,
          }}
        />
        <DivergingMeter
          label="A replaced skeleton"
          value={40}
          loading
          parts={{ skeleton: <span style={{ color: 'var(--umbra-color-base-text-muted)' }}>Loading…</span> }}
        />
      </Panel>
      <Panel title="Blocks, composed by hand">
        <DivergingMeter.Root value={-25} layout="inline">
          <DivergingMeter.Label>Change</DivergingMeter.Label>
          <DivergingMeter.Track>
            <DivergingMeter.Fill color="var(--umbra-color-series-5)" />
          </DivergingMeter.Track>
          <DivergingMeter.Value />
        </DivergingMeter.Root>
      </Panel>
    </Board>
  ),
};

/** `highlightChanges`: the value flashes once and shows a sign when it rises or falls. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues kinds={['up', 'down', 'same']}>
      {(value) => (
        <DivergingMeter
          label="Level"
          min={0}
          max={80}
          origin={40}
          value={value as number}
          formatValue={String}
          showValue
          highlightChanges
        />
      )}
    </LiveValues>
  ),
};
