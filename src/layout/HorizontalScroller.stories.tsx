import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { SummaryTile } from '../data/SummaryTile';
import { AppShell } from '../shell/AppShell';
import { Log, Rows } from '../stories/placeholders';
import { Card } from './Card';
import { HorizontalScroller, type HorizontalScrollerProps } from './HorizontalScroller';
import { Page } from './Page';
import { Stack } from './Stack';

const meta = {
  title: 'Layout/HorizontalScroller',
  component: HorizontalScroller,
} satisfies Meta<typeof HorizontalScroller>;
export default meta;
type Story = StoryObj<typeof meta>;

const tiles = (count = 11, props: (i: number) => object = () => ({})) =>
  Array.from({ length: count }, (_, i) => (
    <SummaryTile
      key={i}
      title={`Item ${i + 1}`}
      value={String((i * 37 + 12) % 100)}
      caption={`Region ${(i % 4) + 1}`}
      {...props(i)}
    />
  ));

/** The row above a card that takes the rest of the page, as in a real screen. */
const frame = (row: ReactNode, below: ReactNode = null) => (
  <AppShell>
    <Page>
      <Stack>
        {row}
        {below}
        <Card title="The rest of the page">
          <Rows count={8} />
        </Card>
      </Stack>
    </Page>
  </AppShell>
);

const Row = (props: HorizontalScrollerProps) => (
  <HorizontalScroller itemWidth={180} aria-label="Summary" {...props} />
);

/**
 * Eleven tiles in a row that is too narrow for them: the last one is cut, a fade and a button show at
 * the edge that has more, and the row scrolls sideways inside itself. No scrollbar is drawn.
 */
export const Default: Story = { tags: ['tints', 'narrow'], render: () => frame(<Row>{tiles()}</Row>) };

/** Items that are controls: the arrow keys move between them, and `onReachEnd` reports the far edge. */
export const Interactive: Story = {
  render: function Render() {
    const [last, setLast] = useState('none');
    const [ends, setEnds] = useState(0);
    return frame(
      <Row onReachEnd={() => setEnds((n) => n + 1)}>
        {tiles(11, (i) => ({ onPress: () => setLast(`Item ${i + 1}`) }))}
      </Row>,
      <Stack size="content">
        <Log>
          Last pressed: {last} · reached the end: {ends}
        </Log>
      </Stack>,
    );
  },
};

const label: CSSProperties = { margin: 0, font: 'var(--umbra-font-label)' };

/** The thin thumb, always or on hover; no snapping; no fade; and a wider gap. */
export const Variants: Story = {
  parameters: { frame: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
      <p style={label}>scrollbar="auto"</p>
      <Row scrollbar="auto">{tiles()}</Row>
      <p style={label}>scrollbar="hover", snap off</p>
      <Row scrollbar="hover" snap={false}>
        {tiles()}
      </Row>
      <p style={label}>No fade, a wider gap, items of their own width</p>
      <HorizontalScroller fade={false} gap={8} aria-label="Own widths">
        {['Short', 'A longer label', 'Mid', 'The longest label of them all', 'Short again']
          .flatMap((text) => [text, `${text} (2)`, `${text} (3)`])
          .map((text) => (
            <Button key={text}>{text}</Button>
          ))}
      </HorizontalScroller>
    </div>
  ),
};

/** Few items: nothing to scroll, so no fade and no button. */
export const Fits: Story = { render: () => frame(<Row>{tiles(3)}</Row>) };

/** Loading, empty and failed. */
export const States: Story = {
  parameters: { frame: 'padded' },
  render: function Render() {
    const [tries, setTries] = useState(0);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
        <Row loading>{tiles(2)}</Row>
        <Row empty="No items yet" />
        <Row error onRetry={() => setTries((t) => t + 1)}>
          {tiles(2)}
        </Row>
        <Log>Retries: {tries}</Log>
      </div>
    );
  },
};

/** With a share of the height (`size`), the items stretch to it: here three cards that each scroll inside. */
export const FillsHeight: Story = {
  render: () =>
    frame(
      <HorizontalScroller size={1} itemWidth={320} aria-label="Boards">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} title={`Card ${i + 1}`}>
            <Rows count={10} />
          </Card>
        ))}
      </HorizontalScroller>,
    ),
};

/**
 * The parts as a node, `null` and a function: no buttons (the look of the source), buttons of the
 * app's own; and a row composed from its blocks.
 */
export const PartsAndBlocks: Story = {
  parameters: { frame: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
      <Row parts={{ previous: null, next: null }} aria-label="No buttons">
        {tiles()}
      </Row>
      <Row
        aria-label="Own buttons"
        parts={{
          next: (p) => (
            <span style={{ position: 'absolute', insetInlineEnd: 4, insetBlockStart: 4, zIndex: 1 }}>
              <Button size="small" variant="accent" onPress={p.onPress}>
                More
              </Button>
            </span>
          ),
          previous: (
            <span data-custom="" style={{ position: 'absolute', insetInlineStart: 4, insetBlockStart: 4 }}>
              ◂
            </span>
          ),
        }}
      >
        {tiles()}
      </Row>
      <HorizontalScroller.Root aria-label="From blocks" itemWidth={200}>
        {tiles(8).map((tile, i) => (
          <HorizontalScroller.Item key={i} style={i === 0 ? { width: 320 } : undefined}>
            {tile}
          </HorizontalScroller.Item>
        ))}
      </HorizontalScroller.Root>
    </div>
  ),
};
