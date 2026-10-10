import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Log } from '../stories/placeholders';
import { Banner, type BannerTone, type BannerVariant } from './Banner';

const meta = { title: 'Data/Banner', component: Banner, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Banner
>;
export default meta;
type Story = StoryObj<typeof meta>;

const tones: BannerTone[] = ['info', 'success', 'warning', 'danger', 'neutral', 'accent'];
const variants: BannerVariant[] = ['subtle', 'solid', 'outline'];
const grid = (columns: number): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  gap: 12,
  alignItems: 'start',
});
const column: CSSProperties = { display: 'grid', gap: 12, alignContent: 'start', minWidth: 0 };
const Caption = ({ children }: { children: ReactNode }) => (
  <div style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}>
    {children}
  </div>
);
const long =
  'Orders from Region 2 arrived later than planned on four of the last seven days, and the backlog is now larger than at any point this quarter.';

/** Every tone in every variant. Each tone has its own icon, so it does not depend on colour. */
export const Tones: Story = {
  render: () => (
    <div style={grid(3)}>
      {tones.flatMap((tone) =>
        variants.map((variant) => (
          // `live="off"`: a page of examples is not eighteen announcements.
          <Banner key={tone + variant} tone={tone} variant={variant} live="off" title={`${tone}, ${variant}`}>
            Report 4 is ready.
          </Banner>
        )),
      )}
    </div>
  ),
};

/** The `insight` emphasis: a leading edge stripe, for a finding about the data beside it. */
export const Insight: Story = {
  render: () => (
    <div style={grid(3)}>
      {tones.flatMap((tone) =>
        variants.map((variant) => (
          <Banner
            key={tone + variant}
            tone={tone}
            variant={variant}
            emphasis="insight"
            live="off"
            title={`${tone}, ${variant}`}
          />
        )),
      )}
    </div>
  ),
};

/** Title, description, actions, dismiss button, icon choices and the compact one-line variant. */
export const Content: Story = {
  render: () => (
    <div style={grid(2)}>
      <div style={column}>
        <Banner title="Title only" />
        <Banner>Description only: the export finished.</Banner>
        <Banner tone="success" title="Export finished" actions={<Button>Open</Button>} dismissible>
          48 rows were written.
        </Banner>
        <Banner
          tone="warning"
          title="Budget is nearly used"
          actions={
            <>
              <Button variant="ghost">Later</Button>
              <Button variant="primary">Review</Button>
            </>
          }
        >
          92% of the quarter&apos;s budget is spent.
        </Banner>
        <Banner
          tone="danger"
          variant="solid"
          title="Sync failed"
          actions={<Button>Retry</Button>}
          dismissible
        >
          The last three attempts timed out.
        </Banner>
      </div>
      <div style={column}>
        <Banner tone="accent" icon={<Sparkles />} title="A custom icon" />
        <Banner tone="neutral" icon={null} title="No icon">
          Set <code>icon</code> to <code>null</code>.
        </Banner>
        <Banner tone="info" title="Clamped to two lines" maxLines={2}>
          {long} {long}
        </Banner>
        <Banner compact tone="success" title="Compact" dismissible>
          One line; the description truncates. {long}
        </Banner>
        <Banner compact tone="warning" variant="outline">
          Compact, description only.
        </Banner>
        <Banner compact tone="danger" variant="solid" emphasis="insight" title="Compact, solid, insight" />
      </div>
    </div>
  ),
};

const Shrinking = ({ width, compact }: { width: number; compact?: boolean }) => (
  <div style={{ width }} data-width={width}>
    <Caption>
      {width}px{compact ? ', compact' : ''}
    </Caption>
    <Banner
      compact={compact}
      tone="warning"
      title="Backlog is growing"
      actions={<Button size={compact ? 'small' : 'default'}>Review</Button>}
      dismissible
      maxLines={compact ? undefined : 3}
      live="off"
    >
      {long}
    </Banner>
  </div>
);

/** As it narrows: the actions move below the text, then the icon hides. The description clamps to `maxLines`. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      <Shrinking width={520} />
      <Shrinking width={320} />
      <Shrinking width={200} />
      <Shrinking width={320} compact />
      <Shrinking width={200} compact />
    </div>
  ),
};

/** `role` follows the tone: `status` by default, `alert` for `danger`, none with `live="off"`. Dismissal, both ways. */
export const Dismissal: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    const [dismissed, setDismissed] = useState(0);
    return (
      <div style={{ ...column, maxWidth: 640 }}>
        <Banner title="Uncontrolled" dismissible onDismiss={() => setDismissed((n) => n + 1)}>
          It hides itself when dismissed.
        </Banner>
        <Banner
          tone="danger"
          title="Controlled"
          dismissible
          dismissLabel="Close the warning"
          open={open}
          onDismiss={() => setOpen(false)}
        >
          The app decides when it hides.
        </Banner>
        <Banner tone="danger" live="off" title="Not announced" />
        <div>
          <Button onPress={() => setOpen(true)}>Show the controlled banner</Button>
        </div>
        <Log>
          Dismissed: {dismissed}. Controlled banner: {open ? 'open' : 'closed'}.
        </Log>
      </div>
    );
  },
};

/** Each kind of `parts` override: a node replaces, `null` hides, a function wraps the default. */
export const Parts: Story = {
  render: () => (
    <div style={{ ...column, maxWidth: 640 }}>
      <Banner
        title="A node replaces the icon"
        parts={{ icon: <span style={{ alignSelf: 'center', fontWeight: 700 }}>NEW</span> }}
      />
      <Banner
        title="null hides the dismiss button and the title"
        dismissible
        parts={{ dismiss: null, title: null }}
      >
        Only the description is left.
      </Banner>
      <Banner
        tone="success"
        title="A function wraps the default"
        actions={<Button>Open</Button>}
        parts={{
          title: (p) => <em data-part="title">{p.children} (wrapped)</em>,
          description: (p) => <Banner.Description {...p} maxLines={1} />,
          actions: (p) => <Banner.Actions>{p.children} · 3 new</Banner.Actions>,
        }}
      >
        {long}
      </Banner>
    </div>
  ),
};

/** The same banner composed by hand from the blocks, and one inside a card, pinned under its content. */
export const Blocks: Story = {
  render: () => (
    <div style={grid(2)}>
      <Banner.Root tone="accent" emphasis="insight">
        <Banner.Icon />
        <Banner.Content>
          <Banner.Title>Composed from blocks</Banner.Title>
          <Banner.Description maxLines={2}>
            Region 3 is ahead of its plan for the fourth week.
          </Banner.Description>
        </Banner.Content>
        <Banner.Actions>
          <Button variant="accent">Details</Button>
        </Banner.Actions>
        <Banner.Dismiss label="Dismiss the insight" />
      </Banner.Root>
      <Card title="Orders" style={{ height: 220 }} parts={{ footer: null }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
          <div style={{ flex: 1 }}>Region 1 handled 412 orders this week.</div>
          <Banner tone="success" variant="outline" emphasis="insight" compact>
            12% above the weekly average.
          </Banner>
        </div>
      </Card>
    </div>
  ),
};
