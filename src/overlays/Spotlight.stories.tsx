import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Page } from '../layout/Page';
import { Stack } from '../layout/Stack';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import { AppShell } from '../shell/AppShell';
import { Log, Rows, Value } from '../stories/placeholders';
import { CommandPalette } from './CommandPalette';
import { Menu } from './Menu';
import { Modal } from './Modal';
import { Spotlight, type SpotlightProps } from './Spotlight';
import { Tooltip } from './Tooltip';

const meta = { title: 'Overlays/Spotlight', component: Spotlight } satisfies Meta<typeof Spotlight>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

/** The page behind every spotlight: three columns of cards. `summary` is extra content of the middle card. */
function Screen({ summary, children }: { summary?: ReactNode; children?: ReactNode }) {
  return (
    <AppShell background="flat">
      <Page>
        <Columns>
          <Card title="Inbox" size={3} className="spot-inbox">
            <Rows count={40} prefix="Message" />
          </Card>
          <Card title="Summary" size={5} className="spot-summary">
            {summary}
            <Rows count={8} prefix="Update" />
          </Card>
          <Stack size={2.4} label="Status">
            <Card title="Budget" tone="neutral" className="spot-budget">
              <Value label="Available" value="64.0M" />
            </Card>
            <Card title="This week" tone="neutral">
              <Rows count={3} prefix="Day" />
            </Card>
          </Stack>
        </Columns>
        {children}
      </Page>
    </AppShell>
  );
}

/** A spotlight that can be opened again, and a line that says what happened. */
function Demo({
  summary,
  children,
  ...spotlight
}: SpotlightProps & { summary?: ReactNode; children?: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [finished, setFinished] = useState(0);
  return (
    <Screen
      summary={
        <>
          <Button onPress={() => setOpen(true)}>Show the tip</Button>
          <Log>
            Spotlight: {open ? 'open' : 'closed'}. Finished: {finished}
          </Log>
          {summary}
        </>
      }
    >
      <Spotlight open={open} onOpenChange={setOpen} onFinish={() => setFinished((n) => n + 1)} {...spotlight}>
        {children}
      </Spotlight>
    </Screen>
  );
}

/**
 * A coach mark: everything but the target is dimmed, the target has a ring, and a callout beside it
 * explains it. Nothing but the callout can be used. Escape, a press on the dim and the button close it.
 */
export const Default: Story = {
  render: () => (
    <Demo target=".spot-inbox" title="Your inbox">
      New messages arrive here. The newest is at the top.
    </Demo>
  ),
};

function InteractiveDemo() {
  const [shown, setShown] = useState(true);
  const [last, setLast] = useState('none');
  const [open, setOpen] = useState(true);
  return (
    <Screen
      summary={
        <>
          <Button onPress={() => setOpen(true)}>Show the tip</Button>
          <Log>
            Spotlight: {open ? 'open' : 'closed'}. Last: {last}
          </Log>
          {shown && (
            <div className="spot-tools" style={{ display: 'flex', gap: 8, padding: 8 }}>
              <Tooltip content="Sends the summary by mail">
                <Button onPress={() => setLast('send')}>Send</Button>
              </Tooltip>
              <Menu
                trigger={<Button>More</Button>}
                items={[
                  { id: 'duplicate', label: 'Duplicate' },
                  { id: 'archive', label: 'Archive' },
                ]}
                onAction={setLast}
              />
              <Button onPress={() => setShown(false)}>Remove these tools</Button>
            </div>
          )}
        </>
      }
    >
      <Spotlight
        target=".spot-tools"
        interactive
        open={open}
        onOpenChange={setOpen}
        placement="bottom"
        title="Try the tools"
      >
        They work while the rest of the page is dimmed. A target that leaves the page closes the spotlight.
      </Spotlight>
    </Screen>
  );
}

/**
 * `interactive`: the target takes presses and keys, and what it opens (a tooltip, a menu) is above
 * the dim. The rest of the page stays out of reach. When the target leaves the page the spotlight
 * closes: the dim is never left without a target.
 */
export const Interactive: Story = { render: () => <InteractiveDemo /> };

function TourDemo() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  return (
    <Screen
      summary={
        <>
          <Button onPress={() => (setStep(0), setOpen(true))}>Start the tour</Button>
          <Log>Tour: {open ? `step ${step + 1}` : 'closed'}</Log>
        </>
      }
    >
      <Spotlight
        open={open}
        onOpenChange={setOpen}
        step={step}
        onStepChange={setStep}
        steps={[
          { target: '.spot-inbox', title: 'Inbox', body: 'New messages arrive here.' },
          { target: '.spot-missing', title: 'Not in the page', body: 'This step is passed over.' },
          {
            target: '.spot-summary',
            title: 'Summary',
            body: 'The figures of the week.',
            placement: 'start',
          },
          {
            // The last row of the inbox: out of sight until the tour scrolls it into view.
            target: () =>
              document.querySelector('.spot-inbox [data-part="body"] > div > div > div:last-child'),
            title: 'Older messages',
            body: 'Scroll the inbox to read them.',
          },
          { target: '.spot-budget', title: 'Budget', body: 'What is left to spend.', placement: 'start' },
        ]}
      />
    </Screen>
  );
}

/**
 * `steps` makes a tour: Back, Next and Skip, "2 of 5", and the focus on the callout at every step. A
 * step whose target is not in the page is passed over; a target inside a scroll area is scrolled
 * into view.
 */
export const Tour: Story = { render: () => <TourDemo /> };

/**
 * `dismissable={false}`: only the callout's buttons close it. `actions` are the app's own buttons;
 * `padding` and `radius` shape the cut-out.
 */
export const Persistent: Story = {
  render: () => (
    <Demo
      target=".spot-budget"
      dismissable={false}
      padding={8}
      radius={16}
      placement="start"
      title="Set a budget first"
      actions={
        <Button variant="primary" size="small">
          Set the budget
        </Button>
      }
    >
      Orders cannot be placed without one.
    </Demo>
  ),
};

function InModalDemo({ globals }: { globals: Globals }) {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState('none');
  const field = useRef<HTMLDivElement>(null);
  return (
    <UmbraProvider {...globals}>
      <Screen>
        <Modal defaultOpen size="md" title="Edit order" footer={<Modal.Close>Close</Modal.Close>}>
          <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
            <div ref={field} style={{ display: 'flex', gap: 8 }}>
              <Tooltip content="Sends the order to the warehouse">
                <Button onPress={() => setLast('dispatch')}>Dispatch</Button>
              </Tooltip>
            </div>
            <Button onPress={() => setOpen(true)}>Show the tip</Button>
            <Log>
              Spotlight: {open ? 'open' : 'closed'}. Last: {last}
            </Log>
          </div>
        </Modal>
        <Spotlight target={field} interactive open={open} onOpenChange={setOpen} title="Dispatch from here">
          The order leaves as soon as it is dispatched.
        </Spotlight>
        <CommandPalette
          commands={[{ id: 'export', label: 'Export orders' }]}
          onRun={(command) => setLast(command.label)}
        />
      </Screen>
    </UmbraProvider>
  );
}

/**
 * A target inside a modal: the spotlight is above the modal (`--umbra-layer-spotlight`), the modal
 * stays open under it, and the command palette (`Mod+K`) still opens on top of both.
 */
export const InModal: Story = {
  render: (_, { globals }) => <InModalDemo globals={globals as Globals} />,
};

/**
 * Parts changed by a function (the title, the progress), replaced by a node (the buttons) and hidden
 * with `null` (the text); translated button texts are props (`nextLabel`, `backLabel`, `skipLabel`,
 * `doneLabel`, `progressLabel`).
 */
export const Parts: Story = {
  render: () => (
    <Demo
      steps={[
        { target: '.spot-summary', title: 'Summary', body: 'Hidden by the part.', placement: 'start' },
        { target: '.spot-inbox', title: 'Inbox' },
      ]}
      progressLabel={(current, total) => `Étape ${current} sur ${total}`}
      parts={{
        title: (p) => <Spotlight.Title {...p}>★ {p.children}</Spotlight.Title>,
        body: null,
        progress: (p) => <strong data-part="progress">{p.children}</strong>,
        actions: <Button size="small">Fermer</Button>,
      }}
    />
  ),
};

function BlocksDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Screen
      summary={
        <>
          <Button onPress={() => setOpen(true)}>Show the tip</Button>
          <Log>Spotlight: {open ? 'open' : 'closed'}</Log>
        </>
      }
    >
      <Spotlight.Root target=".spot-inbox" open={open} onOpenChange={setOpen}>
        <Spotlight.Callout placement="end start">
          <Spotlight.Title headingLevel={3}>Built from blocks</Spotlight.Title>
          <Spotlight.Body>The root, the callout, a title, a body and a footer of the app.</Spotlight.Body>
          <Spotlight.Footer>
            <Button size="small" onPress={() => setOpen(false)}>
              Later
            </Button>
            <Button size="small" variant="primary" onPress={() => setOpen(false)}>
              Read the inbox
            </Button>
          </Spotlight.Footer>
        </Spotlight.Callout>
      </Spotlight.Root>
    </Screen>
  );
}

/** The blocks composed by hand: `Spotlight.Root`, `Callout`, `Title`, `Body` and `Footer`. */
export const Blocks: Story = { render: () => <BlocksDemo /> };
