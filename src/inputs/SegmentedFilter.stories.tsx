import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutGrid, List as ListIcon, Table } from 'lucide-react';
import { useState } from 'react';
import { Narrow, Row } from '../data/storyParts';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Rows } from '../stories/placeholders';
import { SegmentedFilter, type SegmentedFilterItem } from './SegmentedFilter';

const meta = {
  title: 'Inputs/SegmentedFilter',
  component: SegmentedFilter,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SegmentedFilter>;
export default meta;
type Story = StoryObj<typeof meta>;

const inbox: SegmentedFilterItem[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'tasks', label: 'Tasks', count: 4 },
  { id: 'unread', label: 'Unread', count: 8 },
];
const views: SegmentedFilterItem[] = [
  { id: 'table', label: 'Table', icon: <Table /> },
  { id: 'list', label: 'List', icon: <ListIcon /> },
  { id: 'grid', label: 'Grid', icon: <LayoutGrid /> },
];
const regions: SegmentedFilterItem[] = [
  { id: 'north', label: 'North', count: 12 },
  { id: 'south', label: 'South', count: 7 },
  { id: 'east', label: 'East', count: 0 },
  { id: 'west', label: 'West', count: 31, disabled: true },
];

/** Single selection: counts, icons, both sizes, full width, a disabled segment and a disabled control. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Single selection">
        <Row label="Counts">
          <SegmentedFilter aria-label="Messages" items={inbox} defaultValue="all" />
        </Row>
        <Row label="Icons">
          <SegmentedFilter aria-label="View" items={views} defaultValue="list" />
        </Row>
        <Row label="Small">
          <SegmentedFilter aria-label="Messages, small" items={inbox} defaultValue="tasks" size="small" />
        </Row>
        <Row label="None selected">
          <SegmentedFilter aria-label="Window mode" items={views.slice(0, 2)} />
        </Row>
        <Row label="Full width">
          <SegmentedFilter aria-label="Text size" items={inbox} defaultValue="new" fullWidth />
        </Row>
      </Card>
      <Card title="Disabled">
        <Row label="One segment">
          <SegmentedFilter aria-label="Regions" items={regions} defaultValue="south" />
        </Row>
        <Row label="All of it">
          <SegmentedFilter aria-label="Messages, disabled" items={inbox} defaultValue="all" disabled />
        </Row>
      </Card>
    </Columns>
  ),
};

function Filtered() {
  const [value, setValue] = useState<string | null>('all');
  const [changes, setChanges] = useState(0);
  return (
    <Card
      title="Filters the list below"
      parts={{
        toolbar: (
          <Card.Toolbar>
            <SegmentedFilter
              aria-label="Messages"
              items={inbox}
              value={value}
              onChange={(id) => {
                setValue(id);
                setChanges(changes + 1);
              }}
            />
          </Card.Toolbar>
        ),
      }}
    >
      <p style={{ margin: '0 0 8px', font: 'var(--umbra-font-label)' }}>
        Selected: {value}. Changes: {changes}
      </p>
      <Rows count={value === 'tasks' ? 4 : value === 'unread' ? 8 : 12} prefix="Message" />
    </Card>
  );
}

function Several() {
  const [values, setValues] = useState<string[]>(['north']);
  const [withAll, setWithAll] = useState<string[]>([]);
  const [one, setOne] = useState<string | null>(null);
  return (
    <Card title="Several at once">
      <Row label="Multiple">
        <SegmentedFilter
          aria-label="Regions"
          selectionMode="multiple"
          items={regions}
          values={values}
          onChange={setValues}
        />
      </Row>
      <p style={{ margin: '0 0 16px', font: 'var(--umbra-font-label)' }}>
        Regions: {values.join(', ') || 'none'}
      </p>
      <Row label={'With "All"'}>
        <SegmentedFilter
          aria-label="Regions or all"
          selectionMode="multiple"
          all
          allCount={50}
          items={regions}
          values={withAll}
          onChange={setWithAll}
        />
      </Row>
      <p style={{ margin: '0 0 16px', font: 'var(--umbra-font-label)' }}>
        Regions or all: {withAll.join(', ') || 'all'}
      </p>
      <Row label={'Single, "All"'}>
        <SegmentedFilter
          aria-label="One region or all"
          all
          allLabel="Any"
          items={regions}
          value={one}
          onChange={setOne}
        />
      </Row>
      <p style={{ margin: 0, font: 'var(--umbra-font-label)' }}>One region: {one ?? 'any'}</p>
    </Card>
  );
}

/** A filter in a card toolbar, multiple selection with its check marks, and the "All" segment. */
export const Selection: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Filtered />
      <Several />
    </Columns>
  ),
};

const long: SegmentedFilterItem[] = [
  { id: 'a', label: 'Open orders', count: 12 },
  { id: 'b', label: 'Waiting for review', count: 3 },
  { id: 'c', label: 'Closed this quarter', count: 148 },
  { id: 'd', label: 'Archived', count: 9 },
];

/** With less room the counts hide, then the labels truncate equally, then the last segments move into a menu. */
export const Narrowing: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Little room">
        {[620, 470, 300, 150].map((width) => (
          <div key={width} style={{ margin: '2px 0 12px' }}>
            <Narrow width={width}>
              <SegmentedFilter aria-label={`Orders at ${width}`} items={long} defaultValue="b" />
            </Narrow>
          </div>
        ))}
        <Narrow width={300}>
          <SegmentedFilter aria-label="Orders, full width" items={long} defaultValue="b" fullWidth />
        </Narrow>
        <div style={{ marginTop: 12 }}>
          <Narrow width={200}>
            <SegmentedFilter
              aria-label="Orders, several"
              items={long}
              selectionMode="multiple"
              defaultValues={['a', 'd']}
            />
          </Narrow>
        </div>
      </Card>
    </Columns>
  ),
};

/** Each part replaced by a function or a node and hidden with `null`, and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Parts and blocks">
        <Row label="Function">
          <SegmentedFilter
            aria-label="Count as a function"
            items={inbox}
            defaultValue="tasks"
            parts={{ count: (p) => <b data-part="count">· {p.children} open</b> }}
          />
        </Row>
        <Row label="Node">
          <SegmentedFilter
            aria-label="Check as a node"
            selectionMode="multiple"
            items={regions}
            defaultValues={['north', 'south']}
            parts={{ check: <span data-part="check">✓</span> }}
          />
        </Row>
        <Row label="Null">
          <SegmentedFilter
            aria-label="Counts and icons hidden"
            items={[...views, ...inbox.slice(2)]}
            defaultValue="grid"
            parts={{ count: null, icon: null }}
          />
        </Row>
        <Row label="Item">
          <SegmentedFilter
            aria-label="Item as a function"
            items={inbox}
            defaultValue="new"
            parts={{
              item: (p) => (
                <SegmentedFilter.Item {...p} style={{ textTransform: 'uppercase' }}>
                  {p.children}
                </SegmentedFilter.Item>
              ),
            }}
          />
        </Row>
        <Row label="Blocks">
          <SegmentedFilter.Root aria-label="By hand" defaultValue="week">
            <SegmentedFilter.Item id="day">Day</SegmentedFilter.Item>
            <SegmentedFilter.Item id="week" count={5}>
              Week
            </SegmentedFilter.Item>
            <SegmentedFilter.Item id="month" disabled>
              Month
            </SegmentedFilter.Item>
          </SegmentedFilter.Root>
        </Row>
      </Card>
    </Columns>
  ),
};
