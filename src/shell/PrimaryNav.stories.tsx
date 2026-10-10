import type { Meta, StoryObj } from '@storybook/react-vite';
import { Boxes, CalendarDays, Home, Users } from 'lucide-react';
import { useState } from 'react';
import { Log, sections } from '../stories/placeholders';
import type { NavItem } from './nav';
import { PrimaryNav, type PrimaryNavProps } from './PrimaryNav';
import { TopBar } from './TopBar';

const meta = {
  title: 'Shell/PrimaryNav',
  component: PrimaryNav,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof PrimaryNav>;
export default meta;
type Story = StoryObj<typeof meta>;

const icons = [<Home key="1" />, <Boxes key="2" />, <CalendarDays key="3" />, null, <Users key="5" />, null];
const withIcons: NavItem[] = sections.map((item, i) => ({ ...item, icon: icons[i] }));

/** The nav lives in a `TopBar`. The line below shows the section it reported through `onChange`. */
function Nav({ start = 'planning', ...props }: PrimaryNavProps & { start?: string }) {
  const [section, setSection] = useState(start);
  return (
    <div>
      <TopBar
        logo="U"
        nav={<PrimaryNav items={sections} value={section} onChange={setSection} {...props} />}
      />
      <Log>Current section: {section}</Log>
    </div>
  );
}

/** Links, dropdowns and a disabled item, some with icons. One tab stop; arrow keys move between items. */
export const Items: Story = { render: () => <Nav items={withIcons} /> };

/** Items that do not fit move into "More", last first. The active item stays, wherever it is. */
export const Overflow: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
      {[640, 440, 340].map((width) => (
        <div key={width} style={{ width }}>
          <Nav start="sourcing" />
        </div>
      ))}
    </div>
  ),
};

/** `renderLink` plugs in the app's router link. Here it stops the browser and reports where it would go. */
function RouterNav() {
  const [target, setTarget] = useState('nowhere yet');
  return (
    <div>
      <Nav
        renderLink={(p) => (
          <a
            {...p}
            data-router-link=""
            onClick={(event) => {
              event.preventDefault();
              p.onClick?.(event);
              setTarget(p.href);
            }}
          />
        )}
      />
      <Log>The router went to: {target}</Log>
    </div>
  );
}
export const RenderLink: Story = { render: () => <RouterNav /> };

/**
 * Parts: every item changed by a function, the active indicator replaced by a node, and "More" replaced
 * by an item that holds the moved items in its menu. Below it, the same nav built from blocks.
 */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
      <div style={{ width: 560 }}>
        <Nav
          parts={{
            item: (p) => <PrimaryNav.Item {...p} icon={p.id === 'overview' ? <Home /> : p.icon} />,
            indicator: (
              <span
                data-part="indicator"
                style={{
                  position: 'absolute',
                  insetInline: 0,
                  top: 0,
                  height: 4,
                  background: 'currentColor',
                }}
              />
            ),
            more: (p) => (
              <PrimaryNav.Item id="all" menu={<PrimaryNav.Menu>{p.children}</PrimaryNav.Menu>}>
                All sections
              </PrimaryNav.Item>
            ),
          }}
        />
      </div>
      <TopBar
        logo="U"
        nav={
          <PrimaryNav.Root value="reports" aria-label="Built from blocks">
            <PrimaryNav.Item id="orders" href="#orders">
              Orders
            </PrimaryNav.Item>
            <PrimaryNav.Item
              id="reports"
              href="#reports"
              menu={
                <PrimaryNav.Menu>
                  <PrimaryNav.Item id="monthly" href="#monthly">
                    Monthly
                  </PrimaryNav.Item>
                  <PrimaryNav.Item id="yearly" href="#yearly">
                    Yearly
                  </PrimaryNav.Item>
                </PrimaryNav.Menu>
              }
            >
              Reports
            </PrimaryNav.Item>
            <PrimaryNav.Item id="people" icon={<Users />} disabled>
              People
            </PrimaryNav.Item>
          </PrimaryNav.Root>
        }
      />
    </div>
  ),
};
