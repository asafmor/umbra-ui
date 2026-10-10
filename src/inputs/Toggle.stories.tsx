import type { Meta, StoryObj } from '@storybook/react-vite';
import { Moon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { Caption, column, DemoForm, grid } from './samples';
import { Toggle } from './Toggle';

const meta = {
  title: 'Inputs/Toggle',
  component: Toggle,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [on, setOn] = useState(false);
  return (
    <>
      <Toggle checked={on} onChange={setOn}>
        Controlled
      </Toggle>
      <Log>Sound is {on ? 'on' : 'off'}.</Log>
    </>
  );
}

/** Off and on in every state. On is the thumb at the end and the check mark on it, not colour alone. */
export const States: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>Default</Caption>
        <Toggle>Off</Toggle>
        <Toggle defaultChecked>On</Toggle>
        <Toggle defaultChecked description="A second line that explains the setting.">
          With a description
        </Toggle>
        <Toggle aria-label="No visible label" defaultChecked />
        <Controlled />
      </div>
      <div style={column}>
        <Caption>Disabled</Caption>
        <Toggle disabled>Off</Toggle>
        <Toggle disabled defaultChecked>
          On
        </Toggle>
        <Caption>Read-only</Caption>
        <Toggle readOnly>Off</Toggle>
        <Toggle readOnly defaultChecked>
          On
        </Toggle>
      </div>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>Label at the start</Caption>
        <Toggle labelPosition="start">Off</Toggle>
        <Toggle labelPosition="start" defaultChecked>
          On
        </Toggle>
        <div style={{ display: 'grid', width: 220 }}>
          <Toggle labelPosition="start" defaultChecked description="The switch stays at the end of the row.">
            Filling a row
          </Toggle>
        </div>
      </div>
      <div style={column}>
        <Caption>Small, for table cells and toolbars</Caption>
        <Toggle size="small">Off</Toggle>
        <Toggle size="small" defaultChecked>
          On
        </Toggle>
        <Caption>A long label wraps</Caption>
        <div style={{ width: 180 }}>
          <Toggle>Show only the items that were reviewed this week</Toggle>
        </div>
      </div>
    </div>
  ),
};

/** In a form a toggle that is on sends its `value` (or "on") under its `name`; off sends nothing. */
export const Form: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 420 }}>
      <Toggle name="sound" defaultChecked>
        Sound
      </Toggle>
      <Toggle name="music" value="yes">
        Music
      </Toggle>
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** The `parts` prop (node, `null`, function), then the same toggle composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2)}>
      <div style={column}>
        <Caption>parts</Caption>
        <Toggle
          defaultChecked
          parts={{
            track: (
              <Toggle.Track>
                <Moon />
              </Toggle.Track>
            ),
          }}
        >
          A node replaces the track and its mark
        </Toggle>
        <Toggle description="Hidden by null." parts={{ description: null }}>
          null hides the description
        </Toggle>
        <Toggle parts={{ label: (p) => <Toggle.Label>{p.children} (wrapped)</Toggle.Label> }}>
          A function wraps the label
        </Toggle>
      </div>
      <div style={column}>
        <Caption>Blocks</Caption>
        <Toggle.Root defaultChecked labelPosition="start">
          <Toggle.Track />
          <Toggle.Label>Composed by hand</Toggle.Label>
          <Toggle.Description>Root, Track, Label and Description.</Toggle.Description>
        </Toggle.Root>
      </div>
    </div>
  ),
};
