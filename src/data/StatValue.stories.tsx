import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleCheck, Wallet } from 'lucide-react';
import { Card } from '../layout/Card';
import { MeterStandIn, Section, Sheet, TrendStandIn } from '../stories/dataValues';
import { StatValue } from './StatValue';
import { LiveValues } from '../stories/live';

const meta = {
  title: 'Data/StatValue',
  component: StatValue,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof StatValue>;
export default meta;
type Story = StoryObj<typeof meta>;

const tones = ['default', 'accent', 'success', 'warning', 'danger', 'muted'] as const;

/** Sizes, tones, alignment, the supporting pieces and loading. */
export const Stats: Story = {
  render: () => (
    <Sheet gap={28}>
      <Section label="Sizes: md, lg, xl">
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
          <StatValue label="Orders" value="521" />
          <StatValue label="Orders" value="521" size="lg" />
          <StatValue label="Orders" value="521" size="xl" />
        </div>
      </Section>
      <Section label="Tones (each with a second cue in a real screen)">
        <div style={{ display: 'flex', gap: 20 }}>
          {tones.map((tone) => (
            <StatValue key={tone} label={tone} value="58" tone={tone} />
          ))}
        </div>
      </Section>
      <Section label="Unit, trend, icon, caption and meter" width={230}>
        <StatValue
          label="Available budget"
          icon={<Wallet />}
          value="€64.0M"
          unit="/ year"
          tone="accent"
          size="lg"
          trend={<TrendStandIn>4%</TrendStandIn>}
          caption="Spent this year · €9.5M"
          meter={<MeterStandIn value={87} label="87% of the budget is available" />}
        />
      </Section>
      <Section label="Centre and end" width={300}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <StatValue
            label="Done deals"
            icon={<CircleCheck />}
            value="200"
            align="center"
            caption="This quarter"
            trend={<TrendStandIn>12</TrendStandIn>}
          />
          <StatValue
            label="Regressions"
            value="2"
            align="end"
            caption="Since Monday"
            trend={<TrendStandIn down>1</TrendStandIn>}
          />
        </div>
      </Section>
      <Section label="A value that does not fit truncates" width={120}>
        <StatValue label="A long label for a stat" value="€1,234,567.89" unit="net" size="lg" />
      </Section>
      <Section label="Loading: md, and lg with caption and meter" width={300}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <StatValue label="Orders" loading />
          <StatValue
            label="Available budget"
            size="lg"
            loading
            caption="Spent this year"
            meter={<MeterStandIn value={0} label="Loading" />}
          />
        </div>
      </Section>
      <Section label="No value: emptyLabel, and no unit or trend" width={300}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <StatValue label="Orders" value={null} unit="/ year" trend={<TrendStandIn>12</TrendStandIn>} />
          <StatValue label="Last sync" value={undefined} emptyLabel="Never" size="lg" />
        </div>
      </Section>
      <Section label="No label: named for assistive technology">
        <StatValue aria-label="Open orders" value="12" size="xl" tone="accent" />
      </Section>
    </Sheet>
  ),
};

const steps = {
  md: [170, 140, 120, 100],
  lg: [176, 148, 126, 104],
  xl: [190, 160, 138, 112],
} as const;

/**
 * As its card gets shorter the stat hides its caption, then its meter, then its label, and at the last
 * step the value goes one font step down. Four heights per size: everything, then one step each.
 */
export const Shrinking: Story = {
  render: () => (
    <Sheet gap={12}>
      {(['md', 'lg', 'xl'] as const).flatMap((size) =>
        steps[size].map((height) => (
          <div key={size + height} style={{ display: 'flex', width: 140, height }}>
            <Card title={`${size} · ${height}px`} tone="neutral">
              <StatValue
                size={size}
                label="Available"
                value="64M"
                tone="accent"
                caption="Spent · €9.5M"
                meter={<MeterStandIn value={87} label="87% of the budget is available" />}
              />
            </Card>
          </div>
        )),
      )}
    </Sheet>
  ),
};

/** The `parts` prop (a node, `null`, a function), tokens, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Sheet gap={28}>
      <Section label="parts: a node replaces the unit">
        <StatValue
          label="Payroll"
          value="€410K"
          unit="per month"
          parts={{ unit: <StatValue.Unit>/ mo</StatValue.Unit> }}
        />
      </Section>
      <Section label="parts: null hides the caption and label">
        <StatValue
          aria-label="Payroll"
          label="Payroll"
          value="€410K"
          caption="Committed · €500K"
          parts={{ caption: null, label: null }}
        />
      </Section>
      <Section label="parts: a function adjusts the value">
        <StatValue
          label="Rating"
          value="9.1"
          size="lg"
          parts={{
            value: (p) => (
              <StatValue.Value style={{ textDecoration: 'underline', textUnderlineOffset: 4 }}>
                {p.children}
              </StatValue.Value>
            ),
          }}
        />
      </Section>
      <Section label="parts: the skeleton">
        <StatValue label="Orders" loading parts={{ skeleton: <span>…</span> }} />
      </Section>
      <Section label="Tokens">
        <div
          style={
            {
              '--umbra-stat-value-font': '700 34px/1 var(--umbra-font-family-heading)',
              '--umbra-stat-value-fg': 'var(--umbra-color-value-ramp-5)',
              '--umbra-stat-value-gap': '8px',
            } as React.CSSProperties
          }
        >
          <StatValue label="Clients" value="8" caption="Two new this month" />
        </div>
      </Section>
      <Section label="Blocks composed by hand" width={200}>
        <StatValue.Root size="lg" tone="success">
          <StatValue.Figure>
            <StatValue.Trend>
              <TrendStandIn>4</TrendStandIn>
            </StatValue.Trend>
            <StatValue.Value>12</StatValue.Value>
            <StatValue.Unit>items</StatValue.Unit>
          </StatValue.Figure>
          <StatValue.Label>Improvements</StatValue.Label>
          <StatValue.Caption>The label sits under the value here</StatValue.Caption>
          <StatValue.Meter>
            <MeterStandIn value={40} label="40% of the target" />
          </StatValue.Meter>
        </StatValue.Root>
      </Section>
    </Sheet>
  ),
};

/** `highlightChanges`: press the button and each changed value flashes once, with a sign when a number rose or fell. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues>{(value) => <StatValue label="Orders" value={value} highlightChanges />}</LiveValues>
  ),
};
