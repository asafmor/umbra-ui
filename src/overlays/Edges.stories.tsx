import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { SearchField } from '../inputs/SearchField';
import { Select } from '../inputs/Select';
import { Rows } from '../stories/placeholders';
import { Menu } from './Menu';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

/**
 * Overlays opened from each corner of the window. Each one flips to the side with room and is never
 * taller or wider than the window: what does not fit scrolls inside.
 */
const meta = { title: 'Overlays/Window edges' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const corners = {
  'top start': { top: 0, left: 0 },
  'top end': { top: 0, right: 0 },
  // A little above the edge: an empty popover still fits below there, and its content does not.
  'bottom start': { bottom: 64, left: 0 },
  'bottom end': { bottom: 64, right: 0 },
} satisfies Record<string, CSSProperties>;
const many = Array.from({ length: 14 }, (_, i) => ({ id: `item-${i + 1}`, label: `Item ${i + 1}` }));

/** The popover opens empty and gets its content afterwards, as the popover of a collapsed card does. */
function LatePopover() {
  const [open, setOpen] = useState(false);
  const [filled, setFilled] = useState(false);
  return (
    <Popover
      trigger={<Button>Popover</Button>}
      aria-label="Late content"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFilled(false);
        if (next) setTimeout(() => setFilled(true), 100);
      }}
    >
      {filled && <Rows count={8} />}
    </Popover>
  );
}

export const Corners: Story = {
  render: () => (
    <div style={{ position: 'relative', height: '100%' }}>
      {Object.entries(corners).map(([corner, place]) => (
        <div
          key={corner}
          data-corner={corner}
          style={{
            position: 'absolute',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            padding: 4,
            ...place,
          }}
        >
          <LatePopover />
          <Menu trigger={<Button>Menu</Button>} items={many} />
          <div style={{ width: 120 }}>
            <Select aria-label="Select" placeholder="Select" options={many} />
          </div>
          <div style={{ width: 150 }}>
            <SearchField label="Search" placeholder="Search" suggestions={many} />
          </div>
          <Tooltip content="A tooltip that stays in the window">
            <Button>Tip</Button>
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};
