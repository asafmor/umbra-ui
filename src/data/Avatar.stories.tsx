import type { Meta, StoryObj } from '@storybook/react-vite';
import { Building2 } from 'lucide-react';
import { Button } from '../basics/Button';
import { brokenImage, DotStandIn, portrait, row, Section, Sheet } from '../stories/dataValues';
import { Avatar, AvatarGroup } from './Avatar';
import { Badge } from './Badge';
import { EntityIcon } from './EntityIcon';
import { KeyValueList } from './KeyValue';
import { Link } from './Link';
import { StatusIndicator } from './StatusIndicator';
import { StatValue } from './StatValue';
import { SummaryTile } from './SummaryTile';
import { Tag } from './Tag';
import { TrendArrow } from './TrendArrow';
import { ValuePill } from './ValuePill';

const meta = { title: 'Data/Avatar', component: Avatar, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Avatar
>;
export default meta;
type Story = StoryObj<typeof meta>;

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const people = ['Person A', 'Person B', 'Person C', 'Person D', 'Person E', 'Person F', 'Person G'];

/** The three contents in order of preference, every size and shape, the status slot and the ring. */
export const Avatars: Story = {
  render: () => (
    <Sheet>
      <Section label="Image, initials, silhouette (size follows density)">
        <div style={row}>
          <Avatar src={portrait} name="Person A" />
          <Avatar name="Person B" />
          <Avatar alt="Unknown person" />
          <Avatar name="Team North" fallbackIcon={<Building2 />} shape="square" />
          <Avatar fallbackIcon={<Building2 />} alt="Organisation" shape="square" />
        </div>
      </Section>
      <Section label="An image that fails falls back">
        <div style={row}>
          <Avatar src={brokenImage} name="Person C" />
          <Avatar src={brokenImage} alt="Unknown person" />
        </div>
      </Section>
      <Section label="Sizes xs to xl">
        <div style={row}>
          {sizes.map((size) => (
            <Avatar key={size} size={size} name="Person D" />
          ))}
          {sizes.map((size) => (
            <Avatar key={size} size={size} src={portrait} alt="Person A" />
          ))}
        </div>
      </Section>
      <Section label="Square">
        <div style={row}>
          {sizes.map((size) => (
            <Avatar key={size} size={size} shape="square" name="Region 2" />
          ))}
          <Avatar size="lg" shape="square" alt="Unknown person" />
        </div>
      </Section>
      <Section label="Status slot and ring">
        <div style={{ ...row, gap: 20 }}>
          <Avatar size="lg" name="Person E" status={<DotStandIn label="Online" />} />
          <Avatar
            size="lg"
            shape="square"
            src={portrait}
            alt="Person A"
            status={<DotStandIn label="Online" />}
          />
          <Avatar size="lg" name="Person F" ring />
          <Avatar size="lg" src={portrait} alt="Person A" ring="var(--umbra-color-semantic-success)" />
          <Avatar size="lg" shape="square" name="Person G" ring status={<DotStandIn label="Online" />} />
        </div>
      </Section>
    </Sheet>
  ),
};

/**
 * The value components in a right-to-left locale: the avatar's status, a badge and a tag's stripe move
 * to the other side; the order of icon and text flips; arrows that show a trend keep their direction.
 */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  render: () => (
    <Sheet>
      <Section label="Avatar: status at the trailing corner">
        <div style={{ ...row, gap: 20 }}>
          <Avatar size="lg" name="Person E" status={<DotStandIn label="Online" />} />
          <Avatar size="lg" shape="square" name="Person G" status={<DotStandIn label="Online" />} />
        </div>
      </Section>
      <Section label="Badge, Tag, StatusIndicator, TrendArrow, Link">
        <div style={{ ...row, gap: 20 }}>
          <Badge count={3}>
            <Button>Inbox</Button>
          </Badge>
          <Tag
            tone="success"
            variant="solid"
            icon={<Building2 />}
            stripe="warning"
            stripeLabel="under review"
            onRemove={() => {}}
          >
            Region 2
          </Tag>
          <StatusIndicator status="success">Online</StatusIndicator>
          <TrendArrow direction="up" value="2.4%" />
          <Link href="#all" variant="standalone" chevron>
            See all
          </Link>
        </div>
      </Section>
      <Section label="KeyValueList, StatValue" width={260}>
        <KeyValueList
          aria-label="Details"
          items={[
            { label: 'Started', value: '17 Aug 2026', highlighted: true },
            { label: 'Monthly fee', value: '€1,900' },
          ]}
        />
        <StatValue
          label="Orders"
          value="521"
          unit="/ year"
          trend={<TrendArrow direction="down" value="4" />}
        />
      </Section>
      <Section label="SummaryTile, ValuePill, EntityIcon" width={260}>
        <SummaryTile icon={<Building2 />} title="Checks" value="9 passed" caption="Last 30 days" />
        <div style={{ ...row, marginTop: 12 }}>
          <ValuePill value={74} showLevel />
          <EntityIcon name="Client A" label />
        </div>
      </Section>
    </Sheet>
  ),
};

const group = (count: number) => people.slice(0, count).map((name) => <Avatar key={name} name={name} />);

/** `AvatarGroup` overlaps its avatars and counts those that do not fit, or are over `max`, in "+N". */
export const Groups: Story = {
  render: () => (
    <Sheet>
      <Section label="All fit">
        <AvatarGroup aria-label="Team">{group(5)}</AvatarGroup>
      </Section>
      <Section label="max={3}">
        <AvatarGroup aria-label="Team" max={3}>
          {group(7)}
        </AvatarGroup>
      </Section>
      <Section label="total={40}">
        <AvatarGroup aria-label="Team" total={40}>
          {group(4)}
        </AvatarGroup>
      </Section>
      <Section label="Square, lg">
        <AvatarGroup aria-label="Regions" size="lg" shape="square" max={4}>
          {group(6)}
        </AvatarGroup>
      </Section>
      <Section label="Small, with an image">
        <AvatarGroup aria-label="Team" size="sm">
          <Avatar src={portrait} alt="Person A" />
          {group(4)}
        </AvatarGroup>
      </Section>
      <Section label="180px wide" width={180}>
        <AvatarGroup aria-label="Narrow team">{group(7)}</AvatarGroup>
      </Section>
      <Section label="120px wide" width={120}>
        <AvatarGroup aria-label="Narrower team">{group(7)}</AvatarGroup>
      </Section>
      <Section label="80px wide" width={80}>
        <AvatarGroup aria-label="Narrowest team">{group(7)}</AvatarGroup>
      </Section>
    </Sheet>
  ),
};

/** The `parts` prop (a node, `null`, a function), tokens, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Sheet>
      <Section label="parts: a node replaces the initials">
        <Avatar
          size="lg"
          name="Person A"
          parts={{ initials: <Avatar.Initials label="Person A">A1</Avatar.Initials> }}
        />
      </Section>
      <Section label="parts: null hides the status">
        <Avatar size="lg" name="Person B" status={<DotStandIn label="Online" />} parts={{ status: null }} />
      </Section>
      <Section label="parts: a function adjusts the image">
        <Avatar
          size="lg"
          src={portrait}
          name="Person A"
          parts={{ image: (p) => <Avatar.Image {...p} style={{ filter: 'grayscale(1)' }} /> }}
        />
      </Section>
      <Section label="parts: the group's overflow">
        <AvatarGroup
          aria-label="Team"
          max={2}
          parts={{
            overflow: (p) => (
              <span style={{ marginInlineStart: 8, font: 'var(--umbra-font-label)' }}>and {p.label}</span>
            ),
          }}
        >
          {group(5)}
        </AvatarGroup>
      </Section>
      <Section label="Tokens">
        <div
          style={
            {
              ...row,
              '--umbra-avatar-size': '56px',
              '--umbra-avatar-bg': 'var(--umbra-color-interaction)',
              '--umbra-avatar-fg': 'var(--umbra-color-on-interaction)',
              '--umbra-avatar-radius': '16px',
            } as React.CSSProperties
          }
        >
          <Avatar name="Person C" />
          <Avatar name="Person D" shape="square" />
        </div>
      </Section>
      <Section label="Blocks composed by hand">
        <div style={row}>
          <Avatar.Root size="lg" ring>
            <Avatar.Initials label="Order 7">#7</Avatar.Initials>
            <Avatar.Status>
              <DotStandIn label="Open" />
            </Avatar.Status>
          </Avatar.Root>
          <Avatar.Root size="lg" shape="square">
            <Avatar.Fallback label="Organisation">
              <Building2 />
            </Avatar.Fallback>
          </Avatar.Root>
          <AvatarGroup.Root aria-label="Hand-made group" size="lg">
            <Avatar name="Person E" />
            <Avatar name="Person F" />
            <AvatarGroup.Overflow count={12} label="12 more" />
          </AvatarGroup.Root>
        </div>
      </Section>
    </Sheet>
  ),
};
