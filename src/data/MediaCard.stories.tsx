import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bookmark } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../basics/IconButton';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { brokenImage } from '../stories/dataValues';
import { Picture } from '../stories/pictures';
import { Log } from '../stories/placeholders';
import { EntityIcon } from './EntityIcon';
import { MediaCard } from './MediaCard';
import { Box } from './samples';
import { Tag } from './Tag';

const meta = {
  title: 'Data/MediaCard',
  component: MediaCard,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof MediaCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const text =
  'The quarterly review is ready. It covers every region, with the changes since the last one marked.';
const save = <IconButton icon={<Bookmark />} label="Save for later" variant="ghost" />;
const pair = {
  title: 'Region A',
  side: { leading: <EntityIcon name="Region A" size="sm" letters={2} />, meta: '12' },
  opposite: { title: 'Region B', leading: <EntityIcon name="Region B" size="sm" letters={2} />, meta: '9' },
  center: 'to',
};

/** The three variants: hero with the picture above and behind, compact, and pair. */
export const Variants: Story = {
  tags: ['tints'],
  render: () => (
    <Columns style={{ height: '100%' }}>
      <MediaCard
        variant="hero"
        image={<Picture label="A drawn landscape" />}
        title="Quarterly review published"
        description={text}
        meta="2 days ago · Reports"
        category="Review"
        actions={save}
        href="#review"
      />
      <MediaCard
        variant="hero"
        imagePlacement="behind"
        image={<Picture hue={190} />}
        title="New planning cycle opens next week"
        description={text}
        meta="5 hours ago · Planning"
        category="Notice"
        href="#cycle"
      />
      <Stack>
        <MediaCard
          size="content"
          image={<Picture hue={20} />}
          title="Stock count finished in Region 2"
          meta="3 days ago · Operations"
          category="Update"
          href="#count"
        />
        <MediaCard
          size="content"
          image={<Picture hue={120} />}
          title="Two suppliers added to the shortlist"
          description="Both passed the first check."
          meta="Last week · Sourcing"
          actions={save}
          href="#suppliers"
        />
        <MediaCard size="content" {...pair} meta="Week 12" category="Final" href="#regions" />
        <MediaCard
          size="content"
          title="Group 1"
          side={{ meta: '104' }}
          opposite={{ title: 'Group 2', meta: '98' }}
          meta="Orders this week"
        />
      </Stack>
    </Columns>
  ),
};

/** Loading in each layout, a picture that fails or is missing (the drawn placeholder), and no picture. */
export const States: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Stack>
        <MediaCard variant="hero" loading aria-label="Loading article" />
        <MediaCard size="content" loading aria-label="Loading item" />
        <MediaCard size="content" loading opposite={{ title: '' }} aria-label="Loading comparison" />
      </Stack>
      <Stack>
        <MediaCard
          variant="hero"
          src={brokenImage}
          alt="A picture that does not load"
          title="The picture failed to load"
          meta="Placeholder shown"
        />
        <MediaCard size="content" title="No picture was given" meta="Placeholder shown" />
        <MediaCard
          size="content"
          title="The picture is hidden"
          description="parts.image is null."
          parts={{ image: null }}
        />
      </Stack>
    </Columns>
  ),
};

function Pressable() {
  const [last, setLast] = useState('none');
  return (
    <Stack>
      <MediaCard
        size="content"
        image={<Picture />}
        title="A button with an action inside"
        meta="Press the card or the icon"
        onPress={() => setLast('Opened the card')}
        actions={
          <IconButton
            icon={<Bookmark />}
            label="Save for later"
            variant="ghost"
            onPress={() => setLast('Saved')}
          />
        }
      />
      <MediaCard
        size="content"
        image={<Picture hue={20} />}
        title="A link through the app's router"
        meta="renderLink"
        href="#routed"
        renderLink={(props) => <a data-router="" {...props} />}
      />
      <MediaCard
        size="content"
        {...pair}
        meta="A pair card that is a button"
        onPress={() => setLast('Opened the pair')}
      />
      <MediaCard size="content" image={<Picture hue={120} />} title="Plain: nothing to press" meta="Static" />
      <Log>Last action: {last}</Log>
    </Stack>
  );
}

/** The whole card as a link or a button, with a control inside that stays its own. */
export const LinksAndActions: Story = { render: () => <Pressable /> };

const long = 'A long headline that wraps to a second line and then ends in an ellipsis when it must';

const wrap = { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' } as const;

/** Less is shown as the card narrows: the description and the category go, then the picture and the meta line. */
export const Narrower: Story = {
  render: () => (
    <div style={wrap}>
      {[300, 210, 150].map((width) => (
        <Box key={width} width={width} label={`Compact, ${width}px`}>
          <MediaCard
            image={<Picture />}
            title={long}
            description={text}
            meta="2 days ago · Reports"
            category="Review"
          />
        </Box>
      ))}
      <Box width={170} label="Pair, 170px">
        <MediaCard {...pair} meta="Week 12" category="Final" />
      </Box>
    </div>
  ),
};

/** Less is shown as the slot gets shorter: the picture shrinks, the description goes, the meta line, the picture. */
export const Shorter: Story = {
  render: () => (
    <div style={wrap}>
      {[280, 200, 150, 100, 60].map((height) => (
        <Box key={height} width={260} height={height} label={`Hero, ${height}px high`}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <MediaCard
              variant="hero"
              image={<Picture hue={190} />}
              title="Planning cycle"
              description={text}
              meta="5 hours ago"
            />
          </div>
        </Box>
      ))}
    </div>
  ),
};

/** Text over a picture that is almost white: the scrim keeps it readable. */
export const OverALightPicture: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <MediaCard
        variant="hero"
        imagePlacement="behind"
        image={<Picture light />}
        title="A headline over a very light picture"
        description={text}
        meta="Just now · Reports"
        category="Review"
        href="#light"
      />
      <MediaCard
        variant="hero"
        imagePlacement="behind"
        image={<Picture light hue={40} />}
        title="Another one, with an action"
        meta="Just now"
        actions={save}
      />
    </Columns>
  ),
};

/** Parts replaced, hidden and adjusted, and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Stack>
        <MediaCard
          size="content"
          image={<Picture />}
          title="Function: a title of one line"
          description="parts.title receives the default props."
          parts={{ title: (p) => <MediaCard.Title {...p} lines={1} headingLevel={4} /> }}
        />
        <MediaCard
          size="content"
          image={<Picture hue={20} />}
          title="Node: the meta line is replaced"
          meta="Not shown"
          parts={{ meta: <MediaCard.Meta>Replaced meta</MediaCard.Meta> }}
        />
        <MediaCard
          size="content"
          image={<Picture hue={120} />}
          title="Null: no category"
          meta="Yesterday"
          category="Hidden"
          parts={{ category: null }}
        />
      </Stack>
      <MediaCard.Root variant="hero" aria-label="Composed by hand">
        <MediaCard.Image>
          <Picture hue={300} />
        </MediaCard.Image>
        <MediaCard.Content>
          <MediaCard.Title href="#by-hand">Composed from the blocks</MediaCard.Title>
          <MediaCard.Description lines={3}>{text}</MediaCard.Description>
          <MediaCard.Footer>
            <MediaCard.Meta>Today</MediaCard.Meta>
            <MediaCard.Category>
              <Tag size="small" tone="info">
                Guide
              </Tag>
            </MediaCard.Category>
            <MediaCard.Actions>{save}</MediaCard.Actions>
          </MediaCard.Footer>
        </MediaCard.Content>
      </MediaCard.Root>
    </Columns>
  ),
};

/** Right to left: the picture of a compact card is at the right, and the actions at the left. */
export const RightToLeft: Story = { ...Variants, tags: [], globals: { direction: 'rtl' } };
