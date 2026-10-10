import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../basics/Button';
import { Rows } from '../stories/placeholders';
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
