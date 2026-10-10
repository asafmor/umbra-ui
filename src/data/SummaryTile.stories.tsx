import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClipboardList, Lightbulb, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { Section, Sheet, TrendStandIn } from '../stories/dataValues';
import { Log, Rows } from '../stories/placeholders';
import { SummaryTile } from './SummaryTile';

const meta = {
  title: 'Data/SummaryTile',
  component: SummaryTile,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SummaryTile>;
export default meta;
type Story = StoryObj<typeof meta>;

const grid = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 } as const;

function Pressable() {
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState('advice');
  return (
    <>
      <div style={grid}>
        <SummaryTile
          icon={<Lightbulb />}
          title="Advice"
          value="Insights (8)"
          selected={selected === 'advice'}
          onPress={() => {
            setSelected('advice');
            setCount(count + 1);
          }}
        />
        <SummaryTile
          icon={<Users />}
          title="Duties"
          value="Shared"
          selected={selected === 'duties'}
          onPress={() => {
            setSelected('duties');
            setCount(count + 1);
          }}
        />
        <SummaryTile
          icon={<Target />}
          title="Disabled"
          value="Not available"
          disabled
          onPress={() => setCount(-1)}
        />
      </div>
      <Log>Pressed {count} times</Log>
    </>
  );
}

/** Every state, in a plain CSS grid: links, buttons, static, selected, disabled and loading. */
export const Tiles: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Section label="Links (href): icon, title, value, caption and trend">
        <div style={grid}>
          <SummaryTile href="#advice" icon={<Lightbulb />} title="Advice" value="Insights (8)" />
          <SummaryTile
            href="#reviews"
            icon={<ClipboardList />}
            title="Review results"
            value="1 positive / 11 negative"
            caption="Last 30 days"
            trend={<TrendStandIn down>3</TrendStandIn>}
          />
          <SummaryTile
            href="#plan"
            title="No icon"
            value="Plan B · balanced"
            caption="Chosen in March"
            selected
          />
        </div>
      </Section>
      <Section label="Buttons (onPress): selected is a pressed state">
        <Pressable />
      </Section>
      <Section label="Static, loading (with and without a caption), disabled link">
        <div style={grid}>
          <SummaryTile icon={<Users />} title="Static" value="No link, no button" caption="Not focusable" />
          <SummaryTile href="#a" icon={<Target />} title="Targets" loading caption="Last 30 days" />
          <SummaryTile href="#b" icon={<Target />} title="Disabled link" value="Not available" disabled />
        </div>
      </Section>
    </div>
  ),
};

/** Tiles as layout children: a row of four above a card, and a stack of tiles beside it. */
export const InLayout: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Stack size={4}>
        <Columns size="content">
          <SummaryTile href="#advice" icon={<Lightbulb />} title="Advice" value="Insights (8)" />
          <SummaryTile
            href="#plan"
            icon={<Target />}
            title="Primary plan"
            value="Plan B · balanced, with a long name"
            selected
          />
          <SummaryTile
            href="#reviews"
            icon={<ClipboardList />}
            title="Review results"
            value="1 positive / 11 negative"
            trend={<TrendStandIn down>3</TrendStandIn>}
          />
          <SummaryTile
            href="#duties"
            icon={<Users />}
            title="Duties"
            value="Shared"
            caption="Lead and staff"
          />
        </Columns>
        <Card title="Schedule">
          <Rows count={12} />
        </Card>
      </Stack>
      <Stack size={1}>
        <SummaryTile href="#open" title="Open" value="12" trend={<TrendStandIn>4</TrendStandIn>} />
        <SummaryTile href="#late" title="Late" value="3" caption="Oldest: 9 days" />
        <SummaryTile href="#done" title="Done" value="148" size={2} />
      </Stack>
    </Columns>
  ),
};

const widths = [260, 210, 170, 130, 90];

/** As a tile narrows the caption hides, then the trend, then the icon; the title and value truncate. */
export const Narrowing: Story = {
  render: () => (
    <Sheet gap={12}>
      {widths.map((width) => (
        <Section key={width} label={`${width}px`} width={width}>
          <SummaryTile
            href="#reviews"
            icon={<ClipboardList />}
            title="Review results"
            value="11 negative"
            caption="Last 30 days"
            trend={<TrendStandIn down>3</TrendStandIn>}
          />
        </Section>
      ))}
    </Sheet>
  ),
};

/** The `parts` prop (a node, `null`, a function), tokens, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Sheet>
      <Section label="parts: a node replaces the icon" width={260}>
        <SummaryTile
          href="#a"
          icon={<Users />}
          title="Team"
          value="Person A"
          parts={{ icon: <strong style={{ fontSize: 28 }}>PA</strong> }}
        />
      </Section>
      <Section label="parts: null hides the caption and trend" width={260}>
        <SummaryTile
          href="#b"
          icon={<Target />}
          title="Targets"
          value="4 of 6 met"
          caption="This quarter"
          trend={<TrendStandIn>1</TrendStandIn>}
          parts={{ caption: null, trend: null }}
        />
      </Section>
      <Section label="parts: a function adjusts the value" width={260}>
        <SummaryTile
          href="#c"
          icon={<Lightbulb />}
          title="Advice"
          value="8"
          parts={{
            value: (p) => (
              <SummaryTile.Value style={{ font: 'var(--umbra-font-title)' }}>
                {p.children} insights
              </SummaryTile.Value>
            ),
          }}
        />
      </Section>
      <Section label="parts: the skeleton" width={260}>
        <SummaryTile
          href="#d"
          icon={<Target />}
          title="Targets"
          loading
          parts={{ skeleton: <span>…</span> }}
        />
      </Section>
      <Section label="Tokens" width={260}>
        <div
          style={
            {
              display: 'flex',
              '--umbra-summary-tile-bg': 'var(--umbra-color-base-surface-neutral)',
              '--umbra-summary-tile-border': 'var(--umbra-color-base-border-control)',
              '--umbra-summary-tile-radius': '0',
              '--umbra-summary-tile-icon-size': '32px',
              '--umbra-summary-tile-icon-bg': 'var(--umbra-color-fixed-selected)',
            } as React.CSSProperties
          }
        >
          <SummaryTile href="#e" icon={<Users />} title="Duties" value="Shared" />
        </div>
      </Section>
      <Section label="Blocks composed by hand" width={260}>
        <SummaryTile.Root href="#f">
          <SummaryTile.Content>
            <SummaryTile.Figure>
              <SummaryTile.Value style={{ font: 'var(--umbra-font-display)' }}>12</SummaryTile.Value>
              <SummaryTile.Trend>
                <TrendStandIn>4</TrendStandIn>
              </SummaryTile.Trend>
            </SummaryTile.Figure>
            <SummaryTile.Title>Open orders</SummaryTile.Title>
            <SummaryTile.Caption>The value sits above the title here</SummaryTile.Caption>
          </SummaryTile.Content>
          <SummaryTile.Icon>
            <ClipboardList />
          </SummaryTile.Icon>
        </SummaryTile.Root>
      </Section>
    </Sheet>
  ),
};
