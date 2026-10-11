import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { AppShell } from '../shell/AppShell';
import { Log, Rows } from '../stories/placeholders';
import { Card } from './Card';
import { Columns } from './Columns';
import { Page } from './Page';
import { Stack } from './Stack';
import { WidgetBoard, type WidgetBoardProps } from './WidgetBoard';

const meta = {
  title: 'Layout/WidgetBoard',
  component: WidgetBoard,
} satisfies Meta<typeof WidgetBoard>;
export default meta;
type Story = StoryObj<typeof meta>;

// Widgets of different heights: the number of rows each one shows.
const sizes = [5, 9, 3, 7, 4, 6, 8, 2, 5, 4, 7, 3];
const widgets = (count = sizes.length, spans: Record<number, number> = {}) =>
  sizes.slice(0, count).map((rows, i) => (
    <WidgetBoard.Widget key={i} id={`widget-${i + 1}`} title={`Widget ${i + 1}`} span={spans[i]}>
      <Rows count={rows} />
    </WidgetBoard.Widget>
  ));

const frame = (children: ReactNode) => (
  <AppShell>
    <Page>{children}</Page>
  </AppShell>
);

/** A board that keeps its state, with a line that shows it. */
function Board(props: WidgetBoardProps) {
  const [collapsed, setCollapsed] = useState<string[]>(['widget-2']);
  return (
    <Stack>
      <WidgetBoard collapsedIds={collapsed} onCollapsedChange={setCollapsed} {...props} />
      <Stack size="content">
        <Log>Collapsed: {collapsed.join(', ') || 'none'}</Log>
      </Stack>
    </Stack>
  );
}

/**
 * Cards of different heights, packed in as many columns as fit. Each keeps the height of its content
 * and collapses to its header; the board scrolls inside. "Collapse all" collapses every one.
 */
export const Default: Story = { tags: ['tints', 'narrow'], render: () => frame(<Board>{widgets()}</Board>) };

/** `span` makes a widget two or three columns wide. A span wider than the board is cut to its width. */
export const Spans: Story = {
  render: () => frame(<WidgetBoard>{widgets(10, { 0: 2, 4: 3, 7: 2 })}</WidgetBoard>),
};

/** `columns` fixes the number of columns, whatever the width. */
export const FixedColumns: Story = {
  render: () => frame(<WidgetBoard columns={2}>{widgets(6)}</WidgetBoard>),
};

/** Beside other content: the board takes its share of a `Columns` and scrolls by itself. */
export const InColumns: Story = {
  render: () =>
    frame(
      <Columns>
        <WidgetBoard size={2} minColumnWidth={220} aria-label="Team widgets">
          {widgets(8)}
        </WidgetBoard>
        <Card title="Beside the board">
          <Rows count={12} />
        </Card>
      </Columns>,
    ),
};

/** While loading: skeleton cards in the grid. */
export const Loading: Story = { render: () => frame(<WidgetBoard loading>{widgets(3)}</WidgetBoard>) };

/** Without widgets: the empty state, here with an action. */
export const Empty: Story = {
  render: () =>
    frame(
      <WidgetBoard
        empty={{
          title: 'No widgets yet',
          description: 'Add one to start your board.',
          action: <Button>Add a widget</Button>,
        }}
      />,
    ),
};

/** A failed load, with a retry button. */
export const Failed: Story = {
  render: function Render() {
    const [tries, setTries] = useState(0);
    return frame(
      <Stack>
        <WidgetBoard error="The widgets could not be loaded" onRetry={() => setTries((t) => t + 1)}>
          {widgets(3)}
        </WidgetBoard>
        <Stack size="content">
          <Log>Retries: {tries}</Log>
        </Stack>
      </Stack>,
    );
  },
};

/** `height="content"`: the board is as tall as its widgets, and the card around it scrolls. */
export const ContentHeight: Story = {
  render: () =>
    frame(
      <Card title="A board in a card">
        <WidgetBoard height="content" minColumnWidth={240}>
          {widgets(5)}
        </WidgetBoard>
      </Card>,
    ),
};

/**
 * The parts as a node, `null` and a function, and a board composed from its blocks: a toolbar of its
 * own, a widget that cannot collapse, an item that holds a card built from `Card.Root`, and one that
 * is no card at all.
 */
export const PartsAndBlocks: Story = {
  render: () =>
    frame(
      <Columns>
        <WidgetBoard
          minColumnWidth={200}
          aria-label="Custom parts"
          parts={{
            collapseAll: (p) => (
              <Button size="small" onPress={p.onPress}>
                {p.allCollapsed ? 'Open every widget' : 'Close every widget'}
              </Button>
            ),
          }}
        >
          {widgets(4)}
        </WidgetBoard>
        <WidgetBoard minColumnWidth={200} aria-label="No toolbar" parts={{ toolbar: null }}>
          {widgets(4)}
        </WidgetBoard>
        <WidgetBoard.Root>
          <WidgetBoard.Toolbar>
            <strong style={{ marginInlineEnd: 'auto', font: 'var(--umbra-font-label)' }}>My board</strong>
            <WidgetBoard.CollapseAll collapseAllLabel="Fold all" expandAllLabel="Unfold all" />
          </WidgetBoard.Toolbar>
          <WidgetBoard.Grid minColumnWidth={200} aria-label="From blocks">
            <WidgetBoard.Widget id="a" title="A widget">
              <Rows count={4} />
            </WidgetBoard.Widget>
            <WidgetBoard.Widget id="b" title="Always open" collapsible={false}>
              <Rows count={3} />
            </WidgetBoard.Widget>
            <WidgetBoard.Item id="c">
              {(state) => (
                <Card.Root size="content" collapsible {...state}>
                  <Card.Header>
                    <Card.Title>Built by hand</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <Rows count={3} />
                  </Card.Body>
                </Card.Root>
              )}
            </WidgetBoard.Item>
            <WidgetBoard.Item>
              <div style={{ padding: 12, border: '1px dashed var(--umbra-color-base-border-control)' }}>
                Any element
              </div>
            </WidgetBoard.Item>
          </WidgetBoard.Grid>
        </WidgetBoard.Root>
      </Columns>,
    ),
};
