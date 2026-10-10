import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings, Trash2 } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { FormField } from '../inputs/FormField';
import { SegmentedFilter } from '../inputs/SegmentedFilter';
import { Tabs } from '../inputs/Tabs';
import { TextField } from '../inputs/TextField';
import { Toggle } from '../inputs/Toggle';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Page } from '../layout/Page';
import { AppShell } from '../shell/AppShell';
import { Log, Rows } from '../stories/placeholders';
import { ConfirmDialog, Modal, type ModalProps } from './Modal';

/** The page a modal opens over. Its button must not react while a modal is open. */
function Backdrop({ children }: { children: ReactNode }) {
  const [presses, setPresses] = useState(0);
  return (
    <AppShell background="flat">
      <Page>
        <Columns>
          <Card
            title="Orders"
            size={2}
            actions={<Button onPress={() => setPresses(presses + 1)}>Refresh</Button>}
          >
            <Log>Background presses: {presses}</Log>
            {children}
            <Rows count={30} prefix="Order" />
          </Card>
          <Card title="Summary">
            <Rows count={12} prefix="Measure" />
          </Card>
        </Columns>
      </Page>
    </AppShell>
  );
}

const meta = {
  title: 'Overlays/Modal',
  component: Modal,
  decorators: [
    (Story) => (
      <Backdrop>
        <Story />
      </Backdrop>
    ),
  ],
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;

const text = (
  <p style={{ margin: 0 }}>
    The report covers every region for the selected period. Pick what to include, then export it or share it
    with the people on your team.
  </p>
);
const actions = (
  <>
    <Modal.Close>Cancel</Modal.Close>
    <Modal.Close variant="primary">Confirm</Modal.Close>
  </>
);
const sized = (size: ModalProps['size'], label: string): Story => ({
  args: {
    size,
    defaultOpen: true,
    trigger: <Button>Open report</Button>,
    title: `Export report (${label})`,
    description: 'Choose what the export contains.',
    footer: actions,
    children: text,
  },
});

/** `sm`: a short question or a single field. */
export const Small: Story = sized('sm', 'sm');

/** `md`, the default. Opened by its `trigger`; focus returns to the trigger when it closes. */
export const Medium: Story = { ...sized('md', 'md'), tags: ['narrow'] };

export const Large: Story = sized('lg', 'lg');

export const ExtraLarge: Story = sized('xl', 'xl');

/** `full` fills the window minus a margin. */
export const Full: Story = sized('full', 'full');

/** `height="fill"` takes the full height whatever the content. */
export const FillHeight: Story = { args: { ...sized('md', 'height fill').args, height: 'fill' } };

const sectionNames = ['General', 'Display', 'Notifications', 'Accessibility', 'Shortcuts', 'Advanced'];

/** A stand-in for `VerticalNav`: any node can be the `nav`. */
function SectionList({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div role="group" aria-label="Sections" style={{ display: 'grid', gap: 4 }}>
      {sectionNames.map((name) => (
        <Button
          key={name}
          fullWidth
          variant={name === value ? 'neutral' : 'ghost'}
          onPress={() => onChange(name)}
          style={{
            justifyContent: 'flex-start',
            fontWeight: name === value ? 700 : undefined,
            boxShadow: name === value ? 'inset 3px 0 0 var(--umbra-color-fixed-selected)' : undefined,
          }}
        >
          {name}
        </Button>
      ))}
    </div>
  );
}

function SettingRows({ section, count = 4 }: { section: string; count?: number }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <FormField surface label={`${section}: display name`} description="Shown to the people you share with.">
        <TextField defaultValue="Person A" style={{ width: 200 }} />
      </FormField>
      {Array.from({ length: count }, (_, i) => (
        <FormField
          key={i}
          surface
          label={`${section}: option ${i + 1}`}
          description="A second line that explains the choice."
        >
          <Toggle defaultChecked={i % 2 === 0} />
        </FormField>
      ))}
    </div>
  );
}

/**
 * A settings screen: `nav` makes the panel two columns, and the body scrolls beside it. Below the
 * minimum window the modal fills the window and the navigation moves behind a "Sections" toggle.
 */
export const WithNav: Story = {
  tags: ['narrow'],
  render: function WithNav() {
    const [section, setSection] = useState('General');
    return (
      <Modal
        defaultOpen
        size="xl"
        height="fill"
        icon={<Settings />}
        title="Preferences"
        description="Changes apply to this workspace."
        nav={<SectionList value={section} onChange={setSection} />}
        footer={
          <>
            <Button variant="ghost" style={{ marginInlineEnd: 'auto' }}>
              Reset to default
            </Button>
            <Modal.Close>Cancel</Modal.Close>
            <Modal.Close variant="primary">Confirm</Modal.Close>
          </>
        }
      >
        <SettingRows section={section} count={9} />
      </Modal>
    );
  },
};

/** `toolbar`: tabs or filters that stay fixed under the header while the body scrolls. */
export const ToolbarTabs: Story = {
  render: function ToolbarTabs() {
    const [tab, setTab] = useState('overview');
    return (
      <Modal
        defaultOpen
        size="lg"
        title="Region 2"
        toolbar={
          <>
            <Tabs
              size="content"
              aria-label="View"
              value={tab}
              onChange={setTab}
              items={[
                { id: 'overview', label: 'Overview' },
                { id: 'detailed', label: 'Detailed' },
              ]}
            />
            <SegmentedFilter
              aria-label="Period"
              size="small"
              defaultValue="week"
              style={{ marginInlineStart: 'auto' }}
              items={[
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
              ]}
            />
          </>
        }
        padding="none"
      >
        <Rows count={tab === 'overview' ? 8 : 40} prefix={tab === 'overview' ? 'Total' : 'Order'} />
      </Modal>
    );
  },
};

/** Content taller than the window: the header and footer stay, the body scrolls, the page does not. */
export const LongBody: Story = {
  args: {
    defaultOpen: true,
    title: 'Activity',
    description: 'Everything that changed this week.',
    footer: <Modal.Close variant="primary">Done</Modal.Close>,
    children: <Rows count={60} prefix="Change" />,
  },
};

/**
 * A form. `onRequestClose` keeps the modal open while there are unsaved changes: Escape, an outside
 * press and the close button all ask first.
 */
export const Form: Story = {
  render: function Form() {
    const [name, setName] = useState('Person A');
    const [blocked, setBlocked] = useState(0);
    const dirty = name !== 'Person A';
    return (
      <Modal
        defaultOpen
        trigger={<Button>Edit profile</Button>}
        title="Edit profile"
        onRequestClose={() => {
          if (!dirty) return;
          setBlocked(blocked + 1);
          return false;
        }}
        footer={
          <>
            <span style={{ marginInlineEnd: 'auto', font: 'var(--umbra-font-label)' }} role="status">
              {dirty ? `Unsaved changes. Close blocked: ${blocked}` : 'No changes'}
            </span>
            <Button onPress={() => setName('Person A')}>Discard</Button>
            <Modal.Close variant="primary" onPress={() => setName('Person A')}>
              Save
            </Modal.Close>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <FormField label="Display name" description="Shown to the people you share with." required>
            <TextField value={name} onChange={setName} style={{ width: 200 }} />
          </FormField>
          <FormField label="Email updates" description="A summary every Monday.">
            <Toggle defaultChecked />
          </FormField>
          <FormField label="Sound" description="Play a sound when a report is ready.">
            <Toggle />
          </FormField>
        </div>
      </Modal>
    );
  },
};

/** A modal opened from a modal. Escape and an outside press close only the top one. */
export const Nested: Story = {
  render: () => (
    <Modal defaultOpen size="lg" title="Order 12" footer={<Modal.Close>Close</Modal.Close>}>
      {text}
      <div style={{ marginTop: 16 }}>
        <Modal
          defaultOpen
          size="sm"
          trigger={<Button>Add a note</Button>}
          title="Add a note"
          footer={actions}
        >
          <TextField aria-label="Note" multiline rows={3} placeholder="Write a note" />
        </Modal>
      </div>
    </Modal>
  ),
};

/**
 * `variant="alertdialog"`: asks for a decision. No close button, an outside press does nothing, and
 * the first footer action (the least destructive one) has the focus.
 */
export const AlertDialog: Story = {
  args: {
    variant: 'alertdialog',
    size: 'sm',
    defaultOpen: true,
    trigger: <Button>Sign out</Button>,
    title: 'Sign out everywhere?',
    description: 'You will need to sign in again on every device.',
    footer: (
      <>
        <Modal.Close>Stay signed in</Modal.Close>
        <Modal.Close variant="primary">Sign out</Modal.Close>
      </>
    ),
    parts: { body: null },
  },
};

/**
 * `ConfirmDialog` with an `onConfirm` that returns a promise: the confirm button shows `loading` until
 * it settles. The first try fails and the dialog stays open; the second succeeds and closes it.
 */
export const Confirm: Story = {
  render: function Confirm() {
    const [tries, setTries] = useState(0);
    const [result, setResult] = useState('nothing yet');
    return (
      <>
        <Log>Result: {result}</Log>
        <ConfirmDialog
          defaultOpen
          trigger={<Button variant="danger">Delete report</Button>}
          tone="danger"
          icon={<Trash2 />}
          title="Delete this report?"
          description="The report and its 12 exports are removed for everyone. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setResult('cancelled')}
          onConfirm={() =>
            new Promise<void>((resolve, reject) => {
              setTries(tries + 1);
              setTimeout(() => {
                if (tries === 0) {
                  setResult('failed');
                  reject(new Error('offline'));
                } else {
                  setResult('deleted');
                  resolve();
                }
              }, 1200);
            })
          }
        >
          {result === 'failed' && (
            <p role="alert" style={{ margin: 0, color: 'var(--umbra-color-semantic-danger)' }}>
              Could not delete the report. Try again.
            </p>
          )}
        </ConfirmDialog>
      </>
    );
  },
};

const drawer = (side: ModalProps['side']): Story => ({
  args: {
    variant: 'drawer',
    side,
    defaultOpen: true,
    trigger: <Button>Show details</Button>,
    title: `Order 12 (${side})`,
    description: 'Placed by Person A in Region 2.',
    footer: <Modal.Close>Close</Modal.Close>,
    children: <Rows count={side === 'bottom' ? 5 : 40} prefix="Line" />,
  },
});

/** `variant="drawer"`: a detail panel attached to the end edge. */
export const DrawerEnd: Story = drawer('end');

export const DrawerStart: Story = drawer('start');

/** A bottom drawer is as tall as its content, and leaves some of the page in view. */
export const DrawerBottom: Story = drawer('bottom');

/** `parts`: a node replaces a piece, `null` hides one, a function receives the default props. */
export const Parts: Story = {
  args: {
    defaultOpen: true,
    title: 'Share report',
    description: 'This description is hidden with `null`.',
    footer: actions,
    children: text,
    parts: {
      title: (p) => <Modal.Title {...p}>{p.children} (wrapped by a function)</Modal.Title>,
      description: null,
      close: (p) => <Modal.Close {...p} label="Dismiss" />,
      footer: (
        <Modal.Footer>
          <span style={{ marginInlineEnd: 'auto', font: 'var(--umbra-font-label)' }}>
            A footer replaced by a node
          </span>
          <Modal.Close variant="primary">Done</Modal.Close>
        </Modal.Footer>
      ),
    },
  },
};

/** The same modal composed by hand from the blocks, with the focus sent to a chosen control. */
export const Blocks: Story = {
  render: function Blocks() {
    const field = useRef<HTMLDivElement>(null);
    return (
      <Modal.Root defaultOpen size="lg" initialFocusRef={field}>
        <Modal.Trigger>
          <Button>Open</Button>
        </Modal.Trigger>
        <Modal.Overlay>
          <Modal.Content>
            <Modal.Header>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Modal.Title>Invite people</Modal.Title>
                <Modal.Description>They get access to this workspace.</Modal.Description>
              </div>
            </Modal.Header>
            <Modal.Toolbar>
              <SegmentedFilter
                aria-label="Role"
                defaultValue="viewer"
                items={[
                  { id: 'viewer', label: 'Viewer' },
                  { id: 'editor', label: 'Editor' },
                ]}
              />
            </Modal.Toolbar>
            <Modal.Nav>
              <div style={{ font: 'var(--umbra-font-label)' }}>A custom side column</div>
            </Modal.Nav>
            <Modal.Body>
              <div ref={field}>
                <TextField aria-label="Email" placeholder="name@example.com" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close>Cancel</Modal.Close>
              <Modal.Close variant="primary">Send</Modal.Close>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Overlay>
      </Modal.Root>
    );
  },
};
