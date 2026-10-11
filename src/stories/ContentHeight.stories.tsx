import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { DonutChart } from '../charts/DonutChart';
import { LineChart } from '../charts/LineChart';
import { List } from '../data/List';
import { Accordion } from '../layout/Accordion';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { SectionTitle } from '../layout/SectionTitle';
import { Slot } from '../layout/Slot';
import { Stack } from '../layout/Stack';
import { Modal } from '../overlays/Modal';
import { AppShell } from '../shell/AppShell';
import { Page } from '../layout/Page';
import { DataTable, type DataTableColumn } from '../table/DataTable';
import { regions, type Region } from '../table/samples';
import { months } from './charts';
import { Rows } from './placeholders';

/**
 * `DataTable`, `List` and the charts fill the height of their slot. Where there is no height to fill
 * they take the height of their content instead, and `height` makes the choice explicit.
 */
const meta = { title: 'Layout/Content height' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const columns: DataTableColumn<Region>[] = [
  { id: 'name', header: 'Region', accessor: 'name', priority: 'always' },
  { id: 'orders', header: 'Orders', accessor: 'orders' },
  { id: 'points', header: 'Points', accessor: 'points' },
];
const table = (label: string, count: number, height?: 'content' | number) => (
  <DataTable
    aria-label={label}
    data={regions.slice(0, count)}
    getRowId={(r) => r.id}
    columns={columns}
    height={height}
  />
);
const list = (label: string, count: number, height?: 'content' | number) => (
  <List aria-label={label} itemSize="compact" height={height}>
    {regions.slice(0, count).map((r) => (
      <List.Item key={r.id} id={r.id} title={r.name} meta={r.points} />
    ))}
  </List>
);
const series = [
  { id: 'orders', label: 'Orders', data: months.slice(0, 6).map((x, i) => ({ x, y: 40 + ((i * 17) % 30) })) },
];
const line = (label: string, height?: 'content' | number) => (
  <LineChart aria-label={label} series={series} height={height} />
);
const donut = (label: string) => (
  <DonutChart
    aria-label={label}
    data={regions.slice(0, 4).map((r) => ({ id: r.id, label: r.name, value: r.orders }))}
    centerValue={4}
    centerLabel="regions"
  />
);
const flow: CSSProperties = { display: 'grid', gap: 'var(--umbra-space-5)', minWidth: 0 };

/**
 * One scrolling card body with several pieces in a row. In the first card they sit in a flowing
 * wrapper, which has no height, so each one takes its content's height by itself. In the second they
 * are direct children of the body, which has a height: `height="content"` (or a number) says so.
 */
export const Flowing: Story = {
  render: () => (
    <AppShell background="flat">
      <Page>
        <Columns>
          <Card title="In a flowing wrapper">
            <div style={flow}>
              <SectionTitle>First table</SectionTitle>
              {table('First table', 4)}
              <SectionTitle>Second table</SectionTitle>
              {table('Second table', 6)}
              <SectionTitle>List</SectionTitle>
              {list('Flowing list', 3)}
              <SectionTitle>Chart</SectionTitle>
              {line('Flowing chart')}
            </div>
          </Card>
          <Card title='With height="content"' padding="none">
            {table('Content table', 5, 'content')}
            {list('Content list', 3, 'content')}
            {line('Content chart', 'content')}
            {table('Fixed table', 12, 120)}
          </Card>
          <Card title="The default still fills">{table('Filling table', 20)}</Card>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/**
 * The stack is too short, so three cards collapse to their header. Each header opens its content in a
 * popover, which has no height of its own: the chart, the table and the list take their content's.
 */
export const CollapsedCards: Story = {
  render: () => (
    <AppShell background="flat">
      <Page>
        <Columns>
          <Card title="Orders" size={2}>
            <Rows count={20} prefix="Order" />
          </Card>
          <Slot label="Status">
            <div style={{ height: 300, display: 'flex' }}>
              <Stack>
                <Card title="Open" priority={1}>
                  <Rows count={3} />
                </Card>
                <Card title="Chart">{donut('Orders by region')}</Card>
                <Card title="Table" padding="none">
                  {table('Collapsed table', 8)}
                </Card>
                <Card title="List" padding="none">
                  {list('Collapsed list', 5)}
                </Card>
              </Stack>
            </div>
          </Slot>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/** An accordion panel and a modal body are as tall as their content: a chart in them has a height. */
export const PanelAndModal: Story = {
  render: () => (
    <AppShell background="flat">
      <Page>
        <Columns>
          <Card title="Accordion">
            <Accordion
              aria-label="Sections"
              defaultValue={['chart', 'table']}
              items={[
                { id: 'chart', title: 'Chart', content: line('Chart in a panel') },
                { id: 'table', title: 'Table', content: table('Table in a panel', 3) },
              ]}
            />
          </Card>
          <Card title="Modal">
            <Modal defaultOpen size="sm" trigger={<Button>Open</Button>} title="Orders by region">
              {donut('Chart in a modal')}
            </Modal>
          </Card>
        </Columns>
      </Page>
    </AppShell>
  ),
};
