import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log } from '../stories/placeholders';
import { Link } from './Link';
import { Narrow, Row } from './storyParts';

const meta = { title: 'Data/Link', component: Link, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Link
>;
export default meta;
type Story = StoryObj<typeof meta>;

const text = { margin: '0 0 12px', font: 'var(--umbra-font-label)' };

/** Inline and standalone links in both tones, external, disabled, and with a chevron. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Inline">
        <p style={text}>
          The order was placed by <Link href="#person-a">Person A</Link> and is handled by{' '}
          <Link href="#team-b" tone="neutral">
            Team B
          </Link>
          . Read the{' '}
          <Link href="https://example.com" external>
            delivery terms
          </Link>{' '}
          or <Link onPress={() => {}}>change the address</Link>.
        </p>
        <p style={text}>
          A disabled link:{' '}
          <Link href="#closed" disabled>
            closed orders
          </Link>
          , and a disabled action: <Link disabled>reopen</Link>.
        </p>
        <p style={{ ...text, width: 220 }}>
          An inline link wraps with its sentence:{' '}
          <Link href="#long">the full list of open orders in Region 2</Link>.
        </p>
      </Card>
      <Card title="Standalone">
        <Row label="Accent">
          <Link href="#all" variant="standalone" chevron>
            See all
          </Link>
          <Link href="#all" variant="standalone">
            See all
          </Link>
        </Row>
        <Row label="Neutral">
          <Link href="#all" variant="standalone" tone="neutral" chevron>
            All orders
          </Link>
        </Row>
        <Row label="External">
          <Link href="https://example.com" variant="standalone" external>
            Support
          </Link>
        </Row>
        <Row label="Disabled">
          <Link href="#all" variant="standalone" chevron disabled>
            See all
          </Link>
        </Row>
        <Row label="Narrow">
          <Narrow width={130}>
            <Link href="#all" variant="standalone" chevron>
              See all the open orders
            </Link>
          </Narrow>
        </Row>
      </Card>
    </Columns>
  ),
};

function Callbacks() {
  const [last, setLast] = useState('none');
  return (
    <Card title="Callbacks and a router link">
      <Row label="onPress">
        <Link variant="standalone" onPress={() => setLast('button pressed')}>
          Run action
        </Link>
        <Link variant="standalone" href="#here" onPress={() => setLast('link followed')}>
          Follow link
        </Link>
      </Row>
      <Row label="renderLink">
        <Link
          variant="standalone"
          href="#routed"
          chevron
          renderLink={({ href, ...rest }) => (
            <a
              {...rest}
              href={href}
              data-router=""
              onClick={(event) => {
                event.preventDefault();
                rest.onClick?.(event);
                setLast(`router went to ${href}`);
              }}
            />
          )}
        >
          Routed link
        </Link>
      </Row>
      <Log>Last action: {last}</Log>
    </Card>
  );
}

/** `onPress`, a router link through `renderLink`, and parts replaced, hidden and composed by hand. */
export const BehaviourAndParts: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Callbacks />
      <Card title="Parts and blocks">
        <Row label="Function">
          <Link
            href="#all"
            variant="standalone"
            parts={{ label: (p) => <em data-part="label">{p.children} (12)</em> }}
          >
            Label wrapped
          </Link>
        </Row>
        <Row label="Node">
          <Link
            href="#all"
            variant="standalone"
            chevron
            parts={{ chevron: <span data-part="chevron">→</span> }}
          >
            Chevron replaced
          </Link>
        </Row>
        <Row label="Null">
          <Link href="https://example.com" variant="standalone" external parts={{ externalIcon: null }}>
            External icon hidden
          </Link>
        </Row>
        <Row label="Blocks">
          <Link.Root href="#file" variant="standalone" tone="neutral">
            <Link.Icon>
              <Download />
            </Link.Icon>
            <Link.Label>By hand</Link.Label>
          </Link.Root>
        </Row>
      </Card>
    </Columns>
  ),
};
