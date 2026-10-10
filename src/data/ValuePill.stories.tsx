import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Narrow, Row } from './storyParts';
import { ValuePill } from './ValuePill';

const meta = {
  title: 'Data/ValuePill',
  component: ValuePill,
  args: { value: 50 },
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ValuePill>;
export default meta;
type Story = StoryObj<typeof meta>;

const scores = [8, 31, 52, 74, 96];
const grades = ['E', 'D', 'C', 'B', 'A'];

/** The five ramp steps, both directions, thresholds, shapes, sizes, the level marker, no value, loading. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Ramp">
        <Row label="0 to 100">
          {scores.map((v) => (
            <ValuePill key={v} value={v} />
          ))}
        </Row>
        <Row label="Lower is better">
          {scores.map((v) => (
            <ValuePill key={v} value={v} ramp="lower-is-better" />
          ))}
        </Row>
        <Row label="Thresholds">
          {[5.8, 6.4, 6.9, 7.5, 8.2].map((v) => (
            <ValuePill key={v} value={v} thresholds={[6, 6.5, 7, 8]} format={(n) => n.toFixed(2)} />
          ))}
        </Row>
        <Row label="One threshold">
          <ValuePill value={6.9} thresholds={[7]} />
          <ValuePill value={7} thresholds={[7]} format={(n) => n.toFixed(1)} />
        </Row>
        <Row label="Level marker">
          {scores.map((v) => (
            <ValuePill key={v} value={v} showLevel />
          ))}
        </Row>
      </Card>
      <Card title="Shapes and states">
        <Row label="Square">
          {[3, 7, 11, 15, 19].map((v) => (
            <ValuePill key={v} value={v} min={1} max={20} shape="square" />
          ))}
        </Row>
        <Row label="Circle">
          {scores.map((v, i) => (
            <ValuePill key={v} value={v} shape="circle" format={() => grades[i]} />
          ))}
        </Row>
        <Row label="Sizes">
          <ValuePill value={74} size="small" />
          <ValuePill value={74} />
          <ValuePill value={74} size="large" showLevel />
        </Row>
        <Row label="No value">
          <ValuePill value={null} />
          <ValuePill value={undefined} emptyText="n/a" />
          <ValuePill value={null} shape="square" />
        </Row>
        <Row label="Loading">
          <ValuePill value={null} loading />
          <ValuePill value={null} loading />
        </Row>
      </Card>
    </Columns>
  ),
};

/** A value that truncates, and parts replaced, hidden and composed by hand. */
export const BehaviourAndParts: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Little room">
        <Narrow width={72}>
          <ValuePill value={96} format={(v) => `${v} of 100 points`} showLevel />
        </Narrow>
      </Card>
      <Card title="Parts and blocks">
        <Row label="Function">
          <ValuePill value={74} parts={{ value: (p) => <span data-part="value">{p.children}%</span> }} />
          <ValuePill
            value={74}
            showLevel
            parts={{ level: (p) => <small data-part="level">{p.level}/5</small> }}
          />
        </Row>
        <Row label="Node">
          <ValuePill value={74} parts={{ value: <span data-part="value">High</span> }} />
          <ValuePill value={null} loading parts={{ skeleton: <i data-part="skeleton">Loading…</i> }} />
        </Row>
        <Row label="Null">
          <ValuePill value={74} showLevel parts={{ level: null }} />
        </Row>
        <Row label="Blocks">
          <ValuePill.Root level={2} shape="square">
            <ValuePill.Value>Low</ValuePill.Value>
            <ValuePill.Level level={2} label="Level 2 of 5" />
          </ValuePill.Root>
        </Row>
      </Card>
    </Columns>
  ),
};
