import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Narrow, Row } from './storyParts';
import { TrendArrow } from './TrendArrow';

const meta = {
  title: 'Data/TrendArrow',
  component: TrendArrow,
  args: { direction: 'up' },
  parameters: { frame: 'padded' },
} satisfies Meta<typeof TrendArrow>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The three directions, which one is good, a value, a forced tone, and a custom icon. */
export const Variants: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Directions">
        <Row label="Up is good">
          <TrendArrow direction="up" />
          <TrendArrow direction="down" />
          <TrendArrow direction="flat" />
        </Row>
        <Row label="Down is good">
          <TrendArrow direction="up" positive="down" value="12 ms" />
          <TrendArrow direction="down" positive="down" value="8 ms" />
          <TrendArrow direction="flat" positive="down" value="0 ms" />
        </Row>
        <Row label="With a value">
          <TrendArrow direction="up" value="2.4%" />
          <TrendArrow direction="down" value="1.1%" />
          <TrendArrow direction="flat" value="0%" />
        </Row>
        <Row label="Forced tone">
          <TrendArrow direction="up" tone="neutral" value="3" />
          <TrendArrow direction="down" tone="good" value="3" />
        </Row>
        <Row label="In a title">
          <span style={{ font: 'var(--umbra-font-display)' }}>
            1,284 <TrendArrow direction="up" value="36" upLabel="Up by" />
          </span>
        </Row>
      </Card>
      <Card title="Little room, parts and blocks">
        <Row label="Narrow">
          <Narrow width={96}>
            <TrendArrow direction="up" value="2.4% since last month" />
          </Narrow>
        </Row>
        <Row label="Icon prop">
          <TrendArrow direction="up" icon={<ChevronsUp />} value="Fast" />
          <TrendArrow direction="down" icon={<ChevronsDown />} value="Fast" />
        </Row>
        <Row label="Function">
          <TrendArrow
            direction="up"
            value="2.4%"
            parts={{ value: (p) => <b data-part="value">+{p.children}</b> }}
          />
        </Row>
        <Row label="Node">
          <TrendArrow direction="down" value="1.1%" parts={{ icon: <span data-part="icon">▼</span> }} />
        </Row>
        <Row label="Null">
          <TrendArrow direction="up" value="Value hidden" parts={{ value: null }} />
        </Row>
        <Row label="Blocks">
          <TrendArrow.Root direction="up" tone="good">
            <TrendArrow.Value>By hand</TrendArrow.Value>
            <TrendArrow.Icon>
              <ChevronsUp />
            </TrendArrow.Icon>
          </TrendArrow.Root>
        </Row>
      </Card>
    </Columns>
  ),
};
