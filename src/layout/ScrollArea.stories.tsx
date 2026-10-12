import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log, Rows } from '../stories/placeholders';
import { Columns } from './Columns';
import { ScrollArea } from './ScrollArea';
import { Slot } from './Slot';
import { Stack } from './Stack';

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

function ReachEndArea() {
  const [count, setCount] = useState(0);
  return (
    <Stack style={{ height: '100%' }}>
      <Slot size="content">
        <Log>Reached the end {count} times</Log>
      </Slot>
      <Slot>
        <ScrollArea onReachEnd={() => setCount((c) => c + 1)}>
          <Rows count={60} />
        </ScrollArea>
      </Slot>
    </Stack>
  );
}

/** `onReachEnd` is called once each time the end is reached, for loading more. */
export const ReachEnd: StoryObj<typeof meta> = { render: () => <ReachEndArea /> };

/**
 * Content with nothing focusable in it makes the area itself a focus stop, named by `label`, so the
 * arrow keys can scroll it. Content with a control in it does not need that.
 */
export const Keyboard: StoryObj<typeof meta> = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Slot label="Text only">
        <ScrollArea aria-label="Item list">
          <Rows count={60} />
        </ScrollArea>
      </Slot>
      <Slot label="With controls">
        <ScrollArea>
          <Button size="small">Add item</Button>
          <Rows count={60} />
        </ScrollArea>
      </Slot>
    </Columns>
  ),
};

/** The fade: replaced through `parts.fade` (here a line on each edge), hidden with `null`, or turned off. */
export const Fades: StoryObj<typeof meta> = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Slot label="Default">
        <ScrollArea>
          <Rows count={60} />
        </ScrollArea>
      </Slot>
      <Slot label="Replaced">
        <ScrollArea
          parts={{
            fade: ({ edge }) => (
              <div
                key={edge}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  insetInline: 0,
                  [edge === 'start' ? 'top' : 'bottom']: 0,
                  height: 2,
                  background: 'var(--umbra-color-interaction-text)',
                }}
              />
            ),
          }}
        >
          <Rows count={60} />
        </ScrollArea>
      </Slot>
      <Slot label="Hidden part">
        <ScrollArea parts={{ fade: null }}>
          <Rows count={60} />
        </ScrollArea>
      </Slot>
      <Slot label="Off, thumb on hover">
        <ScrollArea fade={false} scrollbar="hover">
          <Rows count={60} />
        </ScrollArea>
      </Slot>
    </Columns>
  ),
};
