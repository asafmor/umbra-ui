import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  Eye,
  Keyboard,
  Monitor,
  Plug,
  Settings,
  SlidersHorizontal,
  Users,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../data/Badge';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log, Rows } from '../stories/placeholders';
import {
  VerticalNav,
  type VerticalNavItem,
  type VerticalNavProps,
  type VerticalNavSection,
} from './VerticalNav';

const meta = {
  title: 'Shell/VerticalNav',
  component: VerticalNav,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof VerticalNav>;
export default meta;
type Story = StoryObj<typeof meta>;

const items: (VerticalNavItem | VerticalNavSection)[] = [
  { id: 'general', label: 'General', icon: <Settings /> },
  { id: 'display', label: 'Display', icon: <Monitor /> },
  { id: 'sound', label: 'Sound', icon: <Volume2 />, badge: <Badge count={2} label="2 new" /> },
  {
    id: 'people',
    label: 'People',
    icon: <Users />,
    items: [
      { id: 'teams', label: 'Teams', icon: <Users /> },
      { id: 'roles', label: 'Roles', icon: <Eye /> },
    ],
  },
  {
    type: 'section',
    label: 'Advanced',
    items: [
      { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard /> },
      { id: 'alerts', label: 'Alerts', icon: <Bell /> },
      { id: 'plugins', label: 'Plug-ins', icon: <Plug />, disabled: true },
      { id: 'all', label: 'All preferences', icon: <SlidersHorizontal /> },
    ],
  },
];
const title = <strong>Preferences</strong>;
const version = (
  <span style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}>
    Version 4.2
  </span>
);

const Controlled = ({ cardSize, ...props }: Partial<VerticalNavProps> & { cardSize?: number }) => {
  const [value, setValue] = useState('display');
  return (
    <>
      <VerticalNav items={items} value={value} onChange={setValue} {...props} />
      <Card title={`Page: ${value}`} size={cardSize}>
        <Rows count={8} prefix="Setting" />
        <Log>Current: {value}.</Log>
      </Card>
    </>
  );
};

/** Beside a card in `Columns`: header, items, a group, a section, a badge, a disabled item, footer and toggle. */
export const Default: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Controlled header={title} footer={version} collapsible />
    </Columns>
  ),
};

/** `collapsed`: the icon rail. Every label is still the name of its item, and the hover hint. */
export const Rail: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Controlled collapsed collapsible defaultExpandedIds={['people']} />
    </Columns>
  ),
};

/**
 * With a weight instead of its own width, the nav takes the width of its slot. Narrower than the token
 * width (160px) it becomes the rail by itself, because every item has an icon: here at the minimum window.
 */
export const NarrowSlot: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Controlled size={1} cardSize={5.5} />
    </Columns>
  ),
};

/** Without an icon on every item there is no rail to switch to: in a narrow slot the labels truncate. */
export const WithoutIcons: Story = {
  render: () => (
    <div style={{ width: 130 }}>
      <VerticalNav
        aria-label="Without icons"
        value="b"
        items={[
          { id: 'a', label: 'Without icons' },
          { id: 'b', label: 'Labels truncate' },
        ]}
      />
    </div>
  ),
};

/** Taller than its slot, the list scrolls inside; header and footer stay. Links go through `renderLink`. */
export const Scrolling: Story = {
  render: function Render() {
    const [value, setValue] = useState('page-3');
    return (
      <div style={{ display: 'flex', gap: 24, height: 320 }}>
        <VerticalNav
          aria-label="Pages"
          header={title}
          footer={version}
          value={value}
          onChange={setValue}
          renderLink={(props) => <a data-router="" {...props} />}
          items={Array.from({ length: 24 }, (_, i) => ({
            id: `page-${i + 1}`,
            label: `Page ${i + 1}`,
            href: `#page-${i + 1}`,
          }))}
        />
        <Log>Current: {value}.</Log>
      </div>
    );
  },
};

/** Groups, controlled: the app holds which are open. A closed group that holds the current item keeps the stripe. */
export const Groups: Story = {
  render: function Render() {
    const [open, setOpen] = useState<string[]>([]);
    const [value, setValue] = useState('roles');
    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
        <VerticalNav
          aria-label="Groups"
          items={items}
          value={value}
          onChange={setValue}
          expandedIds={open}
          onExpandedChange={setOpen}
        />
        <Log>
          Open: {open.join(', ') || 'none'}. Current: {value}.
        </Log>
      </div>
    );
  },
};

/** Each kind of `parts` override: a node replaces, `null` hides, a function wraps the default. */
export const Parts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      <VerticalNav
        aria-label="Node and null"
        items={items.slice(0, 3)}
        value="general"
        header={title}
        footer={version}
        collapsible
        parts={{ header: <div style={{ padding: 8 }}>A node replaces the header</div>, toggle: null }}
      />
      <VerticalNav
        aria-label="Function"
        items={items.slice(0, 3)}
        value="display"
        parts={{ item: (p) => <VerticalNav.Item {...p} badge={<Badge dot label="changed" />} /> }}
      />
    </div>
  ),
};

/** The same nav composed by hand from the blocks. */
export const Blocks: Story = {
  render: () => (
    <VerticalNav.Root aria-label="Composed" value="display" defaultExpandedIds={['people']}>
      <VerticalNav.Header>{title}</VerticalNav.Header>
      <VerticalNav.List>
        <VerticalNav.Item id="general" icon={<Settings />}>
          General
        </VerticalNav.Item>
        <VerticalNav.Item id="display" icon={<Monitor />}>
          Display
        </VerticalNav.Item>
        <VerticalNav.Section label="More">
          <VerticalNav.Group id="people" label="People" icon={<Users />}>
            <VerticalNav.Item id="teams">Teams</VerticalNav.Item>
          </VerticalNav.Group>
        </VerticalNav.Section>
      </VerticalNav.List>
      <VerticalNav.Footer>{version}</VerticalNav.Footer>
      <VerticalNav.Toggle />
    </VerticalNav.Root>
  ),
};

/** Right to left: the stripe of the current item, the carets and the rail toggle mirror. */
export const RightToLeft: Story = { ...Default, globals: { direction: 'rtl' } };
