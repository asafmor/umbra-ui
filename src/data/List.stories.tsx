import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { Log } from '../stories/placeholders';
import { GroupHeader } from './GroupHeader';
import { List, type ListKey } from './List';
import { ListItem } from './ListItem';
import { Chip, days, Dot, ranking, type Message } from './samples';

const meta = {
  title: 'Data/List',
  component: List,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;

const messageRow = (m: Message) => (
  <List.Item
    id={m.id}
    overline={m.from}
    title={m.title}
    meta={m.time}
    trailing={<Chip>{m.tag}</Chip>}
    unread={m.unread}
  />
);

function InboxCard() {
  const [selected, setSelected] = useState<ListKey[]>(['m4']);
  const [opened, setOpened] = useState('none');
  return (
    <Card
      title="Inbox"
      padding="none"
      parts={{
        footer: (
          <Card.Footer>
            <Log>
              Selected: {selected.join(', ') || 'none'} · Opened: {opened}
            </Log>
          </Card.Footer>
        ),
      }}
    >
      <List
        aria-label="Inbox"
        itemVariant="message"
        selectionMode="single"
        selectedIds={selected}
        onSelectionChange={setSelected}
        onAction={(key) => setOpened(String(key))}
        groups={days}
        renderItem={messageRow}
      />
    </Card>
  );
}

/** A grouped message list: sticky date headers, single selection, and Enter or a double click to open. */
export const Inbox: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <InboxCard />
      <Card title="Collapsible groups" padding="none" size={1}>
        <List
          aria-label="Messages by day"
          itemVariant="message"
          groups={days.map((day, i) => ({
            ...day,
            count: day.items.length,
            collapsible: true,
            defaultCollapsed: i === 1,
          }))}
          renderItem={messageRow}
        />
      </Card>
    </Columns>
  ),
};

function MultipleCard() {
  const [selected, setSelected] = useState<ListKey[]>(['r2', 'r3']);
  return (
    <Card
      title="Multiple selection"
      padding="none"
      parts={{
        footer: (
          <Card.Footer>
            <Log>Selected: {selected.join(', ') || 'none'}</Log>
          </Card.Footer>
        ),
      }}
    >
      <List
        aria-label="Regions"
        itemSize="compact"
        selectionMode="multiple"
        selectedIds={selected}
        onSelectionChange={setSelected}
      >
        {ranking.slice(0, 6).map((r) => (
          <List.Item key={r.id} id={r.id} title={r.name} meta={r.owner} disabled={r.id === 'r5'} />
        ))}
      </List>
    </Card>
  );
}

function ActionsCard() {
  const [last, setLast] = useState('none');
  return (
    <Card
      title="Controls inside rows"
      padding="none"
      parts={{
        footer: (
          <Card.Footer>
            <Log>Last action: {last}</Log>
          </Card.Footer>
        ),
      }}
    >
      <List aria-label="People" itemSize="compact" onAction={(key) => setLast(`Opened ${key}`)}>
        {ranking.slice(0, 4).map((r) => (
          <List.Item
            key={r.id}
            id={r.id}
            leading={<Dot size={20} />}
            title={r.owner}
            trailing={
              <IconButton
                icon={<Star />}
                label={`Pin ${r.owner}`}
                onPress={() => setLast(`Pinned ${r.owner}`)}
              />
            }
          />
        ))}
      </List>
    </Card>
  );
}

/** A numbered, striped ranking from `items`; multiple selection; and rows that hold their own controls. */
export const Rows: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Ranking" padding="none">
        <List
          aria-label="Regional ranking"
          numbered
          striped
          dividers={false}
          itemSize="compact"
          items={ranking}
          renderItem={(r) => (
            <List.Item id={r.id} leading={<Dot size={20} />} title={r.name} meta={r.value} />
          )}
        />
      </Card>
      <MultipleCard />
      <ActionsCard />
    </Columns>
  ),
};

function RetryCard() {
  const [failed, setFailed] = useState(true);
  return (
    <Card title="Error, with retry" padding="none">
      <List
        aria-label="Orders"
        itemSize="compact"
        error={failed && { title: 'Orders did not load', description: 'The server did not answer in time.' }}
        onRetry={() => setFailed(false)}
      >
        <List.Item id="a" title="Order 1" />
        <List.Item id="b" title="Order 2" />
      </List>
    </Card>
  );
}

function MoreCard() {
  const [count, setCount] = useState(12);
  return (
    <Card
      title="Loading more"
      padding="none"
      parts={{
        footer: (
          <Card.Footer>
            <Log>Rows: {count}</Log>
          </Card.Footer>
        ),
      }}
    >
      <List
        aria-label="Orders, page by page"
        itemSize="compact"
        loadingMore
        onReachEnd={() => setCount((n) => Math.min(n + 12, 36))}
        items={Array.from({ length: count }, (_, i) => i + 1)}
        renderItem={(n) => <List.Item id={n} title={`Order ${n}`} />}
      />
    </Card>
  );
}

/** Loading shows skeleton rows in the final layout; empty and error come from the shared data states. */
export const States: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Stack>
        <Card title="Loading" padding="none">
          <List aria-label="Loading list" loading skeletonRows={3} />
        </Card>
        <Card title="Loading, message rows" padding="none">
          <List aria-label="Loading inbox" itemVariant="message" loading skeletonRows={3} />
        </Card>
      </Stack>
      <Stack>
        <Card title="Empty, default text" padding="none">
          <List aria-label="Empty list" />
        </Card>
        <Card title="Empty, custom" padding="none">
          <List
            aria-label="Orders"
            items={[]}
            empty={{
              title: 'No orders',
              description: 'Orders appear here once a client has placed one.',
              action: <Button>New order</Button>,
            }}
          />
        </Card>
      </Stack>
      <Stack>
        <RetryCard />
        <Card title="Error, default text" padding="none">
          <List aria-label="Failed list" error />
        </Card>
      </Stack>
      <MoreCard />
    </Columns>
  ),
};

/** Parts replaced by a node or a function, or hidden with `null`; and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Blocks" padding="none">
        <List.Root
          aria-label="Composed by hand"
          itemSize="compact"
          selectionMode="single"
          defaultSelectedIds={['b']}
        >
          <List.Group title="First group" count={2}>
            <List.Item id="a" title="Item 1" />
            <List.Item id="b" title="Item 2" />
          </List.Group>
          <List.Group
            header={
              <GroupHeader.Root variant="plain">
                <GroupHeader.Title>A header composed by hand</GroupHeader.Title>
              </GroupHeader.Root>
            }
          >
            <List.Item id="c" title="Item 3" />
            <List.Item id="d" textValue="Item 4">
              {(state) => (
                <ListItem.Root size="compact" {...state}>
                  <ListItem.Content>
                    <ListItem.Title>Item 4, with its own content</ListItem.Title>
                  </ListItem.Content>
                </ListItem.Root>
              )}
            </List.Item>
          </List.Group>
        </List.Root>
      </Card>
      <Stack>
        <Card title="Part: skeleton from a function" padding="none">
          <List
            aria-label="Custom skeleton"
            loading
            skeletonRows={2}
            parts={{
              skeleton: (p) => <ListItem size="compact" title={`Loading row ${p.index + 1}…`} />,
            }}
          />
        </Card>
        <Card title="Part: state replaced by a node" padding="none">
          <List
            aria-label="Custom state"
            parts={{ state: <p style={{ margin: 16 }}>A custom empty state.</p> }}
          />
        </Card>
        <Card title="Part: loading-more row hidden" padding="none">
          <List aria-label="No loading row" itemSize="compact" loadingMore parts={{ loadingMore: null }}>
            <List.Item id="a" title="Item 1" />
          </List>
        </Card>
      </Stack>
    </Columns>
  ),
};
