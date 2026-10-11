import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe, Tag as TagGlyph } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log } from '../stories/placeholders';
import { Narrow, Row } from './storyParts';
import { Tag } from './Tag';

const meta = { title: 'Data/Tag', component: Tag, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Tag
>;
export default meta;
type Story = StoryObj<typeof meta>;

const tones = ['neutral', 'info', 'success', 'warning', 'danger', 'accent'] as const;
const variants = ['outline', 'subtle', 'solid'] as const;

/** Every tone in every variant, a custom colour, sizes, an icon, the edge stripe and loading. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Tones and variants" size={3}>
        {variants.map((variant) => (
          <Row key={variant} label={variant}>
            {tones.map((tone) => (
              <Tag key={tone} tone={tone} variant={variant}>
                {tone}
              </Tag>
            ))}
            <Tag color="#b4f032" variant={variant}>
              custom
            </Tag>
          </Row>
        ))}
        <Row label="Small">
          {variants.map((variant) => (
            <Tag key={variant} size="small" tone="success" variant={variant}>
              OK
            </Tag>
          ))}
          <Tag size="small">Region 2</Tag>
        </Row>
      </Card>
      <Card title="Content" size={2}>
        <Row label="Icon">
          <Tag icon={<Globe />}>Region 2</Tag>
          <Tag icon={<TagGlyph />} variant="subtle">
            12K – 18K
          </Tag>
        </Row>
        <Row label="Stripe">
          <Tag tone="success" variant="solid" stripe="warning" stripeLabel="under review">
            Set
          </Tag>
          <Tag tone="danger" variant="solid" stripe="success" stripeLabel="recovering">
            Hold
          </Tag>
          <Tag stripe="#3d9be8">Team B</Tag>
        </Row>
        <Row label="Loading">
          <Tag loading />
          <Tag loading />
        </Row>
        <Row label="No label">
          <Tag>{null}</Tag>
          <Tag tone="info" variant="subtle" emptyLabel="None">
            {undefined}
          </Tag>
        </Row>
      </Card>
    </Columns>
  ),
};

function Removable() {
  const [items, setItems] = useState(['Region 1', 'Region 2', 'Orders over 500', 'Person A']);
  const [last, setLast] = useState('none');
  const [filter, setFilter] = useState(true);
  return (
    <Card title="Removable">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {items.map((item) => (
          <Tag
            key={item}
            variant="subtle"
            tone="info"
            onRemove={() => {
              setItems(items.filter((i) => i !== item));
              setLast(item);
            }}
          >
            {item}
          </Tag>
        ))}
        {filter && (
          <Tag
            variant="solid"
            tone="warning"
            onRemove={() => {
              setFilter(false);
              setLast('Filter');
            }}
            removeLabel="Clear"
          >
            Filter
          </Tag>
        )}
      </div>
      <Log>Last removed: {last}</Log>
    </Card>
  );
}

/** The remove button, a label that truncates, and parts replaced, hidden and composed by hand. */
export const BehaviourAndParts: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Removable />
      <Card title="Little room">
        <Narrow width={140}>
          <Tag icon={<Globe />} onRemove={() => {}}>
            A long label that does not fit
          </Tag>
        </Narrow>
        <br />
        <Narrow width={140}>
          <Tag tone="success" variant="solid">
            Short
          </Tag>
          <Tag tone="info" variant="subtle">
            Another long label
          </Tag>
        </Narrow>
      </Card>
      <Card title="Parts and blocks">
        <Row label="Function">
          <Tag icon={<Globe />} parts={{ label: (p) => <b data-part="label">{p.children} (new)</b> }}>
            Label wrapped
          </Tag>
        </Row>
        <Row label="Node">
          <Tag icon={<Globe />} parts={{ icon: <span data-part="icon">★</span> }}>
            Icon replaced
          </Tag>
        </Row>
        <Row label="Null">
          <Tag icon={<Globe />} onRemove={() => {}} parts={{ icon: null, remove: null }}>
            Icon and remove hidden
          </Tag>
        </Row>
        <Row label="Skeleton">
          <Tag loading parts={{ skeleton: <i data-part="skeleton">Loading…</i> }} />
        </Row>
        <Row label="Blocks">
          <Tag.Root tone="accent" variant="subtle">
            <Tag.Icon className="by-hand" style={{ opacity: 1 }}>
              <Globe />
            </Tag.Icon>
            <Tag.Label>By hand</Tag.Label>
            <Tag.Remove label="Remove By hand" />
          </Tag.Root>
        </Row>
      </Card>
    </Columns>
  ),
};
