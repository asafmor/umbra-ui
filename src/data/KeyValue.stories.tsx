import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays, MapPin, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Section, Sheet } from '../stories/dataValues';
import { EntityIcon } from './EntityIcon';
import { KeyValue, KeyValueList, type KeyValueItem } from './KeyValue';
import { LiveValues } from '../stories/live';

const meta = {
  title: 'Data/KeyValue',
  component: KeyValue,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof KeyValue>;
export default meta;
type Story = StoryObj<typeof meta>;

const contract: KeyValueItem[] = [
  { label: 'Client', value: <EntityIcon name="Client A" label /> },
  { label: 'Started', value: '17 Aug 2026' },
  { label: 'Expires', value: '31 May 2027' },
  { label: 'Monthly fee', value: '€1,900' },
  { label: 'Agreed service level', value: 'Priority' },
];

const facts: KeyValueItem[] = [
  { label: 'Based in', value: 'Region 2', icon: <MapPin /> },
  { label: 'Founded', value: '1998', icon: <CalendarDays /> },
  { label: 'Budget', value: '€64.0M', icon: <Wallet />, hint: 'This year' },
  { label: 'Ranking', value: '1st of 20' },
];

/** One row on its own, and lists in rows: striped, with dividers, with hints, wrapping and truncating. */
export const Rows: Story = {
  render: () => (
    <Sheet>
      <Section label="A single KeyValue: inline, stacked, with icon and hint" width={260}>
        <div style={{ display: 'grid', gap: 10 }}>
          <KeyValue label="Status" value="Open" />
          <KeyValue label="Owner" value="Person A" icon={<MapPin />} hint="Since March" />
          <KeyValue label="Aligned to the start" value="Region 2" align="start" />
          <KeyValue label="Stacked" value="€64.0M" orientation="stacked" hint="Spent this year: €9.5M" />
          <KeyValue label="Stacked, aligned to the end" value="1st of 20" orientation="stacked" align="end" />
        </div>
      </Section>
      <Section label="Rows: the label column is shared" width={280}>
        <KeyValueList aria-label="Contract" items={contract} />
      </Section>
      <Section label="Striped" width={280}>
        <KeyValueList aria-label="Contract, striped" items={contract} striped />
      </Section>
      <Section label="Dividers, hints and icons" width={280}>
        <KeyValueList aria-label="Facts" items={facts} dividers />
      </Section>
      <Section label="Values aligned to the start, labelWidth={96}" width={280}>
        <KeyValueList aria-label="Contract, aligned" items={contract} align="start" labelWidth={96} striped />
      </Section>
      <Section label="Long text: truncated (default)" width={220}>
        <KeyValueList aria-label="Truncated" striped>
          <KeyValue label="Agreed level of service for the year" value="Priority" />
          <KeyValue label="Note" value="Delivery moved to the north depot until further notice" />
        </KeyValueList>
      </Section>
      <Section label="Long text: wrap" width={220}>
        <KeyValueList aria-label="Wrapped" striped wrap>
          <KeyValue label="Note" value="Delivery moved to the north depot until further notice" />
          <KeyValue label="Reference" value="ORD-2026-000184-NORTH-DEPOT" />
        </KeyValueList>
      </Section>
    </Sheet>
  ),
};

/** Columns and grid layouts, and how the grid uses fewer columns in a narrow card. */
export const Layouts: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 20 }}>
      <Section label='layout="columns" with dividers'>
        <KeyValueList aria-label="Facts in columns" layout="columns" items={facts} dividers />
      </Section>
      <Section label='layout="columns", inline'>
        <KeyValueList aria-label="Counts" layout="columns" orientation="inline" align="start">
          <KeyValue label="Open" value="12" />
          <KeyValue label="Late" value="3" />
          <KeyValue label="Done" value="148" />
        </KeyValueList>
      </Section>
      <Columns style={{ height: 250 }}>
        <Card title="Grid, columns={3}" size={3}>
          <KeyValueList
            aria-label="Grid of three"
            layout="grid"
            columns={3}
            items={[...facts, ...contract]}
          />
        </Card>
        <Card title="Same grid, narrow" size={1.4}>
          <KeyValueList aria-label="Narrow grid" layout="grid" columns={3} items={[...facts, ...contract]} />
        </Card>
        <Card title="Grid, inline" size={2}>
          <KeyValueList
            aria-label="Inline grid"
            layout="grid"
            orientation="inline"
            items={contract.slice(1)}
          />
        </Card>
      </Columns>
    </div>
  ),
};

/** An error with a retry button: pressing it loads, then shows the rows. The focus is never lost. */
function Failing() {
  const [state, setState] = useState<'error' | 'loading' | 'done'>('error');
  return (
    <KeyValueList
      aria-label="Failed"
      items={contract}
      loading={state === 'loading'}
      error={state === 'error' && 'The details could not be loaded.'}
      onRetry={() => {
        setState('loading');
        setTimeout(() => setState('done'), 400);
      }}
    />
  );
}

/**
 * Loading shows skeleton rows in the final layout; empty and error replace the rows. The states are the
 * shared ones of every data component: text, a node, `{ title, description, icon, action }`, or `true`.
 */
export const States: Story = {
  render: () => (
    <Sheet>
      <Section label="loading" width={260}>
        <KeyValueList aria-label="Loading" loading striped />
      </Section>
      <Section label="loading, skeletonRows={2}, dividers" width={260}>
        <KeyValueList aria-label="Loading two" loading skeletonRows={2} dividers />
      </Section>
      <Section label="loading, grid" width={260}>
        <KeyValueList aria-label="Loading grid" loading layout="grid" />
      </Section>
      <Section label="No items: the default empty text" width={260}>
        <KeyValueList aria-label="Empty" items={[]} />
      </Section>
      <Section label="A given empty text" width={260}>
        <KeyValueList aria-label="Empty contract" items={[]} empty="No contract yet." />
      </Section>
      <Section label="error, with onRetry" width={260}>
        <Failing />
      </Section>
      <Section label="error={true}: the default text" width={260}>
        <KeyValueList aria-label="Failed by default" items={contract} error />
      </Section>
      <Section label="error as pieces, retryLabel" width={260}>
        <KeyValueList
          aria-label="Failed in pieces"
          items={contract}
          error={{ title: 'No connection', description: 'The details are kept on the server.' }}
          onRetry={() => {}}
          retryLabel="Reload"
        />
      </Section>
      <Section label="A row without a value; emptyLabel" width={260}>
        <KeyValueList
          aria-label="Missing values"
          items={[
            { label: 'Started', value: '17 Aug 2026' },
            { label: 'Expires', value: null },
            { label: 'Renewed', value: undefined, emptyLabel: 'Never' },
          ]}
        />
      </Section>
    </Sheet>
  ),
};

/** The `parts` prop (a node, `null`, a function), tokens, and the blocks composed by hand. */
export const Customised: Story = {
  render: () => (
    <Sheet>
      <Section label="parts: a node replaces the value" width={240}>
        <KeyValue label="Status" value="Open" parts={{ value: <KeyValue.Value>Replaced</KeyValue.Value> }} />
      </Section>
      <Section label="parts: null hides the hint and icon" width={240}>
        <KeyValue
          label="Owner"
          value="Person A"
          icon={<MapPin />}
          hint="Since March"
          parts={{ hint: null, icon: null }}
        />
      </Section>
      <Section label="parts: a function adjusts the label" width={240}>
        <KeyValue
          label="Budget"
          value="€64.0M"
          parts={{
            label: (p) => <KeyValue.Label {...p} style={{ color: 'var(--umbra-color-fixed-accent-text)' }} />,
          }}
        />
      </Section>
      <Section label="List parts: item, as a function" width={240}>
        <KeyValueList
          aria-label="Adjusted items"
          items={contract.slice(1, 4)}
          parts={{ item: (p) => <KeyValue {...p} label={<>{p.label}:</>} /> }}
        />
      </Section>
      <Section label="List parts: skeleton and empty" width={240}>
        <KeyValueList
          aria-label="Custom skeleton"
          loading
          parts={{ skeleton: <div>Loading the list…</div> }}
        />
        <KeyValueList
          aria-label="Custom empty"
          items={[]}
          parts={{ empty: (p) => <strong>{p.children}!</strong> }}
        />
      </Section>
      <Section label="highlighted: key rows" width={240}>
        <KeyValueList
          aria-label="Key rows"
          items={[
            { label: 'Response time', value: '1.2 s', highlighted: true },
            { label: 'Uptime', value: '99.9%' },
            { label: 'Error rate', value: '0.4%', highlighted: true },
            { label: 'Queue', value: '12' },
          ]}
        />
      </Section>
      <Section label="Tokens" width={240}>
        <KeyValueList
          aria-label="With tokens"
          items={contract.slice(1, 4)}
          striped
          style={
            {
              '--umbra-key-value-row-height': '36px',
              '--umbra-key-value-stripe': 'color-mix(in oklab, var(--umbra-context) 30%, transparent)',
              '--umbra-key-value-label-fg': 'var(--umbra-color-base-text-primary)',
            } as React.CSSProperties
          }
        />
      </Section>
      <Section label="Blocks composed by hand" width={240}>
        <KeyValueList.Root aria-label="Hand-made list" dividers>
          <KeyValue.Root>
            <KeyValue.Label icon={<EntityIcon name="Client B" />}>Client B</KeyValue.Label>
            <KeyValue.Value>12 orders</KeyValue.Value>
          </KeyValue.Root>
          <KeyValueList.Item label="Client C" value="7 orders" />
          <KeyValue.Root>
            <KeyValue.Label>Client D</KeyValue.Label>
            <KeyValue.Value>3 orders</KeyValue.Value>
            <KeyValue.Hint>Last order in May</KeyValue.Hint>
          </KeyValue.Root>
        </KeyValueList.Root>
      </Section>
    </Sheet>
  ),
};

/** `highlightChanges`: press the button and each changed value flashes once, with a sign when a number rose or fell. */
export const LiveUpdates: Story = {
  render: () => (
    <LiveValues>
      {(value) => <KeyValue label="Orders" value={value} orientation="stacked" highlightChanges />}
    </LiveValues>
  ),
};

/** `highlightChanges` set once on the list is the default of every row; a row can still switch it off. */
export const LiveList: Story = {
  render: () => (
    <LiveValues kinds={['up', 'down', 'same']} columns={3}>
      {(value) => (
        <KeyValueList
          aria-label="Live list"
          highlightChanges
          items={[
            { label: 'Orders', value },
            { label: 'Not highlighted', value: `v${value}`, highlightChanges: false },
          ]}
        />
      )}
    </LiveValues>
  ),
};
