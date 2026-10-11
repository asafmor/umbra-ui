import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronsUpDown, Eye, Globe, LayoutGrid, List as ListIcon, Rows3 } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { Avatar } from '../data/Avatar';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { portrait } from '../stories/dataValues';
import { Log } from '../stories/placeholders';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { Select, type SelectEntry, type SelectOption } from './Select';

const meta = {
  title: 'Inputs/Select',
  component: Select,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

const frequency: SelectOption[] = [
  { id: 'always', label: 'Every time' },
  { id: 'needed', label: 'When an item needs a review or was left out of the last report' },
  { id: 'never', label: 'Never' },
];

const views: SelectOption[] = [
  { id: 'summary', label: 'Summary', icon: <LayoutGrid /> },
  { id: 'detail', label: 'Detail', icon: <Rows3 /> },
  { id: 'compact', label: 'Compact', icon: <ListIcon /> },
];

const regions: SelectEntry[] = [
  {
    type: 'section',
    label: 'North',
    options: [
      { id: 'region-1', label: 'Region 1', meta: '12' },
      { id: 'region-2', label: 'Region 2', meta: '8' },
      { id: 'region-3', label: 'Region 3', meta: '0', disabled: true },
    ],
  },
  {
    type: 'section',
    label: 'South',
    options: [
      { id: 'region-4', label: 'Region 4', meta: '21' },
      { id: 'region-5', label: 'Region 5', meta: '3' },
    ],
  },
];

const people: SelectOption[] = ['A', 'B', 'C', 'D'].map((letter, i) => ({
  id: `person-${letter.toLowerCase()}`,
  label: `Person ${letter}`,
  description: ['Lead reviewer', 'Assistant reviewer', 'Analyst', 'Coordinator'][i],
  // An image, not initials: initials would be text in the trigger that is not part of its name.
  avatar: <Avatar src={portrait} alt="" size="sm" />,
}));

const roles: SelectOption[] = [
  { id: 'owner', label: 'Owner', description: 'Full access, including billing', tone: 'accent' },
  { id: 'editor', label: 'Editor', description: 'Can change content', tone: 'success' },
  { id: 'viewer', label: 'Viewer', description: 'Read only', tone: 'info' },
  { id: 'guest', label: 'Guest', description: 'One project', color: '#c2128a' },
];

const stages: SelectOption[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In review', tone: 'warning' },
  { id: 'done', label: 'Done', tone: 'success' },
  { id: 'blocked', label: 'Blocked', tone: 'danger' },
  { id: 'special', label: 'Special', color: '#6a1fd6' },
];

const items: SelectOption[] = Array.from({ length: 24 }, (_, i) => ({
  id: `item-${i + 1}`,
  label: `Item ${i + 1}`,
}));

function Controlled() {
  const [value, setValue] = useState('detail');
  return (
    <>
      <Select aria-label="Controlled" options={views} value={value} onChange={setValue} clearable />
      <Log>Value: "{value}".</Log>
    </>
  );
}

/** Every variant and state, closed. An invalid select shows an icon as well as the danger border. */
export const States: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>Default</Caption>
        <Select aria-label="Empty" options={frequency} placeholder="Choose when" />
        <Select aria-label="With a value" options={frequency} defaultValue="always" />
        <Select aria-label="With an icon" options={views} defaultValue="summary" />
        <Caption>Clearable, controlled</Caption>
        <Controlled />
      </div>
      <div style={column}>
        <Caption>Ghost</Caption>
        <Select aria-label="Ghost" variant="ghost" options={views} defaultValue="summary" />
        <Select aria-label="Ghost, empty" variant="ghost" options={views} placeholder="View" />
        <Caption>Small</Caption>
        <Select aria-label="Small" size="small" options={views} defaultValue="detail" />
        <Select
          aria-label="Small ghost"
          size="small"
          variant="ghost"
          options={frequency}
          defaultValue="never"
        />
      </div>
      <div style={column}>
        <Caption>Invalid</Caption>
        <Select aria-label="Invalid" invalid options={frequency} />
        <Caption>Disabled</Caption>
        <Select aria-label="Disabled" disabled clearable options={frequency} defaultValue="always" />
        <Caption>Read-only</Caption>
        <Select aria-label="Read-only" readOnly clearable options={frequency} defaultValue="never" />
      </div>
      <div style={column}>
        <Caption>Full width</Caption>
        <Select aria-label="Full width" fullWidth options={views} defaultValue="compact" />
        <Caption>A long label truncates</Caption>
        <Select aria-label="Long" fullWidth options={frequency} defaultValue="needed" />
        <Caption>Two lines in the trigger</Caption>
        <Select aria-label="Reviewer" fullWidth valueDescription options={people} defaultValue="person-a" />
      </div>
    </div>
  ),
};

/** The open list: sections, a disabled option, text at the end of a row, and the check on the chosen one. */
export const Open: Story = {
  render: () => <Select aria-label="Region" options={regions} defaultValue="region-2" defaultOpen />,
};

/** Rich options: an avatar, a name and a second line, in the list and in the trigger. */
export const RichOptions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 280, alignItems: 'start' }}>
      <Select aria-label="Reviewer" valueDescription options={people} defaultValue="person-b" defaultOpen />
      <div style={{ ...column, width: 260 }}>
        <Caption>Colour swatches</Caption>
        <Select aria-label="Role" fullWidth valueDescription options={roles} defaultValue="editor" />
        <Caption>renderOption and renderValue</Caption>
        <Select
          aria-label="Custom"
          fullWidth
          options={roles}
          defaultValue="owner"
          renderValue={([role]) => <strong>Role: {role?.label}</strong>}
          renderOption={(option, { selected }) => (
            <span>
              {selected ? 'Current: ' : ''}
              <em>{option.label}</em>
            </span>
          )}
        />
      </div>
    </div>
  ),
};

function Several({ width }: { width: number }) {
  const [values, setValues] = useState(['region-1', 'region-2', 'region-4']);
  return (
    <Width width={width}>
      <Select
        aria-label={`Regions at ${width}`}
        fullWidth
        multiple
        options={regions}
        values={values}
        onValuesChange={setValues}
      />
      <Log>Values: {values.join(', ') || 'none'}.</Log>
    </Width>
  );
}

/** Several choices. The trigger shows the labels, then how many are chosen when they do not fit. */
export const Multiple: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      <div style={{ ...column, width: 280 }}>
        <Caption>Open: options show checkboxes</Caption>
        <Select
          aria-label="Regions"
          multiple
          clearable
          options={regions}
          defaultValues={['region-1', 'region-4']}
          defaultOpen
        />
      </div>
      <Several width={360} />
      <Several width={180} />
    </div>
  ),
};

function Filtered() {
  const [search, setSearch] = useState('');
  const [value, setValue] = useState('item-3');
  return (
    <div style={{ display: 'flex', gap: 320, alignItems: 'start' }}>
      <Select
        aria-label="Item"
        searchable
        searchPlaceholder="Filter items"
        options={items}
        value={value}
        onChange={setValue}
        onSearchChange={setSearch}
        defaultOpen
      />
      <Log>
        Value: "{value}". Search: "{search}".
      </Log>
    </div>
  );
}

/** A filter field inside the list: typing filters the options; the arrow keys and Enter still choose. */
export const Searchable: Story = { render: () => <Filtered /> };

/** While loading without options the list shows skeleton rows. */
export const Loading: Story = {
  render: () => (
    <Select aria-label="Item" searchable loading options={[]} placeholder="Choose an item" defaultOpen />
  ),
};

/** No options at all. */
export const Empty: Story = {
  render: () => (
    <Select
      aria-label="Item"
      options={[]}
      placeholder="Choose an item"
      empty={{ title: 'No items yet', description: 'Items you create appear here.' }}
      defaultOpen
    />
  ),
};

function Failing() {
  const [tries, setTries] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 320, alignItems: 'start' }}>
      <Select
        aria-label="Item"
        options={items}
        placeholder="Choose an item"
        error="The items could not be loaded"
        onRetry={() => setTries(tries + 1)}
        defaultOpen
      />
      <Log>Retries: {tries}.</Log>
    </div>
  );
}

/** An error takes the place of the options, with a retry action. */
export const ErrorState: Story = { render: () => <Failing /> };

/** Inside a `FormField` the select takes the field's label, description, error and required state. */
export const InFormField: Story = {
  render: () => (
    <div style={grid(2)}>
      <DemoForm style={column}>
        <FormField label="Role" description="What this person may do." required>
          <Select name="role" options={roles} placeholder="Choose a role" />
        </FormField>
        <FormField label="Regions" layout="stacked">
          <Select name="regions" fullWidth multiple options={regions} />
        </FormField>
        <FormField label="Reviewer" layout="inline" disabled>
          <Select name="reviewer" options={people} defaultValue="person-c" />
        </FormField>
        <FormField label="View" layout="inline">
          <Select name="view" clearable options={views} defaultValue="detail" />
        </FormField>
        <div>
          <Button type="submit" variant="accent">
            Save
          </Button>
        </div>
      </DemoForm>
      {/* An invalid control holds its form back, so this one is outside the form. */}
      <FormField label="Stage" layout="stacked" error="Choose a stage">
        <Select options={stages} placeholder="Stage" />
      </FormField>
    </div>
  ),
};

/** Ghost selects in a card's toolbar and header, as view and filter pickers. */
export const InToolbar: Story = {
  render: () => (
    <Columns style={{ height: 240 }}>
      <Card
        title="Orders"
        actions={<Select aria-label="View" variant="ghost" options={views} defaultValue="summary" />}
        parts={{
          toolbar: (
            <Card.Toolbar>
              <Select
                aria-label="Region"
                variant="ghost"
                size="small"
                options={regions}
                defaultValue="region-1"
              />
              <Select
                aria-label="Stage"
                variant="ghost"
                size="small"
                options={stages}
                placeholder="Stage"
                clearable
              />
              <Select
                aria-label="Items"
                size="small"
                searchable
                multiple
                options={items}
                placeholder="Items"
              />
            </Card.Toolbar>
          ),
        }}
      >
        <Log>The card's content.</Log>
      </Card>
    </Columns>
  ),
};

const cell: CSSProperties = {
  padding: 0,
  height: 'var(--umbra-density-table-row)',
  borderBottom: '1px solid var(--umbra-color-base-border-strong)',
};
const text: CSSProperties = {
  ...cell,
  padding: '0 8px',
  font: 'var(--umbra-font-table-cell)',
  textAlign: 'start',
};

/** `inCell` fills a table cell. The chosen option's colour fills the trigger; its label says the same in text. */
export const InCell: Story = {
  render: () => (
    <table style={{ width: 420, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th style={{ ...text, width: 120 }}>Stage</th>
          <th style={text}>Order</th>
          <th style={{ ...text, width: 120 }}>Owner</th>
        </tr>
      </thead>
      <tbody>
        {stages.map((stage, i) => (
          <tr key={stage.id}>
            <td style={cell}>
              <Select
                aria-label={`Stage of order ${i + 1}`}
                variant="inCell"
                size="small"
                options={stages}
                defaultValue={stage.id}
              />
            </td>
            <td style={text}>Order {i + 1}</td>
            <td style={cell}>
              <Select
                aria-label={`Owner of order ${i + 1}`}
                variant="inCell"
                size="small"
                options={people.map(({ id, label }) => ({ id, label }))}
                defaultValue={people[i % people.length]!.id}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/** Every kind of part (a node, `null`, a function), and the same select composed from its blocks. */
export const Parts: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>icon: a node</Caption>
        <Select
          aria-label="Custom caret"
          options={views}
          defaultValue="summary"
          parts={{ icon: <ChevronsUpDown /> }}
        />
        <Caption>icon: null</Caption>
        <Select aria-label="No caret" options={views} defaultValue="summary" parts={{ icon: null }} />
      </div>
      <div style={column}>
        <Caption>value: a function</Caption>
        <Select
          aria-label="Wrapped value"
          options={views}
          defaultValue="detail"
          parts={{
            value: (p) => (
              <>
                <Eye size={16} aria-hidden="true" style={{ marginInlineEnd: 6 }} />
                <Select.Value {...p} />
              </>
            ),
          }}
        />
        <Caption>option and check: functions</Caption>
        <Select
          aria-label="Wrapped options"
          options={views}
          defaultValue="detail"
          parts={{
            option: ({ option, children }) => (
              <>
                {children}
                <small>#{option.id}</small>
              </>
            ),
            check: () => <Globe />,
          }}
        />
      </div>
      <div style={column}>
        <Caption>empty: a node</Caption>
        <Select
          aria-label="Custom empty"
          options={[]}
          parts={{ empty: <p style={{ margin: 12 }}>Nothing here.</p> }}
        />
        <Caption>Option and Section blocks as children</Caption>
        <Select aria-label="From children" defaultValue="b">
          <Select.Option id="a">Option A</Select.Option>
          <Select.Section label="More">
            <Select.Option id="b" description="The second one">
              Option B
            </Select.Option>
            <Select.Option id="c" disabled>
              Option C
            </Select.Option>
          </Select.Section>
        </Select>
      </div>
      <div style={column}>
        <Caption>Composed from the blocks</Caption>
        <Select.Root aria-label="By hand" options={roles} defaultValue="viewer">
          <Select.Trigger>
            <Eye size={16} aria-hidden="true" style={{ marginInlineEnd: 6 }} />
            <Select.Value />
          </Select.Trigger>
          <Select.Popover matchTriggerWidth />
        </Select.Root>
      </div>
    </div>
  ),
};

const corner = (place: CSSProperties): CSSProperties => ({ position: 'absolute', ...place });

/** The list opens under the trigger, flips above it near the bottom edge, and scrolls inside when it is tall. */
export const Placement: Story = {
  render: () => (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={corner({ top: 0, left: 0 })}>
        <Select aria-label="Top start" options={items} defaultValue="item-1" />
      </div>
      <div style={corner({ top: 0, right: 0 })}>
        <Select aria-label="Top end" options={frequency} defaultValue="always" placement="bottom end" />
      </div>
      <div style={corner({ bottom: 0, left: 0 })}>
        <Select aria-label="Bottom start" options={items} defaultValue="item-1" />
      </div>
      <div style={corner({ bottom: 0, right: 0 })}>
        <Select aria-label="Bottom end" options={frequency} defaultValue="never" matchTriggerWidth />
      </div>
    </div>
  ),
};

/** Right to left: the caret, the clear button and the invalid icon are on the left. */
export const RightToLeft: Story = { ...States, globals: { direction: 'rtl' } };
