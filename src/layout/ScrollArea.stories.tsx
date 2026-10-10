import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rows } from '../stories/placeholders';
import { Columns } from './Columns';
import { ScrollArea } from './ScrollArea';
import { Slot } from './Slot';

const meta = {
  title: 'Layout/ScrollArea',
  component: ScrollArea,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof ScrollArea>;
export default meta;

const wide = (
  <div style={{ display: 'flex', gap: 12, width: 1600 }}>
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} style={{ flex: 1 }}>
        <Rows count={30} prefix={`Column ${i + 1}, row`} />
      </div>
    ))}
  </div>
);

/** Thin thumb, no track, and a fade on an edge that has more content. */
export const Axes: StoryObj<typeof meta> = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Slot label="Vertical">
        <ScrollArea>
          <Rows count={60} />
        </ScrollArea>
      </Slot>
      <Slot label="Thumb on hover">
        <ScrollArea scrollbar="hover" fade={false}>
          <Rows count={60} />
        </ScrollArea>
      </Slot>
      <Slot label="Horizontal">
        <ScrollArea axis="horizontal">{wide}</ScrollArea>
      </Slot>
      <Slot label="Both">
        <ScrollArea axis="both">{wide}</ScrollArea>
      </Slot>
    </Columns>
  ),
};
