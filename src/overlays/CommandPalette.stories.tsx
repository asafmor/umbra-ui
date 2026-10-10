import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import { appShortcuts, commands } from '../shell/samples';
import { Log } from '../stories/placeholders';
import { CommandPalette, type Command, type CommandPaletteProps } from './CommandPalette';

const meta = {
  title: 'Overlays/CommandPalette',
  component: CommandPalette,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof CommandPalette>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

/** The page behind the palette: a button that opens it, and a line that shows what ran. */
function App({ globals, ...palette }: CommandPaletteProps & { globals: unknown }) {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState('none');
  const [action, setAction] = useState(0);
  return (
    <UmbraProvider
      {...(globals as Globals)}
      shortcuts={[
        ...appShortcuts.slice(0, 2),
        { ...appShortcuts[2]!, action: () => setAction((n) => n + 1) },
      ]}
    >
      <Button onPress={() => setOpen(true)}>Open the palette</Button>
      <Log>
        Last command: {last}. Shortcut actions: {action}
      </Log>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        onRun={(command) => setLast(command.label)}
        navigate={(href) => setLast((label) => `${label} (${href})`)}
        {...palette}
      />
    </UmbraProvider>
  );
}

/**
 * A fixed list in sections, with the recent commands first while the input is empty. Type to filter:
 * the start of a label ranks above the start of a word, text inside it, and keywords.
 */
export const Default: Story = {
  render: (_, { globals }) => <App globals={globals} commands={commands} recent={['export', 'orders']} />,
};

/** `includeShortcuts` lists the provider's shortcuts that have a label, each with its keys. */
export const Shortcuts: Story = {
  render: (_, { globals }) => <App globals={globals} commands={commands.slice(0, 3)} includeShortcuts />,
};

const people = Array.from({ length: 30 }, (_, i) => `Person ${i + 1}`);
/** A lookup that takes a moment. A text that starts with "slow" takes longer, and "fail" fails once. */
function useLookup() {
  const [failed, setFailed] = useState(false);
  return (text: string) =>
    new Promise<Command[]>((resolve, reject) => {
      const wanted = text.replace('slow', '').trim().toLowerCase();
      const answer = () => {
        if (text === 'fail' && !failed) {
          setFailed(true);
          return reject(new Error('lookup failed'));
        }
        resolve(
          people
            .filter((name) => name.toLowerCase().includes(wanted))
            .slice(0, 12)
            .map((label) => ({ id: label, label, section: 'People', icon: <UserRound /> })),
        );
      };
      setTimeout(answer, text.startsWith('slow') ? 1500 : text ? 60 : 0);
    });
}
function AsyncApp({ globals }: { globals: unknown }) {
  return <App globals={globals} commands={commands.slice(0, 2)} onQuery={useLookup()} debounce={100} />;
}

/**
 * `onQuery` looks results up as the user types (after `debounce`), and they are listed after the
 * matches from `commands`. A late answer to an earlier text is dropped. A failed lookup shows the
 * error state with a retry button.
 */
export const Async: Story = { render: (_, { globals }) => <AsyncApp globals={globals} /> };

/** `loading` shows placeholder rows in the final layout, under the results that are already there. */
export const Loading: Story = {
  render: (_, { globals }) => <App globals={globals} commands={commands.slice(0, 2)} loading />,
};

/** Nothing to list, and nothing matching. */
export const Empty: Story = { render: (_, { globals }) => <App globals={globals} commands={[]} /> };

/** `error` shows the error state in place of looked-up results; fixed commands stay usable. */
export const ErrorState: Story = {
  name: 'Error',
  render: (_, { globals }) => (
    <App globals={globals} commands={commands.slice(0, 2)} error="The search service did not answer" />
  ),
};

/**
 * Parts changed by a function (item, section header), replaced by a node (the search icon, the empty
 * state) and hidden with `null` (the footer); translated texts.
 */
export const Parts: Story = {
  render: (_, { globals }) => (
    <App
      globals={globals}
      commands={commands.slice(0, 4)}
      label="Search everything"
      placeholder="Search everything"
      resultsLabel="Matches"
      parts={{
        searchIcon: <Search data-part="searchIcon" width={16} height={16} />,
        item: (p) => (
          <>
            {p.children}
            {p.active && <small>Enter</small>}
          </>
        ),
        sectionHeader: (p) => (
          <div data-part="sectionHeader" style={{ padding: '8px 12px', fontWeight: 700 }}>
            {p.children}:
          </div>
        ),
        empty: <div data-part="empty">Nothing here</div>,
        footer: null,
      }}
    />
  ),
};
