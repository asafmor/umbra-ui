import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import type { Threshold } from '../utils/thresholds';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { Slider } from './Slider';

const meta = {
  title: 'Inputs/Slider',
  component: Slider,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

const quarters = [
  { value: 0, label: '0' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 75, label: '75' },
  { value: 100, label: '100' },
];

const load: Threshold[] = [
  { from: 0, tone: 'success', label: 'Light' },
  { from: 40, tone: 'warning', label: 'Medium' },
  { from: 75, tone: 'danger', label: 'Heavy' },
];

const minutes = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;

function Controlled() {
  const [value, setValue] = useState(30);
  const [range, setRange] = useState<readonly [number, number]>([20, 60]);
  return (
    <>
      <Slider aria-label="Controlled" value={value} onChange={setValue} />
      <Slider aria-label="Controlled range" value={range} onChange={setRange} />
      <Log>
        Value {value}; range {range[0]} to {range[1]}.
      </Log>
    </>
  );
}

/** One thumb or two, with marks, a value bubble, and the fill coloured by the band the value is in. */
export const States: Story = {
  render: () => (
    <div style={grid(3, 32)}>
      <div style={column}>
        <Caption>One value, and a range</Caption>
        <Controlled />
        <Caption>Marks with labels, step 25</Caption>
        <Slider aria-label="Marks" marks={quarters} step={25} defaultValue={50} />
        <Caption>Small</Caption>
        <Slider aria-label="Small" size="small" defaultValue={40} />
      </div>
      <div style={column}>
        <Caption>Coloured by value: thresholds, with the band&apos;s pattern and label</Caption>
        <Slider aria-label="Light load" thresholds={load} defaultValue={20} />
        <Slider aria-label="Medium load" thresholds={load} defaultValue={55} />
        <Slider aria-label="Heavy load" thresholds={load} defaultValue={90} />
        <Caption>A bubble in place of the output; formatValue</Caption>
        <Slider aria-label="Share" bubble showValue={false} defaultValue={65} formatValue={(v) => `${v}%`} />
      </div>
      <div style={column}>
        <Caption>Disabled</Caption>
        <Slider aria-label="Disabled" disabled defaultValue={40} />
        <Caption>Read-only: focusable, not changeable</Caption>
        <Slider aria-label="Read-only" readOnly defaultValue={40} />
        <Caption>Invalid</Caption>
        <Slider aria-label="Invalid" invalid defaultValue={95} />
      </div>
    </div>
  ),
};

/** The scrubber: a position on a timeline, its value in a box before a thin track. And vertical sliders. */
export const ScrubberAndVertical: Story = {
  render: () => (
    <div style={grid(2, 32)}>
      <div style={column}>
        <Caption>variant=&quot;scrubber&quot;</Caption>
        <Slider
          aria-label="Position"
          variant="scrubber"
          max={5400}
          step={15}
          defaultValue={1245}
          formatValue={minutes}
        />
        <Caption>With marks</Caption>
        <Slider
          aria-label="Position with marks"
          variant="scrubber"
          max={5400}
          step={15}
          defaultValue={3600}
          formatValue={minutes}
          marks={[
            { value: 0, label: 'Start' },
            { value: 2700, label: 'Half' },
            { value: 5400, label: 'End' },
          ]}
        />
      </div>
      <div style={{ display: 'flex', gap: 40, height: 220 }}>
        <Slider aria-label="Vertical" orientation="vertical" defaultValue={60} />
        <Slider aria-label="Vertical range" orientation="vertical" defaultValue={[20, 70]} marks={quarters} />
        <Slider
          aria-label="Vertical load"
          orientation="vertical"
          thresholds={load}
          defaultValue={80}
          bubble
        />
      </div>
    </div>
  ),
};

/** In a `FormField` the field names and describes the slider; in a form each thumb sends its value. */
export const InField: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 520 }}>
      <FormField label="Volume" description="Of every sound.">
        <Slider name="volume" defaultValue={70} />
      </FormField>
      <FormField layout="stacked" label="Price" error="The range is too wide.">
        <Slider name="price" defaultValue={[10, 90]} formatValue={(v) => `${v} units`} />
      </FormField>
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** The `parts` prop (node, `null`, function), then the same slider composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2, 32)}>
      <div style={column}>
        <Caption>parts: a node replaces the output</Caption>
        <Slider
          aria-label="Replaced output"
          defaultValue={30}
          parts={{ output: <strong>About a third</strong> }}
        />
        <Caption>parts: null hides the mark labels</Caption>
        <Slider aria-label="Hidden labels" defaultValue={50} marks={quarters} parts={{ marks: null }} />
        <Caption>parts: a function adjusts the track</Caption>
        <Slider
          aria-label="Adjusted track"
          defaultValue={70}
          parts={{ track: (p) => <Slider.Track {...p} style={{ opacity: 0.7 }} /> }}
        />
      </div>
      <div style={column}>
        <Caption>Blocks: the output above the track, a mark inside the thumb</Caption>
        <Slider.Root aria-label="Composed by hand" defaultValue={45} style={{ gridTemplate: 'none' }}>
          <Slider.Output style={{ gridArea: 'auto', textAlign: 'start', margin: 0 }} />
          <Slider.Track style={{ gridArea: 'auto' }}>
            <Slider.Thumb style={{ display: 'grid', placeItems: 'center', fontSize: 8, color: '#000' }}>
              ●
            </Slider.Thumb>
          </Slider.Track>
        </Slider.Root>
      </div>
    </div>
  ),
};

/** As the slider narrows the mark labels hide first, then the output; the track keeps the room. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {[320, 200, 120].map((width) => (
        <Width key={width} width={width}>
          <Slider aria-label={`At ${width}`} marks={quarters} defaultValue={50} />
        </Width>
      ))}
    </div>
  ),
};

/** Right to left: the low end is at the right, and the arrow keys follow what is drawn. */
export const RightToLeft: Story = {
  render: () => (
    <div style={{ ...column, maxWidth: 360 }}>
      <Slider aria-label="Value" marks={quarters} defaultValue={25} />
      <Slider aria-label="Range" defaultValue={[10, 40]} />
      <Slider aria-label="Position" variant="scrubber" defaultValue={30} />
    </div>
  ),
  globals: { direction: 'rtl' },
};
