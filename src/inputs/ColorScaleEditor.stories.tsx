import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { ValuePill } from '../data/ValuePill';
import { LevelMeter } from '../meters/LevelMeter';
import { ProgressBar } from '../meters/ProgressBar';
import type { Threshold } from '../utils/thresholds';
import { ColorScaleEditor } from './ColorScaleEditor';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';

const meta = {
  title: 'Inputs/ColorScaleEditor',
  component: ColorScaleEditor,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ColorScaleEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

const five: Threshold[] = [
  { from: 1, tone: 'ramp-1', label: 'Poor' },
  { from: 5, tone: 'ramp-2' },
  { from: 9, tone: 'ramp-3', label: 'Fair' },
  { from: 13, tone: 'ramp-4' },
  { from: 17, tone: 'ramp-5', label: 'Great' },
];
const three: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Medium' },
  { from: 75, tone: 'success', label: 'High' },
];

/** The preview row, the track with a handle on each boundary, one row per stop, and the two actions. */
export const Editor: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <ColorScaleEditor aria-label="Value colours" min={1} max={20} defaultValue={five} />
    </div>
  ),
};

/** `readOnly` is the preview alone: tones, free colours, labels. Then the limits and the disabled editor. */
export const PreviewAndStates: Story = {
  render: () => (
    <div style={grid(2, 32)}>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>readOnly: the preview</Caption>
        <ColorScaleEditor readOnly aria-label="Five steps" min={1} max={20} value={five} />
        <Caption>Free colours</Caption>
        <ColorScaleEditor
          readOnly
          aria-label="Free colours"
          max={20}
          value={[
            { from: 0, color: '#7f1d1d' },
            { from: 4, color: '#c2410c' },
            { from: 8, color: '#6b7280' },
            { from: 12, color: '#ca8a04' },
            { from: 16, color: '#65a30d' },
            { from: 19, color: '#16a34a' },
          ]}
        />
        <Caption>Disabled, and invalid</Caption>
        <ColorScaleEditor readOnly disabled aria-label="Disabled preview" value={three} />
        <ColorScaleEditor readOnly invalid aria-label="Invalid preview" value={three} />
      </div>
      <div style={column}>
        <Caption>
          At minStops no stop can be removed; a free colour has the browser&apos;s colour field
        </Caption>
        <ColorScaleEditor
          aria-label="Two stops"
          defaultValue={[
            { from: 0, tone: 'info' },
            { from: 50, color: '#d946ef' },
          ]}
        />
        <Caption>Disabled</Caption>
        <ColorScaleEditor aria-label="Disabled editor" disabled defaultValue={three.slice(0, 2)} />
      </div>
    </div>
  ),
};

function Live() {
  const [scale, setScale] = useState<readonly Threshold[]>(three);
  const values = [12, 48, 91];
  return (
    <div style={grid(2, 32)}>
      <ColorScaleEditor
        aria-label="Completion colours"
        value={scale}
        defaultValue={three}
        onChange={setScale}
      />
      <div style={column}>
        <Caption>The editor&apos;s value is the thresholds of each of these</Caption>
        <div style={{ display: 'flex', gap: 8 }}>
          {values.map((value) => (
            <ValuePill key={value} value={value} thresholds={scale} />
          ))}
        </div>
        {values.map((value) => (
          <ProgressBar key={value} label={`Task ${value}`} value={value} thresholds={scale} showValue />
        ))}
        <LevelMeter label="Level" value={48} thresholds={scale} showValue />
        <div style={{ display: 'flex', gap: 16, height: 150 }}>
          <div style={{ flex: 2, minWidth: 0 }}>
            <BarChart
              aria-label="Completion by region"
              orientation="horizontal"
              categories={['Region 1', 'Region 2', 'Region 3']}
              series={[{ id: 'done', label: 'Completed', values }]}
              thresholds={scale}
              valueDomain={[0, 100]}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DonutChart aria-label="Completion" value={48} thresholds={scale} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Edit the ramp and every component that colours by value recolours: they all take the same list. */
export const LiveWithConsumers: Story = { render: () => <Live /> };

/** A field names and describes the editor; in a form the stops are sent as JSON under `name`. */
export const InField: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 560 }}>
      <FormField
        layout="stacked"
        label="Completion colours"
        description="From this value up, until the next stop."
        error="Two stops have the same colour."
      >
        <ColorScaleEditor name="scale" defaultValue={three.slice(0, 2)} />
      </FormField>
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** The `parts` prop (node, `null`, function), then the same editor composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2, 32)}>
      <div style={column}>
        <Caption>
          parts: a node replaces the actions, null hides the track, a function adjusts the preview
        </Caption>
        <ColorScaleEditor
          aria-label="With parts"
          defaultValue={three}
          parts={{
            actions: <em>Stops are fixed here.</em>,
            track: null,
            preview: (p) => <ColorScaleEditor.Preview {...p} style={{ justifyContent: 'flex-end' }} />,
          }}
        />
      </div>
      <div style={column}>
        <Caption>Blocks: the track above the preview, no rows</Caption>
        <ColorScaleEditor.Root aria-label="Composed by hand" defaultValue={three}>
          <ColorScaleEditor.Track />
          <ColorScaleEditor.Preview />
          <ColorScaleEditor.Actions />
        </ColorScaleEditor.Root>
      </div>
    </div>
  ),
};

/** As the editor narrows the label fields hide first, then the track; every boundary keeps its number field. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {[520, 400, 270].map((width) => (
        <Width key={width} width={width}>
          <ColorScaleEditor aria-label={`At ${width}`} defaultValue={three} />
        </Width>
      ))}
    </div>
  ),
};

/** Right to left: the bottom of the scale is at the right, and the arrow keys follow what is drawn. */
export const RightToLeft: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <ColorScaleEditor aria-label="Completion colours" defaultValue={three} />
    </div>
  ),
  globals: { direction: 'rtl' },
};
