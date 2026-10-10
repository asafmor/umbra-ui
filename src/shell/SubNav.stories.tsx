import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays, Inbox } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log, pages } from '../stories/placeholders';
import type { NavItem } from './nav';
import { SubNav, type SubNavProps } from './SubNav';

const meta = {
  title: 'Shell/SubNav',
  component: SubNav,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SubNav>;
export default meta;
type Story = StoryObj<typeof meta>;

const withIconsAndMenu: NavItem[] = pages.map((item) => ({
  ...item,
  icon: item.id === 'inbox' ? <Inbox /> : item.id === 'calendar' ? <CalendarDays /> : undefined,
  items:
    item.id === 'reports'
      ? [
          { id: 'monthly', label: 'Monthly', href: '#monthly' },
          { id: 'yearly', label: 'Yearly', href: '#yearly' },
        ]
      : undefined,
}));

const end = (
  <>
    <Button size="small">Inbox</Button>
    <Button size="small">Team</Button>
  </>
);

/** The line below the bar shows the page it reported through `onChange`. */
function Bar(props: SubNavProps) {
  const [page, setPage] = useState('inbox');
  return (
    <div>
      <SubNav label="Orders" items={pages} value={page} onChange={setPage} {...props} />
      <Log>Current page: {page}</Log>
    </div>
  );
}

/** The section label, pages with icons and a dropdown, and the free slot at the end. */
export const Slots: Story = { render: () => <Bar items={withIconsAndMenu} end={end} /> };

/** As it narrows: the end slot gives way, pages move into "More" (the active one stays), then the label hides. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
      {[640, 440, 300, 190].map((width) => (
        <div key={width} style={{ width }}>
          <Bar end={end} />
        </div>
      ))}
    </div>
  ),
};

/** Parts changed by a function (label, item) or hidden with `null` (end). Below it, the bar built from blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
      <Bar
        end={end}
        parts={{
          label: (p) => <SubNav.Label>Section: {p.children}</SubNav.Label>,
          item: (p) => <SubNav.Item {...p} icon={p.id === 'summary' ? <Inbox /> : p.icon} />,
          end: null,
        }}
      />
      <SubNav.Root value="monthly" aria-label="Built from blocks">
        <SubNav.Label>Reports</SubNav.Label>
        <SubNav.Item id="monthly" href="#monthly">
          Monthly
        </SubNav.Item>
        <SubNav.Item
          id="yearly"
          menu={
            <SubNav.Menu>
              <SubNav.Item id="this-year" href="#this-year">
                This year
              </SubNav.Item>
              <SubNav.Item id="last-year" href="#last-year">
                Last year
              </SubNav.Item>
            </SubNav.Menu>
          }
        >
          Yearly
        </SubNav.Item>
        <SubNav.End>
          <Button size="small">Export</Button>
        </SubNav.End>
      </SubNav.Root>
    </div>
  ),
};
