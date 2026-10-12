import type { Meta, StoryObj } from '@storybook/react-vite';
import { Save, Settings } from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { Button } from '../basics/Button';
import { IconButton } from '../basics/IconButton';
import type { Shortcut } from '../provider/shortcuts';
import { UmbraProvider, UmbraScope, type ContextTint, type Density } from '../provider/UmbraProvider';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;
type Globals = { density: Density; context: ContextTint };

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 160, padding: '48px 24px' };
// Styled in full, so the capture does not depend on the system's form control look.
const plain: CSSProperties = {
  font: 'inherit',
  color: 'inherit',
  padding: '4px 12px',
  border: '1px solid var(--umbra-color-base-border-control)',
  borderRadius: 4,
  background: 'var(--umbra-color-base-surface1)',
};

function Shortcuts({ globals, children }: { globals: Globals; children: React.ReactNode }) {
  const shortcuts = useMemo<Shortcut[]>(() => [{ id: 'doc.save', keys: 'Mod+S', label: 'Save' }], []);
  return (
    <UmbraProvider {...globals} shortcuts={shortcuts}>
      {children}
    </UmbraProvider>
  );
}

/** Plain: one line. Rich: a title, a text and a key hint from the shortcut registry. Shown open here. */
export const PlainAndRich: Story = {
  args: { children: null },
  render: (_, { globals }) => (
    <Shortcuts globals={globals as Globals}>
      <div style={row}>
        <Tooltip content="Saves the document" open>
          <Button iconStart={<Save />}>Save</Button>
        </Tooltip>
        <Tooltip content="Saves the document" shortcut="doc.save" placement="bottom" open>
          <Button iconStart={<Save />}>With a key hint</Button>
        </Tooltip>
        <Tooltip
          title="Projected value"
          content="An estimate from the last three periods. It is updated when a period closes."
          shortcut="doc.save"
          placement="bottom start"
          open
        >
          <Button>Rich</Button>
        </Tooltip>
      </div>
    </Shortcuts>
  ),
};

const sides = ['top', 'bottom', 'start', 'end', 'top start', 'bottom end'] as const;

/** Each side, and alignment along it. */
export const Placements: Story = {
  args: { children: null },
  render: () => (
    <div style={{ ...row, flexWrap: 'wrap', rowGap: 96 }}>
      {sides.map((placement) => (
        <Tooltip key={placement} content={`Placed ${placement}`} placement={placement} open>
          <Button>{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

/** For the interaction tests: hover and focus, any kind of trigger, a disabled control, parts and scope. */
export const Triggers: Story = {
  args: { children: null },
  render: (_, { globals }) => (
    <Shortcuts globals={globals as Globals}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 48 }}>
        <Tooltip content="On an umbra-ui button" delay={0}>
          <Button>Button</Button>
        </Tooltip>
        <Tooltip content="On a plain button">
          <button type="button" style={plain}>
            Plain
          </button>
        </Tooltip>
        <Tooltip content="On a link">
          <a href="#somewhere" style={{ color: 'var(--umbra-color-interaction-text)' }}>
            Link
          </a>
        </Tooltip>
        <Tooltip content="Nothing to save yet">
          <Button disabled>Disabled</Button>
        </Tooltip>
        <Tooltip content="You do not have access" wrap>
          <IconButton icon={<Settings />} label="Workspace settings" disabled tooltip={false} />
        </Tooltip>
        <Tooltip content="Never shown" disabled>
          <Button>Tooltip off</Button>
        </Tooltip>
        <Tooltip content="">
          <Button>Empty content</Button>
        </Tooltip>
        <Tooltip
          title="Hidden title"
          content="Body"
          shortcut="doc.save"
          parts={{
            title: null,
            body: (p) => <em data-part="body">{p.children} from a function</em>,
            hint: <kbd data-part="hint">custom hint</kbd>,
          }}
        >
          <Button>Parts</Button>
        </Tooltip>
        <UmbraScope context="teal" density="compact" tokens={{ 'tooltip-radius': '0px' }}>
          <Tooltip content="Compact, from a teal scope">
            <Button>In a scope</Button>
          </Tooltip>
        </UmbraScope>
      </div>
    </Shortcuts>
  ),
};
