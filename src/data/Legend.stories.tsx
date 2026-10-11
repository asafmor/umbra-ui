import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { seriesPatterns, seriesShapes } from '../internal/SeriesMarker';
import { Card } from '../layout/Card';
import { Log } from '../stories/placeholders';
import { Legend, type LegendItem } from './Legend';

const meta = { title: 'Data/Legend', component: Legend, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Legend
>;
export default meta;
type Story = StoryObj<typeof meta>;

const series = (count: number, more?: (i: number) => Partial<LegendItem>): LegendItem[] =>
  Array.from({ length: count }, (_, i) => ({ id: `s${i + 1}`, label: `Region ${i + 1}`, ...more?.(i) }));
const column: CSSProperties = { display: 'grid', gap: 16, alignContent: 'start', minWidth: 0 };
const Caption = ({ children }: { children: ReactNode }) => (
  <div style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-muted)' }}>
    {children}
  </div>
);
const Example = ({ label, children, width }: { label: string; children: ReactNode; width?: number }) => (
  <div style={{ width, minWidth: 0 }}>
    <Caption>{label}</Caption>
    {children}
  </div>
);

/** The series palette in order, and every marker. Patterns tell series apart without colour. */
export const Markers: Story = {
  args: { items: series(8) },
  render: () => (
    <div style={{ ...column, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      <Example label="The default palette, in order">
        <Legend items={series(8)} />
      </Example>
      {[...seriesShapes, ...seriesPatterns].map((marker) => (
        <Example key={marker} label={`marker="${marker}"`}>
          <Legend items={series(8)} marker={marker} />
        </Example>
      ))}
      <Example label="A marker and a colour per item; one disabled">
        <Legend
          items={[
            { id: 'plan', label: 'Plan', marker: 'dashed', color: 'var(--umbra-color-base-text-secondary)' },
            { id: 'actual', label: 'Actual', marker: 'line' },
            { id: 'range', label: 'Expected range', marker: 'stripes' },
            { id: 'none', label: 'No data', marker: 'square', disabled: true },
          ]}
        />
      </Example>
      <Example label="More series than colours: the palette repeats with a pattern">
        <Legend items={series(12)} />
      </Example>
    </div>
  ),
};

/** Horizontal with each alignment, and vertical with and without a value column. */
export const Orientations: Story = {
  args: { items: series(4) },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
      <div style={column}>
        {(['start', 'center', 'end'] as const).map((align) => (
          <Card key={align} title={`Horizontal, ${align}`} style={{ height: 150 }}>
            <Legend items={series(4)} align={align} />
          </Card>
        ))}
      </div>
      <div style={column}>
        {(['start', 'center', 'end'] as const).map((align) => (
          <Card key={align} title={`Vertical, ${align}`} style={{ height: 150 }}>
            <Legend items={series(2)} orientation="vertical" align={align} />
          </Card>
        ))}
      </div>
      <div style={column}>
        <Card title="Vertical with values" tone="tinted" style={{ height: 270 }}>
          <Legend
            orientation="vertical"
            items={series(5, (i) => ({
              value: `${[38, 24, 17, 12, 9][i]}%`,
              label: i === 1 ? 'Region 2, with a long name that truncates' : `Region ${i + 1}`,
            }))}
          />
        </Card>
        <Card title="Horizontal with values" tone="neutral" style={{ height: 150 }}>
          <Legend items={series(3, (i) => ({ value: [412, 268, 97][i] }))} marker="square" />
        </Card>
      </div>
    </div>
  ),
};

/** Items are toggle buttons: one tab stop, arrow keys between them. Hover and focus report a highlight. */
export const Interactive: Story = {
  args: { items: series(6) },
  render: function Render() {
    const [hidden, setHidden] = useState<string[]>(['s3']);
    const [highlight, setHighlight] = useState<string | null>(null);
    const [changes, setChanges] = useState(0);
    return (
      <div style={{ ...column, maxWidth: 720 }}>
        <Example label="Controlled">
          <Legend
            interactive
            aria-label="Controlled legend"
            items={series(6, (i) => ({ disabled: i === 4 }))}
            hiddenIds={hidden}
            onHiddenChange={setHidden}
            onHighlight={setHighlight}
          />
        </Example>
        <Log>
          Hidden: {hidden.join(', ') || 'none'}. Highlighted: {highlight ?? 'none'}.
        </Log>
        <Example label="Uncontrolled, vertical, with values">
          <div style={{ width: 240 }}>
            <Legend
              interactive
              aria-label="Uncontrolled legend"
              orientation="vertical"
              items={series(4, (i) => ({ value: [412, 268, 97, 31][i] }))}
              defaultHiddenIds={['s2']}
              onHiddenChange={() => setChanges((n) => n + 1)}
            />
          </div>
        </Example>
        <Log>Changes: {changes}.</Log>
        <Example label="Not interactive: hover still reports a highlight">
          <Legend aria-label="Static legend" items={series(3)} onHighlight={setHighlight} />
        </Example>
      </div>
    );
  },
};

const twelve = series(12, (i) =>
  i === 2 ? { label: 'Region 3, with a much longer name than the others' } : {},
);

/** A horizontal legend wraps to `maxRows`, then puts the rest behind a "+N more" button. Labels truncate. */
export const Wrapping: Story = {
  args: { items: twelve },
  render: () => (
    <div style={column}>
      <Example label="Wide: everything fits on one row">
        <Legend items={series(5)} maxRows={1} />
      </Example>
      <Example label="480px, two rows (the default)" width={480}>
        <Legend aria-label="Two rows" items={twelve} />
      </Example>
      <Example label="480px, one row, interactive" width={480}>
        <Legend aria-label="One row" items={twelve} maxRows={1} interactive defaultHiddenIds={['s10']} />
      </Example>
      <Example label="480px, three rows, centred" width={480}>
        <Legend aria-label="Three rows" items={twelve} maxRows={3} align="center" />
      </Example>
      <Example label="140px: one item per row, truncated" width={140}>
        <Legend
          aria-label="Narrow"
          items={series(12, (i) => (i === 0 ? { label: 'Region 1, with a long name' } : {}))}
        />
      </Example>
      <Example
        label="140px, interactive: a truncated label shows its text when its button has focus"
        width={140}
      >
        <Legend
          aria-label="Narrow, interactive"
          interactive
          maxRows={3}
          items={series(3, (i) => (i === 0 ? { label: 'Region 1, with a long name' } : {}))}
        />
      </Example>
      <Example label="A translated label" width={300}>
        <Legend items={twelve} maxRows={1} moreLabel={(n) => `${n} weitere`} allLabel="Alle Einträge" />
      </Example>
    </div>
  ),
};

function Retrying() {
  const [state, setState] = useState<'error' | 'loading' | 'data'>('error');
  return (
    <>
      <Legend
        aria-label="Retried legend"
        interactive
        items={state === 'data' ? series(3) : []}
        loading={state === 'loading'}
        error={state === 'error' && 'The series did not load'}
        onRetry={() => setState('loading')}
      />
      <div>
        <Button size="small" onPress={() => setState(state === 'loading' ? 'data' : 'error')}>
          {state === 'loading' ? 'Finish loading' : 'Fail again'}
        </Button>
      </div>
    </>
  );
}

/**
 * Loading shows placeholder items in the final layout. Empty and error are the shared data states, on
 * one line: text, a node or `{ title, description, icon, action }`, and a retry button with `onRetry`.
 */
export const Loading: Story = {
  args: { items: [] },
  render: () => (
    <div style={{ ...column, maxWidth: 480 }}>
      <Example label="Loading, horizontal">
        <Legend items={[]} loading />
      </Example>
      <Example label="Loading, vertical, five placeholders">
        <Legend items={[]} loading skeletonRows={5} orientation="vertical" />
      </Example>
      <Example label="Loaded">
        <Legend items={series(3)} />
      </Example>
      <Example label="Empty, default text">
        <Legend items={[]} />
      </Example>
      <Example label="Empty, custom">
        <Legend items={[]} empty={{ title: 'No series', description: 'Choose a region to compare.' }} />
      </Example>
      <Example label="Error, default text">
        <Legend items={[]} error />
      </Example>
      <Example label="Error with retry, then loading, then the items">
        <Retrying />
      </Example>
      <Example label="Part: the state replaced by a node">
        <Legend items={[]} parts={{ state: <em>Nothing to compare yet.</em> }} />
      </Example>
    </div>
  ),
};

/** Each kind of `parts` override, and the legend composed by hand from its blocks. */
export const PartsAndBlocks: Story = {
  args: { items: series(4) },
  render: () => (
    <div style={{ ...column, maxWidth: 640 }}>
      <Example label="A node replaces every marker">
        <Legend items={series(3)} parts={{ marker: <span aria-hidden="true">◆</span> }} />
      </Example>
      <Example label="null hides the values">
        <Legend items={series(3, (i) => ({ value: i }))} parts={{ value: null }} />
      </Example>
      <Example label="Functions wrap the label and the item">
        <Legend
          items={series(4)}
          parts={{
            label: (p) => <strong data-part="label">{p.children}</strong>,
            item: (p) => <Legend.Item {...p} marker={p.id === 's2' ? 'stripes' : 'square'} />,
          }}
        />
      </Example>
      <Example label="A function replaces the more button" width={260}>
        <Legend
          items={series(8)}
          maxRows={1}
          parts={{ more: (p) => <Legend.More {...p}>and {p.children}</Legend.More> }}
        />
      </Example>
      <Example label="Composed from blocks">
        <Legend.Root aria-label="Composed legend" interactive defaultHiddenIds={['b']}>
          <Legend.Item id="a" color="var(--umbra-color-series-1)" marker="line">
            This year
          </Legend.Item>
          <Legend.Item id="b" color="var(--umbra-color-series-1)" marker="dashed">
            Last year
          </Legend.Item>
        </Legend.Root>
      </Example>
      <Example label="The marker block on its own">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Legend.Marker kind="dots" color="var(--umbra-color-series-5)" /> Region 5
        </span>
      </Example>
    </div>
  ),
};
