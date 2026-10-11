import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Bookmark, CircleHelp, Settings } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../basics/IconButton';
import { CommandPalette } from '../overlays/CommandPalette';
import { Log, sections } from '../stories/placeholders';
import { HistoryButtons } from './HistoryButtons';
import { PrimaryNav } from './PrimaryNav';
import { commands, SampleContext, SamplePrimaryAction } from './samples';
import { TopBar, type TopBarProps } from './TopBar';

const meta = {
  title: 'Shell/TopBar',
  component: TopBar,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;

const context = <SampleContext />;

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
        primaryAction={<SamplePrimaryAction onPress={() => setLast('Continue')} />}
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

/**
 * With `commandPalette`, the search trigger and `Mod+K` open the palette. `onSearch` is for an app
 * with its own search; here it is left out.
 */
export const WithCommandPalette: Story = {
  render: () => (
    <Bar onSearch={undefined} commandPalette={<CommandPalette commands={commands} recent={['orders']} />} />
  ),
};

/** Parts changed by a function (logo, actions, search, primary action), and hidden with `null` (context, start). */
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
          search: (p) => <TopBar.Search {...p} label="Find" />,
          primaryAction: (p) => (
            <TopBar.PrimaryAction style={{ paddingInline: 12 }}>{p.children}</TopBar.PrimaryAction>
          ),
        }}
      />
      <Bar parts={{ start: null, context: null }} />
    </div>
  ),
};

/**
 * The bar built from its blocks only: everything the all-in-one bar renders is public. It shrinks the
 * same way: the context block hides, the actions collapse (`pinned` ones stay), the nav moves items
 * into "More", and the primary action shows its icon.
 */
export const Blocks: Story = {
  render: () => (
    <TopBar.Root brand="#2b2f36" moreLabel="More tools">
      <TopBar.Start>
        <HistoryButtons canGoBack canGoForward={false} onBack={() => {}} onForward={() => {}} />
        <TopBar.Logo>C</TopBar.Logo>
      </TopBar.Start>
      <TopBar.Nav>
        <PrimaryNav items={sections} value="orders" />
      </TopBar.Nav>
      <TopBar.End>
        <TopBar.Actions
          pinned={
            <>
              <TopBar.Search commandPalette={<CommandPalette commands={commands} />} />
              <IconButton icon={<CircleHelp />} label="Help" />
            </>
          }
        >
          <IconButton icon={<Bell />} label="Notifications" badge />
          <IconButton icon={<Settings />} label="Settings" />
        </TopBar.Actions>
        <TopBar.Context>{context}</TopBar.Context>
        <TopBar.PrimaryAction>
          <SamplePrimaryAction label="Sign off" />
        </TopBar.PrimaryAction>
      </TopBar.End>
    </TopBar.Root>
  ),
};

/**
 * Edge cases of shrinking. Without a nav the bar itself is measured and the nav's step is skipped.
 * After the last step nothing more gives way: the bar clips at its end, here below about 320px.
 * A custom primary action is shown as it is, centred and off the edge.
 */
export const EdgeCases: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
      {[520, 340, 220].map((width) => (
        <div key={width} style={{ width }}>
          <Bar nav={undefined} />
        </div>
      ))}
      <div style={{ width: 520 }}>
        <Bar nav={undefined} context={undefined} primaryAction={<b>Custom node</b>} />
      </div>
    </div>
  ),
};
