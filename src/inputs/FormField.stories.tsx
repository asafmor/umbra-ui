import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gauge, Rabbit, Turtle } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { SectionTitle } from '../layout/SectionTitle';
import { Log } from '../stories/placeholders';
import { Checkbox, CheckboxGroup } from './Checkbox';
import { FormField } from './FormField';
import { Radio, RadioGroup } from './Radio';
import { Caption, column, grid, Width } from './samples';
import { TextField } from './TextField';
import { Toggle } from './Toggle';

const meta = {
  title: 'Inputs/FormField',
  component: FormField,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;

// Styled in full, so the capture does not depend on the system's form control look.
const plain: CSSProperties = {
  font: 'inherit',
  color: 'inherit',
  width: 160,
  padding: '4px 8px',
  border: '1px solid var(--umbra-color-base-border-control)',
  borderRadius: 4,
  background: 'var(--umbra-color-base-surface1)',
};

/** `row`, the default, and `stacked`: the markers, an error, a raised surface and a disabled field. */
export const Layouts: Story = {
  render: () => (
    <div style={grid(2, 24)}>
      <div style={column}>
        <Caption>row (default): text at the start, control at the end</Caption>
        <FormField label="Sound" description="Play a sound when a report is ready.">
          <Toggle defaultChecked />
        </FormField>
        <FormField label="Display name" description="Shown to the people you share with." required>
          <TextField defaultValue="Person A" style={{ width: 160 }} />
        </FormField>
        <FormField label="Reference" optional error="Use letters and digits only.">
          <TextField defaultValue="A 12!" style={{ width: 160 }} />
        </FormField>
        <FormField label="Archive" description="Disabled through the field." disabled>
          <Checkbox />
        </FormField>
        <Caption>surface: a raised row, as in a settings list</Caption>
        <FormField surface label="Sound" description="Play a sound when a report is ready.">
          <Toggle defaultChecked />
        </FormField>
      </div>
      <div style={column}>
        <Caption>stacked: label above the control</Caption>
        <FormField layout="stacked" label="Display name" description="Shown to the people you share with.">
          <TextField defaultValue="Person A" />
        </FormField>
        <FormField layout="stacked" label="Email" required error="Enter an email address.">
          <TextField type="email" defaultValue="person.a@" />
        </FormField>
        <FormField layout="stacked" label="Summary" optional optionalLabel="Not needed">
          <RadioGroup orientation="horizontal" defaultValue="weekly">
            <Radio value="daily">Daily</Radio>
            <Radio value="weekly">Weekly</Radio>
          </RadioGroup>
        </FormField>
      </div>
    </div>
  ),
};

/** `inline`, and `labelWidth`, which lines up the controls of several fields. */
export const Inline: Story = {
  render: () => (
    <div style={grid(2, 24)}>
      <div style={column}>
        <Caption>inline: label and control on one line; description and error under the control</Caption>
        <FormField layout="inline" label="Name" labelWidth={64}>
          <TextField defaultValue="Person A" />
        </FormField>
        <FormField layout="inline" label="Email" labelWidth={64} error="Enter an email address.">
          <TextField type="email" defaultValue="person.a@" />
        </FormField>
        <FormField layout="inline" label="Notes" labelWidth={64} description="Up to 200 characters.">
          <TextField multiline rows={2} />
        </FormField>
        <Caption>inline without labelWidth: the label takes the width of its text</Caption>
        <FormField layout="inline" label="Show reviewed items only">
          <Toggle defaultChecked />
        </FormField>
      </div>
      <div style={column}>
        <Caption>row with labelWidth: the control starts after the label column and fills the rest</Caption>
        <FormField label="Name" labelWidth={140} description="Shown to the people you share with.">
          <TextField defaultValue="Person A" />
        </FormField>
        <FormField label="Reference" labelWidth={140} optional>
          <TextField defaultValue="A 12" />
        </FormField>
        <FormField label="Width" labelWidth="30%" description="labelWidth takes any CSS width.">
          <TextField type="number" defaultValue="30" suffix="%" />
        </FormField>
      </div>
    </div>
  ),
};

function SettingsForm() {
  const [sent, setSent] = useState('nothing yet');
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  const missing = tried && name.trim() === '';
  return (
    <form
      // The story validates by itself; without this the browser stops a submit with an empty required field.
      noValidate
      style={{ display: 'flex', height: '100%', minHeight: 0 }}
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        if (name.trim() === '') return setSent('nothing: the name is missing');
        setSent(JSON.stringify([...new FormData(event.currentTarget).entries()]));
      }}
    >
      <Columns style={{ flex: 1 }}>
        <Card title="Preferences" size={3} parts={{ footer: <SettingsFooter sent={sent} /> }}>
          <div style={{ ...column, gap: 6 }}>
            <SectionTitle>General</SectionTitle>
            <FormField
              surface
              label="Display name"
              description="Shown to the people you share with."
              required
              error={missing ? 'Enter a name.' : undefined}
            >
              <TextField name="name" value={name} onChange={setName} clearable style={{ width: 220 }} />
            </FormField>
            <FormField
              surface
              label="Sort names in one language"
              description="Use the same order whatever the language of the screen."
            >
              <Checkbox name="sort" />
            </FormField>
            <FormField
              surface
              label="Show the editor in the menu"
              description="Adds an entry to the menu bar."
            >
              <Checkbox name="editor" defaultChecked />
            </FormField>
            <SectionTitle>Sound</SectionTitle>
            <FormField surface label="Sound" description="Play a sound when a report is ready.">
              <Toggle name="sound" defaultChecked />
            </FormField>
            <FormField surface label="Volume" description="From 0 to 100.">
              <TextField name="volume" type="number" defaultValue="60" suffix="%" style={{ width: 96 }} />
            </FormField>
          </div>
        </Card>
        <Card title="Review" size={2}>
          <div style={column}>
            <RadioGroup
              variant="card"
              name="pace"
              label="Review pace"
              description="How often the review stops for you."
              defaultValue="even"
            >
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
            <CheckboxGroup
              label="Notify me about"
              name="notify"
              defaultValue={['orders']}
              orientation="horizontal"
            >
              <Checkbox value="orders">Orders</Checkbox>
              <Checkbox value="returns">Returns</Checkbox>
            </CheckboxGroup>
          </div>
        </Card>
      </Columns>
    </form>
  );
}

function SettingsFooter({ sent }: { sent: string }) {
  return (
    <Card.Footer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Log>Sent: {sent}</Log>
      </div>
    </Card.Footer>
  );
}

/** A settings screen: raised rows in a card that scrolls, option cards, and one form around it all. */
export const Settings: Story = { render: () => <SettingsForm /> };

/** Step 1: below 20em a `row` or `inline` field stacks, and its control moves under the text. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      {[520, 360, 280].map((width) => (
        <Width key={width} width={width}>
          <FormField
            label="Display name"
            description="Shown to the people you share with."
            error="Enter a name."
            required
          >
            <TextField aria-label={`Name at ${width}px`} style={{ width: 160 }} />
          </FormField>
          <FormField layout="inline" label="Sound" description="Play a sound when a report is ready.">
            <Toggle defaultChecked />
          </FormField>
        </Width>
      ))}
    </div>
  ),
};

/** A plain form element through a render function, the `parts` prop (node, `null`, function), and the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(3, 24)}>
      <div style={column}>
        <Caption>A plain input: spread what the function receives</Caption>
        <FormField
          label="Plain input"
          description="Not an umbra-ui control."
          error="Still announced."
          required
        >
          {(control) => <input {...control} type="text" defaultValue="abc" style={plain} />}
        </FormField>
        <FormField layout="stacked" label="Plain, disabled" disabled>
          {(control) => <input {...control} type="text" defaultValue="abc" style={plain} />}
        </FormField>
      </div>
      <div style={column}>
        <Caption>parts</Caption>
        <FormField
          label="A node replaces the description"
          description="Replaced."
          parts={{ description: <FormField.Description>A node.</FormField.Description> }}
        >
          <Toggle />
        </FormField>
        <FormField label="null hides the error text" error="Hidden." parts={{ error: null }}>
          <TextField defaultValue="Still invalid" style={{ width: 140 }} />
        </FormField>
        <FormField
          label="A function wraps the label"
          parts={{ label: (p) => <FormField.Label>{p.children} (wrapped)</FormField.Label> }}
        >
          <Checkbox />
        </FormField>
      </div>
      <div style={column}>
        <Caption>Blocks: Root, Label, Description, Control, Error</Caption>
        <FormField.Root layout="stacked" required requiredLabel="Needed">
          <FormField.Label>Composed by hand</FormField.Label>
          <FormField.Description>The blocks wire themselves to the control.</FormField.Description>
          <FormField.Control>
            <TextField defaultValue="Person A" />
          </FormField.Control>
          <FormField.Error>The error block makes the control invalid.</FormField.Error>
        </FormField.Root>
      </div>
    </div>
  ),
};
