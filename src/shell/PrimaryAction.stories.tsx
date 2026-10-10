import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, ChevronsRight, Mail } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { UmbraProvider, type ContextTint, type Density } from '../provider/UmbraProvider';
import { Log } from '../stories/placeholders';
import { PrimaryAction } from './PrimaryAction';
import { appShortcuts } from './samples';

const meta = {
  title: 'Shell/PrimaryAction',
  component: PrimaryAction,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof PrimaryAction>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

// A strip as tall as the top bar: the action fills its height.
const strip: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  height: 'var(--umbra-size-top-bar-height)',
  background: 'var(--umbra-color-brand)',
};
const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 12,
};
const Strip = ({ children, width }: { children: ReactNode; width?: number }) => (
  <div style={{ ...strip, width }}>{children}</div>
);
const menu = [
  { id: 'skip', label: 'Skip to the next review' },
  { id: 'pause', label: 'Pause here' },
];

/**
 * Every state: the label alone, with an icon (at the end or the start), a description, a count, the
 * attention marker, loading, disabled, as a link, and with a menu of alternatives.
 */
export const States: Story = {
  args: { label: 'Continue' },
  render: () => (
    <div style={grid}>
      <Strip>
        <PrimaryAction label="Continue" />
      </Strip>
      <Strip>
        <PrimaryAction label="Continue" icon={<ChevronsRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Open inbox" icon={<Mail />} iconPosition="start" />
      </Strip>
      <Strip>
        <PrimaryAction label="Continue" description="To Monday 12 October" icon={<ChevronsRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Review items" badge={3} icon={<ChevronsRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Answer first" attention icon={<ChevronsRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Continuing" loading icon={<ChevronsRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Continue" disabled icon={<ChevronsRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Next page" href="#next" icon={<ArrowRight />} />
      </Strip>
      <Strip>
        <PrimaryAction label="Continue" icon={<ChevronsRight />} menu={menu} />
      </Strip>
    </div>
  ),
};

/**
 * As its slot narrows: the description hides, then the label, and the icon alone is left with the
 * label as its tooltip and name. The count and the attention marker move to the corner of the icon.
 * Without an icon nothing collapses.
 */
export const Shrink: Story = {
  args: { label: 'Continue' },
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {[320, 250, 120].map((width) => (
        <Strip key={width} width={width}>
          <PrimaryAction
            label="Continue"
            description="To the review on Monday 12 October"
            icon={<ChevronsRight />}
          />
        </Strip>
      ))}
      <Strip width={60}>
        <PrimaryAction label="Review items" badge={3} icon={<ChevronsRight />} />
      </Strip>
      <Strip width={60}>
        <PrimaryAction label="Answer first" attention icon={<ChevronsRight />} />
      </Strip>
      <Strip width={240}>
        <PrimaryAction label="Continue" icon={<ChevronsRight />} collapsed />
      </Strip>
      <Strip width={120}>
        <PrimaryAction label="No icon to keep" />
      </Strip>
    </div>
  ),
};

/** Parts replaced by a node (icon), changed by a function (label, badge) and hidden with `null` (description). */
export const Parts: Story = {
  args: { label: 'Continue' },
  render: () => (
    <div style={grid}>
      <Strip>
        <PrimaryAction
          label="Continue"
          description="Hidden by the part"
          badge={12}
          icon={<ChevronsRight />}
          parts={{
            icon: <b data-part="icon">GO</b>,
            label: (p) => <em data-part="label">{p.children}!</em>,
            badge: (p) => <span data-part="badge">[{p.children}]</span>,
            description: null,
          }}
        />
      </Strip>
      <Strip>
        <PrimaryAction
          label="Answer first"
          attention
          menu={menu}
          parts={{ attention: <b data-part="attention">!</b>, menuTrigger: <span>+</span> }}
        />
      </Strip>
    </div>
  ),
};

function BehaviourApp(globals: Globals) {
  const [log, setLog] = useState('none');
  const [busy, setBusy] = useState(false);
  return (
    <UmbraProvider {...globals} shortcuts={appShortcuts}>
      <Strip width={420}>
        <PrimaryAction
          label={busy ? 'Working' : 'Continue'}
          icon={<ChevronsRight />}
          shortcut="app.continue"
          loading={busy}
          onPress={() => setLog('Continue')}
          menu={[...menu, { id: 'busy', label: busy ? 'Stop working' : 'Start working' }]}
          onMenuAction={(id) => (id === 'busy' ? setBusy(!busy) : setLog(id))}
        />
      </Strip>
      <Log>Last action: {log}</Log>
    </UmbraProvider>
  );
}

/**
 * A press, the bound shortcut (Ctrl+Enter, or Command+Enter on macOS) and the menu of alternatives
 * all report below. While loading, presses and the shortcut do nothing.
 */
export const Behaviour: Story = {
  args: { label: 'Continue' },
  render: (_, { globals }) => <BehaviourApp {...(globals as Globals)} />,
};
