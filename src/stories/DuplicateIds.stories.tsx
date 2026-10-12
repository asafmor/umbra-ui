import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../basics/Button';
import { List } from '../data/List';
import { SearchField } from '../inputs/SearchField';
import { SegmentedFilter } from '../inputs/SegmentedFilter';
import { Select } from '../inputs/Select';
import { SplitButton } from '../inputs/SplitButton';
import { Tabs } from '../inputs/Tabs';
import { Menu } from '../overlays/Menu';

// An app's mistake must not take the page down: two rows with one id. Every component that draws rows
// from ids draws both, and warns in development (`tests/visual/inputs-tier2.spec.ts`).
const meta = { title: 'Integration/Duplicate ids', parameters: { frame: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { id: 'a', label: 'First' },
  { id: 'a', label: 'Second' },
  { id: 'b', label: 'Third' },
];

export const Rows: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'start' }}>
      <Menu items={rows} trigger={<Button>Open menu</Button>} />
      <SplitButton items={rows} menuLabel="More saves">
        Save
      </SplitButton>
      <Select aria-label="Select" options={rows} placeholder="Choose" />
      <div style={{ width: 200 }}>
        <SearchField aria-label="Search" suggestions={rows} />
      </div>
      <SegmentedFilter aria-label="Segments" items={rows} defaultValue="b" />
      <div style={{ width: 260, height: 160, display: 'flex' }}>
        <List aria-label="List">
          {rows.map((row, index) => (
            <List.Item key={index} id={row.id} title={row.label} />
          ))}
        </List>
      </div>
      <div style={{ width: 300 }}>
        <Tabs aria-label="Tabs" items={rows.map((row) => ({ ...row, content: `Panel of ${row.label}` }))} />
      </div>
    </div>
  ),
};
