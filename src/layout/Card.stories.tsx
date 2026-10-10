import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bookmark, Download, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Rows } from '../stories/placeholders';
import { Card } from './Card';
import { Columns } from './Columns';
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
