import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowDownLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log, Rows } from '../stories/placeholders';
import { GroupHeader } from './GroupHeader';
import { Box } from './samples';

const meta = {
  title: 'Data/GroupHeader',
  component: GroupHeader,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof GroupHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

const action = <Button size="small">Add</Button>;

function Collapsible() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      <GroupHeader
        title="Incoming"
        count={3}
        collapsible
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      {!collapsed && <Rows count={3} prefix="Order" />}
      <GroupHeader title="Outgoing" count={2} collapsible defaultCollapsed />
      <Log>Incoming is {collapsed ? 'collapsed' : 'open'}</Log>
    </>
  );
}

/** The strip and plain looks, every piece, a collapsible group, and sticky headers in a scrolling card. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Strip" padding="none">
        <GroupHeader title="Fri 9 Oct" />
        <Rows count={2} />
        <GroupHeader title="Incoming" icon={<ArrowDownLeft />} count={11} meta="€102M" actions={action} />
        <Rows count={2} />
        <GroupHeader title="Level 4 heading" level={4} meta="Total 40" />
        <Rows count={2} />
      </Card>
      <Card title="Plain">
        <GroupHeader variant="plain" title="Highest average rating" count={3} />
        <Rows count={3} prefix="Person" />
        <GroupHeader variant="plain" title="Most closed orders" meta="This quarter" />
        <Rows count={3} prefix="Person" />
      </Card>
      <Card title="Collapsible" padding="none">
        <Collapsible />
      </Card>
      <Card title="Sticky" padding="none">
        {['Fri 9 Oct', 'Thu 8 Oct', 'Wed 7 Oct'].map((day) => (
          <section key={day}>
            <GroupHeader sticky title={day} count={8} />
            <Rows count={8} prefix="Message" />
          </section>
        ))}
      </Card>
    </Columns>
  ),
};

/** The meta text hides when the header is too narrow, then the title truncates. */
export const Shrink: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="By width">
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['wide', 420],
            ['medium', 290],
            ['narrow', 150],
          ].map(([label, width]) => (
            <Box key={label} label={`${label}: ${width}px wide`} width={width}>
              <GroupHeader title="Orders from partners" count={11} meta="Total €102M" actions={action} />
            </Box>
          ))}
        </div>
      </Card>
    </Columns>
  ),
};

/** Parts replaced by a node or a function, or hidden with `null`; and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Parts" padding="none">
        <GroupHeader
          title="Count from a function"
          count={11}
          parts={{ count: (p) => <b data-part="count">{p.children} open</b> }}
        />
        <Rows count={2} />
        <GroupHeader
          title="Meta replaced by a node"
          meta="hidden"
          parts={{
            meta: (
              <i data-part="meta" style={{ marginInlineStart: 'auto' }}>
                Custom
              </i>
            ),
          }}
        />
        <Rows count={2} />
        <GroupHeader
          title="Count, meta and caret hidden"
          count={4}
          meta="Total 9"
          collapsible
          parts={{ count: null, meta: null, toggle: null }}
        />
        <Rows count={2} />
      </Card>
      <Card title="Blocks" padding="none">
        <GroupHeader.Root>
          <GroupHeader.Title level={4}>Composed by hand</GroupHeader.Title>
          <GroupHeader.Count>7</GroupHeader.Count>
          <GroupHeader.Meta>Total 31</GroupHeader.Meta>
          <GroupHeader.Actions>{action}</GroupHeader.Actions>
        </GroupHeader.Root>
        <Rows count={3} />
      </Card>
    </Columns>
  ),
};
