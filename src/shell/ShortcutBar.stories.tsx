import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inbox, Settings2, Users } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Log } from '../stories/placeholders';
import { pinned } from './samples';
import { ShortcutBar } from './ShortcutBar';

const meta = {
  title: 'Shell/ShortcutBar',
  component: ShortcutBar,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ShortcutBar>;
export default meta;
type Story = StoryObj<typeof meta>;

// A strip like the end of the sub nav: the bar sits at its end and shrinks with it.
const strip: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  height: 'var(--umbra-size-sub-nav-height)',
  padding: '0 8px',
  background: 'var(--umbra-color-base-surface2)',
};
const Strip = ({ children, width }: { children: ReactNode; width?: number }) => (
  <div style={{ ...strip, width }}>{children}</div>
);
const column: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 };
const plain = pinned.map(({ id, label, href }) => ({ id, label, href }));

/**
 * `labels` (icon and label), `icons` (the label is the tooltip and the name), a bar without icons,
 * one with a dot, a disabled item and the edit button.
 */
export const Modes: Story = {
  render: () => (
    <div style={column}>
      <Strip>
        <ShortcutBar items={pinned} mode="labels" />
      </Strip>
      <Strip>
        <ShortcutBar items={pinned} mode="icons" />
      </Strip>
      <Strip>
        <ShortcutBar items={plain} />
      </Strip>
      <Strip>
        <ShortcutBar
          items={[
            { ...pinned[0]!, badge: true },
            { ...pinned[1]!, disabled: true },
            { id: 'action', label: 'Refresh', onPress: () => {} },
          ]}
          onEdit={() => {}}
        />
      </Strip>
    </div>
  ),
};

/**
 * `auto`, as the room shrinks: first the labels go (every item has an icon), then items move into
 * the "+N" menu, last first, until only that chip is left. Nothing is clipped.
 */
export const Overflow: Story = {
  render: () => (
    <div style={column}>
      {[560, 360, 190, 130, 60].map((width) => (
        <Strip key={width} width={width}>
          <ShortcutBar items={pinned} onEdit={width > 100 ? () => {} : undefined} />
        </Strip>
      ))}
      {/* Without icons there are no labels to drop: items go straight into the menu. */}
      {[400, 220].map((width) => (
        <Strip key={width} width={width}>
          <ShortcutBar items={plain} aria-label="Shortcuts without icons" />
        </Strip>
      ))}
    </div>
  ),
};

function BlocksBar() {
  const [last, setLast] = useState('none');
  return (
    <div>
      <Strip width={360}>
        <ShortcutBar
          aria-label="Pinned"
          mode="labels"
          moreLabel={(count) => `(+${count})`}
          moreName={(count) => `${count} more`}
          editLabel="Change pinned"
          onEdit={() => setLast('edit')}
          renderLink={(props) => <a {...props} data-router-link="" />}
          parts={{
            item: (p) => (p.item.id === 'team' ? <u>{p.item.label}</u> : p.children),
            more: (p) => <b>{p.children}</b>,
            editIcon: <Settings2 />,
          }}
        >
          <ShortcutBar.Item id="inbox" icon={<Inbox />} badge={2} onPress={() => setLast('inbox')}>
            Inbox
          </ShortcutBar.Item>
          <ShortcutBar.Item id="team" icon={<Users />} href="#team">
            Team
          </ShortcutBar.Item>
          <ShortcutBar.Item id="directory" href="#directory">
            Directory
          </ShortcutBar.Item>
          <ShortcutBar.Item id="calendar" onPress={() => setLast('calendar')}>
            Calendar
          </ShortcutBar.Item>
          <ShortcutBar.Item id="reports" badge={4} onPress={() => setLast('reports')}>
            Reports
          </ShortcutBar.Item>
        </ShortcutBar>
      </Strip>
      <Log>Last action: {last}</Log>
    </div>
  );
}

/**
 * Built from `ShortcutBar.Item` blocks, with a router link, translated texts and parts changed by a
 * function (item, more) and replaced by a node (the edit icon).
 */
export const Blocks: Story = { render: () => <BlocksBar /> };
