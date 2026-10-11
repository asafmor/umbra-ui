// Every exported component once, each with a `data-*` and an `aria-*` attribute the library knows
// nothing about: both must arrive on the component's root element (src/utils/passThrough.ts).
// Checked in tests/visual/root-attributes.spec.ts; the list of names is in rootAttributeNames.ts.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Skeleton } from '../basics/Skeleton';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { Heatmap } from '../charts/Heatmap';
import { LineChart } from '../charts/LineChart';
import { RadarChart } from '../charts/RadarChart';
import { Scatter } from '../charts/Scatter';
import { Sparkline } from '../charts/Sparkline';
import { Avatar, AvatarGroup } from '../data/Avatar';
import { Badge } from '../data/Badge';
import { Banner } from '../data/Banner';
import { Comparison } from '../data/Comparison';
import { EmptyState } from '../data/EmptyState';
import { EntityIcon } from '../data/EntityIcon';
import { GroupHeader } from '../data/GroupHeader';
import { KeyValue, KeyValueList } from '../data/KeyValue';
import { Legend } from '../data/Legend';
import { Link } from '../data/Link';
import { List } from '../data/List';
import { ListItem } from '../data/ListItem';
import { MediaCard } from '../data/MediaCard';
import { SequenceDots } from '../data/SequenceDots';
import { StatusIndicator } from '../data/StatusIndicator';
import { StatValue } from '../data/StatValue';
import { SummaryTile } from '../data/SummaryTile';
import { Tag } from '../data/Tag';
import { TrendArrow } from '../data/TrendArrow';
import { ValuePill } from '../data/ValuePill';
import { Checkbox, CheckboxGroup } from '../inputs/Checkbox';
import { ColorScaleEditor } from '../inputs/ColorScaleEditor';
import { FormField } from '../inputs/FormField';
import { Radio, RadioGroup } from '../inputs/Radio';
import { SearchField } from '../inputs/SearchField';
import { SegmentedFilter } from '../inputs/SegmentedFilter';
import { Select } from '../inputs/Select';
import { Slider } from '../inputs/Slider';
import { SplitButton } from '../inputs/SplitButton';
import { StarRating } from '../inputs/StarRating';
import { Stepper } from '../inputs/Stepper';
import { Tabs } from '../inputs/Tabs';
import { TextField } from '../inputs/TextField';
import { Toggle } from '../inputs/Toggle';
import { Accordion } from '../layout/Accordion';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { HorizontalScroller } from '../layout/HorizontalScroller';
import { Page } from '../layout/Page';
import { ScrollArea } from '../layout/ScrollArea';
import { SectionTitle } from '../layout/SectionTitle';
import { Slot } from '../layout/Slot';
import { Stack } from '../layout/Stack';
import { WidgetBoard } from '../layout/WidgetBoard';
import { DivergingMeter } from '../meters/DivergingMeter';
import { LevelMeter } from '../meters/LevelMeter';
import { PieIndicator } from '../meters/PieIndicator';
import { ProgressBar } from '../meters/ProgressBar';
import { ActionBar } from '../overlays/ActionBar';
import { CommandPalette } from '../overlays/CommandPalette';
import { Menu } from '../overlays/Menu';
import { ConfirmDialog, Modal } from '../overlays/Modal';
import { Popover } from '../overlays/Popover';
import { ShortcutsSheet } from '../overlays/ShortcutsSheet';
import { Spotlight } from '../overlays/Spotlight';
import { Tooltip } from '../overlays/Tooltip';
import { Icon } from '../provider/icons';
import { UmbraProvider, UmbraScope } from '../provider/UmbraProvider';
import { AppShell } from '../shell/AppShell';
import { ContextBlock } from '../shell/ContextBlock';
import { EntitySwitcher } from '../shell/EntitySwitcher';
import { HistoryButtons } from '../shell/HistoryButtons';
import { PageHeader } from '../shell/PageHeader';
import { PrimaryAction } from '../shell/PrimaryAction';
import { PrimaryNav } from '../shell/PrimaryNav';
import { ShortcutBar } from '../shell/ShortcutBar';
import { SubNav } from '../shell/SubNav';
import { TopBar } from '../shell/TopBar';
import { VerticalNav } from '../shell/VerticalNav';
import { DataTable } from '../table/DataTable';
import { DateChip } from '../time/DateChip';
import { Planner } from '../time/Planner';
import { october, thisWeek, TODAY } from '../time/samples';
import { ScheduleSlot } from '../time/ScheduleSlot';
import { WeekStrip } from '../time/WeekStrip';
import { names } from './rootAttributeNames';

const meta = { title: 'Integration/Root attributes' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** What every component is given: neither attribute is one a component knows. */
const t = (name: string) => ({ 'data-test-root': name, 'aria-description': 'x' });

const grid: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' };

/** A box of a fixed size, for the components that fill their slot. */
function Box({ width = 260, height, children }: { width?: number; height?: number; children: ReactNode }) {
  return <div style={{ width, height, display: 'flex', flexDirection: 'column' }}>{children}</div>;
}

const rows = [
  { id: 'a', name: 'Item A', value: 12 },
  { id: 'b', name: 'Item B', value: 7 },
];
const series = [{ id: 's1', label: 'Series 1', values: [3, 5, 4] }];

function Everything() {
  // One overlay at a time: `&open=Modal` in the address opens it.
  const open = new URLSearchParams(window.location.search).get('open');
  const anchor = useRef<HTMLDivElement>(null);
  const is = (name: string) => open === name;
  return (
    <AppShell
      {...t('AppShell')}
      topBar={
        <TopBar
          {...t('TopBar')}
          nav={
            <PrimaryNav
              {...t('PrimaryNav')}
              value="one"
              items={[
                { id: 'one', label: 'One', href: '#one' },
                { id: 'two', label: 'Two', href: '#two' },
              ]}
            />
          }
          history={<HistoryButtons {...t('HistoryButtons')} canGoBack onBack={() => {}} />}
          context={<ContextBlock {...t('ContextBlock')} primary="Context" secondary="Detail" />}
          primaryAction={<PrimaryAction {...t('PrimaryAction')} label="Continue" onPress={() => {}} />}
        />
      }
      subNav={
        <SubNav
          {...t('SubNav')}
          label="Section"
          value="a"
          start={
            <EntitySwitcher
              {...t('EntitySwitcher')}
              value="e1"
              items={[
                { id: 'e1', label: 'Entity 1' },
                { id: 'e2', label: 'Entity 2' },
              ]}
            />
          }
          items={[
            { id: 'a', label: 'Page A', href: '#a' },
            { id: 'b', label: 'Page B', href: '#b' },
          ]}
          end={
            <ShortcutBar
              {...t('ShortcutBar')}
              items={[{ id: 'k1', label: 'Shortcut', href: '#k1', icon: <Icon name="search" /> }]}
            />
          }
        />
      }
    >
      <Page {...t('Page')}>
        <Columns {...t('Columns')}>
          <VerticalNav
            {...t('VerticalNav')}
            size="content"
            value="v1"
            items={[
              { id: 'v1', label: 'First', href: '#v1' },
              { id: 'v2', label: 'Second', href: '#v2' },
            ]}
          />
          <Stack {...t('Stack')}>
            <PageHeader {...t('PageHeader')} title="Root attributes" />
            <Card {...t('Card')} id="root-id-card" title={`${names.length} components`}>
              <div style={grid} ref={anchor}>
                <Box height={40}>
                  <Slot {...t('Slot')}>Slot</Slot>
                </Box>
                <SectionTitle {...t('SectionTitle')}>Section</SectionTitle>
                <Box height={60}>
                  <ScrollArea {...t('ScrollArea')}>Scroll area</ScrollArea>
                </Box>
                <Box>
                  <Accordion
                    {...t('Accordion')}
                    items={[{ id: 'one', title: 'Section one', content: 'Content' }]}
                  />
                </Box>
                <Box width={420}>
                  <WidgetBoard {...t('WidgetBoard')} aria-label="Widgets">
                    <WidgetBoard.Widget id="w1" title="Widget">
                      Content
                    </WidgetBoard.Widget>
                  </WidgetBoard>
                </Box>
                <Box width={320} height={80}>
                  <HorizontalScroller {...t('HorizontalScroller')} itemWidth={120}>
                    <div>One</div>
                    <div>Two</div>
                    <div>Three</div>
                  </HorizontalScroller>
                </Box>
                <UmbraProvider {...t('UmbraProvider')}>
                  <Tag>In a provider</Tag>
                </UmbraProvider>
                <UmbraScope {...t('UmbraScope')} density="compact">
                  <Tag>In a scope</Tag>
                </UmbraScope>

                <Button {...t('Button')} id="root-id-button">
                  Button
                </Button>
                <IconButton {...t('IconButton')} icon={<Icon name="search" />} label="Find" />
                <Box width={120}>
                  <Skeleton {...t('Skeleton')} />
                </Box>
                <Box>
                  <Banner {...t('Banner')} title="Banner">
                    A message.
                  </Banner>
                </Box>
                <Legend {...t('Legend')} items={[{ id: 'l1', label: 'Series 1' }]} />
                <Box height={120}>
                  <EmptyState {...t('EmptyState')} title="Nothing here" />
                </Box>
                <Box>
                  <GroupHeader {...t('GroupHeader')} title="Group" count={2} />
                </Box>
                <Box>
                  <ListItem {...t('ListItem')} title="List item" description="A row" />
                </Box>
                <Box height={90}>
                  <List
                    {...t('List')}
                    aria-label="Items"
                    items={rows}
                    renderItem={(row) => <List.Item key={row.id} id={row.id} title={row.name} />}
                  />
                </Box>
                <Avatar {...t('Avatar')} name="Person A" />
                <AvatarGroup {...t('AvatarGroup')} aria-label="People">
                  <Avatar name="Person B" />
                  <Avatar name="Person C" />
                </AvatarGroup>
                <EntityIcon {...t('EntityIcon')} name="Entity" />
                <KeyValue {...t('KeyValue')} label="Key" value="Value" />
                <Box>
                  <KeyValueList {...t('KeyValueList')} items={[{ label: 'Key', value: 'Value' }]} />
                </Box>
                <StatValue {...t('StatValue')} label="Stat" value="42" />
                <Box width={160} height={80}>
                  <SummaryTile {...t('SummaryTile')} label="Tile" value="7" />
                </Box>
                <Tag {...t('Tag')}>Tag</Tag>
                <Badge {...t('Badge')} count={3} />
                <ValuePill {...t('ValuePill')} value={72} />
                <TrendArrow {...t('TrendArrow')} direction="up" label="Up" />
                <StatusIndicator {...t('StatusIndicator')} status="success">
                  Ready
                </StatusIndicator>
                <Link {...t('Link')} href="#link">
                  Link
                </Link>
                <SequenceDots
                  {...t('SequenceDots')}
                  items={[
                    { id: 'r1', label: 'Run 1: success', tone: 'success' },
                    { id: 'r2', label: 'Run 2: danger', tone: 'danger' },
                  ]}
                />
                <Box width={220}>
                  <MediaCard {...t('MediaCard')} title="Media card" description="A short text." />
                </Box>
                <Box width={320}>
                  <Comparison
                    {...t('Comparison')}
                    aria-label="Site A and Site B"
                    sides={[{ name: 'Site A' }, { name: 'Site B' }]}
                    rows={[{ id: 'score', label: 'Score', values: [82, 76] }]}
                  />
                </Box>

                <Box width={160}>
                  <ProgressBar {...t('ProgressBar')} value={40} label="Progress" />
                </Box>
                <Box width={160}>
                  <LevelMeter {...t('LevelMeter')} value={60} label="Level" />
                </Box>
                <PieIndicator {...t('PieIndicator')} value={50} label="Share" />
                <Box width={160}>
                  <DivergingMeter {...t('DivergingMeter')} value={20} label="Change" />
                </Box>

                <Checkbox {...t('Checkbox')}>Checkbox</Checkbox>
                <CheckboxGroup {...t('CheckboxGroup')} label="Checkbox group">
                  <Checkbox value="a">A</Checkbox>
                </CheckboxGroup>
                <RadioGroup {...t('RadioGroup')} label="Radio group" defaultValue="a">
                  <Radio {...t('Radio')} value="a">
                    A
                  </Radio>
                  <Radio value="b">B</Radio>
                </RadioGroup>
                <Toggle {...t('Toggle')}>Toggle</Toggle>
                <Box>
                  <FormField {...t('FormField')} label="Form field">
                    <TextField />
                  </FormField>
                </Box>
                <Box width={160}>
                  <TextField {...t('TextField')} aria-label="Text" />
                </Box>
                <Box width={180}>
                  <SearchField {...t('SearchField')} aria-label="Search items" />
                </Box>
                <Box width={160}>
                  <Select
                    {...t('Select')}
                    aria-label="Choice"
                    options={[
                      { id: 'o1', label: 'Option 1' },
                      { id: 'o2', label: 'Option 2' },
                    ]}
                  />
                </Box>
                <SegmentedFilter
                  {...t('SegmentedFilter')}
                  aria-label="Filter"
                  defaultValue="s1"
                  items={[
                    { id: 's1', label: 'One' },
                    { id: 's2', label: 'Two' },
                  ]}
                />
                <Box height={90}>
                  <Tabs
                    {...t('Tabs')}
                    aria-label="Tabs"
                    items={[
                      { id: 't1', label: 'Tab 1', content: 'Panel 1' },
                      { id: 't2', label: 'Tab 2', content: 'Panel 2' },
                    ]}
                  />
                </Box>
                <StarRating {...t('StarRating')} aria-label="Rating" defaultValue={3} />
                <SplitButton {...t('SplitButton')} items={[{ id: 'm1', label: 'Other' }]} menuLabel="More">
                  Save
                </SplitButton>
                <Box width={180}>
                  <Slider {...t('Slider')} aria-label="Level" defaultValue={30} />
                </Box>
                <Stepper {...t('Stepper')} aria-label="Count" defaultValue={2} />
                <Box width={420}>
                  <ColorScaleEditor
                    {...t('ColorScaleEditor')}
                    aria-label="Scale"
                    defaultValue={[
                      { from: 0, tone: 'danger' },
                      { from: 50, tone: 'success' },
                    ]}
                  />
                </Box>
                <ActionBar {...t('ActionBar')} primary={{ label: 'Apply', onPress: () => {} }} />
                <Box width={320} height={140}>
                  <DataTable
                    {...t('DataTable')}
                    aria-label="Items"
                    data={rows}
                    getRowId={(row) => row.id}
                    columns={[
                      { id: 'name', header: 'Name', accessor: 'name' },
                      { id: 'value', header: 'Value', accessor: 'value' },
                    ]}
                  />
                </Box>

                <DateChip {...t('DateChip')} date={TODAY} />
                <ScheduleSlot {...t('ScheduleSlot')}>Slot</ScheduleSlot>
                <Box width={520} height={120}>
                  <WeekStrip
                    {...t('WeekStrip')}
                    aria-label="Week"
                    today={TODAY}
                    startDate="2026-10-11"
                    items={thisWeek}
                    slotsPerDay={1}
                  />
                </Box>
                <Box width={640} height={420}>
                  <Planner
                    {...t('Planner')}
                    aria-label="Plan"
                    today={TODAY}
                    defaultMonth="2026-10"
                    items={october}
                  />
                </Box>

                <Box height={180}>
                  <BarChart
                    {...t('BarChart')}
                    aria-label="Bars"
                    categories={['A', 'B', 'C']}
                    series={series}
                  />
                </Box>
                <Box height={180}>
                  <DonutChart {...t('DonutChart')} aria-label="Share" value={40} />
                </Box>
                <Box height={180}>
                  <LineChart
                    {...t('LineChart')}
                    aria-label="Lines"
                    series={[{ id: 'l', label: 'Line', data: [1, 3, 2].map((y, x) => ({ x, y })) }]}
                  />
                </Box>
                <Box height={180}>
                  <RadarChart
                    {...t('RadarChart')}
                    aria-label="Radar"
                    axes={[
                      { id: 'a', label: 'A' },
                      { id: 'b', label: 'B' },
                      { id: 'c', label: 'C' },
                    ]}
                    series={series}
                  />
                </Box>
                <Sparkline {...t('Sparkline')} data={[1, 3, 2, 5]} />
                <Box height={180}>
                  <Heatmap
                    {...t('Heatmap')}
                    aria-label="Heat"
                    columns={['Q1', 'Q2']}
                    rows={['Region 1', 'Region 2']}
                    values={[
                      [10, 45],
                      [75, 90],
                    ]}
                  />
                </Box>
                <Box height={180}>
                  <Scatter
                    {...t('Scatter')}
                    aria-label="Points"
                    series={[
                      {
                        id: 'p',
                        label: 'Points',
                        data: [
                          { x: 1, y: 2 },
                          { x: 3, y: 1 },
                        ],
                      },
                    ]}
                  />
                </Box>

                <Tooltip {...t('Tooltip')} content="A tooltip" open={is('Tooltip')}>
                  <Button>Has a tooltip</Button>
                </Tooltip>
                <Menu
                  {...t('Menu')}
                  open={is('Menu')}
                  trigger={<Button>Menu</Button>}
                  items={[{ id: 'm1', label: 'Row' }]}
                />
                <Popover {...t('Popover')} open={is('Popover')} anchorRef={anchor} title="Popover">
                  Content
                </Popover>
              </div>
            </Card>
          </Stack>
        </Columns>
      </Page>
      <Modal {...t('Modal')} open={is('Modal')} title="Modal">
        Content
      </Modal>
      <ConfirmDialog {...t('ConfirmDialog')} open={is('ConfirmDialog')} title="Confirm?" />
      <CommandPalette {...t('CommandPalette')} open={is('CommandPalette')} shortcut={null} />
      <ShortcutsSheet {...t('ShortcutsSheet')} open={is('ShortcutsSheet')} shortcut={null} />
      <Spotlight
        {...t('Spotlight')}
        open={is('Spotlight')}
        target='[data-test-root="PageHeader"]'
        title="Spotlight"
      >
        The header.
      </Spotlight>
    </AppShell>
  );
}

export const All: Story = { render: () => <Everything /> };
