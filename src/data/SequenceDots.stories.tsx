import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log } from '../stories/placeholders';
import { KeyValue } from './KeyValue';
import { ListItem } from './ListItem';
import { SequenceDots, type SequenceDotsItem } from './SequenceDots';
import { Narrow, Row } from './storyParts';
import type { Tone } from './tone';

const meta = {
  title: 'Data/SequenceDots',
  component: SequenceDots,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SequenceDots>;
export default meta;
type Story = StoryObj<typeof meta>;

const outcomes: Record<Tone, string> = {
  success: 'Passed',
  danger: 'Failed',
  warning: 'Partial',
  info: 'Skipped',
  accent: 'Pinned',
  neutral: 'Not run',
};
const sequence = (tones: Tone[], values?: (number | null)[]): SequenceDotsItem[] =>
  tones.map((tone, i) => ({
    id: `run-${i + 1}`,
    tone,
    label: `Run ${i + 1}: ${outcomes[tone]}`,
    value: values?.[i],
    tooltip: `Run ${i + 1}: ${outcomes[tone]}`,
  }));

const every: Tone[] = ['success', 'danger', 'warning', 'info', 'accent', 'neutral'];
const recent = sequence(['success', 'success', 'danger', 'warning', 'success']);
const long = sequence(['success', 'danger', 'success', 'warning', 'success', 'success', 'danger', 'success']);
const scores = [6.2, 7.4, 3.1, 5.5, 8.8];
const bars = sequence(['success', 'success', 'danger', 'warning', 'success'], scores);

/** Dots and bars: every tone with its shape or fill, the sizes, `max`, a free colour, no value, loading. */
export const Variants: Story = {
  tags: ['tints'],
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Dots">
        <Row label="Every tone">
          <SequenceDots items={sequence(every)} />
        </Row>
        <Row label="Small">
          <SequenceDots size="sm" items={recent} />
        </Row>
        <Row label="Medium">
          <SequenceDots items={recent} />
        </Row>
        <Row label="Large">
          <SequenceDots size="lg" items={recent} />
        </Row>
        <Row label="max={3}">
          <SequenceDots items={long} max={3} />
        </Row>
        <Row label="Free colour">
          <SequenceDots
            items={[
              { id: 'a', label: 'Batch 1: early', color: '#d6a6ff', mark: 'diamond' },
              { id: 'b', label: 'Batch 2: on time', color: '#7ad7ff', mark: 'dot' },
              { id: 'c', label: 'Batch 3: late', color: '#ffb38a', mark: 'ring' },
            ]}
          />
        </Row>
        <Row label="No value">
          <SequenceDots items={null} />
          <SequenceDots items={[]} emptyLabel="None yet" />
        </Row>
        <Row label="Loading">
          <SequenceDots items={recent} loading />
          <SequenceDots loading size="lg" />
        </Row>
      </Card>
      <Card title="Bars">
        <Row label="By value">
          <SequenceDots variant="bars" items={bars} />
        </Row>
        <Row label="Every tone">
          <SequenceDots variant="bars" size="lg" items={sequence(every, [9, 7, 8, 6, 9, 5])} />
        </Row>
        <Row label="Small">
          <SequenceDots variant="bars" size="sm" items={bars} />
        </Row>
        <Row label="Large">
          <SequenceDots variant="bars" size="lg" items={bars} />
        </Row>
        <Row label="range 0 to 20">
          <SequenceDots variant="bars" size="lg" items={bars} range={[0, 20]} />
        </Row>
        <Row label="A missing value">
          <SequenceDots variant="bars" size="lg" items={sequence(every.slice(0, 5), [6, null, 8, 4, null])} />
        </Row>
        <Row label="No value">
          <SequenceDots variant="bars" items={undefined} />
        </Row>
        <Row label="Loading">
          <SequenceDots variant="bars" items={bars} loading />
        </Row>
      </Card>
    </Columns>
  ),
};

function Pressable() {
  const [last, setLast] = useState('none');
  return (
    <>
      <Row label="Dots">
        <SequenceDots items={recent} onAction={setLast} />
      </Row>
      <Row label="Bars">
        <SequenceDots variant="bars" size="lg" items={bars} onAction={setLast} />
      </Row>
      <Row label="One disabled">
        <SequenceDots
          items={recent.map((item, i) => ({ ...item, disabled: i === 2 }))}
          onAction={setLast}
          aria-label="Last five runs"
        />
      </Row>
      <Log>Last action: {last}</Log>
    </>
  );
}

/** Marks that can be pressed (one tab stop, arrow keys), and tooltips on marks that cannot. */
export const Interactive: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="With onAction">
        <Pressable />
      </Card>
      <Card title="Tooltips only">
        <Row label="Hover a mark">
          <SequenceDots size="lg" items={recent} />
        </Row>
      </Card>
    </Columns>
  ),
};

/** The oldest marks go as the room shrinks; the newest always stays. In a list row and beside a value. */
export const Shrinking: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Little room">
        {[160, 96, 60, 20].map((width) => (
          <Row key={width} label={`${width}px`}>
            <Narrow width={width}>
              <SequenceDots items={long} />
            </Narrow>
          </Row>
        ))}
        <Row label="Bars, 30px">
          <Narrow width={30}>
            <SequenceDots variant="bars" items={sequence(every, [3, 6, 9, 4, 7, 8])} />
          </Narrow>
        </Row>
        <Row label="Pressable">
          <Narrow width={80}>
            <SequenceDots items={long} onAction={() => {}} />
          </Narrow>
        </Row>
      </Card>
      <Card title="In rows">
        <ListItem size="compact" title="Item 1" trailing={<SequenceDots size="sm" items={recent} />} />
        <ListItem
          size="compact"
          title="Item 2"
          trailing={<SequenceDots size="sm" variant="bars" items={bars} />}
        />
        <KeyValue label="Recent runs" value={<SequenceDots items={recent} />} />
      </Card>
    </Columns>
  ),
};

/** Parts replaced, hidden and adjusted, and the blocks composed by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Parts">
        <Row label="Function">
          <SequenceDots
            items={recent}
            parts={{ mark: (p) => <SequenceDots.Mark key={p.id} {...p} mark="square" /> }}
          />
        </Row>
        <Row label="Node">
          <SequenceDots loading parts={{ skeleton: <span>Loading runs</span> }} />
        </Row>
        <Row label="Hidden">
          <SequenceDots items={[]} parts={{ empty: null }} />
          <span>(nothing)</span>
        </Row>
      </Card>
      <Card title="Blocks">
        <Row label="By hand">
          <SequenceDots.Root aria-label="Three checks: passed, passed, failed" size="lg">
            <SequenceDots.Mark id="1" label="Passed" tone="success" />
            <SequenceDots.Mark id="2" label="Passed" tone="success" />
            <SequenceDots.Mark id="3" label="Failed" tone="danger" />
          </SequenceDots.Root>
        </Row>
      </Card>
    </Columns>
  ),
};

/** Right to left: the newest mark is at the left, and the arrow keys follow what is drawn. */
export const RightToLeft: Story = { ...Interactive, globals: { direction: 'rtl' } };
