import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { Checkbox, CheckboxGroup } from './Checkbox';
import { Caption, column, DemoForm, grid, Width } from './samples';

const meta = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Unchecked, checked and indeterminate, in every state. Checked is the fill and the mark, not colour alone. */
export const States: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>Default</Caption>
        <Checkbox>Unchecked</Checkbox>
        <Checkbox defaultChecked>Checked</Checkbox>
        <Checkbox indeterminate>Indeterminate</Checkbox>
        <Checkbox defaultChecked description="A second line that explains the choice.">
          With a description
        </Checkbox>
        <Checkbox required>Email me a copy</Checkbox>
        <Checkbox aria-label="No visible label" />
      </div>
      <div style={column}>
        <Caption>Disabled</Caption>
        <Checkbox disabled>Unchecked</Checkbox>
        <Checkbox disabled defaultChecked>
          Checked
        </Checkbox>
        <Checkbox disabled indeterminate>
          Indeterminate
        </Checkbox>
        <Caption>Read-only</Caption>
        <Checkbox readOnly>Unchecked</Checkbox>
        <Checkbox readOnly defaultChecked>
          Checked
        </Checkbox>
      </div>
      <div style={column}>
        <Caption>Invalid</Caption>
        <Checkbox invalid>Unchecked</Checkbox>
        <Checkbox invalid defaultChecked>
          Checked
        </Checkbox>
        <Checkbox required error="Accept the terms to continue.">
          I accept the terms
        </Checkbox>
      </div>
      <div style={column}>
        <Caption>Small, for table cells</Caption>
        <Checkbox size="small">Unchecked</Checkbox>
        <Checkbox size="small" defaultChecked>
          Checked
        </Checkbox>
        <Checkbox size="small" indeterminate>
          Indeterminate
        </Checkbox>
        <Checkbox size="small" defaultChecked aria-label="Select row 1" />
        <Caption>A long label wraps</Caption>
        <div style={{ width: 180 }}>
          <Checkbox>Send a summary of open orders every Monday morning</Checkbox>
        </div>
      </div>
    </div>
  ),
};

const regions = ['Region 1', 'Region 2', 'Region 3', 'Region 4'];

function SelectAll() {
  const [value, setValue] = useState(['Region 2']);
  return (
    <div style={column}>
      <Checkbox
        checked={value.length === regions.length}
        indeterminate={value.length > 0 && value.length < regions.length}
        onChange={(all) => setValue(all ? regions : [])}
      >
        All regions
      </Checkbox>
      <CheckboxGroup
        aria-label="Regions"
        value={value}
        onChange={setValue}
        style={{ paddingInlineStart: 24 }}
      >
        {regions.map((region) => (
          <Checkbox key={region} value={region}>
            {region}
          </Checkbox>
        ))}
      </CheckboxGroup>
      <Log>Checked: {value.join(', ') || 'none'}.</Log>
    </div>
  );
}

/** A group: one label, description and error for several checkboxes; vertical, horizontal or in columns. */
export const Group: Story = {
  render: () => (
    <div style={grid(3)}>
      <div style={column}>
        <CheckboxGroup
          label="Notify me about"
          description="Choose any number."
          defaultValue={['orders']}
          name="notify"
        >
          <Checkbox value="orders">Orders</Checkbox>
          <Checkbox value="returns" description="Including refunds.">
            Returns
          </Checkbox>
          <Checkbox value="reports" disabled>
            Reports
          </Checkbox>
        </CheckboxGroup>
        <CheckboxGroup label="Horizontal" orientation="horizontal" defaultValue={['b']}>
          <Checkbox value="a">Item 1</Checkbox>
          <Checkbox value="b">Item 2</Checkbox>
          <Checkbox value="c">Item 3</Checkbox>
        </CheckboxGroup>
      </div>
      <div style={column}>
        <CheckboxGroup label="Required, with an error" required error="Choose at least one channel.">
          <Checkbox value="email">Email</Checkbox>
          <Checkbox value="phone">Phone</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup label="Disabled group" disabled defaultValue={['a']}>
          <Checkbox value="a">Item 1</Checkbox>
          <Checkbox value="b">Item 2</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup label="Read-only group" readOnly defaultValue={['a']} orientation="horizontal">
          <Checkbox value="a">Item 1</Checkbox>
          <Checkbox value="b">Item 2</Checkbox>
        </CheckboxGroup>
      </div>
      <div style={column}>
        <Caption>Controlled, with a "select all" above it</Caption>
        <SelectAll />
      </div>
    </div>
  ),
};

/** In a form: a checkbox sends its `value` (or "on") under its `name`; a group sends one entry per checked box. */
export const Form: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 420 }}>
      <Checkbox name="terms" value="accepted">
        I accept the terms
      </Checkbox>
      <Checkbox name="news" defaultChecked>
        Send me news
      </Checkbox>
      <CheckboxGroup label="Channels" name="channel" defaultValue={['email']} orientation="horizontal">
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="phone">Phone</Checkbox>
      </CheckboxGroup>
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** A group's columns drop one by one as it narrows; a label wraps instead of overflowing. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      {[620, 420, 200].map((width) => (
        <Width key={width} width={width}>
          <CheckboxGroup label="Regions" columns={3} defaultValue={['Region 1']}>
            {[...regions, 'A region with a long name'].map((region) => (
              <Checkbox key={region} value={region}>
                {region}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </Width>
      ))}
    </div>
  ),
};

/** The `parts` prop (node, `null`, function), then the same checkbox and group composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(3)}>
      <div style={column}>
        <Caption>parts</Caption>
        <Checkbox
          defaultChecked
          parts={{
            box: (
              <Checkbox.Box>
                <Star />
              </Checkbox.Box>
            ),
          }}
        >
          A node replaces the box
        </Checkbox>
        <Checkbox description="Hidden by null." parts={{ description: null }}>
          null hides the description
        </Checkbox>
        <Checkbox
          description="Wrapped."
          parts={{ label: (p) => <Checkbox.Label>{p.children} (wrapped)</Checkbox.Label> }}
        >
          A function wraps the label
        </Checkbox>
        <CheckboxGroup
          label="Group label"
          description="Hidden by null."
          error="An error"
          parts={{
            description: null,
            label: (p) => <CheckboxGroup.Label>{p.children} (wrapped)</CheckboxGroup.Label>,
            error: <CheckboxGroup.Error>A node replaces the error</CheckboxGroup.Error>,
          }}
        >
          <Checkbox value="a">Item 1</Checkbox>
        </CheckboxGroup>
      </div>
      <div style={column}>
        <Caption>Checkbox blocks</Caption>
        <Checkbox.Root defaultChecked>
          <Checkbox.Box />
          <Checkbox.Label>Composed by hand</Checkbox.Label>
          <Checkbox.Description>Root, Box, Label, Description and Error.</Checkbox.Description>
        </Checkbox.Root>
        <Checkbox.Root>
          <Checkbox.Box />
          <Checkbox.Label>With an error block</Checkbox.Label>
          <Checkbox.Error>The error block makes it invalid.</Checkbox.Error>
        </Checkbox.Root>
      </div>
      <div style={column}>
        <Caption>CheckboxGroup blocks</Caption>
        <CheckboxGroup.Root defaultValue={['a']}>
          <CheckboxGroup.Label>Composed by hand</CheckboxGroup.Label>
          <CheckboxGroup.Description>Root, Label, Description, Options and Error.</CheckboxGroup.Description>
          <CheckboxGroup.Options columns={2}>
            <Checkbox value="a">Item 1</Checkbox>
            <Checkbox value="b">Item 2</Checkbox>
          </CheckboxGroup.Options>
        </CheckboxGroup.Root>
      </div>
    </div>
  ),
};
