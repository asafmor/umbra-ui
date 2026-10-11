import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Download, Filter, Pencil, Pin, Settings, Star, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import type { Shortcut } from '../provider/shortcuts';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import { Log, Rows } from '../stories/placeholders';
import { Menu, type MenuEntry } from './Menu';

const meta = { title: 'Overlays/Menu', component: Menu, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Menu
>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

// The log sits beside the trigger, clear of the open menu.
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 240 };
// Styled in full, so the capture does not depend on the system's form control look.
const plain: CSSProperties = {
  font: 'inherit',
  color: 'inherit',
  padding: '4px 12px',
  border: '1px solid var(--umbra-color-base-border-control)',
  borderRadius: 4,
  background: 'var(--umbra-color-base-surface1)',
};

const shortcuts: Shortcut[] = [
  { id: 'item.rename', keys: 'F2', label: 'Rename' },
  { id: 'item.duplicate', keys: 'Mod+D', label: 'Duplicate' },
  { id: 'item.delete', keys: 'Shift+Delete', label: 'Delete' },
];

const actions: MenuEntry[] = [
  { id: 'rename', label: 'Rename', icon: <Pencil />, shortcut: 'item.rename' },
  { id: 'duplicate', label: 'Duplicate', icon: <Copy />, shortcut: 'item.duplicate' },
  { id: 'export', label: 'Export', icon: <Download />, description: 'As a spreadsheet' },
  { id: 'archive', label: 'Archive', disabled: true },
  { type: 'separator' },
  {
    type: 'section',
    label: 'Danger zone',
    items: [{ id: 'delete', label: 'Delete', icon: <Trash2 />, danger: true, shortcut: 'item.delete' }],
  },
];

function BasicMenu({ globals, open }: { globals: Globals; open?: boolean }) {
  const [last, setLast] = useState('none');
  return (
    <UmbraProvider {...globals} shortcuts={shortcuts}>
      <div style={row}>
        <Menu trigger={<Button>Item actions</Button>} items={actions} onAction={setLast} defaultOpen={open} />
        <Log>Last action: {last}</Log>
      </div>
    </UmbraProvider>
  );
}

/** Icons, key hints from the shortcut registry, a description, a disabled row, a separator and a section. */
export const Basic: Story = {
  render: (_, { globals }) => <BasicMenu globals={globals as Globals} open />,
};

/** The same menu, closed: the interaction tests open it with the keyboard. */
export const Closed: Story = {
  render: (_, { globals }) => <BasicMenu globals={globals as Globals} />,
};

const view: MenuEntry[] = [
  {
    type: 'section',
    label: 'Columns',
    items: [
      { id: 'status', label: 'Status', type: 'checkbox' },
      { id: 'owner', label: 'Owner', type: 'checkbox' },
      { id: 'updated', label: 'Last updated', type: 'checkbox' },
    ],
  },
  { type: 'separator' },
  {
    type: 'section',
    label: 'Row height',
    items: [
      { id: 'compact', label: 'Compact', type: 'radio' },
      { id: 'regular', label: 'Regular', type: 'radio' },
      { id: 'tall', label: 'Tall', type: 'radio' },
    ],
  },
  { type: 'separator' },
  { id: 'reset', label: 'Reset view' },
];

function SelectionMenu({ open }: { open?: boolean }) {
  const [selected, setSelected] = useState(['status', 'updated', 'regular']);
  return (
    <div style={row}>
      <Menu
        trigger={<Button iconStart={<Settings />}>View options</Button>}
        items={view}
        selectedIds={selected}
        onSelectionChange={setSelected}
        defaultOpen={open}
      />
      <Log>Selected: {selected.join(', ')}</Log>
    </div>
  );
}

/** Checkbox rows toggle and keep the menu open; radio rows form a group. A check marks the chosen rows. */
export const Selection: Story = { render: () => <SelectionMenu open /> };

/** The same menu, closed, for the interaction tests. */
export const SelectionClosed: Story = { render: () => <SelectionMenu /> };

const fields = ['General', 'Status', 'Dates', 'People', 'Totals'];
const nested: MenuEntry[] = [
  {
    id: 'insert',
    label: 'Insert column',
    items: fields.map((field) => ({
      id: `insert-${field}`,
      label: field,
      items: [1, 2, 3].map((n) => ({ id: `insert-${field}-${n}`, label: `${field} field ${n}` })),
    })),
  },
  { id: 'remove', label: 'Remove this column' },
  { id: 'resize', label: 'Auto size this column' },
  { type: 'separator' },
  { id: 'copy', label: 'Copy current view…' },
];

function SubmenuMenu() {
  const [last, setLast] = useState('none');
  return (
    <div style={row}>
      <Menu trigger={<Button>Column</Button>} items={nested} onAction={setLast} />
      <Log>Last action: {last}</Log>
    </div>
  );
}

/** Submenus, three levels deep. ArrowRight opens one and ArrowLeft closes it. */
export const Submenus: Story = { render: () => <SubmenuMenu /> };

function LinkMenu() {
  const [page, setPage] = useState('reports');
  const [router, setRouter] = useState('nowhere yet');
  const pages = ['Summary', 'Reports', 'Calendar'].map((label) => ({
    id: label.toLowerCase(),
    label,
    href: `#${label.toLowerCase()}`,
    current: label.toLowerCase() === page,
  }));
  return (
    <div style={row}>
      <Menu
        trigger={<Button>Go to</Button>}
        items={[...pages, { id: 'archive', label: 'Archive', href: '#archive', disabled: true }]}
        onAction={setPage}
        defaultOpen
        renderLink={(p) => (
          <a
            {...p}
            data-router-link=""
            onClick={(event) => {
              event.preventDefault();
              p.onClick?.(event);
              setRouter(p.href);
            }}
          />
        )}
      />
      <Log>
        Current page: {page}. The router went to: {router}
      </Log>
    </div>
  );
}

/** Rows with `href` are links. The current page has `aria-current`, a stripe and bold text. */
export const Links: Story = { render: () => <LinkMenu /> };

function BlockMenus() {
  const [pinned, setPinned] = useState(true);
  const [last, setLast] = useState('none');
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Menu
          trigger={<Button>Built from blocks</Button>}
          onAction={setLast}
          selectedIds={pinned ? ['pin'] : []}
          onSelectionChange={(ids) => setPinned(ids.includes('pin'))}
          defaultOpen
        >
          <Menu.Item id="open" icon={<Star />}>
            Open
          </Menu.Item>
          <Menu.Item id="pin" type="checkbox" icon={<Pin />}>
            Pinned
          </Menu.Item>
          <Menu.Separator />
          <Menu.Section label="Share">
            <Menu.Item id="link">Copy link</Menu.Item>
            <Menu.Sub id="send" label="Send to">
              <Menu.Item id="send-a">Person A</Menu.Item>
              <Menu.Item id="send-b">Person B</Menu.Item>
            </Menu.Sub>
          </Menu.Section>
        </Menu>
        <Menu
          trigger={<Button>Parts</Button>}
          items={[
            { id: 'one', label: 'Item 1', type: 'checkbox', checked: true },
            { id: 'two', label: 'Item 2', type: 'checkbox' },
            { type: 'section', label: 'More', items: [{ id: 'three', label: 'Item 3' }] },
          ]}
          parts={{
            check: <span data-custom-check="">●</span>,
            item: (p) => (p.item.id === 'two' ? <em>{p.item.label} (custom row)</em> : p.children),
            sectionHeader: null,
          }}
        />
        <Menu
          trigger={
            <button type="button" style={plain}>
              A plain button
            </button>
          }
          items={[]}
          emptyLabel="Nothing here"
        />
      </div>
      <Log>
        Last action: {last}. Pinned: {pinned ? 'yes' : 'no'}
      </Log>
    </div>
  );
}

/** The block form, the three kinds of `parts` (node, function, `null`), a plain trigger and an empty menu. */
export const BlocksAndParts: Story = { render: () => <BlockMenus /> };

function ContextMenuRegion() {
  const [last, setLast] = useState('none');
  return (
    <Columns style={{ height: '100%' }}>
      <Menu.Context
        aria-label="Row actions"
        onAction={setLast}
        content={
          <>
            <Menu.Item id="open">Open</Menu.Item>
            <Menu.Item id="rename">Rename</Menu.Item>
            <Menu.Separator />
            <Menu.Item id="delete" danger>
              Delete
            </Menu.Item>
          </>
        }
      >
        <Card title="Right click a row">
          <button type="button" style={plain}>
            A focusable row
          </button>
          <Rows count={4} />
          <Log>Last action: {last}</Log>
        </Card>
      </Menu.Context>
      <Card title="No context menu here">
        <Rows count={4} />
      </Card>
    </Columns>
  );
}

/** `Menu.Context` opens at the pointer on a right click, and with the context-menu key or Shift+F10. */
export const ContextMenu: Story = { render: () => <ContextMenuRegion /> };

const many: MenuEntry[] = Array.from({ length: 40 }, (_, i) => ({
  id: `item-${i + 1}`,
  label:
    i === 1 ? 'Item 2, with a label that is much longer than a menu is allowed to be wide' : `Item ${i + 1}`,
}));

/** A long menu is as tall as the window allows and scrolls inside. A label that is too wide is cut short. */
export const Long: Story = {
  render: () => <Menu trigger={<Button>Forty items</Button>} items={many} defaultOpen />,
};

function AnchoredMenu() {
  const anchor = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const items = useMemo<MenuEntry[]>(
    () => ['Region 1', 'Region 2', 'Region 3'].map((label) => ({ id: label, label })),
    [],
  );
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        ref={anchor}
        style={{
          width: 320,
          padding: 8,
          border: '1px dashed var(--umbra-color-base-border-control)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        The anchor
        <Button size="small" onPress={() => setOpen((o) => !o)}>
          Toggle
        </Button>
      </div>
      <Menu
        aria-label="Regions"
        items={items}
        anchorRef={anchor}
        open={open}
        onOpenChange={setOpen}
        placement="bottom end"
        offset={8}
        matchAnchorWidth
      />
    </div>
  );
}

/** Anchored to an element with controlled state, as wide as the anchor, at the end of it. */
export const Anchored: Story = { render: () => <AnchoredMenu /> };

function OverflowCard() {
  const [starred, setStarred] = useState(false);
  const [last, setLast] = useState('none');
  return (
    <div style={{ width: 260, height: 220, display: 'flex' }}>
      <Card
        title="Quarterly review"
        actions={
          <>
            <Button size="small" iconStart={<Filter />} onPress={() => setLast('Filter')}>
              Filter
            </Button>
            {/* A wrapper around buttons is fine; anything that is not a button is left out of the menu. */}
            <span style={{ display: 'contents' }}>
              <IconButton icon={<Star />} label="Favourite" pressed={starred} onPressedChange={setStarred} />
              <small>3 new</small>
            </span>
            <Menu
              trigger={<IconButton icon={<Download />} label="Export" />}
              items={[
                { id: 'csv', label: 'As a spreadsheet' },
                { id: 'pdf', label: 'As a document' },
              ]}
              onAction={(id) => setLast(`Export ${id}`)}
            />
          </>
        }
      >
        <Log>
          Last action: {last}. Favourite: {starred ? 'yes' : 'no'}
        </Log>
      </Card>
    </div>
  );
}

/**
 * Actions that do not fit move into a real menu: a button is a menu item, a toggle a checkbox item, and
 * a `Menu` a submenu.
 */
export const OverflowActions: Story = { render: () => <OverflowCard /> };
