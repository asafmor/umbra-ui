import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log, Rows } from '../stories/placeholders';
import { Card } from './Card';
import { Columns } from './Columns';
import { SectionTitle } from './SectionTitle';

const meta = {
  title: 'Layout/SectionTitle',
  component: SectionTitle,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SectionTitle>;
export default meta;

const actions = (
  <>
    <Button size="small">Sort</Button>
    <Button size="small">Export</Button>
  </>
);

/** The three variants, a count, and actions that move into a menu when the title row is narrow. */
export const Variants: StoryObj<typeof meta> = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Variants" size={2}>
        <SectionTitle>Heading</SectionTitle>
        <Rows count={2} />
        <SectionTitle href="#" count={12}>
          Link to a fuller view
        </SectionTitle>
        <Rows count={2} />
        <SectionTitle variant="rule" actions={actions}>
          Rule, for long-form content
        </SectionTitle>
        <Rows count={2} />
      </Card>
      <Card title="Narrow">
        <div style={{ width: 200 }}>
          <SectionTitle actions={actions}>Recent activity by region</SectionTitle>
        </div>
        <div style={{ width: 120 }}>
          <SectionTitle actions={actions}>Recent activity by region</SectionTitle>
        </div>
      </Card>
    </Columns>
  ),
};

function CallbacksCard() {
  const [last, setLast] = useState('none');
  return (
    <Card title="Callbacks">
      <SectionTitle onOpen={() => setLast('Opened the section')} count={3}>
        Open orders
      </SectionTitle>
      <Rows count={2} prefix="Order" />
      <div style={{ width: 200 }}>
        <SectionTitle
          actions={
            <>
              <Button size="small" onPress={() => setLast('Sort')}>
                Sort
              </Button>
              <Button size="small" onPress={() => setLast('Export')}>
                Export
              </Button>
            </>
          }
        >
          Recent activity by region
        </SectionTitle>
      </div>
      <Log>Last action: {last}</Log>
    </Card>
  );
}

/** `onOpen` makes the title a button; actions keep working from the overflow menu. */
export const Callbacks: StoryObj<typeof meta> = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <CallbacksCard />
    </Columns>
  ),
};

/** Heading levels, and parts replaced by a function or a node, or hidden with `null`. */
export const LevelsAndParts: StoryObj<typeof meta> = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Levels">
        <SectionTitle level={2}>Level 2</SectionTitle>
        <SectionTitle>Level 3, the default</SectionTitle>
        <SectionTitle level={4} count={7}>
          Level 4 with a count
        </SectionTitle>
        <SectionTitle level={6} variant="rule">
          Level 6, rule
        </SectionTitle>
      </Card>
      <Card title="Parts">
        <SectionTitle
          count={12}
          parts={{
            title: (p) => (
              <h3 data-part="title" style={{ margin: 0, font: 'var(--umbra-font-title)' }}>
                {p.children}
              </h3>
            ),
            count: (p) => <span data-part="count">{p.children} open</span>,
          }}
        >
          Title and count from functions
        </SectionTitle>
        <SectionTitle count={12} parts={{ count: <b data-part="count">New</b> }}>
          Count replaced by a node
        </SectionTitle>
        <SectionTitle count={12} actions={actions} parts={{ count: null, actions: null }}>
          Count and actions hidden
        </SectionTitle>
      </Card>
    </Columns>
  ),
};
