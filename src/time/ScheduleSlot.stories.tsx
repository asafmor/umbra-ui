import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { Narrow, Row } from '../data/storyParts';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Log } from '../stories/placeholders';
import { kinds } from './samples';
import { ScheduleSlot } from './ScheduleSlot';

const meta = {
  title: 'Time/ScheduleSlot',
  component: ScheduleSlot,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ScheduleSlot>;
export default meta;
type Story = StoryObj<typeof meta>;

const tones = ['neutral', 'info', 'success', 'warning', 'danger', 'accent'] as const;
const variants = ['filled', 'outlined', 'empty'] as const;
const series = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const wrap = { display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 } as const;

/** Every tone in every variant, a free colour, the series palette, sizes, states, icon only and the three elements. */
export const Variants: Story = {
  tags: ['tints'],
  render: function Render() {
    const [log, setLog] = useState('Nothing pressed');
    return (
      <Columns style={{ height: '100%' }}>
        <Card title="Colour" size={3}>
          {variants.map((variant) => (
            <Row key={variant} label={variant}>
              <div style={wrap}>
                {tones.map((tone) => (
                  <ScheduleSlot key={tone} tone={tone} variant={variant} icon={<Star />}>
                    {tone}
                  </ScheduleSlot>
                ))}
              </div>
            </Row>
          ))}
          <Row label="Free colour">
            <ScheduleSlot color="#b4f032" icon={<Star />}>
              Custom
            </ScheduleSlot>
            <ScheduleSlot color="#b4f032" variant="outlined" icon={<Star />}>
              Custom
            </ScheduleSlot>
          </Row>
          <Row label="Series">
            <div style={wrap}>
              {series.map((n) => (
                <ScheduleSlot key={n} series={n} icon={<Star />}>
                  Series {n}
                </ScheduleSlot>
              ))}
            </div>
          </Row>
          <Row label="Categories">
            <div style={wrap}>
              {Object.entries(kinds).map(([id, { label, ...kind }]) => (
                <ScheduleSlot key={id} {...kind}>
                  {label}
                </ScheduleSlot>
              ))}
            </div>
          </Row>
        </Card>
        <Card title="States and content" size={2}>
          <Row label="Small">
            <ScheduleSlot size="small" {...kinds.planning}>
              Planning
            </ScheduleSlot>
            <ScheduleSlot size="small" {...kinds.free}>
              Free
            </ScheduleSlot>
          </Row>
          <Row label="Selected">
            <ScheduleSlot selected {...kinds.delivery}>
              Delivery
            </ScheduleSlot>
            <ScheduleSlot selected variant="outlined" {...kinds.upkeep}>
              Upkeep
            </ScheduleSlot>
          </Row>
          <Row label="Disabled">
            <ScheduleSlot disabled onPress={() => setLog('Disabled')} {...kinds.delivery}>
              Delivery
            </ScheduleSlot>
          </Row>
          <Row label="No icon">
            <ScheduleSlot tone="info">Planning</ScheduleSlot>
            <ScheduleSlot tone="info" display="icon">
              Keeps its label
            </ScheduleSlot>
          </Row>
          <Row label="No value">
            <ScheduleSlot />
            <ScheduleSlot emptyLabel="Nothing" icon={<Star />} />
          </Row>
          <Row label="Loading">
            <ScheduleSlot loading />
            <ScheduleSlot loading size="small" />
          </Row>
          <Row label="Icon only">
            <ScheduleSlot display="icon" {...kinds.planning}>
              Planning
            </ScheduleSlot>
            <ScheduleSlot display="icon" onPress={() => setLog('Pressed Delivery')} {...kinds.delivery}>
              Delivery
            </ScheduleSlot>
            <ScheduleSlot display="icon" size="small" {...kinds.upkeep}>
              Upkeep
            </ScheduleSlot>
          </Row>
          <Row label="Full width">
            <ScheduleSlot fullWidth {...kinds.review}>
              Quarterly review
            </ScheduleSlot>
          </Row>
        </Card>
        <Card title="Elements, parts and blocks" size={2}>
          <Row label="Button">
            <ScheduleSlot onPress={() => setLog('Pressed Planning')} {...kinds.planning}>
              Planning
            </ScheduleSlot>
          </Row>
          <Row label="Link">
            <ScheduleSlot href="#delivery" {...kinds.delivery}>
              Delivery
            </ScheduleSlot>
            <ScheduleSlot
              href="#router"
              renderLink={(props) => <a {...props} data-router="" />}
              {...kinds.upkeep}
            >
              Router link
            </ScheduleSlot>
          </Row>
          <Row label="Static">
            <ScheduleSlot {...kinds.review}>Quarterly review</ScheduleSlot>
          </Row>
          <Row label="Node">
            <ScheduleSlot
              tone="success"
              icon={<Star />}
              parts={{ label: <b data-part="label">Bold label</b> }}
            >
              Replaced
            </ScheduleSlot>
          </Row>
          <Row label="Hidden">
            <ScheduleSlot tone="success" icon={<Star />} parts={{ icon: null }}>
              No icon part
            </ScheduleSlot>
          </Row>
          <Row label="Function">
            <ScheduleSlot
              tone="success"
              icon={<Star />}
              parts={{ label: (p) => <ScheduleSlot.Label>{p.children} · 2h</ScheduleSlot.Label> }}
            >
              Delivery
            </ScheduleSlot>
          </Row>
          <Row label="Blocks">
            <ScheduleSlot.Root tone="warning" variant="outlined" tooltip="By hand">
              <ScheduleSlot.Label>By hand</ScheduleSlot.Label>
              <ScheduleSlot.Icon>
                <Star />
              </ScheduleSlot.Icon>
            </ScheduleSlot.Root>
          </Row>
          <Log>{log}</Log>
        </Card>
      </Columns>
    );
  },
};

/** With little room the label ends in an ellipsis, and the whole label is in a tooltip. */
export const Truncated: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {[220, 140, 96, 64].map((width) => (
        <Narrow key={width} width={width}>
          <ScheduleSlot fullWidth onPress={() => {}} {...kinds.review}>
            Quarterly review
          </ScheduleSlot>
        </Narrow>
      ))}
    </div>
  ),
};

/** Right to left: the stripe is on the right and the icon comes first from the right. */
export const RightToLeft: Story = { ...Variants, tags: [], globals: { direction: 'rtl' } };
