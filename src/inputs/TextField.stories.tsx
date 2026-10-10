import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mail, Search, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { TextField } from './TextField';

const meta = {
  title: 'Inputs/TextField',
  component: TextField,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [value, setValue] = useState('Report 4');
  return (
    <>
      <TextField aria-label="Controlled" value={value} onChange={setValue} clearable />
      <Log>Value: "{value}".</Log>
    </>
  );
}

/** Every state. An invalid field shows an icon as well as the danger border; read-only has a dashed edge. */
export const States: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>Default</Caption>
        <TextField aria-label="Empty" />
        <TextField aria-label="Placeholder" placeholder="Placeholder" />
        <TextField aria-label="With text" defaultValue="Report 4" />
        <Caption>Clearable, controlled</Caption>
        <Controlled />
      </div>
      <div style={column}>
        <Caption>Prefix and suffix</Caption>
        <TextField aria-label="Search" prefix={<Search />} placeholder="Search orders" clearable />
        <TextField aria-label="Weight" type="number" defaultValue="12" suffix="kg" />
        <TextField aria-label="Address" prefix="https://" defaultValue="example.com" type="url" />
        <TextField aria-label="Email" type="email" prefix={<Mail />} defaultValue="person.a@example.com" />
        {/* Empty: the dots of a filled password field are drawn by the system. */}
        <TextField aria-label="Password" type="password" placeholder="Password" />
      </div>
      <div style={column}>
        <Caption>Invalid</Caption>
        <TextField aria-label="Invalid" invalid defaultValue="person.a@" />
        <TextField aria-label="Invalid, clearable" invalid clearable defaultValue="-4" suffix="kg" />
        <Caption>Disabled</Caption>
        <TextField aria-label="Disabled" disabled defaultValue="Report 4" clearable />
        <Caption>Read-only</Caption>
        <TextField aria-label="Read-only" readOnly defaultValue="Report 4" clearable />
      </div>
      <div style={column}>
        <Caption>Small, for table cells</Caption>
        <TextField aria-label="Small" size="small" defaultValue="12" suffix="kg" />
        <TextField aria-label="Small, invalid" size="small" invalid defaultValue="-4" />
        <Caption>Multiline</Caption>
        <TextField aria-label="Notes" multiline placeholder="Notes" />
        <TextField
          aria-label="Notes, invalid"
          multiline
          rows={2}
          invalid
          defaultValue="A note that is long enough to wrap onto a second line of the box."
        />
      </div>
    </div>
  ),
};

/** In a form the field sends its text under its `name`. */
export const Form: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 420 }}>
      <TextField aria-label="Name" name="name" defaultValue="Person A" clearable />
      <TextField aria-label="Amount" name="amount" type="number" defaultValue="12" suffix="kg" />
      <TextField aria-label="Notes" name="notes" multiline rows={2} />
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** The field fills its slot. As it narrows the text box gives way first; a long prefix or suffix truncates. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      {[320, 180, 96].map((width) => (
        <Width key={width} width={width}>
          <TextField
            aria-label={`Address at ${width}px`}
            prefix="https://"
            suffix=".example.com"
            defaultValue="a-long-address-that-does-not-fit"
            clearable
          />
          <TextField aria-label={`Invalid at ${width}px`} invalid defaultValue="-4" suffix="kg" />
        </Width>
      ))}
    </div>
  ),
};

/** The `parts` prop (node, `null`, function), then the same field composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2)}>
      <div style={column}>
        <Caption>parts: a node replaces the invalid icon</Caption>
        <TextField
          aria-label="Custom invalid icon"
          invalid
          defaultValue="-4"
          parts={{
            invalidIcon: (
              <TextField.InvalidIcon>
                <TriangleAlert />
              </TextField.InvalidIcon>
            ),
          }}
        />
        <Caption>parts: null hides the clear button</Caption>
        <TextField aria-label="No clear button" clearable defaultValue="Report 4" parts={{ clear: null }} />
        <Caption>parts: a function wraps the prefix and renames the clear button</Caption>
        <TextField
          aria-label="Wrapped"
          clearable
          defaultValue="Report 4"
          prefix="Name"
          parts={{
            prefix: (p) => <TextField.Prefix>{p.children}:</TextField.Prefix>,
            clear: (p) => <TextField.Clear {...p} label="Empty the field" />,
          }}
        />
      </div>
      <div style={column}>
        <Caption>Blocks: Root, Prefix, Input, InvalidIcon, Clear, Suffix</Caption>
        <TextField.Root aria-label="Composed by hand" defaultValue="12">
          <TextField.Prefix>Weight</TextField.Prefix>
          <TextField.Input />
          <TextField.InvalidIcon />
          <TextField.Clear />
          <TextField.Suffix>kg</TextField.Suffix>
        </TextField.Root>
      </div>
    </div>
  ),
};
