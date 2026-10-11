// The planning page: a month of slots as the main card, with the settings of each week beside it, a
// row of figures above it, and the week, a comparison and the team in a stack at the side.
import { CalendarRange, ClipboardCheck, Copy, Gauge, Truck } from 'lucide-react';
import { useState } from 'react';
import { Sparkline } from '../../charts';
import {
  Avatar,
  Button,
  Card,
  Columns,
  Comparison,
  EntityIcon,
  List,
  Page,
  PageHeader,
  Planner,
  Select,
  SequenceDots,
  Slider,
  Stack,
  StarRating,
  SummaryTile,
  TrendArrow,
  WeekStrip,
  type PlannerWeek,
  type ScheduleItem,
  type SequenceDotsItem,
  type SpotlightStep,
  type Tone,
} from '../../index';
import { useNarrow } from '../../internal/useNarrow';
import { sampleItems } from '../../time/samples';
import { person } from './data';
import { PageHelp } from './help';

/** The day the page is drawn on: the Saturday the context block of the bar shows. */
export const TODAY = '2026-10-10';
const SLOTS = 3;

export const teams = Array.from({ length: 6 }, (_, i) => ({
  id: `team-${i + 1}`,
  label: `Team ${i + 1}`,
  description: `Region ${(i % 3) + 1} · ${6 + ((i * 5) % 7)} people`,
  group: `Region ${(i % 3) + 1}`,
}));

// September to November 2026, with one week left without items.
const schedule = sampleItems('2026-08-30', 98, SLOTS, (date) => date >= '2026-10-25' && date <= '2026-10-31');

const focuses = ['Balanced', 'Deliveries first', 'Reviews first'].map((label) => ({ id: label, label }));

const run = (seed: number, length = 12) =>
  Array.from({ length }, (_, i) => 30 + ((seed * 17 + i * i * 7 + i * seed * 3) % 60));

const outcomes: [tone: Tone, label: string][] = [
  ['success', 'On time'],
  ['success', 'On time'],
  ['warning', 'Late'],
  ['success', 'On time'],
  ['danger', 'Missed'],
];
const lastFive = (seed: number): SequenceDotsItem[] =>
  Array.from({ length: 5 }, (_, i) => {
    const [tone, label] = outcomes[(seed * 3 + i * 2) % outcomes.length]!;
    return { id: String(i), tone, label };
  });
const people = Array.from({ length: 8 }, (_, i) => ({
  id: `person-${i}`,
  name: person(i),
  role: ['Planner', 'Driver', 'Reviewer', 'Analyst'][i % 4]!,
  rating: 2.5 + ((i * 3) % 6) / 2,
  last: lastFive(i),
}));

const tour: SpotlightStep[] = [
  {
    target: '[data-umbra="planner"] [data-part="toolbar"]',
    title: 'Move between months',
    body: 'Pick a month, step to the next one, or come back to today.',
    placement: 'bottom start',
  },
  {
    target: '[data-umbra="planner"] [data-part="weekAside"]',
    title: 'Settings of a week',
    body: 'Each week has its own focus and intensity, and can be copied or cleared.',
  },
  {
    target: '[data-tour="week"]',
    title: 'The week at a glance',
    body: 'The week of the day you select in the month.',
    placement: 'start',
  },
  {
    target: '[data-umbra="entity-switcher"]',
    title: 'Another team',
    body: 'Step to the next team, or search for one.',
    placement: 'bottom start',
  },
];

interface WeekSettings {
  focus: string;
  intensity: number;
}

export function PlanningScreen({ team }: { team: string }) {
  const [items, setItems] = useState<ScheduleItem[]>(schedule);
  const [selected, setSelected] = useState<string | null>(TODAY);
  const [settings, setSettings] = useState<Record<string, WeekSettings>>({});
  const [copied, setCopied] = useState(false);
  // Below the minimum window the month needs the height of the figures. The hook is the library's own,
  // not exported: an app hides such a row with `[data-narrow]` in its CSS.
  const narrow = useNarrow();
  const inWeek = (week: PlannerWeek) => (item: ScheduleItem) =>
    item.date >= week.start && item.date <= week.end;
  const count = (label: string) => items.filter((item) => item.label === label).length;

  const weekControls = (week: PlannerWeek) => {
    const { focus, intensity } = settings[week.start] ?? { focus: 'Balanced', intensity: 60 };
    const set = (change: Partial<WeekSettings>) =>
      setSettings((all) => ({ ...all, [week.start]: { focus, intensity, ...change } }));
    return (
      <>
        <Select
          aria-label="Focus of the week"
          size="small"
          fullWidth
          options={focuses}
          value={focus}
          onChange={(id) => id && set({ focus: id })}
        />
        <Slider
          aria-label="Intensity of the week"
          size="small"
          showValue
          formatValue={(value) => `${value}%`}
          thresholds={[
            { from: 0, tone: 'info', label: 'Light' },
            { from: 50, tone: 'success', label: 'Normal' },
            { from: 80, tone: 'warning', label: 'Heavy' },
          ]}
          step={5}
          value={intensity}
          onChange={(value) => set({ intensity: value })}
          style={{ width: '100%' }}
        />
        <Button
          size="small"
          disabled={week.items.length === 0}
          onPress={() => setItems((all) => all.filter((item) => !inWeek(week)(item)))}
        >
          Clear
        </Button>
      </>
    );
  };

  return (
    <Page
      header={
        <PageHeader
          headingLevel={1}
          media={<EntityIcon name="Schedule" icon={<CalendarRange />} />}
          overline={teams.find((t) => t.id === team)?.label}
          title="Schedule"
          meta={[
            { label: 'Planned', value: items.length },
            { label: 'People', value: people.length },
          ]}
          actions={<PageHelp steps={tour} keys={plannerKeys} />}
        />
      }
    >
      <Columns>
        <Stack size={3.4} label="Schedule">
          {!narrow && (
            <Columns size="content">
              <SummaryTile
                icon={<Truck />}
                title="Deliveries"
                value={count('Delivery')}
                trend={<TrendArrow direction="up" positive="up" value="8%" />}
                caption={
                  <Sparkline data={run(1)} variant="area" lastPoint aria-label="Deliveries, 12 weeks" />
                }
              />
              <SummaryTile
                icon={<ClipboardCheck />}
                title="Reviews"
                value={count('Quarterly review')}
                trend={<TrendArrow direction="down" positive="up" value="3%" />}
                caption={
                  <Sparkline data={run(4)} variant="bars" tone="info" aria-label="Reviews, 12 weeks" />
                }
              />
              <SummaryTile
                icon={<Gauge />}
                title="Load"
                value="74%"
                trend={<TrendArrow direction="up" positive="down" value="6%" />}
                caption={
                  <Sparkline
                    data={run(7)}
                    reference={70}
                    tone="warning"
                    lastPoint
                    aria-label="Load, 12 weeks"
                  />
                }
              />
            </Columns>
          )}
          <Card title="Month" minHeight={240}>
            <Planner
              aria-label="Schedule"
              today={TODAY}
              items={items}
              slotsPerDay={SLOTS}
              weekStartsOn={1}
              minMonth="2026-09"
              maxMonth="2026-11"
              selectedDate={selected}
              onSelectedDateChange={setSelected}
              renderWeek={weekControls}
              emptyWeekLabel="Nothing planned this week"
              parts={{
                toolbar: (p) => (
                  <Planner.Toolbar
                    {...p}
                    actions={
                      <Button
                        size="small"
                        iconStart={<Copy />}
                        shortcut="planning.copy"
                        onPress={() => setCopied(true)}
                      >
                        {copied ? 'Copied' : 'Copy month'}
                      </Button>
                    }
                  />
                ),
              }}
            />
          </Card>
        </Stack>
        <Stack size={1.5} label="Week">
          <Card title="Week" tone="neutral" size={0.8} priority={2} minHeight={160} data-tour="week">
            <WeekStrip
              aria-label="Week of the selected day"
              date={selected ?? TODAY}
              today={TODAY}
              weekStartsOn={1}
              items={items}
              slotsPerDay={SLOTS}
              slotSize="small"
              selectedDate={selected}
              onSelectedDateChange={setSelected}
            />
          </Card>
          <Card title="Sites" tone="neutral" priority={1} minHeight={190}>
            <Comparison
              aria-label="Site A and Site B"
              sides={[{ name: 'Site A' }, { name: 'Site B' }]}
              showBars
              highlightLeader
              rows={[
                { id: 'score', label: 'Score', values: [82, 76] },
                { id: 'time', label: 'On time', values: [91, 84], formatValue: (v) => `${v}%` },
                { id: 'returns', label: 'Returns', values: [4, 9], lowerIsBetter: true },
              ]}
            />
          </Card>
          <Card title="Team" tone="neutral" padding="none" size={1.4} priority={0} minHeight={100}>
            <List aria-label="Team" itemSize="compact" striped>
              {people.map((p) => (
                <List.Item
                  key={p.id}
                  id={p.id}
                  leading={<Avatar size="sm" name={p.name} alt="" />}
                  title={p.name}
                  description={p.role}
                  meta={<SequenceDots size="sm" aria-label="Last five deliveries" items={p.last} />}
                  trailing={<StarRating readOnly size="small" value={p.rating} aria-label="Rating" />}
                />
              ))}
            </List>
          </Card>
        </Stack>
      </Columns>
    </Page>
  );
}

const plannerKeys = [
  {
    title: 'In the month',
    items: [
      { label: 'Move between days and slots', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] },
      { label: 'Previous and next month', keys: ['PageUp', 'PageDown'] },
      { label: 'Select the day or open the slot', keys: 'Enter' },
    ],
  },
];
