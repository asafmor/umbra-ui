import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { DivergingMeter } from './DivergingMeter';
import { LevelMeter } from './LevelMeter';
import { MeterList } from './MeterList';
import { PieIndicator } from './PieIndicator';
import { ProgressBar } from './ProgressBar';
import { Board, Panel, Width } from './storyKit';

const meta = {
  title: 'Meters/MeterList',
  component: MeterList,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof MeterList>;
export default meta;
type Story = StoryObj<typeof meta>;

const skills = [
  ['Speed', 4],
  ['Accuracy of the work', 2],
  ['Care', 5],
  ['Knowledge of the region', 3],
] as const;

const levels = skills.map(([name, value]) => (
  <LevelMeter key={name} label={name} value={value} min={1} max={5} steps={5} showValue />
));

const mixed = (
  <>
    <ProgressBar label="Budget used" value={62} showValue />
    <LevelMeter label="Quality" value={7} min={0} max={10} steps={11} showValue />
    <PieIndicator label="Coverage of the region" value={75} showValue />
    <DivergingMeter label="Change" value={-35} showValue />
  </>
);

/** One column of labels, one of bars and one of values, for meters of one kind or of all four. */
export const Variants: Story = {
  render: () => (
    <Board>
      <Panel title="Level meters: the strips start in one line">
        <MeterList aria-label="Skills">{levels}</MeterList>
      </Panel>
      <Panel title="The four meters together">
        <MeterList aria-label="Figures">{mixed}</MeterList>
      </Panel>
      <Panel title="Without values">
        <MeterList aria-label="Progress">
          <ProgressBar label="Stage 1" value={100} />
          <ProgressBar label="Stage 2, in review" value={40} />
          <ProgressBar label="Stage 3" value={0} />
        </MeterList>
      </Panel>
      <Panel title="A label column of 96px: long labels are cut, with a tooltip">
        <MeterList aria-label="Skills, narrow labels" labelWidth={96}>
          {levels}
        </MeterList>
      </Panel>
      <Panel title="A label column of 50%">
        <MeterList aria-label="Figures, half" labelWidth="50%">
          {mixed}
        </MeterList>
      </Panel>
      <Panel title="Thresholds, a missing value, a row that loads">
        <MeterList aria-label="States of rows">
          <ProgressBar label="Load" value={82} thresholds showValue />
          <ProgressBar label="Not measured" value={null} showValue />
          <ProgressBar label="Loading" value={30} showValue loading />
          <PieIndicator label="Loading share" value={30} showValue loading />
        </MeterList>
      </Panel>
    </Board>
  ),
};

/** Loading with skeleton rows in the three columns, no meters, and an error with a retry. */
export const States: Story = {
  render: function Render() {
    const [tries, setTries] = useState(0);
    return (
      <Board>
        <Panel title="Loading, three rows">
          <MeterList aria-label="Loading" loading skeletonRows={3}>
            {levels}
          </MeterList>
        </Panel>
        <Panel title="Empty">
          <MeterList aria-label="Empty" empty="Nothing measured yet" />
        </Panel>
        <Panel title="Error">
          <MeterList
            aria-label="Failed"
            error={`The figures could not be loaded. Retries: ${tries}.`}
            onRetry={() => setTries(tries + 1)}
          >
            {levels}
          </MeterList>
        </Panel>
      </Board>
    );
  },
};

/** As the list narrows: first the column of values goes, then each label moves above its bar. */
export const Shrink: Story = {
  render: () => (
    <Board columns={2}>
      <Panel title="320px: three columns">
        <Width px={320}>
          <MeterList>{mixed}</MeterList>
        </Width>
      </Panel>
      <Panel title="230px: no values">
        <Width px={230}>
          <MeterList>{mixed}</MeterList>
        </Width>
      </Panel>
      <Panel title="160px: labels above the bars">
        <Width px={160}>
          <MeterList>{mixed}</MeterList>
        </Width>
      </Panel>
      <Panel title="200px, labels of 110px: cut labels stay, no values">
        <Width px={200}>
          <MeterList labelWidth={110}>{mixed}</MeterList>
        </Width>
      </Panel>
    </Board>
  ),
};

/** The page is right to left: the labels are on the right, the values on the left. */
export const RightToLeft: Story = {
  globals: { direction: 'rtl' },
  render: () => (
    <Board>
      <Panel title="Meter list">
        <MeterList aria-label="Figures">{mixed}</MeterList>
      </Panel>
    </Board>
  ),
};

/** Tokens, every kind of part, and the root block used by hand. */
export const Customised: Story = {
  render: () => (
    <Board>
      <Panel title="Tokens: gaps, the colour of the labels, the shortest bar">
        <div
          style={
            {
              '--umbra-meter-list-gap': '4px',
              '--umbra-meter-list-column-gap': '24px',
              '--umbra-meter-list-label-fg': 'var(--umbra-color-base-text-primary)',
              '--umbra-meter-list-bar-min-width': '120px',
            } as CSSProperties
          }
        >
          <MeterList aria-label="Tokens">{mixed}</MeterList>
        </div>
      </Panel>
      <Panel title="Parts: a node, null and a function for the skeleton; the states">
        <MeterList
          aria-label="Skeleton node"
          loading
          parts={{ skeleton: <span>Loading the figures…</span> }}
        />
        <MeterList aria-label="Skeleton null" loading parts={{ skeleton: null }} />
        <MeterList
          aria-label="Skeleton function"
          loading
          parts={{ skeleton: ({ rows }) => <span>{rows} rows on their way</span> }}
        />
        <MeterList aria-label="Empty part" parts={{ empty: <span>No figures.</span> }} />
        <MeterList
          aria-label="Error part"
          error="Not loaded"
          parts={{ error: ({ children }) => <div data-own="error">{children}</div> }}
        />
      </Panel>
      <Panel title="The root block, with its state set by hand">
        <MeterList.Root aria-label="By hand" labelWidth={80} className="own" style={{ opacity: 0.9 }}>
          {levels}
        </MeterList.Root>
      </Panel>
    </Board>
  ),
};
