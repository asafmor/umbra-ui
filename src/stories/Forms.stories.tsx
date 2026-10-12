import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { Checkbox, CheckboxGroup } from '../inputs/Checkbox';
import { ColorScaleEditor } from '../inputs/ColorScaleEditor';
import { FormField } from '../inputs/FormField';
import { Radio, RadioGroup } from '../inputs/Radio';
import { DemoForm } from '../inputs/samples';
import { SearchField } from '../inputs/SearchField';
import { Select } from '../inputs/Select';
import { Slider } from '../inputs/Slider';
import { StarRating } from '../inputs/StarRating';
import { Stepper } from '../inputs/Stepper';
import { TextField } from '../inputs/TextField';
import { Toggle } from '../inputs/Toggle';
import type { Threshold } from '../utils/thresholds';

// Every input that takes `name`, tier 1 and tier 2, in one native form: what `tests/visual/forms.spec.ts`
// holds them all to. A control added to the library is added here.
const meta = { title: 'Integration/Forms', parameters: { frame: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' },
  { id: 'c', label: 'Option C' },
];
const stops: Threshold[] = [
  { from: 0, tone: 'success' },
  { from: 50, tone: 'danger' },
];

const columns: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '8px 24px',
  alignItems: 'start',
};
const column: CSSProperties = { display: 'grid', gap: 8, minWidth: 0 };

/** `empty` leaves out the starting values; `required` and `disabled` are set on every field. */
function AllInputs({
  empty = false,
  required = false,
  disabled = false,
}: {
  empty?: boolean;
  required?: boolean;
  disabled?: boolean;
}) {
  const field = { layout: 'stacked', required, disabled } as const;
  const start = <T,>(value: T) => (empty ? undefined : value);
  return (
    <DemoForm style={{ display: 'grid', gap: 12 }}>
      <div style={columns}>
        <div style={column}>
          <FormField {...field} label="Text" data-field="text">
            <TextField name="text" defaultValue={start('one')} />
          </FormField>
          <FormField {...field} label="Search" data-field="search">
            <SearchField name="search" defaultValue={start('two')} />
          </FormField>
          <FormField {...field} label="Select" data-field="select">
            <Select name="select" options={options} defaultValue={start('a')} />
          </FormField>
          <FormField {...field} label="Checkbox" data-field="checkbox">
            <Checkbox name="checkbox" defaultChecked={!empty}>
              Agreed
            </Checkbox>
          </FormField>
        </div>
        <div style={column}>
          <FormField {...field} label="Checkboxes" data-field="checks">
            <CheckboxGroup name="checks" defaultValue={start(['a'])} orientation="horizontal">
              <Checkbox value="a">A</Checkbox>
              <Checkbox value="b">B</Checkbox>
            </CheckboxGroup>
          </FormField>
          <FormField {...field} label="Radios" data-field="radio">
            <RadioGroup name="radio" defaultValue={start('a')} orientation="horizontal">
              <Radio value="a">A</Radio>
              <Radio value="b">B</Radio>
            </RadioGroup>
          </FormField>
          <FormField {...field} label="Rating" data-field="rating">
            <StarRating name="rating" defaultValue={start(3)} />
          </FormField>
          <FormField {...field} label="Stepper" data-field="stepper">
            <Stepper name="stepper" max={10} defaultValue={start(3)} />
          </FormField>
        </div>
        {/* These three always have a value: nothing to require. */}
        {!required && (
          <>
            <div style={column}>
              <FormField {...field} label="Toggle" data-field="toggle">
                <Toggle name="toggle" defaultChecked>
                  On
                </Toggle>
              </FormField>
              <FormField {...field} label="Slider" data-field="slider">
                <Slider name="slider" defaultValue={30} />
              </FormField>
              {/* A value outside the scale is shown held inside it, and sent as it is shown. */}
              <FormField {...field} label="Held" data-field="held">
                <Stepper name="held" max={10} defaultValue={15} />
              </FormField>
              {/* Without a name a control sends nothing. */}
              <StarRating aria-label="Unnamed rating" defaultValue={2} disabled={disabled} />
              <RadioGroup aria-label="Unnamed radios" defaultValue="a" orientation="horizontal">
                <Radio value="a">A</Radio>
                <Radio value="b">B</Radio>
              </RadioGroup>
            </div>
            <div style={column}>
              <FormField {...field} label="Scale" data-field="scale">
                <ColorScaleEditor name="scale" defaultValue={stops} parts={{ preview: null }} />
              </FormField>
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="accent">
          Save
        </Button>
        <Button type="reset">Start over</Button>
      </div>
    </DemoForm>
  );
}

/** Each control sends its value under its name, and goes back to its starting value on a native reset. */
export const Values: Story = { render: () => <AllInputs /> };

/** A required control left empty holds the form back, and its field says why. */
export const Required: Story = { render: () => <AllInputs empty required /> };

/** A disabled control sends nothing. */
export const Disabled: Story = { render: () => <AllInputs disabled /> };
