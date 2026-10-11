import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { BarChart } from '../charts';
import { ListItem } from '../data/ListItem';
import { SearchField } from '../inputs/SearchField';
import { Select } from '../inputs/Select';
import { Card } from '../layout/Card';
import { Page } from '../layout/Page';
import { UmbraProvider } from '../provider/UmbraProvider';
import { AppShell } from '../shell/AppShell';
import { Log, Rows } from '../stories/placeholders';
import { DataTable } from '../table/DataTable';
import { CommandPalette } from './CommandPalette';
import { Menu } from './Menu';
import { Modal } from './Modal';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

// Overlays in combination: the layer order of plan/tokens.json ("layer"), and overlays opened from
// inside a modal, which render into the modal so they are above it and reachable.
const meta = { title: 'Overlays/Layers', component: Modal } satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = {
  density?: 'compact' | 'default' | 'spacious';
  context?: 'violet' | 'green' | 'teal' | 'grey';
};

const regions = ['North', 'South', 'East', 'West'].map((label) => ({ id: label.toLowerCase(), label }));
const suggestions = ['Order 12', 'Order 120', 'Orders by region'].map((label) => ({ id: label, label }));
const column = { display: 'grid', gap: 12, justifyItems: 'start' } as const;

function ModalWithOverlays() {
  const [last, setLast] = useState('none');
  return (
    <AppShell background="flat">
      <Page>
        <Card title="Orders">
          <Rows count={12} prefix="Order" />
          <Modal defaultOpen size="md" title="Edit order" footer={<Modal.Close>Close</Modal.Close>}>
            <div style={column}>
              <Tooltip content="Sends the order to the warehouse">
                <Button>Dispatch</Button>
              </Tooltip>
              <Menu
                trigger={<Button>Order actions</Button>}
                items={[
                  { id: 'duplicate', label: 'Duplicate' },
                  { id: 'archive', label: 'Archive' },
                ]}
                onAction={setLast}
              />
              <Select
                aria-label="Region"
                options={regions}
                placeholder="Choose a region"
                onChange={setLast}
              />
              <SearchField label="Find an order" suggestions={suggestions} onSelect={setLast} />
              <Popover trigger={<Button>Notes</Button>} title="Notes">
                <Button onPress={() => setLast('note')}>Add a note</Button>
              </Popover>
              <Log>Last: {last}</Log>
            </div>
          </Modal>
        </Card>
      </Page>
    </AppShell>
  );
}

/**
 * A tooltip, a menu, a select list, search suggestions and a popover opened from inside a modal. Each
 * is above the modal and can be used: it renders into the modal's layer, not beside it.
 */
export const InModal: Story = { render: () => <ModalWithOverlays /> };

const lines = [
  { id: 'a', item: 'Shelf bracket, powder coated, 300 mm, box of 40', note: 'Fragile' },
  { id: 'b', item: 'Bolt', note: 'None' },
];

function ModalWithData() {
  const [last, setLast] = useState('none');
  return (
    <AppShell background="flat">
      <Page>
        <Card title="Orders">
          <Rows count={12} prefix="Order" />
          <Modal defaultOpen size="md" title="Order lines" footer={<Modal.Close>Close</Modal.Close>}>
            <div style={{ ...column, width: 300, justifyItems: 'stretch' }}>
              <ListItem
                size="compact"
                title="A delivery note that is far too long to fit on one line of this list"
                onPress={() => setLast('note')}
              />
              <div style={{ height: 120 }}>
                <DataTable
                  aria-label="Lines"
                  data={lines}
                  getRowId={(line) => line.id}
                  columns={[
                    { id: 'item', header: 'Item', accessor: 'item', rowHeader: true, width: 180 },
                    { id: 'note', header: 'Note', accessor: 'note', width: 80, tooltip: 'Handling note' },
                  ]}
                />
              </div>
              <div style={{ height: 150, display: 'flex' }}>
                <Card
                  title="Lines of the order"
                  actions={
                    <>
                      <Button onPress={() => setLast('add')}>Add a line</Button>
                      <Button onPress={() => setLast('import')}>Import lines</Button>
                    </>
                  }
                >
                  <BarChart
                    aria-label="Units by line"
                    categories={['Bracket', 'Bolt']}
                    series={[{ id: 'units', label: 'Units', values: [40, 12] }]}
                    legend={false}
                  />
                </Card>
              </div>
              <Log>Last: {last}</Log>
            </div>
          </Modal>
        </Card>
      </Page>
    </AppShell>
  );
}

/**
 * Data inside a modal: the tooltip of a text that is cut, of a table cell and of a table header, a
 * chart's tooltip, and the menu of a card header that does not fit. Each is above the modal.
 */
export const DataInModal: Story = { render: () => <ModalWithData /> };

function PaletteAndModal({ globals }: { globals: Globals }) {
  const [last, setLast] = useState('none');
  return (
    <UmbraProvider {...globals}>
      <AppShell background="flat">
        <Page>
          <Card title="Orders">
            <Log>Last command: {last}</Log>
            <Rows count={12} prefix="Order" />
            <Modal defaultOpen size="md" title="Edit order" footer={<Modal.Close>Close</Modal.Close>}>
              Press the palette shortcut while this modal is open.
            </Modal>
            <CommandPalette
              commands={[
                { id: 'export', label: 'Export orders' },
                { id: 'print', label: 'Print' },
              ]}
              onRun={(command) => setLast(command.label)}
            />
          </Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}

/** The command palette opens over a modal (`Mod+K`): on top, with focus in its input. */
export const PaletteOverModal: Story = {
  render: (_, { globals }) => <PaletteAndModal globals={globals as Globals} />,
};
