import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from '../overlays/Modal';
import { UmbraScope } from '../provider/UmbraProvider';
import { LiveValues } from '../stories/live';
import type { Threshold } from '../utils/thresholds';
import { DivergingMeter } from './DivergingMeter';
import { PieIndicator } from './PieIndicator';
import { Board, Panel, Width } from './storyKit';

const meta = {
  title: 'Meters/PieIndicator',
  component: PieIndicator,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof PieIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

const bands: Threshold[] = [
  { from: 0, tone: 'ramp-1', label: 'Minimal' },
  { from: 25, tone: 'ramp-2', label: 'Basic' },
  { from: 50, tone: 'ramp-3', label: 'Fair' },
  { from: 75, tone: 'ramp-4', label: 'Extensive' },
];
const column = { display: 'grid', gap: 'var(--umbra-space-3)', justifyItems: 'start' } as const;

/** Segmented and continuous discs, sizes, tones, thresholds and the two layouts. */
export const Variants: Story = {
  render: () => (
    <Board>
      <Panel title="Segmented: 8 wedges by default">
        <div style={column}>
          <PieIndicator label="One eighth" value={12.5} showValue />
          <PieIndicator label="Half" value={50} showValue />
          <PieIndicator label="Nearly full" value={90} showValue />
          <PieIndicator
            label="Five wedges"
            value={3}
            max={5}
            segments={5}
            formatValue={(v) => `${v} of 5`}
            showValue
          />
          <PieIndicator aria-label="Coverage" value={62} />
        </div>
      </Panel>
      <Panel title="Continuous">
        <div style={column}>
          <PieIndicator label="A quarter" variant="continuous" value={25} showValue />
          <PieIndicator label="Exact" variant="continuous" value={62} showValue />
          <PieIndicator label="Full" variant="continuous" value={100} showValue />
        </div>
      </Panel>
      <Panel title="Sizes">
        <div style={column}>
          <PieIndicator label="Small" size="small" value={62} />
          <PieIndicator label="Default" value={62} />
          <PieIndicator label="Large" size="large" value={62} />
        </div>
      </Panel>
      <Panel title="Thresholds: the amount and the colour show the level">
        <div style={column}>
          {[10, 40, 60, 95].map((value) => (
            <PieIndicator key={value} label="Knowledge" value={value} thresholds={bands} showValue />
          ))}
          <PieIndicator label="Thirds" value={45} thresholds showValue />
          <PieIndicator label="Risk: low is good" value={20} thresholds lowerIsBetter showValue />
          <PieIndicator label="Boundaries on the ramp" value={70} thresholds={[20, 40, 60, 80]} showValue />
        </div>
      </Panel>
      <Panel title="Tones">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--umbra-space-4)' }}>
          {(['default', 'neutral', 'success', 'warning', 'danger', 'info', 'accent'] as const).map((tone) => (
            <PieIndicator key={tone} label={tone} tone={tone} value={62} />
          ))}
        </div>
      </Panel>
      <Panel title="Block layout, and inside a line of text">
        <div style={{ display: 'flex', gap: 'var(--umbra-space-6)' }}>
          <PieIndicator layout="block" size="large" label="Coverage" value={75} showValue />
          <PieIndicator layout="block" size="large" label="Quality" value={38} thresholds showValue />
        </div>
        <div style={{ font: 'var(--umbra-font-body)' }}>
          Region 2 is covered <PieIndicator aria-label="Coverage of Region 2" size="small" value={75} /> and
          Region 3 is not <PieIndicator aria-label="Coverage of Region 3" size="small" value={0} />.
        </div>
      </Panel>
    </Board>
  ),
};

/** Zero and full, values outside the scale, no value, and loading. */
export const EdgeValues: Story = {
  render: () => (
    <Board columns={4}>
      <Panel title="Zero, a little, full">
        <PieIndicator label="Zero" value={0} showValue />
        <PieIndicator label="A little" value={2} showValue />
        <PieIndicator label="Full" value={100} showValue />
      </Panel>
      <Panel title="Outside the scale">
        <PieIndicator label="Over" value={120} showValue />
        <PieIndicator label="Under" value={-20} showValue />
        <PieIndicator label="No range" value={5} min={10} max={10} formatValue={String} showValue />
      </Panel>
      <Panel title="No value">
        <PieIndicator label="Not measured" value={null} showValue />
        <PieIndicator label="Not rated" showValue emptyLabel="n/a" noValueLabel="Not available" />
      </Panel>
      <Panel title="Loading">
        <PieIndicator label="Coverage" value={62} showValue loading />
        <PieIndicator aria-label="Quality" value={62} size="large" loading />
      </Panel>
    </Board>
  ),
};

const rows = [
  { name: 'Item 1', level: 100 },
  { name: 'Item 2', level: 75 },
  { name: 'Item 3', level: 40 },
  { name: 'Item 4', level: 10 },
  { name: 'Item 5', level: null },
];

/** In table cells: the disc alone at the end of a row, as in the evidence, and with its level beside it. */
export const InCell: Story = {
  render: () => (
    <Panel title="Readiness by item" style={{ maxWidth: 560 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--umbra-font-table-cell)' }}>
        <thead>
          <tr style={{ color: 'var(--umbra-color-base-text-muted)' }}>
            <th style={{ textAlign: 'start' }}>Name</th>
            <th style={{ textAlign: 'start' }}>Level</th>
            <th style={{ textAlign: 'end', width: 64 }}>Disc</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ height: 'var(--umbra-density-table-row)' }}>
              <td>{row.name}</td>
              <td>
                <PieIndicator
                  aria-label={`${row.name} level`}
                  value={row.level}
                  thresholds={bands}
                  showValue
                />
              </td>
              <td style={{ textAlign: 'end' }}>
                <PieIndicator aria-label={`${row.name} readiness`} value={row.level} thresholds={bands} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  ),
};

/** The value hides first, then the label truncates. The disc never shrinks. */
export const Shrink: Story = {
  render: () => (
    <Panel title="240, 180, 90 and 20px wide" style={{ maxWidth: 320 }}>
      {[240, 180, 90, 20].map((px) => (
        <Width key={px} px={px}>
          <PieIndicator label="Knowledge of the region" value={62} showValue />
        </Width>
      ))}
    </Panel>
  ),
};

/** The page is right to left: the row mirrors. The disc still fills clockwise from the top, like a clock. */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  render: () => (
    <Board>
      <Panel title="Pie indicator">
        <div style={column}>
          <PieIndicator label="Coverage" value={25} showValue />
          <PieIndicator label="Exact" variant="continuous" value={62} showValue />
        </div>
      </Panel>
      <Panel title="Diverging meter: positive is towards the end of the line">
        <DivergingMeter label="Change" value={40} showValue />
        <DivergingMeter label="Change" value={-65} showValue />
        <DivergingMeter label="Change" value={30} layout="inline" showValue />
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
          'pie-indicator-size': '28px',
          'pie-indicator-fill': 'var(--umbra-color-value-ramp-5)',
          'pie-indicator-track': 'var(--umbra-color-base-surface1)',
          'pie-indicator-wedge-gap': '0.3',
        }}
      >
        <Panel title="Tokens">
          <PieIndicator label="Coverage" value={62} showValue />
        </Panel>
      </UmbraScope>
      <Panel title="Parts">
        <div style={column}>
          <PieIndicator
            label="A node replaces the label"
            value={62}
            showValue
            parts={{ label: <strong>Replaced label</strong> }}
          />
          <PieIndicator label="null hides the value" value={62} showValue parts={{ value: null }} />
          <PieIndicator
            label="A function adjusts the value"
            value={62}
            showValue
            parts={{ value: () => <PieIndicator.Value>5 of 8</PieIndicator.Value> }}
          />
          <PieIndicator
            label="A replaced disc"
            value={62}
            parts={{ disc: <span aria-hidden="true">◔</span> }}
          />
          <PieIndicator
            label="A replaced skeleton"
            value={62}
            loading
            parts={{ skeleton: <span style={{ color: 'var(--umbra-color-base-text-muted)' }}>…</span> }}
          />
        </div>
      </Panel>
      <Panel title="Blocks, composed by hand">
        <PieIndicator.Root value={5} max={8} formatValue={(v) => `${v} of 8`} size="large">
          <PieIndicator.Label>Value first</PieIndicator.Label>
          <PieIndicator.Value />
          <PieIndicator.Disc />
        </PieIndicator.Root>
      </Panel>
    </Board>
  ),
};

/** `highlightChanges`: the value flashes once and shows a sign when it rises or falls. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues kinds={['up', 'down', 'same']}>
      {(value) => <PieIndicator label="Orders" value={value as number} showValue highlightChanges />}
    </LiveValues>
  ),
};

/** Inside a modal the tooltip of the exact value opens in the modal's layer. */
export const InModal: Story = {
  render: () => (
    <Modal defaultOpen size="sm" title="Readiness" footer={<Modal.Close>Close</Modal.Close>}>
      <div style={{ display: 'grid', gap: 'var(--umbra-space-4)' }}>
        <PieIndicator label="Knowledge" value={62} thresholds={bands} />
        <DivergingMeter label="Change" value={-35} />
      </div>
    </Modal>
  ),
};
