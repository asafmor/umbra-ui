import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { StarRating } from './StarRating';

const meta = {
  title: 'Inputs/StarRating',
  component: StarRating,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof StarRating>;
export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [value, setValue] = useState<number | null>(3);
  return (
    <>
      <StarRating aria-label="Controlled" clearable value={value} onChange={setValue} />
      <Log>Rating: {value ?? 'none'}.</Log>
    </>
  );
}

/** Display mode draws any value; input mode is a radio group. A full star is filled, an empty one an outline. */
export const States: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>Display (readOnly): any fraction</Caption>
        <StarRating readOnly value={0} />
        <StarRating readOnly value={2.5} />
        <StarRating readOnly value={3.7} showValue />
        <StarRating readOnly value={5} />
        <StarRating readOnly value={7} max={10} aria-label="Quality" />
        <Caption>No value, loading, disabled</Caption>
        <StarRating readOnly value={null} />
        <StarRating readOnly loading />
        <StarRating readOnly disabled value={4} />
      </div>
      <div style={column}>
        <Caption>Sizes</Caption>
        <StarRating readOnly size="small" value={3.5} />
        <StarRating readOnly value={3.5} />
        <StarRating readOnly size="large" value={3.5} />
        <StarRating size="small" aria-label="Small input" defaultValue={2} />
        <StarRating size="large" aria-label="Large input" defaultValue={2} />
      </div>
      <div style={column}>
        <Caption>Input: whole stars</Caption>
        <StarRating aria-label="Whole stars" defaultValue={3} />
        <Caption>Half steps</Caption>
        <StarRating aria-label="Half steps" step={0.5} defaultValue={2.5} showValue />
        <Caption>Clearable: press the chosen star again</Caption>
        <Controlled />
      </div>
      <div style={column}>
        <Caption>Disabled</Caption>
        <StarRating aria-label="Disabled" disabled defaultValue={2} />
        <Caption>Invalid</Caption>
        <StarRating aria-label="Invalid" invalid />
        <Caption>Seven stars</Caption>
        <StarRating aria-label="Seven stars" max={7} defaultValue={5} />
      </div>
    </div>
  ),
};

/** In a `FormField` the field names and describes the rating; in a form its value is sent under `name`. */
export const InField: Story = {
  render: () => (
    <div style={{ ...column, maxWidth: 460 }}>
      <DemoForm style={column}>
        <FormField label="Quality" description="How good the result was." required>
          <StarRating name="quality" defaultValue={4} />
        </FormField>
        <FormField label="Speed" optional>
          <StarRating name="speed" step={0.5} clearable />
        </FormField>
        <div>
          <Button type="submit" variant="accent">
            Save
          </Button>
        </div>
      </DemoForm>
      <FormField label="Service" error="Choose a rating.">
        <StarRating />
      </FormField>
      <FormField label="Last review" description="Display mode inside a field.">
        <StarRating readOnly value={3.5} />
      </FormField>
    </div>
  ),
};

/** The `parts` prop (node, `null`, function), another icon, then the same rating composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2)}>
      <div style={column}>
        <Caption>parts: a node replaces the value</Caption>
        <StarRating readOnly value={4} showValue parts={{ value: <strong>Very good</strong> }} />
        <Caption>parts: null hides it</Caption>
        <StarRating readOnly value={4} showValue parts={{ value: null }} />
        <Caption>parts: a function adjusts each star</Caption>
        <StarRating
          readOnly
          value={2.5}
          parts={{
            star: (p) => <StarRating.Star {...p} style={{ rotate: `${p.index * 12}deg` }} />,
          }}
        />
        <Caption>icon: any node</Caption>
        <StarRating aria-label="Hearts" icon={<Heart />} defaultValue={3} />
      </div>
      <div style={column}>
        <Caption>Blocks</Caption>
        <StarRating.Root readOnly value={2.5} max={3} aria-label="Composed by hand">
          <StarRating.Stars>
            <StarRating.Star index={0} />
            <StarRating.Star index={1} />
            <StarRating.Star index={2} />
          </StarRating.Stars>
          <StarRating.Value>2.5 / 3</StarRating.Value>
        </StarRating.Root>
        <StarRating.Root aria-label="Composed input" defaultValue={2}>
          <StarRating.Stars />
          <StarRating.Value />
        </StarRating.Root>
      </div>
    </div>
  ),
};

/** The value's text hides first; then the row is cut at its end, and the name still says the value. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {[200, 130, 60].map((width) => (
        <Width key={width} width={width}>
          <StarRating readOnly value={3.5} showValue />
        </Width>
      ))}
    </div>
  ),
};

/** Right to left: the first star is at the right, and a partial star fills from the right. */
export const RightToLeft: Story = {
  render: () => (
    <div style={column}>
      <StarRating readOnly value={2.5} showValue />
      <StarRating aria-label="Half steps" step={0.5} clearable defaultValue={1.5} />
    </div>
  ),
  globals: { direction: 'rtl' },
};

/** Loading holds the final layout: the stars and the value's text keep their room. */
export const Loading: Story = {
  render: () => (
    <div style={{ ...column, justifyItems: 'start' }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <div key={size} data-size-row={size} style={{ display: 'flex', gap: 24 }}>
          <StarRating readOnly loading size={size} value={3.5} showValue />
          <StarRating readOnly size={size} value={3.5} showValue />
        </div>
      ))}
    </div>
  ),
};
