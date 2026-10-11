import type { Meta, StoryObj } from '@storybook/react-vite';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { Stepper, type StepperOption } from './Stepper';

const meta = {
  title: 'Inputs/Stepper',
  component: Stepper,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj<typeof meta>;

const zones: StepperOption[] = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6'].map((label) => ({
  id: label.toLowerCase().replace(' ', '-'),
  label,
}));

function Controlled() {
  const [zone, setZone] = useState('zone-5');
  return (
    <>
      <Stepper aria-label="Controlled" options={zones} value={zone} onChange={setZone} />
      <Log>Chosen: {zone}.</Log>
    </>
  );
}

/** Options mode walks a list and goes round; numeric mode walks numbers and stops at the ends. */
export const States: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>Options: goes round</Caption>
        <Controlled />
        <Caption>wrap off: stops at the ends</Caption>
        <Stepper aria-label="Stops at the ends" options={zones} defaultValue="zone-6" wrap={false} />
        <Caption>No value</Caption>
        <Stepper aria-label="No value" options={zones} />
      </div>
      <div style={column}>
        <Caption>Numeric: min, max, step</Caption>
        <Stepper aria-label="Copies" min={1} max={8} defaultValue={3} />
        <Caption>formatValue, and too many positions for segments</Caption>
        <Stepper
          aria-label="Share"
          min={0}
          max={100}
          step={5}
          defaultValue={40}
          formatValue={(v) => `${v}%`}
        />
        <Caption>Numeric that goes round</Caption>
        <Stepper aria-label="Hour" min={0} max={9} defaultValue={9} wrap />
      </div>
      <div style={column}>
        <Caption>Disabled</Caption>
        <Stepper aria-label="Disabled" options={zones} defaultValue="zone-2" disabled />
        <Caption>Read-only: focusable, not changeable</Caption>
        <Stepper aria-label="Read-only" options={zones} defaultValue="zone-2" readOnly />
        <Caption>Invalid</Caption>
        <Stepper aria-label="Invalid" options={zones} defaultValue="zone-2" invalid />
      </div>
      <div style={column}>
        <Caption>Small</Caption>
        <Stepper aria-label="Small" size="small" options={zones} defaultValue="zone-3" />
        <Caption>Without the indicator</Caption>
        <Stepper aria-label="No indicator" options={zones} defaultValue="zone-3" showIndicator={false} />
      </div>
    </div>
  ),
};

/** In a `FormField` the field names and describes the value; in a form it is sent under `name`. */
export const InField: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 460 }}>
      <FormField label="Target" description="Where the result is sent.">
        <Stepper name="target" options={zones} defaultValue="zone-2" />
      </FormField>
      <FormField label="Copies" required error="Choose between 1 and 8.">
        <Stepper name="copies" min={1} max={8} defaultValue={8} />
      </FormField>
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** The `parts` prop (node, `null`, function), then the same stepper composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2)}>
      <div style={column}>
        <Caption>parts: nodes replace the chevrons</Caption>
        <Stepper
          aria-label="Other icons"
          min={0}
          max={5}
          defaultValue={2}
          parts={{
            previous: (
              <Stepper.Previous>
                <Minus size={16} />
              </Stepper.Previous>
            ),
            next: (
              <Stepper.Next>
                <Plus size={16} />
              </Stepper.Next>
            ),
          }}
        />
        <Caption>parts: null hides the indicator</Caption>
        <Stepper
          aria-label="Hidden indicator"
          options={zones}
          defaultValue="zone-1"
          parts={{ indicator: null }}
        />
        <Caption>parts: a function adjusts the value</Caption>
        <Stepper
          aria-label="Adjusted value"
          options={zones}
          defaultValue="zone-4"
          parts={{ value: (p) => <Stepper.Value {...p} style={{ textTransform: 'uppercase' }} /> }}
        />
      </div>
      <div style={column}>
        <Caption>Blocks: the indicator above, the buttons together</Caption>
        <Stepper.Root aria-label="Composed by hand" options={zones} defaultValue="zone-3">
          <Stepper.Indicator />
          <Stepper.Value style={{ gridColumn: '1 / 3', justifyItems: 'start' }} />
          <span style={{ display: 'flex' }}>
            <Stepper.Previous />
            <Stepper.Next />
          </span>
        </Stepper.Root>
      </div>
    </div>
  ),
};

/** The label truncates as the stepper narrows; under 96px the indicator hides. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {[220, 130, 90].map((width) => (
        <Width key={width} width={width}>
          <Stepper
            aria-label={`At ${width}`}
            options={[{ id: 'long', label: 'A longer option' }, ...zones]}
            defaultValue="long"
          />
        </Width>
      ))}
    </div>
  ),
};

/** Right to left: Previous is at the right, and the arrow keys follow what is drawn. */
export const RightToLeft: Story = {
  render: () => (
    <div style={column}>
      <Stepper aria-label="Options" options={zones} defaultValue="zone-2" />
      <Stepper aria-label="Number" min={1} max={8} defaultValue={3} />
    </div>
  ),
  globals: { direction: 'rtl' },
};
