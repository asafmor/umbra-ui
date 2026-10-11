import type { Meta, StoryObj } from '@storybook/react-vite';
import { Row } from '../data/storyParts';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { DateChip } from './DateChip';

const meta = {
  title: 'Time/DateChip',
  component: DateChip,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof DateChip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, the month at a month's start, the weekday names, both sizes, the parts and the blocks. */
export const States: Story = {
  args: { date: '2026-10-14' },
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="States" size={3}>
        <Row label="Default">
          <DateChip date="2026-10-05" />
          <DateChip date="2026-10-13" />
          <DateChip date="2026-10-28" />
        </Row>
        <Row label="Today">
          <DateChip date="2026-10-14" today />
        </Row>
        <Row label="Selected">
          <DateChip date="2026-10-15" selected />
          <DateChip date="2026-10-14" today selected />
        </Row>
        <Row label="Outside">
          <DateChip date="2026-09-28" outside showMonth />
          <DateChip date="2026-09-29" outside />
          <DateChip date="2026-11-01" outside />
        </Row>
        <Row label="Month">
          <DateChip date="2026-10-01" />
          <DateChip date="2026-10-01" showMonth={false} />
          <DateChip date="2026-10-14" showMonth />
        </Row>
        <Row label="Small">
          <DateChip size="small" date="2026-10-13" />
          <DateChip size="small" date="2026-10-14" today />
          <DateChip size="small" date="2026-10-15" selected />
          <DateChip size="small" date="2026-11-01" outside />
        </Row>
      </Card>
      <Card title="Weekday" size={2}>
        <Row label="Long">
          <DateChip date="2026-10-14" weekday="long" />
        </Row>
        <Row label="Short">
          <DateChip date="2026-10-13" weekday="short" />
          <DateChip date="2026-10-14" weekday="short" today />
          <DateChip date="2026-10-15" weekday="short" selected />
        </Row>
        <Row label="Narrow">
          <DateChip date="2026-10-13" weekday="narrow" />
          <DateChip date="2026-10-14" weekday="narrow" today />
        </Row>
        <Row label="Name only">
          <DateChip date="2026-10-13" weekday="short" day={false} />
          <DateChip date="2026-10-14" weekday="short" day={false} today />
        </Row>
      </Card>
      <Card title="Parts and blocks" size={2}>
        <Row label="Node">
          <DateChip date="2026-10-14" weekday="short" parts={{ weekday: <span>Midweek</span> }} />
        </Row>
        <Row label="Hidden">
          <DateChip date="2026-10-14" weekday="short" parts={{ weekday: null }} />
        </Row>
        <Row label="Function">
          <DateChip date="2026-10-14" parts={{ day: (p) => <DateChip.Day {...p} month /> }} />
        </Row>
        <Row label="Blocks">
          <DateChip.Root date="2026-10-14" today>
            <DateChip.Day month />
            <DateChip.Weekday format="long" />
          </DateChip.Root>
        </Row>
      </Card>
    </Columns>
  ),
};

/** Right to left: the weekday and the number follow the reading direction, in the locale's words. */
export const RightToLeft: Story = { ...States, globals: { direction: 'rtl' } };
