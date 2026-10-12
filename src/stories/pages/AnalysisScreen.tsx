// The analysis page: a row of reports to pick from, a board of chart widgets beside a table of sites,
// and one scale of bands, edited in a modal, that colours all of them. No page header: at the minimum
// window the charts need its height, so the page's own actions are in the bar at the bottom.
import { Download, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BarChart, Heatmap, LineChart, Scatter, sparklineColumn, type ChartAnnotation } from '../../charts';
import {
  ActionBar,
  Button,
  Card,
  ColorScaleEditor,
  Columns,
  DataTable,
  DivergingMeter,
  FormField,
  HorizontalScroller,
  MediaCard,
  Modal,
  numberColumn,
  Page,
  PieIndicator,
  Slider,
  SplitButton,
  Stack,
  StarRating,
  Stepper,
  WidgetBoard,
  type DataTableColumn,
  type SpotlightStep,
  type Threshold,
} from '../../index';
import { FloorPlan } from '../backdrops';
import { Picture } from '../pictures';
import { person } from './data';
import { PageHelp } from './help';

const defaultScale: Threshold[] = [
  { from: 0, tone: 'danger', label: 'Low' },
  { from: 40, tone: 'warning', label: 'Fair' },
  { from: 70, tone: 'success', label: 'Good' },
];

const reports = ['All regions', 'Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5', 'Region 6'].map(
  (title, i) => ({
    id: `report-${i}`,
    title,
    category: i === 0 ? 'Summary' : ['Orders', 'Returns', 'Staffing'][i % 3]!,
    meta: `${4 + ((i * 5) % 9)} sites`,
    hue: 200 + i * 37,
  }),
);

interface Site {
  id: string;
  name: string;
  owner: string;
  /** Twelve weekly scores, 0 to 100. */
  scores: number[];
  /** Capacity in use, 0 to 100. */
  used: number;
  /** Change of the orders on the quarter before, in percent. */
  change: number;
  rating: number;
}

/** The sites of a report: every value is derived from the two indexes, so each report differs and none changes. */
const sitesOf = (report: number): Site[] =>
  Array.from({ length: 12 }, (_, i) => {
    const seed = i + report * 5;
    return {
      id: `site-${i + 1}`,
      name: `Site ${i + 1}`,
      owner: person(seed % 11),
      scores: Array.from({ length: 12 }, (_, w) => 18 + ((seed * 23 + w * w * 5 + w * seed * 3) % 78)),
      used: 12 + ((seed * 37) % 86),
      change: ((seed * 13) % 41) - 20,
      rating: 1.5 + ((seed * 3) % 8) / 2,
    };
  });

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 28}`);
const last = (values: number[]) => values[values.length - 1]!;

const tour: SpotlightStep[] = [
  {
    target: '[data-umbra="horizontal-scroller"]',
    title: 'Pick a report',
    body: 'Every chart and the table follow the report you pick.',
    placement: 'bottom',
  },
  {
    target: '[data-umbra="widget-board"]',
    title: 'A board of widgets',
    body: 'Each widget collapses to its header. The board scrolls inside itself.',
    placement: 'end',
  },
  {
    target: '[data-tour="scale"]',
    title: 'One scale for the page',
    body: 'The bands and their colours are yours to change: every chart and the table follow.',
    placement: 'top end',
  },
];

const tableKeys = [
  {
    title: 'In the table',
    items: [
      { label: 'Move between cells', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] },
      { label: 'Sort by the column', keys: 'Enter' },
    ],
  },
];

export function AnalysisScreen() {
  const [report, setReport] = useState(0);
  const [scale, setScale] = useState<Threshold[]>(defaultScale);
  const [target, setTarget] = useState(60);
  const [top, setTop] = useState(8);
  const [editing, setEditing] = useState(false);
  const [exported, setExported] = useState('Nothing exported yet');

  const sites = useMemo(() => sitesOf(report), [report]);
  const shown = sites.slice(0, top);
  const load = useMemo(
    () => days.map((_, d) => hours.map((_, h) => (report * 11 + d * 29 + h * h * 7 + h * d * 13) % 100)),
    [report],
  );
  const places = useMemo(
    () =>
      ['Team 1', 'Team 2'].map((label, t) => ({
        id: `team-${t + 1}`,
        label,
        data: Array.from({ length: 7 }, (_, i) => ({
          x: 8 + ((report * 7 + t * 31 + i * 23) % 84),
          y: 6 + ((report * 5 + t * 17 + i * 19) % 48),
          size: 4 + ((t * 3 + i * 5) % 14),
          label: `Place ${t * 7 + i + 1}`,
        })),
      })),
    [report],
  );
  // The boundaries of the scale as lines of the line chart, which has no bands of its own.
  const lines: ChartAnnotation[] = [
    ...scale
      .slice(1)
      .map((band): ChartAnnotation => ({ type: 'line', value: band.from, label: band.label ?? '' })),
    { type: 'line', value: target, label: 'Target', color: 'var(--umbra-color-fixed-accent-text)' },
  ];

  const columns = useMemo<DataTableColumn<Site>[]>(
    () => [
      {
        id: 'name',
        header: 'Site',
        accessor: 'name',
        width: { min: 64, flex: 1 },
        priority: 'always',
        rowHeader: true,
        sortable: true,
      },
      { id: 'owner', header: 'Owner', accessor: 'owner', width: 84, priority: 0 },
      sparklineColumn<Site>({
        id: 'trend',
        header: 'Twelve weeks',
        values: (s) => s.scores,
        sparkline: { variant: 'bars', thresholds: scale },
        width: 104,
        priority: 3,
      }),
      numberColumn<Site>({
        id: 'score',
        header: 'Score',
        accessor: (s) => last(s.scores),
        width: 76,
        priority: 'always',
        sortDescFirst: true,
        sortable: true,
      }),
      {
        id: 'used',
        header: 'In use',
        accessor: 'used',
        width: 112,
        priority: 2,
        sortable: true,
        cell: (s) => (
          <PieIndicator
            value={s.used}
            thresholds={scale}
            showValue
            layout="inline"
            size="small"
            aria-label="Capacity in use"
          />
        ),
      },
      {
        id: 'change',
        header: 'Change',
        accessor: 'change',
        width: 116,
        priority: 1,
        sortable: true,
        cell: (s) => (
          <DivergingMeter
            value={s.change}
            min={-20}
            max={20}
            layout="inline"
            size="thin"
            showValue
            aria-label="Change on the quarter before"
            formatValue={(v) => `${v > 0 ? '+' : ''}${v}%`}
          />
        ),
      },
      {
        id: 'rating',
        header: 'Rating',
        accessor: 'rating',
        // Five small stars (75px) and the padding of a last cell at the spacious density.
        width: 108,
        priority: 0,
        cell: (s) => <StarRating readOnly size="small" value={s.rating} aria-label="Rating" />,
      },
    ],
    [scale],
  );

  return (
    <Page
      footer={
        <ActionBar
          aria-label="Report"
          status={exported}
          secondary={
            <>
              <span data-tour="scale" style={{ display: 'inline-flex' }}>
                <Button
                  iconStart={<SlidersHorizontal />}
                  shortcut="analysis.scale"
                  onPress={() => setEditing(true)}
                >
                  Scale
                </Button>
              </span>
              <PageHelp steps={tour} keys={tableKeys} />
            </>
          }
          primary={
            <SplitButton
              variant="accent"
              iconStart={<Download />}
              shortcut="analysis.export"
              onPress={() => setExported(`Exported ${reports[report]!.title} as PDF`)}
              menuLabel="More ways to export"
              items={[
                { id: 'CSV', label: 'Export as CSV' },
                { id: 'image', label: 'Export the charts as images' },
              ]}
              onAction={(id) => setExported(`Exported ${reports[report]!.title} as ${id}`)}
            >
              Export
            </SplitButton>
          }
        />
      }
    >
      <Stack>
        <HorizontalScroller size="content" aria-label="Reports" itemWidth={264} snap>
          {reports.map((r, i) => (
            <MediaCard
              key={r.id}
              image={<Picture hue={r.hue} />}
              title={r.title}
              headingLevel={2}
              // The report on the page says so in words: a card has no selected state of its own.
              category={i === report ? 'Shown' : r.category}
              meta={r.meta}
              onPress={() => setReport(i)}
            />
          ))}
        </HorizontalScroller>
        <Columns>
          <WidgetBoard size={3} label="Charts" aria-label="Charts" minColumnWidth={300}>
            <WidgetBoard.Widget id="load" title="Load by day and hour">
              <Heatmap
                aria-label="Load by day and hour"
                height={170}
                rows={days}
                columns={hours}
                values={load}
                thresholds={scale}
                valueDomain={[0, 100]}
                formatValue={(v) => `${v}%`}
              />
            </WidgetBoard.Widget>
            <WidgetBoard.Widget id="score" title="Score by site">
              <BarChart
                aria-label="Score by site"
                height={200}
                categories={shown.map((s) => s.name.replace('Site ', 'S'))}
                series={[{ id: 'score', label: 'Score', values: shown.map((s) => last(s.scores)) }]}
                thresholds={scale}
                valueDomain={[0, 100]}
                annotations={[{ type: 'line', value: target, label: 'Target' }]}
              />
            </WidgetBoard.Widget>
            <WidgetBoard.Widget id="places" title="Orders by place">
              <Scatter
                aria-label="Orders by place on the floor plan"
                height={200}
                series={places}
                xDomain={[0, 100]}
                yDomain={[0, 60]}
                axes={false}
                sizeLabel="Orders"
                parts={{ backdrop: <FloorPlan /> }}
              />
            </WidgetBoard.Widget>
            <WidgetBoard.Widget id="weeks" title="Score over twelve weeks">
              <LineChart
                aria-label="Score over twelve weeks"
                height={200}
                categories={weeks}
                yDomain={[0, 100]}
                series={sites.slice(0, 2).map((s) => ({
                  id: s.id,
                  label: s.name,
                  data: s.scores.map((y, w) => ({ x: weeks[w]!, y })),
                }))}
                annotations={lines}
              />
            </WidgetBoard.Widget>
          </WidgetBoard>
          <Card title="Sites" label="Sites" size={2} padding="none">
            <DataTable
              aria-label="Sites"
              data={sites}
              getRowId={(s) => s.id}
              columns={columns}
              striped
              defaultSort={[{ id: 'score', direction: 'desc' }]}
            />
          </Card>
        </Columns>
      </Stack>
      <Modal
        open={editing}
        onOpenChange={setEditing}
        size="md"
        title="Scale"
        description="The bands every chart and the table are coloured by."
        footer={
          <ActionBar
            aria-label="Scale"
            secondary={{ label: 'Reset', onPress: () => setScale(defaultScale) }}
            primary={{ label: 'Done', variant: 'accent', onPress: () => setEditing(false) }}
          />
        }
      >
        <FormField label="Bands" layout="stacked">
          <ColorScaleEditor
            value={scale}
            onChange={setScale}
            defaultValue={defaultScale}
            min={0}
            max={100}
            step={5}
            maxStops={5}
          />
        </FormField>
        <FormField label="Target" description="A line on the score charts.">
          <Slider
            value={target}
            onChange={setTarget}
            min={0}
            max={100}
            step={5}
            showValue
            thresholds={scale}
          />
        </FormField>
        <FormField label="Sites in the bar chart">
          <Stepper value={top} onChange={setTop} min={4} max={12} step={2} />
        </FormField>
      </Modal>
    </Page>
  );
}
