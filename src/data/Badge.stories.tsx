import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Badge } from './Badge';
import { Row } from './storyParts';

const meta = { title: 'Data/Badge', component: Badge, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Badge
>;
export default meta;
type Story = StoryObj<typeof meta>;

const tones = ['accent', 'neutral', 'info', 'success', 'warning', 'danger'] as const;

/** Counts and dots in every tone, alone and on the corner of another element. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Standalone">
        <Row label="Count">
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} count={7} label={(n) => `${n} ${tone}`} />
          ))}
          <Badge color="#b4f032" count={7} label="7 custom" />
        </Row>
        <Row label="Dot">
          {tones.map((tone) => (
            <Badge key={tone} tone={tone} dot label={`${tone} dot`} />
          ))}
          <Badge color="#b4f032" dot label="custom dot" />
        </Row>
        <Row label="Max">
          <Badge count={99} />
          <Badge count={100} />
          <Badge count={1250} max={999} />
        </Row>
        <Row label="Zero">
          <Badge count={0} showZero />
          <span style={{ font: 'var(--umbra-font-label)' }}>
            hidden without showZero:
            <Badge count={0} />
          </span>
        </Row>
      </Card>
      <Card title="Anchored">
        <div style={{ paddingTop: 8 }}>
          <Row label="Count">
            <Badge count={3} label={(n) => `${n} unread messages`}>
              <IconButton icon={<Mail />} label="Messages" variant="neutral" />
            </Badge>
            <Badge count={120} tone="danger">
              <Button>Alerts</Button>
            </Badge>
          </Row>
          <Row label="Dot">
            <Badge dot label="New notifications">
              <IconButton icon={<Bell />} label="Notifications" variant="neutral" />
            </Badge>
            <Badge dot tone="success" label="Online">
              <Button>Person A</Button>
            </Badge>
          </Row>
        </div>
      </Card>
    </Columns>
  ),
};

function Counter() {
  const [count, setCount] = useState(98);
  return (
    <Card title="Live count">
      <div style={{ paddingTop: 8 }}>
        <Row label="Count">
          <Badge count={count} label={(n) => `${n} open orders`}>
            <Button onPress={() => setCount(count + 1)}>Add order</Button>
          </Badge>
          <Button variant="ghost" onPress={() => setCount(0)}>
            Clear
          </Button>
        </Row>
      </div>
    </Card>
  );
}

/**
 * On a filled surface the badge gets a ring in the surface's text colour, so it keeps its edge when
 * the fill is close to its own colour: a violet badge on an `accent` button, or on a violet brand.
 */
export const OnFilledSurfaces: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Buttons">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, paddingTop: 8, alignItems: 'center' }}>
          {(['accent', 'primary', 'neutral'] as const).map((variant) => (
            <Badge key={variant} count={3}>
              <Button variant={variant}>Anchored on {variant}</Button>
            </Badge>
          ))}
          <Button variant="accent">
            Inside accent <Badge count={3} />
          </Button>
        </div>
      </Card>
      {['#6a1fd6', '#e8e4f0'].map((brand) => (
        <Card
          key={brand}
          title={`Band ${brand}`}
          headerStyle="band"
          parts={{
            header: <Card.Header title={`Band ${brand}`} bandColor={brand} actions={<Badge count={3} />} />,
          }}
        >
          The band is the surface: the ring is its text colour.
        </Card>
      ))}
    </Columns>
  ),
};

/** A count that changes, and the indicator replaced, hidden and composed by hand. */
export const BehaviourAndParts: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Counter />
      <Card title="Parts and blocks">
        <div style={{ paddingTop: 8 }}>
          <Row label="Function">
            <Badge
              count={5}
              parts={{
                indicator: (p) => (
                  <b data-part="indicator" style={{ marginInlineStart: 8 }}>
                    ({p.children} new)
                  </b>
                ),
              }}
            >
              <Button>Inbox</Button>
            </Badge>
          </Row>
          <Row label="Node">
            <Badge count={5} parts={{ indicator: <span data-part="indicator">★</span> }}>
              <Button>Inbox</Button>
            </Badge>
          </Row>
          <Row label="Null">
            <Badge count={5} parts={{ indicator: null }}>
              <Button>Indicator hidden</Button>
            </Badge>
          </Row>
          <Row label="Blocks">
            <Badge.Root tone="success" anchored>
              <Button>By hand</Button>
              <Badge.Indicator label="2 done">2</Badge.Indicator>
            </Badge.Root>
            <Badge.Root tone="warning">
              <Badge.Indicator dot label="Pending" />
            </Badge.Root>
          </Row>
        </div>
      </Card>
    </Columns>
  ),
};
