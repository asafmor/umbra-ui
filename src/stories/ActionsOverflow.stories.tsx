import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Tag } from '../data/Tag';
import { Select } from '../inputs/Select';
import { Stepper } from '../inputs/Stepper';
import { Card } from '../layout/Card';
import { RawIcon } from '../provider/icons';

// Whatever an app puts among the actions of a header, the "more" menu never breaks: what can be a row
// of a menu moves into it, and everything else stays in the row (decision 07, "Controls among actions
// that overflow"). Tested in tests/visual/inputs-tier2.spec.ts.
const meta = {
  title: 'Integration/Actions that overflow',
  parameters: { frame: 'padded' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const pages = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
];
const views = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
];

// Components of an app: the row of actions cannot see into them.
const OwnButton = () => <Button onPress={() => {}}>Archive</Button>;
const OwnStepper = () => <Stepper options={pages} defaultValue="day" size="small" aria-label="Own stepper" />;
const OwnSelect = () => <Select options={views} defaultValue="all" size="small" aria-label="Own select" />;
/** A mistake: a button and something that is no action, in one component. */
const OwnMixture = () => (
  <>
    <Button onPress={() => {}}>Share</Button>
    <Tag icon={<RawIcon name="star" />}>New</Tag>
  </>
);

const buttons = (
  <>
    <Button onPress={() => {}}>Refresh</Button>
    <Button onPress={() => {}}>Export</Button>
  </>
);

function Case({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div data-case={name} style={{ width: 230, height: 120, display: 'flex' }}>
      <Card title={name} actions={children}>
        Content
      </Card>
    </div>
  );
}

export const AnyNode: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      <Case name="Tag">
        {buttons}
        <Tag icon={<RawIcon name="star" />}>Beta</Tag>
      </Case>
      <Case name="Span">
        {buttons}
        <span>Today</span>
      </Case>
      <Case name="Wrapped">
        {buttons}
        <OwnButton />
        <OwnStepper />
      </Case>
      <Case name="Select">
        {buttons}
        <OwnSelect />
      </Case>
      <Case name="Mixture">
        {buttons}
        <OwnMixture />
      </Case>
    </div>
  ),
};
