import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Check, ExternalLink, Redo2, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Page } from '../layout/Page';
import { AppShell } from '../shell/AppShell';
import { Log, Rows } from '../stories/placeholders';
import { ActionBar, type ActionBarAction, type ActionBarTone } from './ActionBar';

const meta = {
  title: 'Overlays/ActionBar',
  component: ActionBar,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ActionBar>;
export default meta;
type Story = StoryObj<typeof meta>;

const column: CSSProperties = { display: 'grid', gap: 24, alignContent: 'start', minWidth: 0 };
const history: ActionBarAction[] = [
  { label: 'Undo', icon: <Undo2 /> },
  { label: 'Redo', icon: <Redo2 />, disabled: true },
  { label: 'Reset', icon: <RotateCcw /> },
];
const confirm: ActionBarAction = { label: 'Confirm', icon: <Check /> };

/** As the footer of a page, and as the footer of a card. */
export const Inline: Story = {
  parameters: { frame: undefined },
  render: () => (
    <AppShell>
      <Page
        footer={
          <ActionBar
            aria-label="Page actions"
            status={{ tone: 'info', text: '3 changes not saved' }}
            secondary={history}
            primary={confirm}
          />
        }
      >
        <Card
          title="Settings"
          parts={{
            footer: (
              <Card.Footer>
                <ActionBar
                  aria-label="Card actions"
                  style={{ flex: 1 }}
                  status="Rules for Region 2"
                  actions={<Button>Expand</Button>}
                />
              </Card.Footer>
            ),
          }}
        >
          <Rows count={8} prefix="Setting" />
        </Card>
      </Page>
    </AppShell>
  ),
};

/** Every status tone has its own icon. `emphasis="strong"` fills the bar, for a status that needs an answer. */
export const Status: Story = {
  tags: ['tints'],
  render: () => (
    <div style={column}>
      {(['neutral', 'info', 'success', 'warning', 'danger'] as ActionBarTone[]).map((tone) => (
        <ActionBar
          key={tone}
          aria-label={`Tone ${tone}`}
          status={{ tone, text: `Status with the ${tone} tone` }}
          primary={<Button>Action</Button>}
        />
      ))}
      <ActionBar
        aria-label="Response"
        emphasis="strong"
        status={{ tone: 'danger', text: 'Must respond' }}
        secondary={{ label: 'Decline' }}
        primary={{ label: 'Begin', variant: 'accent', icon: <ExternalLink /> }}
      />
      <ActionBar
        aria-label="Reminder"
        emphasis="strong"
        status={{ tone: 'warning', text: 'The review closes in two days' }}
        primary={<Button>Open the review</Button>}
      />
    </div>
  ),
};

/** `align`, the three groups of the structured form, and plain nodes. */
export const Groups: Story = {
  render: function Render() {
    const [log, setLog] = useState('none');
    const press = (label: string) => () => setLog(label);
    return (
      <div style={column}>
        <ActionBar
          aria-label="Structured"
          tertiary={[
            { label: 'Help', icon: <ExternalLink />, onPress: press('Help') },
            { label: 'Support', icon: <ExternalLink />, onPress: press('Support') },
          ]}
          secondary={history.map((a) => ({ ...a, onPress: press(a.label) }))}
          primary={{ ...confirm, onPress: press('Confirm') }}
        />
        {(['start', 'center', 'end'] as const).map((align) => (
          <ActionBar
            key={align}
            aria-label={`Aligned ${align}`}
            align={align}
            status={`align: ${align}`}
            actions={
              <>
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Save</Button>
              </>
            }
          />
        ))}
        <Log>Last action: {log}.</Log>
      </div>
    );
  },
};

const rows = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

/** A floating bar for the selected rows: it enters when the first row is selected and leaves when none is. */
export const Floating: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>([]);
    const [archived, setArchived] = useState(0);
    return (
      <div style={{ ...column, maxWidth: 640 }}>
        <Card title="Items" style={{ height: 320, position: 'relative' }}>
          {rows.map((row) => (
            <label key={row} style={{ display: 'flex', gap: 8, padding: '6px 0' }}>
              <input
                type="checkbox"
                checked={selected.includes(row)}
                onChange={(e) =>
                  setSelected((s) => (e.target.checked ? [...s, row] : s.filter((v) => v !== row)))
                }
              />
              {row}
            </label>
          ))}
          <ActionBar
            variant="floating"
            aria-label="Selected items"
            selectionCount={selected.length}
            onClearSelection={() => setSelected([])}
            secondary={[{ label: 'Delete', icon: <Trash2 />, variant: 'danger' }]}
            primary={{
              label: 'Archive',
              icon: <Archive />,
              variant: 'accent',
              onPress: () => setArchived((n) => n + 1),
            }}
          />
        </Card>
        <Log>
          Selected: {selected.length}. Archived: {archived}.
        </Log>
      </div>
    );
  },
};

/** An open floating bar, as the visual tests see it. */
export const FloatingOpen: Story = {
  render: () => (
    <Card title="Items" style={{ height: 320, maxWidth: 640, position: 'relative' }}>
      <Rows count={6} />
      <ActionBar
        variant="floating"
        aria-label="Selected items"
        selectionCount={3}
        onClearSelection={() => {}}
        secondary={[{ label: 'Delete', icon: <Trash2 />, variant: 'danger' }]}
        primary={{ label: 'Archive', icon: <Archive />, variant: 'accent' }}
      />
    </Card>
  ),
};

/**
 * As it narrows: the status text truncates down to its icon, then the secondary actions keep only their
 * icons, then their labels truncate. The primary action keeps its label.
 */
export const Shrink: Story = {
  render: () => (
    <div style={column}>
      {[760, 520, 400, 300, 200].map((width) => (
        <div key={width} style={{ width }} data-width={width}>
          <ActionBar
            aria-label={`${width}px`}
            status={{ tone: 'info', text: 'Three changes are not saved yet' }}
            secondary={[...history.slice(0, 2), { label: 'Discard' }]}
            primary={confirm}
          />
        </div>
      ))}
    </div>
  ),
};

/** Each kind of `parts` override: a node replaces, `null` hides, a function wraps the default. */
export const Parts: Story = {
  render: () => (
    <div style={column}>
      <ActionBar
        aria-label="Node"
        status="Replaced"
        primary={confirm}
        parts={{ status: <strong data-part="status">A node replaces the status</strong> }}
      />
      <ActionBar
        aria-label="Null"
        selectionCount={2}
        onClearSelection={() => {}}
        primary={confirm}
        parts={{ clear: null }}
      />
      <ActionBar
        aria-label="Function"
        status={{ tone: 'success', text: 'Saved' }}
        primary={confirm}
        parts={{
          status: (p) => <ActionBar.Status {...p}>{p.children} (wrapped)</ActionBar.Status>,
          actions: (p) => <ActionBar.Actions>3 drafts · {p.children}</ActionBar.Actions>,
        }}
      />
    </div>
  ),
};

/** The same bar composed by hand from the blocks. */
export const Blocks: Story = {
  render: () => (
    <ActionBar.Root aria-label="Composed" tone="warning">
      <ActionBar.Status>Composed from blocks</ActionBar.Status>
      <ActionBar.Group kind="tertiary">
        <ActionBar.Action label="Help" icon={<ExternalLink />} />
      </ActionBar.Group>
      <ActionBar.Actions>
        <ActionBar.Group kind="secondary">
          <ActionBar.Action label="Undo" icon={<Undo2 />} />
        </ActionBar.Group>
        <ActionBar.Group kind="primary">
          <ActionBar.Action label="Confirm" icon={<Check />} />
        </ActionBar.Group>
      </ActionBar.Actions>
    </ActionBar.Root>
  ),
};
