import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gauge, Rabbit, SlidersHorizontal, Turtle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { Radio, RadioGroup } from './Radio';
import { Caption, column, DemoForm, grid, Width } from './samples';

const meta = {
  title: 'Inputs/Radio',
  component: RadioGroup,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [value, setValue] = useState('weekly');
  return (
    <>
      <RadioGroup label="Controlled" value={value} onChange={setValue}>
        <Radio value="daily">Daily</Radio>
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </RadioGroup>
      <Log>Chosen: {value}.</Log>
    </>
  );
}

/** The `default` variant in every state. Chosen is the filled ring and the dot, not colour alone. */
export const Default: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <RadioGroup label="Summary" description="How often the summary is sent." defaultValue="weekly">
          <Radio value="daily">Daily</Radio>
          <Radio value="weekly" description="Every Monday morning.">
            Weekly
          </Radio>
          <Radio value="monthly">Monthly</Radio>
          <Radio value="never" disabled>
            Never (disabled option)
          </Radio>
        </RadioGroup>
      </div>
      <div style={column}>
        <RadioGroup label="Horizontal" orientation="horizontal" defaultValue="b">
          <Radio value="a">Item 1</Radio>
          <Radio value="b">Item 2</Radio>
          <Radio value="c">Item 3</Radio>
        </RadioGroup>
        <RadioGroup label="Required, with an error" required error="Choose one option.">
          <Radio value="a">Item 1</Radio>
          <Radio value="b">Item 2</Radio>
        </RadioGroup>
      </div>
      <div style={column}>
        <RadioGroup label="Disabled group" disabled defaultValue="a">
          <Radio value="a">Item 1</Radio>
          <Radio value="b">Item 2</Radio>
        </RadioGroup>
        <RadioGroup label="Read-only group" readOnly defaultValue="a">
          <Radio value="a">Item 1</Radio>
          <Radio value="b">Item 2</Radio>
        </RadioGroup>
      </div>
      <div style={column}>
        <Controlled />
      </div>
    </div>
  ),
};

const paces = (
  <>
    <Radio value="short" media={<Rabbit />} description="Fewer stops, to move through the work faster.">
      Streamlined
    </Radio>
    <Radio value="even" media={<Gauge />} description="Regular stops that keep you up to date.">
      Balanced
    </Radio>
    <Radio value="full" media={<Turtle />} description="A stop at every change, so nothing is missed.">
      Thorough
    </Radio>
    <Radio value="custom" media={<SlidersHorizontal />} description="Set each step yourself." disabled>
      Custom
    </Radio>
  </>
);

/** The `card` variant: bordered tiles with a title, a description and an icon; one column or several. */
export const Cards: Story = {
  render: () => (
    <div style={grid(2, 24)}>
      <RadioGroup
        variant="card"
        label="Review pace"
        description="How often the review stops for you."
        defaultValue="even"
      >
        {paces}
      </RadioGroup>
      <div style={column}>
        <RadioGroup variant="card" columns={2} label="Two columns" defaultValue="short">
          {paces}
        </RadioGroup>
        <RadioGroup variant="card" columns={3} label="Titles only, with an error" error="Choose a size.">
          <Radio value="s">Small</Radio>
          <Radio value="m">Medium</Radio>
          <Radio value="l">Large</Radio>
        </RadioGroup>
      </div>
    </div>
  ),
};

/** In a form the group sends the chosen option's `value` under its `name`. */
export const Form: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 420 }}>
      <RadioGroup label="Summary" name="summary" defaultValue="weekly" orientation="horizontal">
        <Radio value="daily">Daily</Radio>
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </RadioGroup>
      <RadioGroup label="Size" name="size" variant="card" columns={3}>
        <Radio value="s">Small</Radio>
        <Radio value="m">Medium</Radio>
        <Radio value="l" disabled>
          Large
        </Radio>
      </RadioGroup>
      <div>
        <Button type="submit" variant="accent">
          Save
        </Button>
      </div>
    </DemoForm>
  ),
};

/** Columns drop one by one as the group narrows; a narrow card hides its media and truncates its text. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      {[700, 460, 200].map((width) => (
        <Width key={width} width={width}>
          <RadioGroup variant="card" columns={3} aria-label={`Review pace at ${width}px`} defaultValue="even">
            <Radio value="short" media={<Rabbit />} description="Fewer stops, to move faster.">
              Streamlined
            </Radio>
            <Radio value="even" media={<Gauge />} description="Regular stops that keep you up to date.">
              Balanced
            </Radio>
            <Radio value="full" media={<Turtle />} description="A stop at every change.">
              Thorough
            </Radio>
          </RadioGroup>
        </Width>
      ))}
    </div>
  ),
};

/** The `parts` prop (node, `null`, function), then a group and its options composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(3)}>
      <div style={column}>
        <Caption>parts</Caption>
        <RadioGroup
          label="Group label"
          description="Hidden by null."
          defaultValue="a"
          parts={{
            description: null,
            label: (p) => <RadioGroup.Label>{p.children} (wrapped)</RadioGroup.Label>,
          }}
        >
          <Radio value="a" description="Hidden by null." parts={{ description: null }}>
            null hides the description
          </Radio>
          <Radio value="b" parts={{ label: (p) => <Radio.Label>{p.children} (wrapped)</Radio.Label> }}>
            A function wraps the label
          </Radio>
          <Radio value="c" parts={{ label: <Radio.Label>A node replaces the label</Radio.Label> }}>
            Replaced
          </Radio>
        </RadioGroup>
      </div>
      <div style={column}>
        <Caption>Blocks, default variant</Caption>
        <RadioGroup.Root defaultValue="a">
          <RadioGroup.Label>Composed by hand</RadioGroup.Label>
          <RadioGroup.Description>Root, Label, Description, Options and Error.</RadioGroup.Description>
          <RadioGroup.Options>
            <Radio.Root value="a">
              <Radio.Mark />
              <Radio.Label>Item 1</Radio.Label>
              <Radio.Description>Root, Mark, Label and Description.</Radio.Description>
            </Radio.Root>
            <Radio.Root value="b">
              <Radio.Mark />
              <Radio.Label>Item 2</Radio.Label>
            </Radio.Root>
          </RadioGroup.Options>
          <RadioGroup.Error>The error block makes the group invalid.</RadioGroup.Error>
        </RadioGroup.Root>
      </div>
      <div style={column}>
        <Caption>Blocks, card variant</Caption>
        <RadioGroup.Root variant="card" defaultValue="a" aria-label="Cards composed by hand">
          <RadioGroup.Options columns={1}>
            <Radio.Root value="a">
              <Radio.Mark />
              <Radio.Media>
                <Gauge />
              </Radio.Media>
              <Radio.Label>Item 1</Radio.Label>
              <Radio.Description>With the Media block.</Radio.Description>
            </Radio.Root>
            <Radio.Root value="b">
              <Radio.Mark />
              <Radio.Label>Item 2</Radio.Label>
            </Radio.Root>
          </RadioGroup.Options>
        </RadioGroup.Root>
      </div>
    </div>
  ),
};
