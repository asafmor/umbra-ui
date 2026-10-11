import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { LiveValues } from '../stories/live';
import { Comparison, type ComparisonRow, type ComparisonSide } from './Comparison';
import { EntityIcon } from './EntityIcon';
import { Box } from './samples';
import { ValuePill } from './ValuePill';

const sides: [ComparisonSide, ComparisonSide] = [
  { name: 'Region A', icon: <EntityIcon name="Region A" size="sm" letters={2} /> },
  { name: 'Region B', icon: <EntityIcon name="Region B" size="sm" letters={2} /> },
];
const percent = (value: number) => `${value}%`;
const rows: ComparisonRow[] = [
  { id: 'orders', label: 'Orders', values: [128, 96] },
  { id: 'returns', label: 'Returns', values: [7, 12], lowerIsBetter: true },
  { id: 'on-time', label: 'Delivered on time', values: [92, 88], formatValue: percent, max: 100 },
  { id: 'visits', label: 'Visits', values: [41, 41] },
  { id: 'rating', label: 'Average rating', values: [4.2, null], max: 5 },
  { id: 'cost', label: 'Cost per order', values: [3.4, 2.9], lowerIsBetter: true },
];
const meta = {
  title: 'Data/Comparison',
  component: Comparison,
  args: { sides, rows },
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Comparison>;
export default meta;
type Story = StoryObj<typeof meta>;

const summary = { values: [12, 9] as const, caption: 'Week 12' };

/** Plain names with bars, the large summary in the header, and the one-line strip. */
export const Variants: Story = {
  tags: ['tints'],
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Names and bars">
        <Comparison sides={sides} rows={rows} aria-label="Region A and Region B" />
      </Card>
      <Card title="Summary, no bars">
        <Comparison
          sides={sides}
          rows={rows}
          summary={summary}
          showBars={false}
          aria-label="Region A and Region B, week 12"
        />
      </Card>
      <Stack>
        <Card title="Strip" size="content">
          <Comparison variant="strip" sides={sides} rows={rows} summary={summary} aria-label="Week 12" />
        </Card>
        <Card title="Strip from the first row" size="content">
          <Comparison variant="strip" sides={sides} rows={rows} aria-label="Orders" />
        </Card>
        <Card title="Free colours, no leader mark">
          <Comparison
            sides={[
              { name: 'Plan', color: '#d6a6ff' },
              { name: 'Actual', color: '#ffb38a' },
            ]}
            rows={rows.slice(0, 3)}
            highlightLeader={false}
            aria-label="Plan and actual"
          />
        </Card>
      </Stack>
    </Columns>
  ),
};

function Failing() {
  const [failed, setFailed] = useState(true);
  return (
    <Comparison
      sides={sides}
      rows={rows}
      error={failed}
      onRetry={() => setFailed(false)}
      aria-label="Region A and Region B"
    />
  );
}

function Loads() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Button size="small" onPress={() => setLoading(!loading)}>
        {loading ? 'Finish loading' : 'Load again'}
      </Button>
      <Comparison sides={sides} rows={rows} loading={loading} skeletonRows={6} aria-label="Regions" />
    </>
  );
}

/** Loading, empty, and an error with a retry button. */
export const States: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Loading">
        <Loads />
      </Card>
      <Card title="Loading, with a summary">
        <Comparison sides={sides} rows={[]} summary={summary} loading showBars={false} aria-label="Regions" />
      </Card>
      <Stack>
        <Card title="Empty">
          <Comparison sides={sides} rows={[]} />
        </Card>
        <Card title="Error">
          <Failing />
        </Card>
      </Stack>
    </Columns>
  ),
};

const column = { display: 'flex', flexDirection: 'column', height: '100%' } as const;

/** Narrow: the bars go and long labels truncate. Short: the bars go, then one line is left. */
export const Shrinking: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      {[320, 230, 170].map((width) => (
        <Box key={width} width={width} label={`${width}px wide`}>
          <Comparison sides={sides} rows={rows.slice(0, 4)} height="content" aria-label={`At ${width}`} />
        </Box>
      ))}
      {[260, 190, 60].map((height) => (
        <Box key={height} width={280} height={height} label={`${height}px high`}>
          <div style={column}>
            <Comparison sides={sides} rows={rows} summary={summary} aria-label={`In ${height}`} />
          </div>
        </Box>
      ))}
    </div>
  ),
};

/** Parts replaced, hidden and adjusted, and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Function: values as pills">
        <Comparison
          sides={sides}
          rows={rows.slice(0, 4)}
          aria-label="With pills"
          parts={{
            value: ({ row, ...p }) => (
              <Comparison.Value {...p}>
                <ValuePill size="small" value={row.values[p.opposite ? 1 : 0]} max={130} />
              </Comparison.Value>
            ),
          }}
        />
      </Card>
      <Card title="Node and null">
        <Comparison
          sides={sides}
          rows={rows.slice(0, 3)}
          summary={summary}
          aria-label="Replaced parts"
          parts={{
            bars: null,
            summary: <Comparison.Summary values={['A', 'B']} caption="Replaced summary" separator="vs" />,
          }}
        />
      </Card>
      <Card title="Blocks by hand">
        <Comparison.Root height="content">
          <Comparison.Table aria-label="Composed by hand">
            <Comparison.Header metricLabel="Measure">
              <Comparison.Side role="columnheader">Group 1</Comparison.Side>
              <Comparison.Side role="columnheader" opposite>
                Group 2
              </Comparison.Side>
            </Comparison.Header>
            <Comparison.Body>
              <Comparison.Row>
                <Comparison.Label>Members</Comparison.Label>
                <Comparison.Value leader>24</Comparison.Value>
                <Comparison.Value opposite>18</Comparison.Value>
                <Comparison.Bars shares={[1, 0.75]} />
              </Comparison.Row>
              <Comparison.Row>
                <Comparison.Label>Open tasks</Comparison.Label>
                <Comparison.Value>5</Comparison.Value>
                <Comparison.Value opposite leader>
                  3
                </Comparison.Value>
              </Comparison.Row>
            </Comparison.Body>
          </Comparison.Table>
        </Comparison.Root>
      </Card>
    </Columns>
  ),
};

/** `highlightChanges`: a value that changes flashes once, with a sign for its direction. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues kinds={['up', 'down', 'same']} columns={3}>
      {(value) => (
        <Comparison
          sides={[{ name: 'Region A' }, { name: 'Region B' }]}
          rows={[{ id: 'orders', label: 'Orders', values: [value as number, 40] }]}
          height="content"
          highlightChanges
          aria-label="Live orders"
        />
      )}
    </LiveValues>
  ),
};

/** Right to left: the first side is at the right, and each bar still grows from the centre. */
export const RightToLeft: Story = { ...Variants, tags: [], globals: { direction: 'rtl' } };
