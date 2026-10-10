import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartLine, ClipboardList, Plus, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Narrow } from '../data/storyParts';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { Rows } from '../stories/placeholders';
import { Tabs, type TabsItem, type TabsVariant } from './Tabs';

const meta = {
  title: 'Inputs/Tabs',
  component: Tabs,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants: TabsVariant[] = ['underline', 'pill', 'button-group'];

const panel = (prefix: string, count = 30) => (
  <Card aria-label={prefix} padding="none">
    <Rows count={count} prefix={prefix} />
  </Card>
);

const sections: TabsItem[] = [
  { id: 'orders', label: 'Orders', icon: <ClipboardList />, count: 12, content: panel('Order') },
  { id: 'people', label: 'People', icon: <Users />, count: 5, content: panel('Person') },
  { id: 'reports', label: 'Reports', icon: <ChartLine />, content: panel('Report') },
  { id: 'settings', label: 'Settings', icon: <Settings />, disabled: true, content: panel('Setting') },
];
const plain: TabsItem[] = sections.map(({ id, label, disabled, content }) => ({
  id,
  label,
  disabled,
  content,
}));

/** The three variants, each at the default size, small and full width. The panel fills what is left. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      {variants.map((variant) => (
        <Stack key={variant}>
          <Tabs aria-label={`${variant}, default`} variant={variant} items={sections} size={2} />
          <Tabs aria-label={`${variant}, small`} variant={variant} items={sections} tabSize="small" />
          <Tabs aria-label={`${variant}, full width`} variant={variant} items={plain} fullWidth />
        </Stack>
      ))}
    </Columns>
  ),
};

/** A vertical list sits beside its panel. Up and Down move between the tabs. */
export const Vertical: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      {variants.map((variant) => (
        <Tabs
          key={variant}
          aria-label={`${variant}, vertical`}
          variant={variant}
          orientation="vertical"
          items={sections}
          defaultValue="people"
        />
      ))}
    </Columns>
  ),
};

/**
 * Tabs inside a card: `Tabs.Root` wraps the card, the list sits in the card's toolbar and the panels in
 * its body. Beside it, tabs as a layout child of the columns.
 */
export const InCard: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Tabs.Root defaultValue="orders" variant="button-group" tabSize="small">
        <Card
          title="Activity"
          parts={{
            toolbar: (
              <Card.Toolbar>
                <Tabs.List aria-label="Activity">
                  <Tabs.Tab id="orders" count={12}>
                    Orders
                  </Tabs.Tab>
                  <Tabs.Tab id="people" count={5}>
                    People
                  </Tabs.Tab>
                  <Tabs.Tab id="reports">Reports</Tabs.Tab>
                </Tabs.List>
              </Card.Toolbar>
            ),
          }}
        >
          <Tabs.Panel id="orders">
            <Rows count={30} prefix="Order" />
          </Tabs.Panel>
          <Tabs.Panel id="people">
            <Rows count={5} prefix="Person" />
          </Tabs.Panel>
          <Tabs.Panel id="reports">
            <Rows count={12} prefix="Report" />
          </Tabs.Panel>
        </Card>
      </Tabs.Root>
      <Tabs aria-label="Sections" items={sections} variant="pill" />
    </Columns>
  ),
};

function Clicks({ name }: { name: string }) {
  const [clicks, setClicks] = useState(0);
  return (
    <div>
      <Button onPress={() => setClicks(clicks + 1)}>
        {name} clicks: {clicks}
      </Button>
    </div>
  );
}

const stateful: TabsItem[] = ['Orders', 'People', 'Reports'].map((name) => ({
  id: name.toLowerCase(),
  label: name,
  content: <Clicks name={name} />,
}));

function Closable() {
  const [open, setOpen] = useState(['Report 1', 'Report 2', 'Report 3']);
  const [value, setValue] = useState('Report 2');
  const [made, setMade] = useState(3);
  return (
    <Tabs
      aria-label="Open reports"
      variant="pill"
      value={value}
      onChange={setValue}
      onClose={(id) => setOpen(open.filter((name) => name !== id))}
      items={[
        { id: 'home', label: 'Home', closable: false, content: <p>Open reports: {open.length}</p> },
        ...open.map((name) => ({ id: name, label: name, content: <p>The content of {name}</p> })),
      ]}
      end={
        <IconButton
          icon={<Plus />}
          label="Add report"
          onPress={() => {
            setOpen([...open, `Report ${made + 1}`]);
            setValue(`Report ${made + 1}`);
            setMade(made + 1);
          }}
        />
      }
    />
  );
}

function Counted() {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <Stack>
      <Tabs
        aria-label="Manual activation"
        activation="manual"
        items={sections}
        onChange={(id) => setChanges([...changes, id])}
      />
      <p style={{ flex: 'none', margin: 0, font: 'var(--umbra-font-label)' }}>
        Changes: {changes.join(', ') || 'none'}
      </p>
    </Stack>
  );
}

/**
 * Manual activation (arrow keys move focus, Enter or Space selects), panels that stay mounted and keep
 * their state against panels that are unmounted, and closable tabs with an "add" button.
 */
export const Behaviour: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Counted />
      <Stack>
        <Tabs aria-label="Kept mounted" variant="button-group" keepMounted items={stateful} />
        <Tabs aria-label="Unmounted" variant="button-group" items={stateful} />
      </Stack>
      <Closable />
    </Columns>
  ),
};

const many: TabsItem[] = [
  { id: 'orders', label: 'Open orders', icon: <ClipboardList />, count: 12 },
  { id: 'people', label: 'People and teams', icon: <Users />, count: 5 },
  { id: 'reports', label: 'Quarterly reports', icon: <ChartLine />, count: 148 },
  { id: 'settings', label: 'Settings', count: 2 },
  { id: 'archive', label: 'Archive' },
];

/**
 * With less room the counts hide, then a tab with an icon shows the icon only, then the list scrolls
 * inside itself and keeps the selected tab in view.
 */
export const Narrowing: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Little room">
        {[860, 700, 480, 220].map((width) => (
          <div key={width} style={{ margin: '2px 0 12px' }}>
            <Narrow width={width}>
              <Tabs aria-label={`Sections at ${width}`} items={many} defaultValue="settings" variant="pill" />
            </Narrow>
          </div>
        ))}
        <Narrow width={220}>
          <Tabs aria-label="Underline at 220" items={many} defaultValue="archive" />
        </Narrow>
      </Card>
    </Columns>
  ),
};

/** Each part replaced by a function or a node and hidden with `null`, and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Stack>
        <Tabs
          aria-label="Parts as functions"
          items={sections}
          parts={{
            count: (p) => <b data-part="count">· {p.children}</b>,
            tab: (p) => <Tabs.Tab {...p} style={{ textTransform: 'uppercase' }} />,
            panel: (p) => (
              <Tabs.Panel id={p.id}>
                <p style={{ margin: 0 }}>Wrapped panel: {p.id}</p>
              </Tabs.Panel>
            ),
            list: (p) => <Tabs.List {...p} aria-label="List from a function" />,
          }}
        />
        <Tabs
          aria-label="Parts as nodes"
          variant="pill"
          items={stateful}
          onClose={() => {}}
          parts={{
            indicator: <span data-part="indicator" />,
            close: <span data-part="close">×</span>,
          }}
        />
        <Tabs
          aria-label="Parts hidden"
          variant="button-group"
          items={sections}
          parts={{ icon: null, count: null, indicator: null }}
        />
      </Stack>
      <Tabs.Root defaultValue="b" orientation="vertical" variant="pill">
        <Tabs.List aria-label="By hand" end={<Button size="small">New view</Button>}>
          <Tabs.Tab id="a">View A</Tabs.Tab>
          <Tabs.Tab id="b" count={3}>
            View B
          </Tabs.Tab>
          <Tabs.Tab id="c" disabled>
            View C
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="a">{panel('Item A')}</Tabs.Panel>
        <Tabs.Panel id="b">{panel('Item B')}</Tabs.Panel>
      </Tabs.Root>
    </Columns>
  ),
};
