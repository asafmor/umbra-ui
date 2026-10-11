import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '../basics/IconButton';
import { Log, Rows } from '../stories/placeholders';
import { Card } from './Card';
import { Stack } from './Stack';

// This file imports nothing that holds a menu or a popover, so the built Storybook loads their code
// the way an app does: on demand (plan/decisions/05-packaging.md, "Loaded on demand"). Keep it so:
// `tests/visual/card-menu.spec.ts` watches the requests.
const meta = {
  title: 'Layout/Card on demand',
  component: Card,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

function Cards() {
  const [last, setLast] = useState('none');
  const actions = (
    <>
      <IconButton icon={<Filter />} label="Filter" onPress={() => setLast('Filter')} />
      <IconButton icon={<Download />} label="Export" onPress={() => setLast('Export')} />
      <IconButton icon={<RefreshCw />} label="Refresh" onPress={() => setLast('Refresh')} />
    </>
  );
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* A third of the window: in a narrow window the actions no longer fit. */}
      <div style={{ width: '32%', minWidth: 0, display: 'flex' }}>
        <Card title="Quarterly review" actions={actions}>
          <Log>Last action: {last}</Log>
        </Card>
      </div>
      {/* Part of the window's height: in a short window the stack collapses its second card. */}
      <div style={{ width: 320, height: '60%', display: 'flex' }}>
        <Stack>
          <Card title="Orders" priority={1} minHeight={120}>
            <Rows count={3} prefix="Order" />
          </Card>
          <Card title="Exports" minHeight={120} actions={actions}>
            <Rows count={3} prefix="File" />
          </Card>
        </Stack>
      </div>
    </div>
  );
}

/**
 * A card loads the menu of its header the first time the header does not fit, and its popover the
 * first time a stack collapses it. Here everything fits; narrow the window and the actions of the first
 * card move into a "more" menu, shorten it and the second card of the stack collapses to its header.
 */
export const FitsUntilTheWindowShrinks: Story = { render: () => <Cards /> };
