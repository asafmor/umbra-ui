import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../shell/AppShell';
import { Rows, Value } from '../stories/placeholders';
import { Card } from './Card';
import { Columns } from './Columns';
import { Page } from './Page';
import { Slot } from './Slot';
import { Stack } from './Stack';

const meta = { title: 'Layout/Page layouts', component: Columns } satisfies Meta<typeof Columns>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The Milestone 0 test: three columns of placeholder cards fill any window from 1024 x 600 up with no
 * page scroll. When the right-hand stack runs out of height, its lowest-priority cards collapse to
 * their header. Below the minimum window the columns become tabs.
 */
export const ThreeColumns: Story = {
  tags: ['narrow'],
  render: () => (
    <AppShell>
      <Page>
        <Columns>
          <Card title="Inbox" size={3}>
            <Rows count={40} prefix="Message" />
          </Card>
          <Card title="Summary" size={5}>
            <Rows count={12} prefix="Update" />
          </Card>
          <Stack size={2.4} label="Status">
            <Card title="Next review" tone="neutral" priority={2}>
              <Value label="Site" value="North depot" />
            </Card>
            <Card title="Data hub" tone="neutral" size={1.4}>
              <Rows count={4} prefix="Measure" />
            </Card>
            <Card title="Project budget" tone="neutral" priority={1}>
              <Value label="Available" value="80.12M" />
            </Card>
            <Card title="Payroll budget" tone="neutral">
              <Value label="Available" value="275K" />
            </Card>
            <Card title="This week" tone="neutral">
              <Rows count={3} prefix="Day" />
            </Card>
          </Stack>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/** `size` is a weight, `size="content"` hugs, and stacks and columns nest freely. */
export const Sizes: Story = {
  render: () => (
    <AppShell background="flat">
      <Page>
        <Stack>
          <Card title="Hugs its content" size="content">
            One line of content.
          </Card>
          <Columns>
            <Card title="Weight 1">
              <Rows />
            </Card>
            <Card title="Weight 2" size={2}>
              <Rows />
            </Card>
            <Slot label="Custom">
              <div style={{ border: '1px dashed var(--umbra-color-base-border-control)', padding: 12 }}>
                Any element, placed with Slot
              </div>
            </Slot>
          </Columns>
        </Stack>
      </Page>
    </AppShell>
  ),
};

/** A teal page: the frame takes the page's context tint. `padding="none"` removes the outer margin. */
export const PageContext: Story = {
  render: () => (
    <AppShell>
      <Page context="teal" header={<div style={{ font: 'var(--umbra-font-title)' }}>Page header slot</div>}>
        <Columns>
          <Card title="Tinted" tone="tinted">
            <Rows />
          </Card>
          <Card title="Default">
            <Rows />
          </Card>
          <Card title="Loading" loading />
        </Columns>
      </Page>
    </AppShell>
  ),
};

const five = ['Next review', 'Data hub', 'Project budget', 'Payroll budget', 'This week'];

/**
 * Layout rule 3. The stack is too short for five cards at their minimum height, so the cards with the
 * lowest priority collapse to their header. "Next review" has the highest priority and "Project budget"
 * the next; the rest collapse from the end. A collapsed header opens the card's content in a popover.
 */
export const StackCollapse: Story = {
  render: () => (
    <AppShell background="flat">
      <Page>
        <Columns>
          {[720, 400, 300].map((height) => (
            <Slot key={height} label={`${height}px`}>
              <div style={{ height, maxHeight: '100%', display: 'flex' }}>
                <Stack>
                  {five.map((title, i) => (
                    <Card key={title} title={title} tone="neutral" priority={i === 0 ? 2 : i === 2 ? 1 : 0}>
                      <Rows count={3} />
                    </Card>
                  ))}
                </Stack>
              </div>
            </Slot>
          ))}
        </Columns>
      </Page>
    </AppShell>
  ),
};
