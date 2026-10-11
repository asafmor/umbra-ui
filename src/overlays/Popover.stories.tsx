import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings } from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { SectionTitle } from '../layout/SectionTitle';
import { UmbraScope } from '../provider/UmbraProvider';
import { Log, Rows } from '../stories/placeholders';
import { Menu } from './Menu';
import { Popover } from './Popover';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' };
// Styled in full, so the capture does not depend on the system's form control look.
const plain: CSSProperties = {
  font: 'inherit',
  color: 'inherit',
  padding: '4px 12px',
  border: '1px solid var(--umbra-color-base-border-control)',
  borderRadius: 4,
  background: 'var(--umbra-color-base-surface1)',
};

function BasicPopovers() {
  const [saved, setSaved] = useState(0);
  return (
    <div style={row}>
      <Popover
        trigger={<Button>Share</Button>}
        title="Share this view"
        footer={
          <Button variant="accent" onPress={() => setSaved((n) => n + 1)}>
            Copy link
          </Button>
        }
        defaultOpen
      >
        Anyone with the link can open this view. The page behind stays usable while the panel is open.
      </Popover>
      <Popover trigger={<IconButton icon={<Settings />} label="Settings" />} aria-label="Settings">
        {(close) => (
          <div style={{ display: 'grid', gap: 12 }}>
            A panel without a title is named by `label`.
            <Button onPress={close}>Done</Button>
          </div>
        )}
      </Popover>
      <Popover
        trigger={
          <button type="button" style={plain}>
            A plain button
          </button>
        }
        title="From a plain button"
        closeButton
      >
        The trigger can be any button.
      </Popover>
      <Log>Copied {saved} times</Log>
    </div>
  );
}

/** A title, a body and a footer; a panel named by `label`; a plain button as the trigger, with a close button. */
export const Basic: Story = { render: () => <BasicPopovers /> };

const placements = ['start', 'bottom start', 'bottom end', 'top', 'end start'] as const;

/** Each side and alignment, with the arrow. A panel that has no room on its side flips to the other. */
export const Placements: Story = {
  render: () => (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
      <div style={{ ...row, gap: 72, flexWrap: 'nowrap' }}>
        {placements.map((placement) => (
          <Popover
            key={placement}
            trigger={<Button>{placement}</Button>}
            aria-label={placement}
            placement={placement}
            arrow
            defaultOpen
            dismissOnBlur={false}
            style={{ minWidth: 0 }}
          >
            Panel
          </Popover>
        ))}
      </div>
    </div>
  ),
};

function LargePopover() {
  const [tab, setTab] = useState('Actions (3)');
  const [done, setDone] = useState<number[]>([]);
  return (
    <Popover
      trigger={<Button>Advice</Button>}
      size="large"
      title="Team advice"
      subtitle="Person A, coordinator"
      actions={<Button onPress={() => setDone([1, 2, 3])}>Apply all actions</Button>}
      toolbar={['Actions (3)', 'Observations (2)'].map((label) => (
        <Button
          key={label}
          size="small"
          variant={tab === label ? 'accent' : 'neutral'}
          onPress={() => setTab(label)}
        >
          {label}
        </Button>
      ))}
      footer={
        <>
          <span style={{ marginInlineEnd: 'auto', font: 'var(--umbra-font-label)' }}>
            {done.length} of 3 applied
          </span>
          <Button variant="accent">Done</Button>
        </>
      }
      defaultOpen
    >
      {[1, 2, 3].map((n) => (
        <div key={n}>
          <SectionTitle
            count={1}
            actions={
              <Button size="small" disabled={done.includes(n)} onPress={() => setDone((d) => [...d, n])}>
                {done.includes(n) ? 'Applied' : 'Apply'}
              </Button>
            }
          >
            {`Group ${n}`}
          </SectionTitle>
          <p style={{ margin: '0 0 12px' }}>
            A longer explanation of what is suggested for item {n}, and why it would help. The body scrolls
            when the panel is as tall as the window allows; the toolbar and the footer stay in place.
          </p>
          <Rows count={3} />
        </div>
      ))}
    </Popover>
  );
}

/** The large variant: a header with an action, a toolbar, a scrolling body and a footer. */
export const Large: Story = { render: () => <LargePopover /> };

function AnchoredPopover() {
  const anchor = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Button onPress={() => setOpen((o) => !o)}>Toggle</Button>
      <div
        ref={anchor}
        style={{ width: 360, padding: 8, border: '1px dashed var(--umbra-color-base-border-control)' }}
      >
        The anchor
      </div>
      <Popover
        anchorRef={anchor}
        open={open}
        onOpenChange={setOpen}
        aria-label="Details"
        matchAnchorWidth
        maxHeight={180}
        padding="none"
        offset={8}
      >
        <Rows count={12} />
      </Popover>
      <Log>Open: {open ? 'yes' : 'no'}</Log>
    </div>
  );
}

/** Anchored to an element with controlled state: as wide as the anchor, at most 180px tall, edge-to-edge body. */
export const Anchored: Story = { render: () => <AnchoredPopover /> };

/** The three kinds of `parts` (node, function, `null`), and a popover composed from the blocks by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={{ ...row, gap: 220, alignItems: 'flex-start' }}>
      <Popover
        trigger={<Button>Parts</Button>}
        title="Hidden by a part"
        footer="Replaced"
        defaultOpen
        dismissOnBlur={false}
        parts={{
          header: null,
          body: (p) => <Popover.Body {...p} padding="none" />,
          footer: <Popover.Footer>A footer from a node</Popover.Footer>,
        }}
      >
        <Rows count={3} />
      </Popover>
      <Popover.Root defaultOpen>
        <Popover.Trigger>
          <Button>Blocks</Button>
        </Popover.Trigger>
        <Popover.Content placement="bottom start" dismissOnBlur={false}>
          <Popover.Header title="Built from blocks" subtitle="Header, toolbar, body, footer" closeButton />
          <Popover.Toolbar>
            <Button size="small">Filter</Button>
          </Popover.Toolbar>
          <Popover.Body>
            <Rows count={2} />
          </Popover.Body>
          <Popover.Footer>
            <Button size="small">Close</Button>
          </Popover.Footer>
        </Popover.Content>
      </Popover.Root>
    </div>
  ),
};

/** A popover keeps the density, context tint and tokens of the place it was opened from. */
export const KeepsItsScope: Story = {
  render: () => (
    <div style={{ ...row, gap: 280, alignItems: 'flex-start' }}>
      <Popover trigger={<Button>From the page</Button>} title="Page scope" defaultOpen dismissOnBlur={false}>
        <Rows count={2} />
      </Popover>
      <UmbraScope context="teal" density="compact" tokens={{ 'popover-radius': '0px' }}>
        <Popover
          trigger={<Button>From a compact teal scope</Button>}
          title="Scope kept"
          defaultOpen
          dismissOnBlur={false}
        >
          <Rows count={2} />
        </Popover>
      </UmbraScope>
    </div>
  ),
};

function NestedPopover() {
  const [last, setLast] = useState('none');
  return (
    <div style={row}>
      <Popover trigger={<Button>Open</Button>} title="With a menu inside">
        <Menu
          trigger={<Button>Choose</Button>}
          items={[
            { id: 'one', label: 'Item 1' },
            { id: 'two', label: 'Item 2' },
          ]}
          onAction={setLast}
        />
      </Popover>
      <Popover trigger={<Button>Stays on blur</Button>} title="dismissOnBlur off" dismissOnBlur={false}>
        <Button>Inside</Button>
      </Popover>
      <Popover trigger={<Button>Flips</Button>} aria-label="Flips" placement="top">
        No room above
      </Popover>
      <Button>Elsewhere on the page</Button>
      <Log>Last action: {last}</Log>
    </div>
  );
}

/** For the interaction tests: a menu opened from inside a popover, and `dismissOnBlur={false}`. */
export const Behaviour: Story = { render: () => <NestedPopover /> };
