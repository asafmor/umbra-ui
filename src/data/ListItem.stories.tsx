import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log } from '../stories/placeholders';
import { ListItem } from './ListItem';
import { Box, Chip, Dot } from './samples';
import { LiveValues } from '../stories/live';

const meta = {
  title: 'Data/ListItem',
  component: ListItem,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ListItem>;
export default meta;
type Story = StoryObj<typeof meta>;

function Pressable() {
  const [last, setLast] = useState('none');
  return (
    <>
      <ListItem
        size="compact"
        title="Opens with a press"
        meta="Button"
        onPress={() => setLast('Pressed the row')}
        trailing={<IconButton icon={<Star />} label="Pin" onPress={() => setLast('Pinned')} />}
      />
      <ListItem size="compact" title="Goes to a page" meta="Link" href="#page" />
      <ListItem size="compact" title="Disabled" meta="Button" disabled onPress={() => setLast('Never')} />
      <Log>Last action: {last}</Log>
    </>
  );
}

/** The default variant with every slot, both sizes, and rows that are a link or a button. */
export const Default: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Slots" padding="none">
        <ListItem title="Title only" />
        <ListItem title="Title and description" description="A second line under the title" />
        <ListItem
          leading={<Dot />}
          overline="Overline"
          title="Every slot"
          description="Leading, overline, description, meta and trailing"
          meta="12:40"
          trailing={<Chip>Tag</Chip>}
        />
        <ListItem leading={<Dot />} title="Selected" description="Violet with an edge stripe" selected />
        <ListItem
          title="Accent"
          description="A stripe that carries a category"
          accent="var(--umbra-color-semantic-warning)"
          accentLabel="Category: review"
        />
        <ListItem title="Disabled" description="Dimmed" meta="12:40" disabled />
      </Card>
      <Card title="Compact" padding="none">
        <ListItem size="compact" leading={<Dot size={20} />} title="Person A" meta="9.1" />
        <ListItem size="compact" leading={<Dot size={20} />} title="Person B" meta="8.4" selected />
        <ListItem size="compact" leading={<Dot size={20} />} title="Person C" meta="7.7" unread />
      </Card>
      <Card title="Link and button" padding="none">
        <Pressable />
      </Card>
    </Columns>
  ),
};

/**
 * Two layouts beyond a title and a value. A `pair` row sets two things against each other around a
 * centre: each side takes half of the row, so the centres line up down the list. A media row holds a
 * paragraph beside an icon or image: `descriptionLines` lets the description wrap.
 */
export const PairAndMedia: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Pair" padding="none">
        <ListItem
          size="compact"
          title="Region 1"
          leading={<Dot size={20} />}
          meta="42"
          center="to"
          opposite={{
            title: 'Region 2',
            leading: <Dot size={20} color="var(--umbra-color-series-2)" />,
            meta: '38',
          }}
        />
        <ListItem
          size="compact"
          title="A region with a long name that truncates"
          leading={<Dot size={20} />}
          meta="7"
          center="to"
          opposite={{
            title: 'Region 4',
            leading: <Dot size={20} color="var(--umbra-color-series-3)" />,
            meta: '112',
          }}
        />
        <ListItem
          size="compact"
          title="Plan"
          center="09:30"
          opposite={{ title: 'Actual' }}
          accent="var(--umbra-color-semantic-warning)"
          accentLabel="Category: review"
        />
        <ListItem
          size="compact"
          title="Region 5"
          meta="16"
          center="to"
          opposite={{ title: 'Not set yet' }}
          selected
        />
      </Card>
      <Card title="Media" padding="none">
        <ListItem
          leading={<Dot size={48} />}
          title="Stock is in good shape"
          description="Nine of ten sites hold more than two weeks of stock, and no site is below its reorder level."
          descriptionLines={3}
        />
        <ListItem
          leading={<Dot size={48} color="var(--umbra-color-semantic-warning)" />}
          title="Two deliveries are late"
          description="Both left the depot on time. The delay is on the last stretch, where one road is closed until Friday, so the next deliveries on that route will be late as well."
          descriptionLines={2}
        />
        <ListItem
          leading={<Dot size={48} />}
          title="One line by default"
          description="Without descriptionLines a description stays on one line and ends in an ellipsis when it is too long for the row."
        />
      </Card>
      <Card title="Pair, from blocks" padding="none">
        <ListItem.Root variant="pair" size="compact">
          <ListItem.Side>
            <ListItem.Title>Depot A</ListItem.Title>
            <ListItem.Meta>12</ListItem.Meta>
          </ListItem.Side>
          <ListItem.Center>→</ListItem.Center>
          <ListItem.Side opposite>
            <ListItem.Meta>9</ListItem.Meta>
            <ListItem.Title>Depot B</ListItem.Title>
          </ListItem.Side>
        </ListItem.Root>
      </Card>
    </Columns>
  ),
};

/** The message variant: sender and tag on the first line, title and time on the second. */
export const Message: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="States" padding="none">
        <ListItem
          variant="message"
          overline="Person A"
          title="Unread: bold with a dot"
          meta="20:49"
          trailing={<Chip>Training</Chip>}
          unread
        />
        <ListItem
          variant="message"
          overline="Person B"
          title="Read: dimmed"
          meta="08:43"
          trailing={<Chip>Scheduling</Chip>}
          unread={false}
        />
        <ListItem
          variant="message"
          overline="Person A"
          title="Selected"
          meta="07:50"
          trailing={<Chip>Planning</Chip>}
          unread={false}
          selected
        />
        <ListItem
          variant="message"
          overline="Person C"
          title="Accent, with two tags"
          meta="21:34"
          trailing={
            <>
              <Chip>Review</Chip>
              <Chip>Audit</Chip>
            </>
          }
          accent="var(--umbra-color-semantic-success)"
          accentLabel="Category: introduction"
          unread
        />
        <ListItem
          variant="message"
          leading={<Dot />}
          overline="Person D"
          title="With a leading node and a title that is far too long to fit on one line of this card"
          description="A description goes on a third line"
          meta="10:50"
          trailing={<Chip>Research</Chip>}
        />
      </Card>
    </Columns>
  ),
};

const widths = [
  ['wide', 320],
  ['no trailing', 250],
  ['no description', 190],
  ['no meta', 130],
] as const;

/** As the row narrows, `trailing` hides, then `description`, then `meta`. The title truncates. */
export const Shrink: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Default">
        <div style={{ display: 'grid', gap: 8 }}>
          {widths.map(([label, width]) => (
            <Box key={label} label={`${label}: ${width}px`} width={width}>
              <ListItem
                size="compact"
                title="Quarterly review of all regions"
                description="Prepared by Person A"
                meta="12:40"
                trailing={<Chip>Tag</Chip>}
                unread
              />
            </Box>
          ))}
        </div>
      </Card>
      <Card title="Message">
        <div style={{ display: 'grid', gap: 8 }}>
          {widths.map(([label, width]) => (
            <Box key={label} label={`${label}: ${width}px`} width={width}>
              <ListItem
                variant="message"
                size="compact"
                overline="Person A"
                title="Quarterly review of all regions"
                meta="12:40"
                trailing={<Chip>Tag</Chip>}
                unread
              />
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
      <Card title="Parts" padding="none">
        <ListItem
          title="Title from a function"
          meta="12:40"
          parts={{
            title: (p) => (
              <div data-part="title" style={{ font: 'var(--umbra-font-title)' }}>
                {p.children}
              </div>
            ),
          }}
        />
        <ListItem
          title="Meta replaced by a node"
          meta="hidden"
          parts={{ meta: <b data-part="meta">Custom</b> }}
        />
        <ListItem
          leading={<Dot />}
          title="Leading, description and the unread dot hidden"
          description="Hidden"
          unread
          parts={{ leading: null, description: null, unread: null }}
        />
      </Card>
      <Card title="Blocks" padding="none">
        <ListItem.Root variant="message" unread>
          <ListItem.Leading>
            <Dot />
          </ListItem.Leading>
          <ListItem.Content>
            <ListItem.Overline>Composed by hand</ListItem.Overline>
            <ListItem.Title>Any content can sit between the blocks</ListItem.Title>
          </ListItem.Content>
          <ListItem.End>
            <span>
              <ListItem.Unread label="New" /> <ListItem.Meta>12:40</ListItem.Meta>
            </span>
            <ListItem.Trailing>
              <Chip>Tag</Chip>
            </ListItem.Trailing>
          </ListItem.End>
        </ListItem.Root>
      </Card>
    </Columns>
  ),
};

/** `highlightChanges`: press the button and each changed value flashes once, with a sign when a number rose or fell. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues>{(value) => <ListItem title="Orders" meta={value} highlightChanges />}</LiveValues>
  ),
};
