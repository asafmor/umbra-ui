import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../basics/Button';
import { Log } from '../stories/placeholders';
import { HistoryButtons } from './HistoryButtons';
import { TopBar } from './TopBar';

const meta = {
  title: 'Shell/HistoryButtons',
  component: HistoryButtons,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof HistoryButtons>;
export default meta;
type Story = StoryObj<typeof meta>;

const places = ['Overview', 'Orders', 'Open orders', 'Reports', 'Settings'];

/** A router of five places, standing in for the app's own. */
function Routed({ entries = false, brand }: { entries?: boolean; brand?: string }) {
  const [at, setAt] = useState(2);
  const [last, setLast] = useState('none');
  const go = (to: number, how: string) => {
    setAt(to);
    setLast(how);
  };
  return (
    <div>
      <TopBar.Root brand={brand}>
        <TopBar.Start>
          <HistoryButtons
            canGoBack={at > 0}
            canGoForward={at < places.length - 1}
            onBack={() => go(at - 1, 'back')}
            onForward={() => go(at + 1, 'forward')}
            entries={
              entries
                ? places
                    .map((label, i) => ({ id: String(i), label }))
                    .filter((entry) => entry.id !== String(at))
                    .reverse()
                : undefined
            }
            onNavigate={(id) => go(Number(id), `entry ${places[Number(id)]}`)}
          />
          <b>{places[at]}</b>
        </TopBar.Start>
      </TopBar.Root>
      {entries && (
        <label style={{ display: 'block', paddingTop: 8 }}>
          Notes{' '}
          <input
            type="text"
            // Styled in full, so the capture does not depend on the system's form control look.
            style={{
              font: 'inherit',
              color: 'inherit',
              width: 160,
              padding: '4px 8px',
              border: '1px solid var(--umbra-color-base-border-control)',
              borderRadius: 4,
              background: 'var(--umbra-color-base-surface1)',
            }}
          />
        </label>
      )}
      <Log>
        Place: {places[at]}. Last: {last}
      </Log>
    </div>
  );
}

/**
 * Router mode, on three brand colours: `canGoBack`, `canGoForward`, `onBack` and `onForward` come from
 * the app. A button with nowhere to go is disabled. The keys are Alt+Left and Alt+Right.
 */
export const Controlled: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <Routed />
      <Routed brand="#2b2f36" />
      <Routed brand="#e8e4f0" />
    </div>
  ),
};

/**
 * With `entries`, a caret opens the recent places; so do a long press and a right click on the
 * buttons. Choosing one calls `onNavigate`. While the text field has the focus, Alt+Left and Alt+Right
 * move the caret and not the history.
 */
export const Entries: Story = { render: () => <Routed entries /> };

/**
 * On their own the buttons drive the browser history, and are enabled when the browser says there is
 * somewhere to go (always, where it cannot say). The links below add history entries.
 */
export const Browser: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <HistoryButtons />
      <Button href="#one">Go to #one</Button>
      <Button href="#two">Go to #two</Button>
    </div>
  ),
};

/** Icons replaced through `parts`, labels translated, and no keys bound. */
export const Parts: Story = {
  render: () => (
    <HistoryButtons
      canGoBack
      canGoForward={false}
      onBack={() => {}}
      onForward={() => {}}
      entries={[{ id: '1', label: 'Overview' }]}
      backLabel="Previous place"
      forwardLabel="Next place"
      entriesLabel="Places"
      aria-label="Places"
      backShortcut={null}
      forwardShortcut={null}
      parts={{ backIcon: <ChevronLeft />, forwardIcon: <ChevronRight />, entriesIcon: <History /> }}
    />
  ),
};
