import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Settings } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { IconButton } from '../basics/IconButton';
import { Log, sections } from '../stories/placeholders';
import { ContextBlock, type ContextBlockProps } from './ContextBlock';
import { PrimaryNav } from './PrimaryNav';
import { SamplePrimaryAction } from './samples';
import { TopBar } from './TopBar';

const meta = {
  title: 'Shell/ContextBlock',
  component: ContextBlock,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ContextBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

// A fixed moment, written in UTC with a 24-hour clock: the same text on every machine.
const utc: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
};
const sample: ContextBlockProps = {
  primary: 'Sat 10 Oct 2026',
  secondary: 'Quarter close in 6 days',
  time: '2026-10-10T09:30:00Z',
  timeFormat: utc,
};
const column: CSSProperties = { display: 'grid', gap: 16, justifyItems: 'start' };
const strip: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 32,
  flexWrap: 'wrap',
  padding: '12px 16px',
  borderRadius: 8,
  background: 'var(--umbra-color-brand)',
  color: 'var(--umbra-color-on-brand)',
};

/**
 * The anatomy: a bold line, a quieter line and a chip. In a row: all three, a `time` alone, a `chip`
 * with any short value, one line only, and no chip. The block takes the colour of the bar it is on.
 */
export const Anatomy: Story = {
  tags: ['tints'],
  render: () => (
    <div style={column}>
      <div style={strip}>
        <ContextBlock {...sample} />
        <ContextBlock time={sample.time} timeFormat={utc} />
        <ContextBlock primary="Workspace A" secondary="12 people online" chip="v 4.2" />
        <ContextBlock primary="Week 41" chip="Q4" />
        <ContextBlock primary="Sat 10 Oct 2026" secondary="Quarter close in 6 days" />
      </div>
    </div>
  ),
};

/** On bars of other colours, the light one included: text, chip and focus ring follow the bar. */
export const OnBrands: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      {['#1d4ed8', '#22262e', '#e8e4f0', '#0f766e'].map((brand) => (
        <TopBar
          key={brand}
          brand={brand}
          logo="U"
          nav={<PrimaryNav items={sections.slice(0, 3)} value="overview" onChange={() => {}} />}
          context={<ContextBlock {...sample} onPress={() => {}} />}
          primaryAction={<SamplePrimaryAction />}
        />
      ))}
    </div>
  ),
};

/** With `onPress` the block is a button, with `href` a link. A disabled one does nothing. */
export const Interactive: Story = {
  render: function Render() {
    const [count, setCount] = useState(0);
    return (
      <div style={column}>
        <div style={strip}>
          <ContextBlock {...sample} onPress={() => setCount((c) => c + 1)} />
          <ContextBlock {...sample} href="#calendar" />
          <ContextBlock {...sample} onPress={() => setCount((c) => c + 1)} disabled />
          <ContextBlock
            {...sample}
            href="#router"
            renderLink={(props) => <a {...props} data-router-link="" />}
          />
        </div>
        <Log>Presses: {count}</Log>
      </div>
    );
  },
};

/**
 * In a bar that runs out of room the block gives way first: its second line hides, then its chip, then
 * the bar hides the block. The tooltip shows everything while something is hidden.
 */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
      {[1000, 930, 880, 800].map((width) => (
        <div key={width} style={{ width }}>
          <TopBar
            logo="U"
            nav={<PrimaryNav items={sections.slice(0, 4)} value="overview" onChange={() => {}} />}
            actions={
              <>
                <IconButton icon={<Bell />} label="Notifications" />
                <IconButton icon={<Settings />} label="Settings" />
              </>
            }
            context={<ContextBlock {...sample} onPress={() => {}} />}
            primaryAction={<SamplePrimaryAction />}
          />
        </div>
      ))}
    </div>
  ),
};

/** Outside a bar nothing hides: both lines end in an ellipsis, and the tooltip shows the full text. */
export const Truncated: Story = {
  render: () => (
    <div style={column}>
      <div style={{ ...strip, width: 220, flexWrap: 'nowrap' }}>
        <ContextBlock
          primary="Saturday 10 October 2026"
          secondary="Quarter close in 6 days, then the yearly review"
          time={sample.time}
          timeFormat={utc}
          onPress={() => {}}
        />
      </div>
      <div style={strip}>
        <ContextBlock
          {...sample}
          secondary="Quarter close in 6 days, then the yearly review"
          style={{ ['--umbra-context-block-max-width' as string]: '200px' }}
        />
      </div>
    </div>
  ),
};

/**
 * `live` makes the chip a clock that moves on each minute. With a `time` it starts there, so this story
 * shows the same minute each time it is opened; without one it shows the device's clock.
 */
export const Live: Story = {
  render: () => (
    <div style={strip}>
      <ContextBlock {...sample} time="2026-10-10T09:30:00Z" live />
      <ContextBlock
        primary="Region 2"
        secondary="Local time"
        time="2026-10-10T09:30:00Z"
        timeFormat={{ ...utc, timeZone: 'Asia/Tokyo' }}
        live
      />
    </div>
  ),
};

/** Each part as a node, as `null` and as a function; and the same block composed from its blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={strip}>
      <ContextBlock {...sample} parts={{ chip: <strong data-custom="">09:30 UTC</strong> }} />
      <ContextBlock {...sample} parts={{ secondary: null }} />
      <ContextBlock
        {...sample}
        parts={{ primary: (p) => <ContextBlock.Primary>Today · {p.children}</ContextBlock.Primary> }}
      />
      <ContextBlock.Root tooltip="Workspace A, 12 people online">
        <ContextBlock.Text>
          <ContextBlock.Primary>Workspace A</ContextBlock.Primary>
          <ContextBlock.Secondary>12 people online</ContextBlock.Secondary>
        </ContextBlock.Text>
        <ContextBlock.Chip dateTime="2026-10-10T09:30:00Z">09:30</ContextBlock.Chip>
      </ContextBlock.Root>
    </div>
  ),
};
