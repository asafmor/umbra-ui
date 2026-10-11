import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronsDown, Download, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Card } from '../layout/Card';
import { Menu, type MenuEntry } from '../overlays/Menu';
import { Log } from '../stories/placeholders';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { SplitButton } from './SplitButton';

const meta = {
  title: 'Inputs/SplitButton',
  component: SplitButton,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SplitButton>;
export default meta;
type Story = StoryObj<typeof meta>;

const items: MenuEntry[] = [
  { id: 'copy', label: 'Save a copy' },
  { id: 'template', label: 'Save as template' },
  { type: 'separator' },
  { id: 'discard', label: 'Discard changes', danger: true },
];

function Logged() {
  const [last, setLast] = useState('nothing yet');
  return (
    <>
      <SplitButton variant="accent" items={items} onPress={() => setLast('save')} onAction={setLast}>
        Save
      </SplitButton>
      <Log>Last action: {last}.</Log>
    </>
  );
}

/** The five variants and two sizes of `Button`, as one control with two halves. */
export const Variants: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>Variants</Caption>
        <SplitButton items={items}>Neutral</SplitButton>
        <SplitButton variant="primary" items={items}>
          Primary
        </SplitButton>
        <Logged />
        <SplitButton variant="ghost" items={items}>
          Ghost
        </SplitButton>
        <SplitButton variant="danger" items={items}>
          Danger
        </SplitButton>
      </div>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>Small</Caption>
        <SplitButton size="small" items={items}>
          Neutral
        </SplitButton>
        <SplitButton size="small" variant="primary" items={items}>
          Primary
        </SplitButton>
        <SplitButton size="small" variant="accent" items={items}>
          Accent
        </SplitButton>
        <Caption>With an icon</Caption>
        <SplitButton iconStart={<Download />} items={items}>
          Export
        </SplitButton>
      </div>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>Loading: the menu stays usable</Caption>
        <SplitButton loading items={items}>
          Saving
        </SplitButton>
        <SplitButton variant="primary" loading iconStart={<Save />} items={items}>
          Saving
        </SplitButton>
        <Caption>Disabled</Caption>
        <SplitButton disabled items={items}>
          Neutral
        </SplitButton>
        <SplitButton variant="accent" disabled items={items}>
          Accent
        </SplitButton>
      </div>
      <div style={column}>
        <Caption>Full width</Caption>
        <SplitButton fullWidth items={items}>
          Fills its slot
        </SplitButton>
        <Caption>The action as a link</Caption>
        <div>
          <SplitButton href="#report" items={items}>
            Open the report
          </SplitButton>
        </div>
      </div>
    </div>
  ),
};

/** A field names and describes the pair, and disables both halves. The action can submit the form. */
export const InField: Story = {
  render: () => (
    <DemoForm style={{ ...column, maxWidth: 460 }}>
      <input type="hidden" name="draft" value="Draft 1" />
      <FormField label="Draft" description="Saved to your own space.">
        <SplitButton type="submit" variant="accent" items={items}>
          Save
        </SplitButton>
      </FormField>
      <FormField label="Export" error="Nothing to export yet.">
        <SplitButton items={items}>Export</SplitButton>
      </FormField>
      <FormField label="Archive" description="Disabled through the field." disabled>
        <SplitButton items={items}>Archive</SplitButton>
      </FormField>
    </DemoForm>
  ),
};

/** The `parts` prop (node, `null`, function), then the same control composed from the blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={grid(2)}>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>parts: a node replaces the caret icon</Caption>
        <SplitButton items={items} parts={{ caret: <ChevronsDown size={16} /> }}>
          Another caret
        </SplitButton>
        <Caption>parts: null hides the icon</Caption>
        <SplitButton items={items} iconStart={<Save />} parts={{ iconStart: null }}>
          No icon
        </SplitButton>
        <Caption>parts: a function wraps the label</Caption>
        <SplitButton items={items} parts={{ label: (p) => <em>{p.children}</em> }}>
          Wrapped
        </SplitButton>
      </div>
      <div style={{ ...column, justifyItems: 'start' }}>
        <Caption>Blocks, with the rows as Menu blocks</Caption>
        <SplitButton.Root variant="primary">
          <SplitButton.Action iconStart={<Save />}>Composed by hand</SplitButton.Action>
          <SplitButton.Menu label="Other ways to save">
            <Menu.Item id="copy">Save a copy</Menu.Item>
            <Menu.Item id="template">Save as template</Menu.Item>
          </SplitButton.Menu>
        </SplitButton.Root>
      </div>
    </div>
  ),
};

/**
 * Among actions that no longer fit (here the header of a narrow card) the action is a row of the
 * "more" menu, and its own menu a submenu after it.
 */
export const InOverflowMenu: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {[520, 240].map((width) => (
        <div key={width} data-width={width} style={{ width, height: 160, display: 'flex' }}>
          <Card
            title="Report for this week"
            actions={
              <>
                <SplitButton items={items} menuLabel="More ways to save">
                  Save
                </SplitButton>
                <Button>Share</Button>
              </>
            }
          >
            The card is {width}px wide.
          </Card>
        </div>
      ))}
    </div>
  ),
};

/** The label truncates as the slot narrows; the caret keeps its width. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      {[260, 150, 90].map((width) => (
        <Width key={width} width={width}>
          <SplitButton items={items}>Save the whole report</SplitButton>
        </Width>
      ))}
    </div>
  ),
};

/** Right to left: the caret is at the left, and the menu opens under it. */
export const RightToLeft: Story = {
  render: () => (
    <div style={{ ...column, justifyItems: 'start' }}>
      <SplitButton items={items}>Neutral</SplitButton>
      <SplitButton variant="primary" iconStart={<Save />} items={items}>
        Primary
      </SplitButton>
    </div>
  ),
  globals: { direction: 'rtl' },
};
