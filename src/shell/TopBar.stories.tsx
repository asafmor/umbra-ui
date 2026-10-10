import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Bell, Bookmark, CircleHelp, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Log, sections } from '../stories/placeholders';
import { PrimaryNav } from './PrimaryNav';
import { TopBar, type TopBarProps } from './TopBar';

const meta = {
  title: 'Shell/TopBar',
  component: TopBar,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;

const context = (
  <>
    <b>Sat 10 Oct 2026</b>
    <br />
    Quarter close in 6 days
  </>
);
const primaryAction = (
  <Button variant="primary" iconEnd={<ArrowRight />} collapseTo="icon">
    Continue
  </Button>
);

/** A bar with every slot filled. The line below it shows what its callbacks did. */
function Bar(props: TopBarProps) {
  const [section, setSection] = useState('overview');
  const [last, setLast] = useState('none');
  return (
    <div>
      <TopBar
        logo="U"
        history
        nav={<PrimaryNav items={sections} value={section} onChange={setSection} />}
        onSearch={() => setLast('Search')}
        actions={
          <>
            <IconButton icon={<Bookmark />} label="Bookmarks" onPress={() => setLast('Bookmarks')} />
            <IconButton icon={<Bell />} label="Notifications" badge={3} />
            <IconButton icon={<Settings />} label="Settings" onPress={() => setLast('Settings')} />
          </>
        }
        context={context}
        primaryAction={primaryAction}
        {...props}
      />
      <Log>Last action: {last}</Log>
    </div>
  );
}

/**
 * Every slot: history buttons, logo, nav, search, actions, the context block and the primary action.
 * As the window narrows the context block hides first, then the actions collapse into one menu.
 */
export const Slots: Story = { render: () => <Bar /> };

/** Parts changed by a function (logo, actions, primary action), and hidden with `null` (context, start). */
export const Parts: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
      <Bar
        parts={{
          logo: (p) => (
            <b data-part="logo" style={{ font: 'var(--umbra-font-title)' }}>
              {p.children} / Console
            </b>
          ),
          actions: (p) => (
            <TopBar.Actions
              {...p}
              pinned={
                <>
                  {p.pinned}
                  <IconButton icon={<CircleHelp />} label="Help" />
                </>
              }
            />
          ),
          primaryAction: (p) => (
            <div
              data-part="primaryAction"
              style={{ display: 'flex', alignItems: 'center', paddingInline: 12 }}
            >
              {p.children}
            </div>
          ),
        }}
      />
      <Bar parts={{ start: null, context: null }} />
    </div>
  ),
};

/** The bar built from its blocks. `pinned` actions stay when the others collapse into the menu. */
export const Blocks: Story = {
  render: () => (
    <TopBar.Root brand="#2b2f36" moreLabel="More tools">
      <TopBar.Start>
        <b style={{ font: 'var(--umbra-font-title)' }}>Console</b>
      </TopBar.Start>
      <TopBar.Nav>
        <PrimaryNav items={sections} value="orders" />
      </TopBar.Nav>
      <TopBar.End>
        <TopBar.Actions pinned={<IconButton icon={<CircleHelp />} label="Help" />}>
          <IconButton icon={<Bell />} label="Notifications" badge />
          <IconButton icon={<Settings />} label="Settings" />
        </TopBar.Actions>
        <Button variant="accent">Sign out</Button>
      </TopBar.End>
    </TopBar.Root>
  ),
};
