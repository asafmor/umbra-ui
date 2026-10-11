import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart, Smile } from 'lucide-react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { StatusIndicator } from './StatusIndicator';
import { Narrow, Row } from './storyParts';

const meta = {
  title: 'Data/StatusIndicator',
  component: StatusIndicator,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof StatusIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

const statuses = [
  ['success', 'Ready'],
  ['warning', 'Slow'],
  ['danger', 'Down'],
  ['info', 'Syncing'],
  ['neutral', 'Idle'],
] as const;

/** Every status in the three variants, a custom colour, the pulse, and a dot without a label. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Statuses" size={3}>
        {(['dot', 'icon', 'label'] as const).map((variant) => (
          <Row key={variant} label={variant}>
            {statuses.map(([status, text]) => (
              <StatusIndicator key={status} status={status} variant={variant}>
                {text}
              </StatusIndicator>
            ))}
          </Row>
        ))}
        <Row label="Custom">
          <StatusIndicator color="#b4f032">Custom colour</StatusIndicator>
          <StatusIndicator color="#b4f032" variant="icon" icon={<Heart />}>
            Custom icon
          </StatusIndicator>
          <StatusIndicator color="#b4f032" variant="label">
            Very good
          </StatusIndicator>
        </Row>
        <Row label="Pulse">
          <StatusIndicator status="success" pulse>
            Live
          </StatusIndicator>
          <StatusIndicator status="danger" pulse>
            Needs attention
          </StatusIndicator>
        </Row>
        <Row label="No label">
          {statuses.map(([status, text]) => (
            <StatusIndicator key={status} status={status} aria-label={text} />
          ))}
          {statuses.map(([status, text]) => (
            <StatusIndicator key={status} status={status} variant="icon" aria-label={text} />
          ))}
        </Row>
      </Card>
      <Card title="Little room, parts and blocks" size={2}>
        <Row label="Narrow">
          <Narrow width={120}>
            <StatusIndicator status="warning">Waiting for a reply from Region 2</StatusIndicator>
          </Narrow>
        </Row>
        <Row label="Function">
          <StatusIndicator status="success" parts={{ label: (p) => <b data-part="label">{p.children}!</b> }}>
            Label wrapped
          </StatusIndicator>
        </Row>
        <Row label="Node">
          <StatusIndicator status="success" parts={{ indicator: <span data-part="indicator">★</span> }}>
            Mark replaced
          </StatusIndicator>
        </Row>
        <Row label="Null">
          <StatusIndicator status="danger" parts={{ indicator: null }}>
            Mark hidden
          </StatusIndicator>
        </Row>
        <Row label="Blocks">
          <StatusIndicator.Root status="info" variant="icon">
            <StatusIndicator.Label>By hand</StatusIndicator.Label>
            <StatusIndicator.Indicator className="by-hand" style={{ opacity: 1 }}>
              <Smile />
            </StatusIndicator.Indicator>
          </StatusIndicator.Root>
          <StatusIndicator.Root status="warning">
            <StatusIndicator.Indicator />
            <StatusIndicator.Label>Dot by hand</StatusIndicator.Label>
          </StatusIndicator.Root>
        </Row>
      </Card>
    </Columns>
  ),
};
