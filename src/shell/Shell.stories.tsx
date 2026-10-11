import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Bookmark, Settings } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Page } from '../layout/Page';
import { Stack } from '../layout/Stack';
import { CommandPalette } from '../overlays/CommandPalette';
import { pages, Rows, sections, Value } from '../stories/placeholders';
import { AppShell } from './AppShell';
import { PrimaryNav } from './PrimaryNav';
import { commands, pinned, SampleContext, SamplePrimaryAction } from './samples';
import { ShortcutBar } from './ShortcutBar';
import { SubNav } from './SubNav';
import { TopBar } from './TopBar';

const meta = { title: 'Shell/App shell', component: AppShell } satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

function Bars({ brand, nav = true }: { brand?: string | undefined; nav?: boolean }) {
  const [section, setSection] = useState('overview');
  const [page, setPage] = useState('summary');
  return (
    <>
      <TopBar
        brand={brand}
        logo="U"
        history
        nav={nav && <PrimaryNav items={sections} value={section} onChange={setSection} />}
        commandPalette={<CommandPalette commands={commands} />}
        actions={
          <>
            <IconButton icon={<Bookmark />} label="Bookmarks" />
            <IconButton icon={<Bell />} label="Notifications" badge={3} />
            <IconButton icon={<Settings />} label="Settings" />
          </>
        }
        context={<SampleContext />}
        primaryAction={<SamplePrimaryAction />}
      />
      <SubNav
        label="Overview"
        items={pages}
        value={page}
        onChange={setPage}
        end={<ShortcutBar items={pinned} onEdit={() => {}} />}
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
            <Card title="Insights" tone="neutral" size={1.4}>
              <Rows count={4} prefix="Measure" />
            </Card>
            <Card title="Project budget" tone="neutral" priority={1}>
              <Value label="Available" value="64.0M" />
            </Card>
            <Card title="Payroll budget" tone="neutral">
              <Value label="Available" value="410K" />
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
 * "More" (the active item stays), and the primary action shows its icon only. In the sub nav the
 * shortcuts lose their labels, then move into their "+N" menu, before any page moves into "More".
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

/** A bar without a nav shrinks the same way: context, then actions, then the primary action. */
export const WithoutNav: Story = {
  parameters: { frame: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {[720, 480, 360].map((width) => (
        <div key={width} style={{ width }}>
          <Bars nav={false} />
        </div>
      ))}
    </div>
  ),
};

const page = (
  <Page>
    <Columns>
      <Card title="Orders" size={2}>
        <Rows count={14} prefix="Order" />
      </Card>
      <Card title="Reports">
        <Rows prefix="Report" />
      </Card>
    </Columns>
  </Page>
);

function SeparateBarsShell() {
  const [section, setSection] = useState('orders');
  const [current, setCurrent] = useState('summary');
  return (
    <AppShell
      topBar={<TopBar logo="U" nav={<PrimaryNav items={sections} value={section} onChange={setSection} />} />}
      subNav={<SubNav label="Orders" items={pages} value={current} onChange={setCurrent} />}
    >
      {page}
    </AppShell>
  );
}

/** The bars passed separately, through `topBar` and `subNav`. */
export const SeparateBars: Story = { render: () => <SeparateBarsShell /> };

/** The shell built from its blocks, with its own skip link text. */
export const Blocks: Story = {
  render: () => (
    <AppShell.Root skipLabel="Skip to the page">
      <AppShell.Background />
      <AppShell.Bars>
        <TopBar logo="U" />
        <SubNav label="Reports" items={pages} value="reports" />
      </AppShell.Bars>
      <AppShell.Main>{page}</AppShell.Main>
    </AppShell.Root>
  ),
};

/** `background="flat"` removes the gradient and the pattern. */
export const FlatBackground: Story = {
  render: () => (
    <AppShell background="flat" topBar={<TopBar logo="U" />}>
      {page}
    </AppShell>
  ),
};

/** The diagonal pattern is opt-in: set `--umbra-shell-pattern-opacity` above 0 on the shell or above it. */
export const Pattern: Story = {
  render: () => (
    <AppShell topBar={<TopBar logo="U" />} style={{ ['--umbra-shell-pattern-opacity' as string]: 0.06 }}>
      {page}
    </AppShell>
  ),
};

/** Right to left (the `locale` of the provider): the bars, the navigation and the cards mirror. */
export const RightToLeft: Story = { ...FullScreen, globals: { direction: 'rtl' } };
