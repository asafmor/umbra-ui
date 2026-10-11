import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Select } from '../inputs/Select';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { ProgressBar } from '../meters/ProgressBar';
import { Log } from '../stories/placeholders';
import { DateChip } from './DateChip';
import { daysBetween, addDays } from './dates';
import { Planner, type PlannerWeek } from './Planner';
import { kinds, october, TODAY } from './samples';
import { ScheduleSlot, type ScheduleItem } from './ScheduleSlot';

const meta = {
  title: 'Time/Planner',
  component: Planner,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Planner>;
export default meta;
type Story = StoryObj<typeof meta>;

const focuses = ['Balanced', 'Deliveries first', 'Planning first'].map((label) => ({ id: label, label }));

/** The app's own side column: a setting of the week, how full it is, and copy, paste and clear. */
function WeekControls({
  week,
  slotsPerDay,
  copied,
  onCopy,
  onPaste,
  onClear,
}: {
  week: PlannerWeek;
  slotsPerDay: number;
  copied: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
}) {
  const [focus, setFocus] = useState('Balanced');
  return (
    <>
      <Select
        aria-label="Focus of the week"
        size="small"
        fullWidth
        options={focuses}
        value={focus}
        onChange={setFocus}
      />
      <ProgressBar
        label="Load"
        value={Math.round((week.items.length / (slotsPerDay * 7)) * 100)}
        size="thin"
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <Button size="small" onPress={onCopy}>
          Copy
        </Button>
        <Button size="small" disabled={!copied} onPress={onPaste}>
          Paste
        </Button>
        <Button size="small" onPress={onClear}>
          Clear
        </Button>
      </div>
    </>
  );
}

function Schedule({
  initial = october,
  ...props
}: Partial<React.ComponentProps<typeof Planner>> & { initial?: ScheduleItem[] }) {
  const [items, setItems] = useState(initial);
  const [copied, setCopied] = useState<{ start: string; items: ScheduleItem[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState('Nothing pressed');
  const inWeek = (week: PlannerWeek) => (item: ScheduleItem) =>
    item.date >= week.start && item.date <= week.end;
  return (
    <Card
      title="Schedule"
      parts={{
        footer: (
          <Card.Footer>
            <Log>
              {log} · selected {selected ?? 'none'}
            </Log>
          </Card.Footer>
        ),
      }}
    >
      <Planner
        aria-label="Schedule"
        today={TODAY}
        items={items}
        selectedDate={selected}
        onSelectedDateChange={setSelected}
        onAction={(id) => setLog(`Item ${id}`)}
        onDayAction={(date) => setLog(`Day ${date}`)}
        onMonthChange={(month) => setLog(`Month ${month}`)}
        renderWeek={(week) => (
          <WeekControls
            week={week}
            slotsPerDay={3}
            copied={!!copied}
            onCopy={() => {
              setCopied({ start: week.start, items: week.items });
              setLog(`Copied ${week.start}`);
            }}
            onPaste={() => {
              if (!copied) return;
              const by = daysBetween(copied.start, week.start);
              setItems((all) => [
                ...all.filter((item) => !inWeek(week)(item)),
                ...copied.items.map((item) => {
                  const date = addDays(item.date, by);
                  return { ...item, date, id: `${date}-${item.slot}` };
                }),
              ]);
              setLog(`Pasted into ${week.start}`);
            }}
            onClear={() => {
              setItems((all) => all.filter((item) => !inWeek(week)(item)));
              setLog(`Cleared ${week.start}`);
            }}
          />
        )}
        {...props}
      />
    </Card>
  );
}

const page = (children: React.ReactNode) => <Columns style={{ height: '100%' }}>{children}</Columns>;

/**
 * A month in a card: three slots a day, a week without items, and the app's controls beside each week
 * (its buttons copy, paste and clear a week: the planner has no clipboard of its own).
 */
export const Default: Story = { tags: ['tints', 'narrow'], render: () => page(<Schedule />) };

/** While loading: the days are known, the slots are placeholders. */
export const Loading: Story = { render: () => page(<Schedule loading />) };

/** The text the app gives for a month without items takes the place of the weeks; the toolbar stays. */
export const Empty: Story = {
  render: () =>
    page(<Schedule initial={[]} empty={{ title: 'Nothing planned', description: 'Pick a day to start.' }} />),
};

/** Without `empty`, a month without items keeps its weeks, each with the line of an empty week. */
export const EmptyWeeks: Story = { render: () => page(<Schedule initial={[]} />) };

/** A failed load, with a retry. */
export const ErrorState: Story = {
  name: 'Error',
  render: function Render() {
    const [failed, setFailed] = useState(true);
    return page(<Schedule error={failed || undefined} onRetry={() => setFailed(false)} />);
  },
};

/** No side column, a month title in place of the list, two slots a day, and a first and last month. */
export const Plain: Story = {
  render: () =>
    page(
      <Card title="Plain">
        <Planner
          aria-label="Plain schedule"
          today={TODAY}
          items={october.filter((item) => (item.slot ?? 0) < 2)}
          slotsPerDay={2}
          weekStartsOn={1}
          minMonth="2026-09"
          maxMonth="2026-11"
          defaultSelectedDate="2026-10-16"
          parts={{ toolbar: (p) => <Planner.Toolbar {...p} monthSelect={false} /> }}
        />
      </Card>,
    ),
};

/**
 * The steps as the planner narrows: the labels end in an ellipsis, then the slots show their icons
 * only, then the side column becomes a button that opens its content.
 */
export const Shrinking: Story = {
  render: () => (
    <>
      <div style={{ display: 'flex', gap: 12, height: '100%', minHeight: 0 }}>
        {[620, 440].map((width) => (
          // The widths named, and less in a window too narrow for both: nothing is cut.
          <div
            key={width}
            data-width={width}
            style={{ display: 'flex', flex: '0 1 auto', width, minWidth: 0, minHeight: 0 }}
          >
            <Schedule />
          </div>
        ))}
      </div>
    </>
  ),
};

const views = ['data', 'empty', 'error'] as const;
const crowded: ScheduleItem[] = [
  ...october,
  { id: 'extra-1', date: TODAY, ...kinds.review },
  { id: 'extra-2', date: TODAY, ...kinds.upkeep },
  { id: 'extra-3', date: TODAY, ...kinds.workshop, disabled: true },
];

/**
 * A planner whose state changes while it is in use (the buttons in the footer stand for the app), with
 * a day that has more items than slots (its "+N" opens them), the line of an empty week hidden, and a
 * month and limits that are not months, which fall back with a warning in development.
 */
export const Changes: Story = {
  render: function Render() {
    const [view, setView] = useState<(typeof views)[number]>('data');
    const [log, setLog] = useState('Nothing pressed');
    return page(
      <Card
        title="Changing"
        parts={{
          footer: (
            <Card.Footer>
              {views.map((name) => (
                <Button key={name} size="small" onPress={() => setView(name)}>
                  {`Show ${name}`}
                </Button>
              ))}
              <Log>{log}</Log>
            </Card.Footer>
          ),
        }}
      >
        <Planner
          aria-label="Changing"
          today={TODAY}
          month="soon"
          minMonth="never"
          maxMonth="2026-13"
          items={view === 'empty' ? [] : crowded}
          empty={view === 'empty' ? 'Nothing planned' : undefined}
          error={view === 'error' || undefined}
          onRetry={() => setView('data')}
          onAction={(id) => setLog(`Item ${id}`)}
          onDayAction={(date) => setLog(`Day ${date}`)}
          renderWeek={(week) => <Button size="small">{`Copy ${week.index + 1}`}</Button>}
          weekAsideWidth={96}
          parts={{ weekEmpty: null }}
        />
      </Card>,
    );
  },
};

/** Each kind of part: a toolbar of the app, no weekday names, and chips and slots drawn by functions. */
export const Parts: Story = {
  render: () =>
    page(
      <>
        <Card title="Replaced and hidden">
          <Planner
            aria-label="Parts as nodes"
            today={TODAY}
            items={october}
            parts={{
              toolbar: <b data-part="toolbar">October, by the app</b>,
              weekdays: null,
              weekEmpty: <i>A quiet week</i>,
              placeholder: null,
            }}
          />
        </Card>
        <Card title="Functions">
          <Planner
            aria-label="Parts as functions"
            today={TODAY}
            items={october}
            parts={{
              toolbar: (p) => (
                <Planner.Toolbar {...p} todayLabel="This month" actions={<Button>Export</Button>} />
              ),
              day: (p) => <DateChip {...p} weekday="narrow" />,
              slot: (p) => <ScheduleSlot {...p} variant="outlined" />,
              weekEmpty: (p) => (
                <span>
                  {p.children} from {p.week.start}
                </span>
              ),
            }}
          />
        </Card>
      </>,
    ),
};

const byHand = ['2026-10-11', '2026-10-18'];

/** Composed from the blocks: the toolbar and the data grid, and a grid drawn cell by cell. */
export const Blocks: Story = {
  render: () =>
    page(
      <>
        <Card title="Root, toolbar and grid">
          <Planner.Root aria-label="From blocks" today={TODAY} defaultMonth="2026-10">
            <Planner.Grid items={october} slotsPerDay={2} emptyWeekLabel="Nothing this week" />
            <Planner.Toolbar monthSelect={false} />
          </Planner.Root>
        </Card>
        <Card title="Cells by hand">
          <div role="grid" aria-label="Two weeks by hand">
            {byHand.map((week) => (
              <div
                key={week}
                role="rowgroup"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
              >
                {[0, 1].map((line) => (
                  <Planner.Row key={line} week={week}>
                    {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((date) => (
                      <Planner.Cell key={date} date={date} line={line} today={date === TODAY}>
                        {line === 0 ? (
                          <DateChip date={date} today={date === TODAY} todayLabel="" />
                        ) : (
                          <ScheduleSlot fullWidth {...kinds.planning}>
                            Planning
                          </ScheduleSlot>
                        )}
                      </Planner.Cell>
                    ))}
                  </Planner.Row>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </>,
    ),
};

/** `height="content"`: as tall as its weeks, in a card whose body scrolls. A number is a height in pixels. */
export const Heights: Story = {
  render: () =>
    page(
      <>
        <Card title="Content height">
          <Planner
            aria-label="Content height"
            today={TODAY}
            items={october}
            height="content"
            slotsPerDay={1}
          />
          <Log>After the planner</Log>
        </Card>
        <Card title="300 pixels">
          <Planner aria-label="Fixed height" today={TODAY} items={october} height={300} />
          <Log>After the planner</Log>
        </Card>
      </>,
    ),
};

/** Right to left: the week runs from the right, the side column is on the right, and the arrows follow. */
export const RightToLeft: Story = { ...Default, tags: [], globals: { direction: 'rtl' } };
