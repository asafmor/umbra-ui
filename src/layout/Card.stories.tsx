import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bookmark, Download, Filter, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Skeleton } from '../basics/Skeleton';
import { Log, Rows } from '../stories/placeholders';
import { Card } from './Card';
import { Columns } from './Columns';
import { Slot } from './Slot';
import { Stack } from './Stack';

const meta = {
  title: 'Layout/Card',
  component: Card,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

const actions = (
  <>
    <IconButton icon={<Filter />} label="Filter" />
    <IconButton icon={<Download />} label="Export" />
    <IconButton icon={<RefreshCw />} label="Refresh" />
  </>
);

/** Tones and header styles. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Default" subtitle="Takes a little of the context tint" icon={<Bookmark />}>
        <Rows />
      </Card>
      <Card title="Tinted" tone="tinted" actions={actions}>
        <Rows />
      </Card>
      <Card title="Neutral" tone="neutral" href="#">
        <Rows />
      </Card>
      <Stack>
        <Card title="Band header" headerStyle="band" subtitle="Brand colour">
          <Rows count={3} />
        </Card>
        <Card title="No padding" padding="none">
          <Rows count={3} />
        </Card>
        <Card aria-label="Card without a header">A card without a title has no header.</Card>
      </Stack>
    </Columns>
  ),
};

/** Loading, empty and error replace the body; the header stays. */
export const States: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Loading" loading />
      <Card title="Empty" empty="Nothing to show yet." />
      <Card
        title="Error"
        error={
          <>
            Could not load this card.
            <Button size="small">Retry</Button>
          </>
        }
      />
      <Stack>
        <Card title="Collapsible" collapsible>
          <Rows count={3} />
        </Card>
        <Card title="Collapsed by the user" collapsible defaultCollapsed>
          <Rows count={3} />
        </Card>
      </Stack>
    </Columns>
  ),
};

function Retrying() {
  const [tries, setTries] = useState(0);
  return (
    <Card title="Error with retry" error="Could not load the orders." onRetry={() => setTries(tries + 1)}>
      Tried {tries} times.
    </Card>
  );
}

/**
 * The richer forms of `empty` and `error`, as on every data component: pieces (`title`, `description`,
 * `icon`, `action`), `true` for a default text, and `onRetry` for a retry button.
 */
export const RichStates: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card
        title="Empty, in pieces"
        empty={{
          title: 'No orders yet',
          description: 'Orders appear here as soon as the first one is placed.',
          icon: <Bookmark />,
          action: <Button>New order</Button>,
        }}
      />
      <Retrying />
      <Card title="Error, default text" error />
      <Card
        title="Error, in pieces"
        error={{ title: 'The service is not answering', description: 'It was last seen a minute ago.' }}
        onRetry={() => {}}
        retryLabel="Load again"
      />
    </Columns>
  ),
};

/** As the header narrows: the subtitle hides, the actions move into one menu, then the title truncates. */
export const HeaderShrink: Story = {
  render: () => (
    <Stack style={{ height: '100%' }}>
      {[520, 360, 250, 150].map((width) => (
        <div key={width} style={{ width, flex: 1, display: 'flex', minHeight: 0 }}>
          <Card title="Quarterly review" subtitle="Updated a moment ago" actions={actions}>
            {width}px wide
          </Card>
        </div>
      ))}
    </Stack>
  ),
};

/** Parts replace or hide one piece; blocks rebuild the card by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card
        title="Toolbar and footer parts"
        parts={{
          toolbar: (
            <Card.Toolbar>
              <Button size="small" variant="accent">
                All
              </Button>
              <Button size="small">Open</Button>
            </Card.Toolbar>
          ),
          footer: <Card.Footer>12 items</Card.Footer>,
        }}
      >
        <Rows count={12} />
      </Card>
      <Card.Root label="Built from blocks">
        <Card.Header>
          <Card.Title>Built from blocks</Card.Title>
          <Card.Actions>
            <Button size="small">Edit</Button>
          </Card.Actions>
        </Card.Header>
        <Card.Body>
          <Rows count={12} />
        </Card.Body>
        <Card.Footer>Footer block</Card.Footer>
      </Card.Root>
    </Columns>
  ),
};

function HeaderOptionsCards() {
  const [opened, setOpened] = useState(0);
  return (
    <Columns style={{ height: '100%' }}>
      <Card.Root label="Band colour" headerStyle="band">
        <Card.Header title="Band colour" subtitle="Set on the header block" bandColor="#134e4a" />
        <Card.Body>
          <Rows count={4} />
        </Card.Body>
      </Card.Root>
      <Card title="Opens a fuller view" onOpen={() => setOpened((n) => n + 1)}>
        <Log>Opened {opened} times</Log>
      </Card>
      <Card title="Heading level 4" headingLevel={4}>
        The title is an h4.
      </Card>
      <Card aria-label="Totals">A card without a title is named by `aria-label`.</Card>
    </Columns>
  );
}

/** `bandColor`, a title that is a button (`onOpen`), `headingLevel`, and a card named by `aria-label`. */
export const HeaderOptions: Story = { render: () => <HeaderOptionsCards /> };

function ControlledCard() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Stack style={{ height: '100%' }}>
      <Slot size="content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button onPress={() => setCollapsed((c) => !c)}>Toggle from outside</Button>
          <Log>Collapsed: {collapsed ? 'yes' : 'no'}</Log>
        </div>
      </Slot>
      <Card title="Controlled" collapsible collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <Rows count={4} />
      </Card>
      <Card title="Takes the room">
        <Rows count={4} />
      </Card>
    </Stack>
  );
}

/** `collapsed` with `onCollapsedChange`: the app holds the state, and the caret reports to it. */
export const ControlledCollapse: Story = { render: () => <ControlledCard /> };

/** A part is replaced by a node, changed by a function that receives the default props, or hidden with `null`. */
export const Parts: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Orders" parts={{ title: <Card.Title>Title from a node</Card.Title> }}>
        <Rows count={4} />
      </Card>
      <Card
        title="Header from a function"
        parts={{ header: (p) => <Card.Header {...p} headerStyle="band" subtitle="Band added by the part" /> }}
      >
        <Rows count={4} />
      </Card>
      <Card title="Body from a function" parts={{ body: (p) => <Card.Body {...p} padding="none" /> }}>
        <Rows count={4} />
      </Card>
      <Stack>
        <Card title="Actions hidden" actions={actions} parts={{ actions: null }}>
          <Rows count={2} />
        </Card>
        <Card title="Header hidden" aria-label="Header hidden" parts={{ header: null }}>
          The header part is `null`.
        </Card>
        <Card
          title="Skeleton from a node"
          loading
          parts={{ skeleton: <Skeleton shape="block" height={48} /> }}
        />
      </Stack>
    </Columns>
  ),
};

function CollapsedActionsStack() {
  const [last, setLast] = useState('none');
  return (
    <Stack style={{ height: '100%' }}>
      <Slot size="content">
        <Log>Last action: {last}</Log>
      </Slot>
      <Slot>
        <div style={{ width: 360, height: 200, maxHeight: '100%', display: 'flex' }}>
          <Stack>
            <Card title="Orders" priority={1} minHeight={120}>
              <Rows count={3} prefix="Order" />
            </Card>
            <Card
              title="Exports"
              minHeight={120}
              actions={
                <>
                  <IconButton icon={<Download />} label="Export" onPress={() => setLast('Export')} />
                  <IconButton icon={<RefreshCw />} label="Refresh" onPress={() => setLast('Refresh')} />
                </>
              }
            >
              <Rows count={3} prefix="File" />
            </Card>
          </Stack>
        </div>
      </Slot>
    </Stack>
  );
}

/**
 * `size="content"`: the card is as tall as its header plus its content, with or without a title, and
 * the others share the rest. In the short stack it gets what the stack can give and scrolls inside.
 */
export const ContentSized: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Stack>
        <Card title="Hugs its content" size="content">
          <Rows count={3} />
        </Card>
        <Card aria-label="Note" size="content">
          A content-sized card without a title.
        </Card>
        <Card title="Takes the rest">
          <Rows count={12} />
        </Card>
      </Stack>
      <Slot label="Short stack">
        <div style={{ height: 220, display: 'flex' }}>
          <Stack>
            <Card title="Taller than the stack" size="content">
              <Rows count={12} />
            </Card>
            <Card title="Keeps its minimum" minHeight={72}>
              <Rows count={3} />
            </Card>
          </Stack>
        </div>
      </Slot>
    </Columns>
  ),
};

/** A card the stack has collapsed opens in a popover, which repeats the header actions above the content. */
export const CollapsedActions: Story = { render: () => <CollapsedActionsStack /> };
