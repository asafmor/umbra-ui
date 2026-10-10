import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Filter, Folder, ScanSearch, User } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import type { Shortcut } from '../provider/shortcuts';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import { Log } from '../stories/placeholders';
import { FormField } from './FormField';
import { Caption, column, DemoForm, grid, Width } from './samples';
import { SearchField, type SearchSuggestion } from './SearchField';

const meta = {
  title: 'Inputs/SearchField',
  component: SearchField,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

const shortcuts: Shortcut[] = [{ id: 'orders.search', keys: 'Mod+E', label: 'Search orders' }];

const everything: SearchSuggestion[] = [
  { id: 'order-12', label: 'Order 12', description: 'Region 1', icon: <FileText />, section: 'Orders' },
  { id: 'order-120', label: 'Order 120', description: 'Region 4', icon: <FileText />, section: 'Orders' },
  { id: 'person-a', label: 'Person A', description: 'Lead reviewer', icon: <User />, section: 'People' },
  { id: 'person-b', label: 'Person B', description: 'Analyst', icon: <User />, section: 'People' },
  { id: 'reports', label: 'Reports', icon: <Folder /> },
];
const matching = (text: string) =>
  everything.filter((s) => (s.label as string).toLowerCase().includes(text.trim().toLowerCase()));

const bar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 8,
  border: '1px dashed var(--umbra-color-base-border-strong)',
};
const spacer: CSSProperties = { flex: '1 1 0' };

function Controlled() {
  const [value, setValue] = useState('Order 12');
  const [submitted, setSubmitted] = useState('nothing');
  const [cleared, setCleared] = useState(0);
  return (
    <>
      <SearchField
        label="Controlled"
        value={value}
        onChange={setValue}
        onSubmit={setSubmitted}
        onClear={() => setCleared(cleared + 1)}
      />
      <Log>
        Value: "{value}". Submitted: {submitted}. Cleared: {cleared}.
      </Log>
    </>
  );
}

/** Every state of the expanded form. The key hint shows while the field is empty and not focused. */
export const States: Story = {
  render: (_, { globals }) => (
    <UmbraProvider {...(globals as Globals)} shortcuts={shortcuts}>
      <div style={grid(4)}>
        <div style={column}>
          <Caption>Default</Caption>
          <SearchField label="Empty" />
          <SearchField label="Placeholder" placeholder="Search orders" />
          <SearchField label="With text" defaultValue="Order 12" />
          <Caption>Controlled, with submit and clear</Caption>
          <Controlled />
        </div>
        <div style={column}>
          <Caption>Key hint: its own keys</Caption>
          <SearchField label="Slash" placeholder="Search" shortcut="/" />
          <Caption>Key hint: from the shortcut list</Caption>
          <SearchField label="Orders" placeholder="Search orders" shortcut="orders.search" />
          <Caption>Loading</Caption>
          <SearchField label="Loading" loading defaultValue="Order" />
        </div>
        <div style={column}>
          <Caption>Invalid</Caption>
          <SearchField label="Invalid" invalid defaultValue="??" />
          <Caption>Disabled</Caption>
          <SearchField label="Disabled" disabled defaultValue="Order 12" shortcut="/" />
          <Caption>Read-only</Caption>
          <SearchField label="Read-only" readOnly defaultValue="Order 12" />
        </div>
        <div style={column}>
          <Caption>Small</Caption>
          <SearchField label="Small" size="small" placeholder="Search" />
          <SearchField label="Small with text" size="small" defaultValue="Order 12" />
          <Caption>A search landmark</Caption>
          <SearchField label="Site search" landmark placeholder="Search everything" />
        </div>
      </div>
    </UmbraProvider>
  ),
};

/**
 * The collapsible form: an icon that opens into the field when pressed or focused, and closes again when
 * empty and blurred. `overlay` opens over the space beside it, so nothing moves; `inline` takes the space.
 */
export const Collapsible: Story = {
  render: () => (
    <div style={{ ...column, gap: 16, maxWidth: 720 }}>
      <Caption>overlay (the default): grows towards the start, over its neighbours</Caption>
      <div style={bar} data-bar="overlay">
        <Button>Orders</Button>
        <Button>Reports</Button>
        <span style={spacer} />
        <Button>Export</Button>
        <SearchField label="Search orders" collapsible placeholder="Search orders" shortcut="/" />
        <IconButton label="Filter" icon={<Filter />} />
      </div>
      <Caption>overlay, growing towards the end, with a label beside the icon</Caption>
      <div style={bar} data-bar="overlay-end">
        <SearchField label="Search" collapsible expandTo="end" collapsedLabel="Search" placeholder="Search" />
        <Button>Orders</Button>
        <Button>Reports</Button>
      </div>
      <Caption>inline: takes the space, and its neighbours move</Caption>
      <div style={bar} data-bar="inline">
        <Button>Orders</Button>
        <span style={spacer} />
        <SearchField label="Search reports" collapsible expandMode="inline" placeholder="Search reports" />
        <Button>Export</Button>
      </div>
      <Caption>With text it stays open</Caption>
      <div style={bar} data-bar="text">
        <Button>Orders</Button>
        <span style={spacer} />
        <SearchField label="Search items" collapsible expandMode="inline" defaultValue="Item 4" />
      </div>
    </div>
  ),
};

function WithSuggestions({ loading = false }: { loading?: boolean }) {
  const [text, setText] = useState('');
  const [recent, setRecent] = useState(['Order 12', 'Region 4']);
  const [log, setLog] = useState('nothing');
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
      <div style={{ width: 320 }}>
        <SearchField
          label="Search"
          placeholder="Search orders and people"
          value={text}
          onChange={setText}
          loading={loading}
          suggestions={loading ? [] : text ? matching(text) : []}
          recent={recent}
          onSelect={(id) => setLog(`selected ${id}`)}
          onSubmit={(submitted) => setLog(`submitted ${submitted}`)}
          onRemoveRecent={(entry) => setRecent(recent.filter((r) => r !== entry))}
        />
      </div>
      <Log>
        Text: "{text}". Last: {log}. Recent: {recent.join(', ') || 'none'}.
      </Log>
    </div>
  );
}

/**
 * Suggestions in a list under the field: the arrow keys move through them and Enter chooses one. While the
 * field is empty the list holds the recent searches. The app supplies the rows for the text typed.
 */
export const Suggestions: Story = { render: () => <WithSuggestions /> };

/** While loading without rows, the list shows skeleton rows and the field a spinner. */
export const SuggestionsLoading: Story = { render: () => <WithSuggestions loading /> };

function Debounced() {
  const [value, setValue] = useState('');
  const [calls, setCalls] = useState(0);
  return (
    <div style={{ ...column, width: 320 }}>
      <SearchField
        label="Debounced"
        placeholder="onChange waits 400ms"
        debounce={400}
        onChange={(next) => {
          setValue(next);
          setCalls((n) => n + 1);
        }}
        onSubmit={() => {}}
      />
      <Log>
        Value: "{value}". Calls: {calls}.
      </Log>
    </div>
  );
}

/** `debounce` holds `onChange` back until typing pauses. Enter and the clear button do not wait. */
export const Debounce: Story = { render: () => <Debounced /> };

/** Inside a `FormField` the field takes its label, description and error; `name` sends the text with the form. */
export const InFormField: Story = {
  render: () => (
    <div style={grid(2)}>
      <DemoForm style={column}>
        <FormField label="Find an order" description="By number or region." layout="stacked">
          <SearchField name="query" defaultValue="Order 12" />
        </FormField>
        <FormField label="Find a person" layout="stacked">
          <SearchField name="person" defaultValue="P" />
        </FormField>
        <div>
          <Button type="submit" variant="accent">
            Save
          </Button>
        </div>
      </DemoForm>
      {/* An invalid control holds its form back, so this one is outside the form. */}
      <FormField label="Find a region" layout="stacked" error="Type at least two letters">
        <SearchField defaultValue="R" />
      </FormField>
    </div>
  ),
};

/** In a card's toolbar and header. */
export const InToolbar: Story = {
  render: () => (
    <Columns style={{ height: 240 }}>
      <Card
        title="Orders"
        actions={<SearchField label="Search the card" collapsible placeholder="Search" />}
        parts={{
          toolbar: (
            <Card.Toolbar>
              <div style={{ width: 280 }}>
                <SearchField label="Filter orders" size="small" placeholder="Filter orders" shortcut="/" />
              </div>
              <Button size="small">Export</Button>
            </Card.Toolbar>
          ),
        }}
      >
        <Log>The card's content.</Log>
      </Card>
    </Columns>
  ),
};

/**
 * As the slot narrows the key hint hides first. A collapsible field that takes space then gives it back:
 * it opens over its neighbours instead.
 */
export const Narrow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
      {[260, 150, 90].map((width) => (
        <Width key={width} width={width}>
          <SearchField label={`Search at ${width}`} placeholder="Search" shortcut="/" />
        </Width>
      ))}
      {[320, 150].map((width) => (
        <Width key={`c${width}`} width={width + 100}>
          <div style={{ display: 'flex', gap: 8, width }} data-row={width}>
            <Button>Export</Button>
            <SearchField
              label={`Collapsible at ${width}`}
              collapsible
              expandMode="inline"
              expandTo="end"
              defaultValue="Item"
            />
          </div>
        </Width>
      ))}
    </div>
  ),
};

/** Every kind of part (a node, `null`, a function), and the same field composed from its blocks. */
export const Parts: Story = {
  render: () => (
    <div style={grid(4)}>
      <div style={column}>
        <Caption>icon: a node</Caption>
        <SearchField
          label="Custom icon"
          placeholder="Scan"
          parts={{ icon: <ScanSearch size={18} aria-hidden="true" /> }}
        />
        <Caption>icon: null</Caption>
        <SearchField label="No icon" placeholder="Search" parts={{ icon: null }} />
      </div>
      <div style={column}>
        <Caption>clear: null</Caption>
        <SearchField label="No clear button" defaultValue="Order 12" parts={{ clear: null }} />
        <Caption>shortcut: a function</Caption>
        <SearchField
          label="Wrapped hint"
          placeholder="Search"
          shortcut="/"
          parts={{
            shortcut: (p) => (
              <>
                <small>press</small>
                <SearchField.Shortcut {...p} />
              </>
            ),
          }}
        />
      </div>
      <div style={column}>
        <Caption>suggestion: a function</Caption>
        <SearchField
          label="Wrapped rows"
          placeholder="Focus to see the rows"
          suggestions={everything.slice(0, 2)}
          parts={{
            suggestion: ({ children, suggestion }) => (
              <>
                {children}
                <small>#{suggestion?.id}</small>
              </>
            ),
          }}
        />
      </div>
      <div style={column}>
        <Caption>Composed from the blocks</Caption>
        <SearchField.Root label="By hand" placeholder="Search" defaultValue="Order">
          <SearchField.Input />
          <SearchField.Clear label="Empty the field" />
          <SearchField.Icon />
        </SearchField.Root>
      </div>
    </div>
  ),
};
