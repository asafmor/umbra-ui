import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { TextField } from '../inputs/TextField';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import type { Shortcut } from '../provider/shortcuts';
import { Log } from '../stories/placeholders';
import { CommandPalette } from './CommandPalette';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { ShortcutsSheet, type ShortcutsSheetProps, type ShortcutsSheetSectionData } from './ShortcutsSheet';

const meta = {
  title: 'Overlays/ShortcutsSheet',
  component: ShortcutsSheet,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ShortcutsSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

const noop = () => {};
/** An app's shortcuts, in two groups and two without a group. */
const shortcuts: Shortcut[] = [
  { id: 'orders.new', keys: 'Mod+Shift+O', label: 'New order', group: 'Orders', action: noop },
  { id: 'orders.duplicate', keys: 'Mod+D', label: 'Duplicate the order', group: 'Orders', action: noop },
  { id: 'orders.archive', keys: 'Shift+A', label: 'Archive the order', group: 'Orders', action: noop },
  { id: 'reports.export', keys: 'Mod+E', label: 'Export the report', group: 'Reports', action: noop },
  { id: 'reports.print', keys: 'Mod+P', label: 'Print', group: 'Reports', action: noop },
  { id: 'reports.refresh', keys: 'R', label: 'Refresh the figures', group: 'Reports', action: noop },
  { id: 'app.save', keys: 'Mod+S', label: 'Save', action: noop },
  { id: 'app.settings', keys: 'Mod+,', label: 'Open settings', action: noop },
];

/** Keys of a component, which are not in the registry: the app lists them. */
const extra: ShortcutsSheetSectionData[] = [
  {
    title: 'In a table',
    items: [
      { label: 'Move between cells', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] },
      { label: 'First and last row', keys: ['Mod+Home', 'Mod+End'] },
      { label: 'Select the row', keys: 'Space' },
      { label: 'Open the row', keys: 'Enter' },
    ],
  },
  {
    title: 'In a dialog',
    items: [
      { label: 'Close', keys: 'Escape' },
      { label: 'Next control', keys: 'Tab' },
    ],
  },
];

/** The page behind the sheet: a button that opens it, a field, and the command palette. */
function App({
  globals,
  list = shortcuts,
  ...sheet
}: ShortcutsSheetProps & { globals: unknown; list?: Shortcut[] }) {
  const [last, setLast] = useState('none');
  return (
    <UmbraProvider {...(globals as Globals)} shortcuts={list}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <ShortcutsSheet trigger={<Button>Keyboard shortcuts</Button>} {...sheet} />
        <TextField aria-label="Note" placeholder="Typing ? here writes a question mark" />
        <Popover trigger={<Button>Filters</Button>} title="Filters">
          <Button onPress={() => setLast('filter')}>Only open orders</Button>
        </Popover>
        <Log>Last: {last}</Log>
      </div>
      <CommandPalette
        commands={[{ id: 'export', label: 'Export orders' }]}
        onRun={(command) => setLast(command.label)}
      />
    </UmbraProvider>
  );
}

/**
 * Every shortcut of the registry that has a label, in the app's groups, then the ungrouped, then the
 * library's own; and two sections the app adds for keys that are not in the registry. Type to filter.
 */
export const Default: Story = {
  tags: ['narrow'],
  render: (_, { globals }) => <App globals={globals} defaultOpen extra={extra} />,
};

/**
 * Closed until it is asked for: by `?`, by the button, or by the app (`open`). `?` typed in a field
 * is text. The popover and the command palette are here for the layer tests.
 */
export const Closed: Story = { render: (_, { globals }) => <App globals={globals} extra={extra} /> };

/** `variant="drawer"`: a sheet attached to the end edge, as tall as the window. */
export const Drawer: Story = {
  render: (_, { globals }) => <App globals={globals} defaultOpen variant="drawer" size="sm" extra={extra} />,
};

/** The search matches nothing: the empty state. `defaultQuery` is the text the sheet opens with. */
export const NoMatch: Story = {
  render: (_, { globals }) => <App globals={globals} defaultOpen defaultQuery="zzz" />,
};

/**
 * Conflicts are shown as the registry resolves them. "Find" takes `Mod+K` from the command palette,
 * which is then listed nowhere; of the two on `G` only the one registered last is listed; and the
 * sheet's own key is rebound to `Mod+/` by registering its id.
 */
export const Conflicts: Story = {
  render: (_, { globals }) => (
    <App
      globals={globals}
      defaultOpen
      size="md"
      list={[
        { id: 'app.find', keys: 'Mod+K', label: 'Find', action: noop },
        { id: 'app.first', keys: 'G', label: 'Go to the first (loses its key)', action: noop },
        { id: 'app.grid', keys: 'G', label: 'Show the grid', action: noop },
        { id: 'umbra.shortcutsSheet', keys: 'Mod+/', label: 'Show keyboard shortcuts' },
      ]}
    />
  ),
};

/**
 * Parts changed by a function (a section, a line), replaced by a node (the empty state) and hidden
 * with `null` (the search); translated texts.
 */
export const Parts: Story = {
  render: (_, { globals }) => (
    <App
      globals={globals}
      defaultOpen
      size="md"
      title="Raccourcis clavier"
      closeLabel="Fermer"
      ungroupedLabel="Divers"
      reservedLabel="Application"
      orLabel="ou"
      extra={extra.slice(0, 1)}
      parts={{
        search: null,
        section: (p) => <ShortcutsSheet.Section {...p} title={<>{p.title} ·</>} />,
        item: (p) => <ShortcutsSheet.Item {...p} label={<em>{p.label}</em>} />,
        empty: <div data-part="empty">Rien</div>,
      }}
    />
  ),
};

/** The blocks composed by hand, in a `Modal` of the app: sections, lines and keys. */
export const Blocks: Story = {
  render: (_, { globals }) => (
    <UmbraProvider {...(globals as Globals)}>
      <Modal defaultOpen size="md" title="Keys of the planner" footer={<Modal.Close>Close</Modal.Close>}>
        <ShortcutsSheet.Columns>
          <ShortcutsSheet.Section title="Days">
            <ShortcutsSheet.Item label="Next and previous day" keys={['ArrowRight', 'ArrowLeft']} />
            <ShortcutsSheet.Item label="Today" keys="T" />
          </ShortcutsSheet.Section>
          <ShortcutsSheet.Section title="Entries">
            <ShortcutsSheet.Item label="New entry" keys="Mod+N" />
            <ShortcutsSheet.Item label="Delete the entry" keys="Mod+Backspace" />
          </ShortcutsSheet.Section>
        </ShortcutsSheet.Columns>
        <p style={{ margin: 0 }}>
          Keys alone, in a sentence: press <ShortcutsSheet.Keys keys="Mod+Enter" /> to save.
        </p>
      </Modal>
    </UmbraProvider>
  ),
};
