// The cases of review 2 that no other story holds: overlays that stand alone inside another overlay,
// a stack that collapses inside one, bare-key shortcuts beside every kind of control, and rows whose
// controls cannot move into the "more" menu. The behaviour is tested in
// tests/visual/review2-crosscutting.spec.ts.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Checkbox } from '../inputs/Checkbox';
import { SearchField } from '../inputs/SearchField';
import { Select } from '../inputs/Select';
import { TextField } from '../inputs/TextField';
import { Toggle } from '../inputs/Toggle';
import { Card } from '../layout/Card';
import { Page } from '../layout/Page';
import { Stack } from '../layout/Stack';
import { ActionBar } from '../overlays/ActionBar';
import { Menu } from '../overlays/Menu';
import { Modal } from '../overlays/Modal';
import { Popover } from '../overlays/Popover';
import { ShortcutsSheet } from '../overlays/ShortcutsSheet';
import { Spotlight } from '../overlays/Spotlight';
import { Tooltip } from '../overlays/Tooltip';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import { AppShell } from '../shell/AppShell';
import { EntitySwitcher } from '../shell/EntitySwitcher';
import { DataTable, type DataTableColumn } from '../table/DataTable';
import { Log, Rows } from './placeholders';

const meta = { title: 'Integration/Review 2' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density?: Density; context?: ContextTint };

/** `&in=popover` in the address puts the case in a popover, `&in=page` in the page; a modal otherwise. */
const where = () => new URLSearchParams(window.location.search).get('in') ?? 'modal';

function Container({ children }: { children: ReactNode }) {
  const place = where();
  const [log, setLog] = useState('open');
  return (
    <AppShell background="flat">
      <Page>
        <Card title="Orders">
          <Rows count={4} prefix="Order" />
          <Log>Container: {log}</Log>
          {place === 'page' && children}
          {place === 'modal' && (
            <Modal
              defaultOpen
              size="md"
              title="Edit order"
              onOpenChange={(open) => setLog(open ? 'open' : 'closed')}
            >
              {children}
            </Modal>
          )}
          {place === 'popover' && (
            <Popover
              defaultOpen
              size="large"
              trigger={<Button>Details</Button>}
              title="Details"
              dismissOnBlur={false}
              onOpenChange={(open) => setLog(open ? 'open' : 'closed')}
            >
              {children}
            </Popover>
          )}
        </Card>
      </Page>
    </AppShell>
  );
}

function Cards() {
  const [cards, setCards] = useState(['Summary', 'Notes', 'History']);
  const [last, setLast] = useState('none');
  return (
    <>
      {/* Too short for three cards: the stack collapses the two of lower priority to their headers. */}
      <div style={{ height: 190, display: 'flex' }}>
        <Stack>
          {cards.map((title, i) => (
            <Card key={title} title={title} priority={i === 0 ? 1 : 0}>
              <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
                <Button onPress={() => setLast(title)}>Use {title}</Button>
                <Button onPress={() => setCards((all) => all.filter((card) => card !== title))}>
                  Remove {title}
                </Button>
              </div>
            </Card>
          ))}
        </Stack>
      </div>
      <Log>Last: {last}</Log>
    </>
  );
}

/**
 * A stack too short for its cards, in a modal (or with `&in=popover`, `&in=page`). The header of a
 * collapsed card opens its content in a popover inside the modal, and the modal stays as it is.
 */
export const CollapsedCards: Story = {
  render: () => (
    <Container>
      <Cards />
    </Container>
  ),
};

const regions = ['North', 'South', 'East'].map((label) => ({ id: label.toLowerCase(), label }));

function Overlays() {
  const [last, setLast] = useState('none');
  const [panel, setPanel] = useState(false);
  const [menu, setMenu] = useState(false);
  const [tour, setTour] = useState(false);
  const panelAnchor = useRef<HTMLDivElement>(null);
  const menuAnchor = useRef<HTMLDivElement>(null);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <div ref={panelAnchor}>
        <Button onPress={() => setPanel(!panel)}>Panel</Button>
      </div>
      <Popover anchorRef={panelAnchor} open={panel} onOpenChange={setPanel} aria-label="Panel">
        <Button onPress={() => setLast('panel')}>In the panel</Button>
      </Popover>
      {/* Never opened: it must not be there at all. */}
      <Popover.Content anchorRef={panelAnchor} open={false} aria-label="Never open">
        Never
      </Popover.Content>
      <div ref={menuAnchor}>
        <Button onPress={() => setMenu(!menu)}>Rows</Button>
      </div>
      <Menu
        anchorRef={menuAnchor}
        open={menu}
        onOpenChange={setMenu}
        aria-label="Rows"
        items={[
          { id: 'one', label: 'Row one' },
          { id: 'two', label: 'Row two' },
        ]}
        onAction={setLast}
      />
      <Tooltip content="Explains the button">
        <Button data-tour="hint">Hint</Button>
      </Tooltip>
      <Select aria-label="Region" options={regions} placeholder="Region" onChange={setLast} />
      <EntitySwitcher
        aria-label="Workspace"
        items={[
          { id: 'w1', label: 'Workspace 1' },
          { id: 'w2', label: 'Workspace 2' },
        ]}
        defaultValue="w1"
        onChange={(id) => setLast(String(id))}
      />
      <Button onPress={() => setTour(true)}>Tour</Button>
      <Spotlight open={tour} onOpenChange={setTour} target='[data-tour="hint"]' title="The hint">
        It explains itself.
      </Spotlight>
      <Log>Last: {last}</Log>
    </div>
  );
}

/**
 * Every overlay that can be opened without a trigger of its own kind, inside a modal (or with
 * `&in=popover`): each has its own open state, and none takes the modal's.
 */
export const StandaloneOverlays: Story = {
  render: () => (
    <Container>
      <Overlays />
    </Container>
  ),
};

function Keys({ globals }: { globals: Globals }) {
  const [count, setCount] = useState(0);
  // A spotlight: `locked` lets nothing but its callout be used, `usable` leaves its target free.
  const [spot, setSpot] = useState<'locked' | 'usable' | null>(null);
  const [dialog, setDialog] = useState(false);
  const [tour, setTour] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const note = (event: string) => setEvents((all) => [...all, event]);
  return (
    <UmbraProvider
      density={globals.density}
      context={globals.context}
      shortcuts={[{ id: 'app.new', keys: 'n', label: 'New order', action: () => setCount((n) => n + 1) }]}
    >
      <AppShell background="flat">
        <Page>
          <Card title="Controls">
            <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
              <Checkbox>Checkbox</Checkbox>
              <Toggle>Toggle</Toggle>
              <label>
                <input type="radio" name="plain" aria-label="Radio" /> Radio
              </label>
              <input type="range" aria-label="Range" />
              <input type="date" aria-label="Date" />
              <Button>Button</Button>
              <TextField aria-label="Text" />
              <div role="textbox" tabIndex={0} aria-label="Custom text" style={{ minWidth: 80 }}>
                Text
              </div>
              <Log>New orders: {count}</Log>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onPress={() => setSpot('locked')}>Show locked</Button>
                <Button onPress={() => setSpot('usable')}>Show usable</Button>
                <Button onPress={() => (setEvents([]), setTour(true))}>Missing tour</Button>
              </div>
              <div data-spot="" style={{ padding: 8 }}>
                <Button onPress={() => setDialog(true)}>Open dialog</Button>
              </div>
              <Log>
                Spotlight: {spot ?? 'closed'}. Tour: {events.join(', ') || 'no events'}
              </Log>
            </div>
          </Card>
          <Spotlight
            open={spot !== null}
            onOpenChange={(open) => open || setSpot(null)}
            interactive={spot === 'usable'}
            target="[data-spot]"
            title="The dialog button"
          >
            It opens a dialog.
          </Spotlight>
          {/* Every target is missing: the tour passes over each step and closes. */}
          <Spotlight
            open={tour}
            onOpenChange={(open) => (note(open ? 'open' : 'closed'), setTour(open))}
            onStepChange={(step) => note(`step ${step}`)}
            steps={[
              { target: '.missing-1', title: 'One' },
              { target: '.missing-2', title: 'Two' },
              { target: '.missing-3', title: 'Three' },
            ]}
          />
          <Modal open={dialog} onOpenChange={setDialog} title="A dialog">
            Opened while a spotlight was showing.
          </Modal>
          <ShortcutsSheet />
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}

/** A bare key is a shortcut on a checkbox, a radio, a slider or a button, and text in a field. */
export const Shortcuts: Story = { render: (_, { globals }) => <Keys globals={globals} /> };

const sorts = ['Newest', 'Oldest', 'Largest'].map((label) => ({ id: label.toLowerCase(), label }));

function Kept() {
  const [last, setLast] = useState('none');
  const press = (name: string) => () => setLast(name);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      {[380, 240].map((width) => (
        <div key={width} data-width={width} style={{ width, display: 'grid', gap: 16 }}>
          <div style={{ height: 150, display: 'flex' }}>
            <Card
              title="Orders by region"
              actions={
                <>
                  <SearchField aria-label="Search orders" placeholder="Search" />
                  <Select aria-label="Sort" options={sorts} defaultValue="newest" />
                  <Button onPress={press('Export')}>Export</Button>
                  <Button onPress={press('Refresh')}>Refresh</Button>
                </>
              }
            >
              <Log>Last: {last}</Log>
            </Card>
          </div>
          <div style={{ height: 260, display: 'flex' }}>
            <Card
              title="Filters"
              actions={
                <>
                  <Checkbox>Only open orders</Checkbox>
                  <Toggle>Live</Toggle>
                  <TextField aria-label="Owner" placeholder="Owner" />
                  <Select aria-label="Region" options={regions} placeholder="Region" />
                  <SearchField aria-label="Search filters" placeholder="Search" />
                  <Checkbox>Mine</Checkbox>
                  <Select aria-label="Order" options={sorts} defaultValue="newest" />
                </>
              }
            >
              <Log>Body</Log>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Controls that cannot be rows of the "more" menu, in cards of 380 and 240 pixels: the title keeps a
 * minimum, the controls shrink to theirs and then take more lines. Nothing is cut, nothing leaves the card.
 */
export const KeptControls: Story = { parameters: { frame: 'padded' }, render: () => <Kept /> };

interface Order {
  id: string;
  name: string;
  amount: number;
}
const orders: Order[] = Array.from({ length: 40 }, (_, i) => ({
  id: `o${i}`,
  name: `Order ${i + 1}`,
  amount: 100 + i * 7,
}));

function Bar() {
  // `&footer=0` in the address leaves the summary row out.
  const footer = new URLSearchParams(window.location.search).get('footer') !== '0';
  const [selected, setSelected] = useState(['o0', 'o1']);
  const [last, setLast] = useState('none');
  const columns: DataTableColumn<Order>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: 'name',
      rowHeader: true,
      pin: 'start',
      footer: footer ? (rows) => `${rows.length} orders` : undefined,
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      align: 'end',
      footer: footer ? (rows) => String(rows.reduce((sum, row) => sum + row.amount, 0)) : undefined,
    },
  ];
  return (
    <AppShell background="flat">
      <Page>
        <Card title="Orders" padding="none" subtitle={`Last: ${last}`}>
          <DataTable
            aria-label="Orders"
            data={orders}
            getRowId={(order) => order.id}
            columns={columns}
            selectionMode="multiple"
            selectedIds={selected}
            onSelectionChange={setSelected}
          />
          <ActionBar
            variant="floating"
            aria-label="Selected orders"
            selectionCount={selected.length}
            onClearSelection={() => setSelected([])}
            secondary={[{ label: 'Flag', onPress: () => setLast('Flag') }]}
            primary={[{ label: 'Archive', onPress: () => setLast('Archive') }]}
          />
        </Card>
      </Page>
    </AppShell>
  );
}

/**
 * The floating bar of a selection over a table with a summary row (`&footer=0`: without one) and a
 * pinned column: the bar is above every sticky row and cell of the table.
 */
export const BarOverTable: Story = { render: () => <Bar /> };
