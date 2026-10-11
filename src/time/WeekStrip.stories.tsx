import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Stack } from '../layout/Stack';
import { Log } from '../stories/placeholders';
import { DateChip } from './DateChip';
import { weekDays } from './dates';
import { kinds, sampleItems, thisWeek, TODAY } from './samples';
import { ScheduleSlot } from './ScheduleSlot';
import { WeekStrip } from './WeekStrip';

const meta = {
  title: 'Time/WeekStrip',
  component: WeekStrip,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof WeekStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

const fill = { height: '100%' } as const;

/** A week in cards of three widths: labels where they fit, icons where they do not. Days and items can be pressed. */
export const Default: Story = {
  tags: ['tints'],
  render: function Render() {
    const [log, setLog] = useState('Nothing pressed');
    const [selected, setSelected] = useState<string | null>('2026-10-16');
    return (
      <Columns style={fill}>
        <Card title="This week" size={4}>
          <WeekStrip
            aria-label="This week"
            today={TODAY}
            items={thisWeek}
            slotSize="default"
            selectedDate={selected}
            onSelectedDateChange={setSelected}
            onAction={(id) => setLog(`Item ${id}`)}
            onDayAction={(date) => setLog(`Day ${date}`)}
          />
          <Log>
            {log} · selected {selected}
          </Log>
        </Card>
        <Stack size={2}>
          <Card title="Weekday and number">
            <WeekStrip aria-label="This week, both" today={TODAY} items={thisWeek} />
          </Card>
          <Card title="Number only">
            <WeekStrip aria-label="This week, numbers" today={TODAY} items={thisWeek} dayHeader="date" />
          </Card>
        </Stack>
        <Stack size={1}>
          <Card title="Weekday only" tone="neutral">
            <WeekStrip aria-label="This week, weekdays" today={TODAY} items={thisWeek} dayHeader="weekday" />
          </Card>
          <Card title="Three slots" tone="neutral">
            <WeekStrip
              aria-label="This week, three slots"
              today={TODAY}
              items={thisWeek}
              slotsPerDay={3}
              dayHeader="weekday"
            />
          </Card>
        </Stack>
      </Columns>
    );
  },
};

/** Loading, a week without items, the empty text an app gives, and an error with a retry. */
export const States: Story = {
  render: function Render() {
    const [failed, setFailed] = useState(true);
    return (
      <Columns style={fill}>
        <Card title="Loading">
          <WeekStrip aria-label="Loading week" today={TODAY} loading />
        </Card>
        <Card title="No items">
          <WeekStrip aria-label="Free week" today={TODAY} slotsPerDay={2} />
        </Card>
        <Card title="Empty">
          <WeekStrip aria-label="Empty week" today={TODAY} empty="Nothing planned this week" />
        </Card>
        <Card title="Error">
          <WeekStrip
            aria-label="Failing week"
            today={TODAY}
            items={thisWeek}
            error={failed ? 'The week could not be loaded' : undefined}
            onRetry={() => setFailed(false)}
          />
        </Card>
      </Columns>
    );
  },
};

const widths = [760, 520, 380, 250] as const;

/** As the strip narrows: the weekday names shorten (long, short, narrow) and the labels give way to the icons. */
export const Shrinking: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {[1040, ...widths].map((width) => (
        <div key={width} data-width={width} style={{ width, maxWidth: '100%' }}>
          <WeekStrip
            aria-label={`Week at ${width} pixels`}
            today={TODAY}
            items={thisWeek}
            slotSize="default"
            onAction={() => {}}
          />
        </div>
      ))}
    </div>
  ),
};

const days = weekDays('2026-10-12');

/** Each kind of part (a node, hidden, a function), and a strip composed from the blocks by hand. */
export const PartsAndBlocks: Story = {
  render: () => (
    <Columns style={fill}>
      <Card title="Parts as functions">
        <WeekStrip
          aria-label="Parts as functions"
          today={TODAY}
          items={thisWeek}
          slotSize="default"
          parts={{
            day: (p) => <DateChip {...p} weekday="narrow" />,
            slot: (p) => <ScheduleSlot {...p} variant="outlined" />,
            placeholder: (p) => <span data-part="placeholder">{p.label}</span>,
          }}
        />
      </Card>
      <Card title="Parts as nodes, and hidden">
        <WeekStrip
          aria-label="Parts as nodes"
          today={TODAY}
          items={thisWeek}
          parts={{ day: <b>Day</b>, placeholder: null }}
        />
        <WeekStrip
          aria-label="Replaced state"
          today={TODAY}
          empty="No items"
          parts={{ state: <p style={{ margin: 0 }}>A state of the app</p> }}
        />
        <WeekStrip
          aria-label="Skeleton part"
          today={TODAY}
          loading
          slotsPerDay={1}
          parts={{ skeleton: <span>…</span> }}
        />
      </Card>
      <Card title="Blocks by hand">
        <WeekStrip.Root aria-label="By hand" initialDate="2026-10-14">
          <WeekStrip.Row week={days[0]!}>
            {days.map((date) => (
              <WeekStrip.Cell key={date} date={date} role="columnheader" today={date === TODAY}>
                <DateChip date={date} weekday="short" today={date === TODAY} todayLabel="" />
              </WeekStrip.Cell>
            ))}
          </WeekStrip.Row>
          <WeekStrip.Row week={days[0]!}>
            {days.map((date, i) => (
              <WeekStrip.Cell key={date} date={date} line={1} today={date === TODAY}>
                <ScheduleSlot fullWidth {...(i % 2 ? kinds.delivery : kinds.planning)}>
                  {i % 2 ? 'Delivery' : 'Planning'}
                </ScheduleSlot>
              </WeekStrip.Cell>
            ))}
          </WeekStrip.Row>
        </WeekStrip.Root>
      </Card>
    </Columns>
  ),
};

/** The first day of the week and every name come from the locale; `weekStartsOn` overrides the first day. */
export const Locales: Story = {
  render: () => (
    <Columns style={fill}>
      {(['en-US', 'en-GB', 'de-DE', 'fr-FR'] as const).map((locale) => (
        <Card key={locale} title={locale}>
          <I18nProvider locale={locale}>
            <WeekStrip aria-label={`Week, ${locale}`} today={TODAY} items={sampleItems('2026-10-10', 9, 2)} />
          </I18nProvider>
        </Card>
      ))}
      <Card title="Starts on Wednesday">
        <WeekStrip aria-label="Week from Wednesday" today={TODAY} items={thisWeek} weekStartsOn={3} />
      </Card>
      <Card title="From a given day">
        <WeekStrip aria-label="Week from the 29th" today={TODAY} startDate="2026-10-29" dayHeader="date" />
      </Card>
    </Columns>
  ),
};

/** Right to left: the first day is on the right, and the arrow keys follow what is drawn. */
export const RightToLeft: Story = { ...Default, tags: [], globals: { direction: 'rtl' } };
