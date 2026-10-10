import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Bell, Bookmark, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Page } from '../layout/Page';
import { Stack } from '../layout/Stack';
import { Rows, Value } from '../stories/placeholders';
import { AppShell } from './AppShell';
import type { NavItem } from './nav';
import { PrimaryNav } from './PrimaryNav';
import { SubNav } from './SubNav';
import { TopBar } from './TopBar';

const meta = { title: 'Shell/App shell', component: AppShell } satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

const sections: NavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview' },
  {
    id: 'orders',
    label: 'Orders',
    href: '#orders',
    items: [
      { id: 'open', label: 'Open orders', href: '#open' },
      { id: 'returns', label: 'Returns', href: '#returns' },
    ],
  },
  { id: 'planning', label: 'Planning', href: '#planning' },
  { id: 'sourcing', label: 'Sourcing', href: '#sourcing' },
  { id: 'people', label: 'People', items: [{ id: 'teams', label: 'Teams', href: '#teams' }] },
  { id: 'finance', label: 'Finance', href: '#finance', disabled: true },
];
const pages: NavItem[] = ['Summary', 'Inbox', 'Calendar', 'Reports', 'Data hub'].map((label) => ({
  id: label.toLowerCase(),
  label,
  href: `#${label.toLowerCase()}`,
}));

function Bars({ brand }: { brand?: string }) {
  const [section, setSection] = useState('overview');
  const [page, setPage] = useState('summary');
  return (
    <>
      <TopBar
        brand={brand}
        logo="U"
        history
        nav={<PrimaryNav items={sections} value={section} onChange={setSection} />}
        onSearch={() => {}}
        actions={
          <>
            <IconButton icon={<Bookmark />} label="Bookmarks" />
            <IconButton icon={<Bell />} label="Notifications" badge={3} />
            <IconButton icon={<Settings />} label="Settings" />
          </>
        }
        context={
          <>
            <b>Sat 10 Oct 2026</b>
            <br />
            Quarter close in 6 days
          </>
        }
        primaryAction={
          <Button variant="primary" iconEnd={<ArrowRight />} collapseTo="icon">
            Continue
          </Button>
        }
      />
      <SubNav
        label="Overview"
        items={pages}
        value={page}
        onChange={setPage}
        end={
          <>
            <Button size="small">Inbox</Button>
            <Button size="small">Team</Button>
            <Button size="small">Directory</Button>
          </>
        }
      />
    </>
  );
}

/**
 * The whole frame: bars on top, and a three-column page that fills the rest of the window. The page
 * never scrolls. Below 1024 x 600 the columns become tabs.
 */
export const FullScreen: Story = {
  tags: ['narrow'],
  render: () => (
    <AppShell topBar={<Bars />}>
      <Page>
        <Columns>
          <Card title="Inbox" size={3} padding="none">
            <Rows count={40} prefix="Message" />
          </Card>
          <Card title="Summary" size={5}>
            <Rows count={14} prefix="Update" />
          </Card>
          <Stack size={2.4} label="Status">
            <Card title="Next review" tone="neutral" priority={2}>
              <Value label="Site" value="North depot" />
            </Card>
            <Card title="Data hub" tone="neutral" size={1.4}>
              <Rows count={4} prefix="Measure" />
            </Card>
            <Card title="Project budget" tone="neutral" priority={1}>
              <Value label="Available" value="80.12M" />
            </Card>
            <Card title="Payroll budget" tone="neutral">
              <Value label="Available" value="275K" />
            </Card>
            <Card title="This week" tone="neutral">
              <Rows count={3} prefix="Day" />
            </Card>
          </Stack>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/** Text on the bar is light or dark, whichever contrasts more with the brand colour. */
export const Brands: Story = {
  parameters: { frame: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {[undefined, '#2b2f36', '#e8e4f0', '#0f766e'].map((brand) => (
        <div key={brand ?? 'default'}>
          <Bars brand={brand} />
        </div>
      ))}
    </div>
  ),
};

/**
 * As the bars narrow: the context block hides, the actions collapse into one menu, nav items move into
 * "More" (the active item stays), and the primary action shows its icon only.
 */
export const BarsShrink: Story = {
  parameters: { frame: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {[960, 820, 680, 520, 400].map((width) => (
        <div key={width} style={{ width }}>
          <Bars />
        </div>
      ))}
    </div>
  ),
};
