import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Comparison, type ComparisonRow, type ComparisonSide } from '../data/Comparison';
import { EntityIcon } from '../data/EntityIcon';
import { List } from '../data/List';
import { ListItem } from '../data/ListItem';
import { MediaCard } from '../data/MediaCard';
import { SequenceDots, type SequenceDotsItem } from '../data/SequenceDots';
import { SummaryTile } from '../data/SummaryTile';
import type { Tone } from '../data/tone';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { Picture } from './pictures';

/**
 * Cases of `SequenceDots`, `MediaCard` and `Comparison` that their own stories do not reach. The view
 * shown is each component loading beside itself loaded, with the same props: nothing may move when the
 * data arrives. The other views are opened by the tests with `args` in the address
 * (`tests/visual/data-tier2.spec.ts`).
 */
interface CaseArgs {
  view: string;
  count: number;
  width: number;
  pressable: boolean;
  bars: boolean;
}
const meta = {
  title: 'Integration/Data cases',
  parameters: { frame: 'padded' },
  args: { view: 'loading', count: 60, width: 100, pressable: false, bars: false },
} satisfies Meta<CaseArgs>;
export default meta;
type Story = StoryObj<CaseArgs>;

const tones: Tone[] = ['success', 'danger', 'success', 'warning', 'info', 'accent', 'neutral'];
const runs = (count: number): SequenceDotsItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `run-${i + 1}`,
    tone: tones[i % tones.length],
    label: `Run ${i + 1}`,
    value: (i % 9) + 1,
    tooltip: `Took ${(i % 7) + 1} min`,
  }));

const sides: [ComparisonSide, ComparisonSide] = [{ name: 'Region A' }, { name: 'Region B' }];
const rows: ComparisonRow[] = [
  { id: 'orders', label: 'Orders', values: [128, 96] },
  { id: 'returns', label: 'Returns', values: [7, 12], lowerIsBetter: true },
  { id: 'visits', label: 'Visits', values: [41, 41] },
];
const summary = { values: [12, 9] as const, caption: 'Week 12' };
const text = 'The review covers every region, with the changes since the last one marked.';
const long = 'A headline that is far too long for the card it is in and so has to end in an ellipsis';
const noop = () => {};

/** One case loaded and loading, one above the other. */
function Pair({ name, children }: { name: string; children: (loading: boolean) => ReactNode }) {
  return (
    <div data-case={name} style={{ display: 'grid', gap: 8, marginBottom: 16, justifyItems: 'start' }}>
      <div data-state="loaded" style={{ maxWidth: '100%', justifySelf: 'stretch' }}>
        {children(false)}
      </div>
      <div data-state="loading" style={{ maxWidth: '100%', justifySelf: 'stretch' }}>
        {children(true)}
      </div>
    </div>
  );
}

const five = runs(5);
const dotCases = (['sm', 'md', 'lg'] as const).flatMap((size) =>
  (['dots', 'bars'] as const).flatMap((variant) =>
    [false, true].map((pressable) => ({ size, variant, pressable })),
  ),
);

function Loading() {
  return (
    <Columns style={{ height: '100%' }}>
      <Card title="SequenceDots">
        {dotCases.map(({ size, variant, pressable }) => (
          <Pair
            key={`${size}${variant}${pressable}`}
            name={`dots-${size}-${variant}${pressable ? '-pressable' : ''}`}
          >
            {(loading) => (
              <SequenceDots
                size={size}
                variant={variant}
                items={five}
                loading={loading}
                onAction={pressable ? noop : undefined}
              />
            )}
          </Pair>
        ))}
      </Card>
      <Card title="MediaCard">
        <Pair name="media-compact">
          {(loading) => (
            <MediaCard
              size="content"
              loading={loading}
              image={<Picture />}
              title="Stock count finished in every region of the north"
              description={text}
              meta="3 days ago"
              category="Update"
            />
          )}
        </Pair>
        <Pair name="media-compact-title">
          {(loading) => <MediaCard size="content" loading={loading} title="A title only" />}
        </Pair>
        <Pair name="media-pair">
          {(loading) => (
            <MediaCard
              size="content"
              loading={loading}
              title="Region A"
              side={{ meta: '12' }}
              opposite={{ title: 'Region B', meta: '9' }}
              center="to"
              meta="Week 12"
            />
          )}
        </Pair>
        <Pair name="media-hero">
          {(loading) => (
            <MediaCard
              size="content"
              variant="hero"
              loading={loading}
              image={<Picture />}
              title="Quarterly review published"
              description={text}
              meta="2 days ago"
            />
          )}
        </Pair>
        <Pair name="media-hero-behind">
          {(loading) => (
            <MediaCard
              size="content"
              variant="hero"
              imagePlacement="behind"
              loading={loading}
              image={<Picture hue={190} />}
              title="New planning cycle opens next week"
              meta="5 hours ago"
            />
          )}
        </Pair>
      </Card>
      <Card title="Comparison">
        <Pair name="comparison-bars">
          {(loading) => (
            <Comparison height="content" sides={sides} rows={rows} loading={loading} skeletonRows={3} />
          )}
        </Pair>
        <Pair name="comparison-summary">
          {(loading) => (
            <Comparison
              height="content"
              sides={sides}
              rows={rows}
              summary={summary}
              showBars={false}
              loading={loading}
              skeletonRows={3}
            />
          )}
        </Pair>
        <Pair name="comparison-strip">
          {(loading) => (
            <Comparison height="content" variant="strip" sides={sides} rows={rows} loading={loading} />
          )}
        </Pair>
        <Pair name="comparison-strip-summary">
          {(loading) => (
            <Comparison
              height="content"
              variant="strip"
              sides={sides}
              rows={rows}
              summary={summary}
              loading={loading}
            />
          )}
        </Pair>
      </Card>
    </Columns>
  );
}

function View({ view, count, width, pressable, bars }: CaseArgs) {
  if (view === 'dots') {
    return (
      <div data-box="" style={{ width }}>
        <SequenceDots
          items={runs(count)}
          variant={bars ? 'bars' : 'dots'}
          onAction={pressable ? noop : undefined}
        />
      </div>
    );
  }
  // No height is given anywhere here: each component is as tall as its content.
  if (view === 'column') {
    const card = <MediaCard image={<Picture />} title="Story 1" description={text} meta="2 h ago" />;
    const hero = <MediaCard variant="hero" image={<Picture />} title="Story 2" meta="2 h ago" />;
    return (
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div data-case="flex" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
          {card}
          {hero}
        </div>
        <div data-case="card" style={{ width: 320 }}>
          <Card title="In a stack in a card" size="content">
            <Stack>
              {card}
              {hero}
            </Stack>
          </Card>
        </div>
        <div data-case="tile" style={{ display: 'flex', flexDirection: 'column', width: 240 }}>
          <Stack size="content">
            <SummaryTile title="Load" value="72%" caption="Of capacity" />
          </Stack>
        </div>
      </div>
    );
  }
  if (view === 'media') {
    return (
      <div style={{ display: 'grid', gap: 16, width, alignItems: 'start' }}>
        <div data-case="button">
          <MediaCard size="content" title={long} onPress={noop} />
        </div>
        <div data-case="link">
          <MediaCard size="content" title={long} href="#story" />
        </div>
        <div data-case="hidden-footer">
          <MediaCard
            size="content"
            title="Story"
            meta="2 h ago"
            category="Update"
            actions={<button type="button">Save</button>}
            parts={{ meta: null, category: null, actions: null }}
          />
        </div>
        <div data-case="title-only">
          <MediaCard size="content" title="Story" />
        </div>
        <div data-case="steps">
          <MediaCard
            size="content"
            image={<Picture />}
            title={long}
            description={text}
            meta="2 days ago"
            category="Review"
          />
        </div>
        <div data-case="no-title">
          <MediaCard size="content" description="No title was given." />
        </div>
        <div data-case="own-title">
          <MediaCard size="content" title="Story" parts={{ title: <strong>A title of the app</strong> }} />
        </div>
        <div data-case="loading">
          <MediaCard size="content" title="Story" loading />
        </div>
      </div>
    );
  }
  if (view === 'comparison') {
    return (
      <div style={{ display: 'grid', gap: 16, width, alignItems: 'start' }}>
        <div data-case="strip-summary-only">
          <Comparison height="content" variant="strip" sides={sides} rows={[]} summary={summary} />
        </div>
        <div data-case="strip-nothing">
          <Comparison height="content" variant="strip" sides={sides} rows={[]} />
        </div>
        <div data-case="long-values">
          <Comparison
            height="content"
            sides={sides}
            rows={[{ id: 'total', label: 'Total of the year', values: [123456789012345, 987654321098765] }]}
            formatValue={(value) => `${value.toLocaleString('en')} units sold`}
          />
        </div>
        <div data-case="strip">
          <Comparison
            height="content"
            variant="strip"
            sides={[
              { name: 'Region A', icon: <EntityIcon name="Region A" alt="" size="sm" /> },
              { name: 'Region B', icon: <EntityIcon name="Region B" alt="" size="sm" /> },
            ]}
            rows={rows}
            summary={summary}
          />
        </div>
      </div>
    );
  }
  // A bare `ListItem` is not a row of the list: it is left out, and the rows beside it are drawn.
  if (view === 'list') {
    return (
      <div style={{ width: 320 }}>
        <List aria-label="Rows" height="content">
          <ListItem title="Not a row" leading={<Picture />} />
          <List.Item id="row" title="A row" />
        </List>
      </div>
    );
  }
  return <Loading />;
}

export const Cases: Story = { render: (args) => <View {...args} /> };
