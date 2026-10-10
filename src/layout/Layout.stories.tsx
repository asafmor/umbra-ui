import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../shell/AppShell';
import { Bar, Rows, Value } from '../stories/placeholders';
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
            <Card title="Insights" tone="neutral" size={1.4}>
              <Rows count={4} prefix="Measure" />
            </Card>
            <Card title="Project budget" tone="neutral" priority={1}>
              <Value label="Available" value="64.0M" />
            </Card>
            <Card title="Payroll budget" tone="neutral">
              <Value label="Available" value="410K" />
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

const five = ['Next review', 'Insights', 'Project budget', 'Payroll budget', 'This week'];

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

/**
 * Not even the highest-priority card can have its minimum height (170) here. It stays open with the
 * space that is left and scrolls inside; the other card collapses. A column is never left with headers only.
 */
export const StackTooShort: Story = {
  render: () => (
    <AppShell background="flat">
      <Page>
        <Columns>
          {[240, 200].map((height) => (
            <Slot key={height} label={`${height}px`}>
              <div style={{ height, display: 'flex' }}>
                <Stack>
                  <Card title="Orders" tone="neutral" minHeight={170}>
                    <Rows count={8} prefix="Order" />
                  </Card>
                  <Card title="Reports" tone="neutral" minHeight={170}>
                    <Rows count={8} prefix="Report" />
                  </Card>
                </Stack>
              </div>
            </Slot>
          ))}
        </Columns>
      </Page>
    </AppShell>
  ),
};

const twoCards = (
  <Columns>
    <Card title="Orders">
      <Rows prefix="Order" />
    </Card>
    <Card title="Reports">
      <Rows prefix="Report" />
    </Card>
  </Columns>
);

/** `header` and `footer` stay fixed above and below the content, which takes the rest of the height. */
export const PageHeaderFooter: Story = {
  render: () => (
    <AppShell>
      <Page header={<Bar>Page header</Bar>} footer={<Bar>Page footer</Bar>}>
        {twoCards}
      </Page>
    </AppShell>
  ),
};

/** `loading` shows one skeleton in place of the content; the header and footer stay. */
export const PageLoading: Story = {
  render: () => (
    <AppShell>
      <Page loading header={<Bar>Page header</Bar>} footer={<Bar>Page footer</Bar>}>
        {twoCards}
      </Page>
    </AppShell>
  ),
};

/** `padding="none"` removes the outer margin, for edge-to-edge content. */
export const PagePaddingNone: Story = {
  render: () => (
    <AppShell background="flat">
      <Page padding="none">
        <Card title="Edge to edge" padding="none">
          <Rows count={40} />
        </Card>
      </Page>
    </AppShell>
  ),
};

/** The page built from its blocks. */
export const PageBlocks: Story = {
  render: () => (
    <AppShell>
      <Page.Root context="green">
        <Page.Header>
          <Bar>Page.Header</Bar>
        </Page.Header>
        <Page.Content>{twoCards}</Page.Content>
        <Page.Footer>
          <Bar>Page.Footer</Bar>
        </Page.Footer>
      </Page.Root>
    </AppShell>
  ),
};

/**
 * `narrow="keep"` keeps the columns below the minimum window, `overflow="keep"` stops a stack from
 * collapsing its cards, and `gap` replaces the density gap with a step of the spacing scale.
 */
export const KeepColumnsAndCards: Story = {
  tags: ['narrow'],
  render: () => (
    <AppShell>
      <Page>
        <Columns narrow="keep" gap={7}>
          <Card title="Orders">
            <Rows count={20} prefix="Order" />
          </Card>
          <Stack overflow="keep" gap={1} label="Status">
            {five.map((title) => (
              <Card key={title} title={title} tone="neutral">
                <Rows count={3} />
              </Card>
            ))}
          </Stack>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/**
 * Below the minimum window every `Columns` becomes tabs, also a nested one. A child without a label
 * (here a `Slot` around plain content) gets its number as the tab label.
 */
export const NestedTabs: Story = {
  tags: ['narrow'],
  render: () => (
    <AppShell>
      <Page>
        <Columns tabsLabel="Sections">
          <Card title="Orders">
            <Rows count={20} prefix="Order" />
          </Card>
          <Columns label="Regions" tabsLabel="Regions">
            <Card title="Region 1">
              <Rows prefix="Site" />
            </Card>
            <Card title="Region 2">
              <Rows count={3} prefix="Site" />
            </Card>
          </Columns>
          <Slot>
            <div style={{ border: '1px dashed var(--umbra-color-base-border-control)', padding: 12 }}>
              Plain content in a Slot without a label
            </div>
          </Slot>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/** `parts.tabs` replaces the tab strip. It receives the tabs, with the ids that link them to their panels. */
export const CustomTabStrip: Story = {
  tags: ['narrow'],
  render: () => (
    <AppShell>
      <Page>
        <Columns
          parts={{
            tabs: ({ tabs, onSelect }) => (
              <div role="tablist" aria-label="Views" style={{ flex: 'none', display: 'flex', gap: 16 }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={tab.tabId}
                    aria-selected={tab.selected}
                    aria-controls={tab.panelId}
                    onClick={() => onSelect(tab.id)}
                    style={{
                      padding: '6px 0',
                      border: 0,
                      borderBottom: `2px solid ${tab.selected ? 'currentColor' : 'transparent'}`,
                      background: 'none',
                      color: 'inherit',
                      font: 'var(--umbra-font-label)',
                      fontWeight: tab.selected ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ),
          }}
        >
          <Card title="Orders">
            <Rows count={20} prefix="Order" />
          </Card>
          <Card title="Reports">
            <Rows prefix="Report" />
          </Card>
          <Card title="People">
            <Rows prefix="Person" />
          </Card>
        </Columns>
      </Page>
    </AppShell>
  ),
};
