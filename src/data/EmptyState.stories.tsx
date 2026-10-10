import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleAlert, Inbox } from 'lucide-react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { EmptyState } from './EmptyState';
import { Box } from './samples';

const meta = {
  title: 'Data/EmptyState',
  component: EmptyState,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

const text = {
  title: 'No orders',
  description: 'Orders appear here once a client has placed one.',
};

/** Block (centred in its slot) and inline (one line), in the neutral and the error tone. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Block">
        <EmptyState {...text} icon={<Inbox />} action={<Button>New order</Button>} />
      </Card>
      <Card title="Block, error">
        <EmptyState
          tone="error"
          role="alert"
          icon={<CircleAlert />}
          title="Orders did not load"
          description="The server did not answer in time."
          action={<Button>Try again</Button>}
        />
      </Card>
      <Stack>
        <Card title="Inline">
          <EmptyState variant="inline" {...text} icon={<Inbox />} />
        </Card>
        <Card title="Inline, error, with an action">
          <EmptyState
            variant="inline"
            tone="error"
            icon={<CircleAlert />}
            title="Orders did not load"
            action={<Button size="small">Try again</Button>}
          />
        </Card>
        <Card title="Title only">
          <EmptyState title="None yet" />
        </Card>
      </Stack>
    </Columns>
  ),
};

/** As its slot gets smaller the icon hides, then the description. An inline title truncates last. */
export const Shrink: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Block, by height">
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['roomy', 150],
            ['short', 76],
            ['tiny', 40],
          ].map(([label, height]) => (
            <Box key={label} label={`${label}: ${height}px high`} height={height}>
              <EmptyState {...text} icon={<Inbox />} />
            </Box>
          ))}
        </div>
      </Card>
      <Card title="Inline, by width">
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['wide', 460],
            ['medium', 380],
            ['narrow', 150],
            ['narrowest', 70],
          ].map(([label, width]) => (
            <Box key={label} label={`${label}: ${width}px wide`} width={width}>
              <EmptyState variant="inline" {...text} icon={<Inbox />} />
            </Box>
          ))}
        </div>
      </Card>
    </Columns>
  ),
};

/** Parts replaced by a node or a function, or hidden with `null`; and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Parts: function and node">
        <EmptyState
          {...text}
          icon={<Inbox />}
          action={<Button>New order</Button>}
          parts={{
            title: (p) => (
              <h3 data-part="title" style={{ margin: 0, font: 'var(--umbra-font-title)' }}>
                {p.children}
              </h3>
            ),
            description: <em data-part="description">A description replaced by a node.</em>,
          }}
        />
      </Card>
      <Card title="Parts: hidden">
        <EmptyState
          {...text}
          icon={<Inbox />}
          action={<Button>New order</Button>}
          parts={{ icon: null, action: null }}
        />
      </Card>
      <Card title="Blocks">
        <EmptyState.Root>
          <EmptyState.Icon>
            <Inbox />
          </EmptyState.Icon>
          <EmptyState.Title>Composed by hand</EmptyState.Title>
          <EmptyState.Description>Any content can sit between the blocks.</EmptyState.Description>
          <EmptyState.Action>
            <Button>One</Button>
            <Button variant="ghost">Two</Button>
          </EmptyState.Action>
        </EmptyState.Root>
      </Card>
    </Columns>
  ),
};
