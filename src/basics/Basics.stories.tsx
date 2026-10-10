import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Bell, Check, Plus, Settings, Star, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Log } from '../stories/placeholders';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Skeleton } from './Skeleton';

const meta = { title: 'Basics/Buttons', component: Button, parameters: { frame: 'padded' } } satisfies Meta<
  typeof Button
>;
export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
    <span
      style={{ width: 96, font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}
    >
      {label}
    </span>
    {children}
  </div>
);

const variants = ['primary', 'accent', 'neutral', 'ghost', 'danger'] as const;

/** Every variant and state of `Button`. */
export const Buttons: Story = {
  render: () => (
    <div>
      <Row label="Variants">
        {variants.map((v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        ))}
      </Row>
      <Row label="Disabled">
        {variants.map((v) => (
          <Button key={v} variant={v} disabled>
            {v}
          </Button>
        ))}
      </Row>
      <Row label="Loading">
        {variants.map((v) => (
          <Button key={v} variant={v} loading>
            {v}
          </Button>
        ))}
      </Row>
      <Row label="Icons">
        <Button iconStart={<Plus />}>Add item</Button>
        <Button variant="primary" iconEnd={<ArrowRight />}>
          Continue
        </Button>
        <Button variant="danger" iconStart={<Trash2 />}>
          Delete
        </Button>
        <Button href="#">A link</Button>
      </Row>
      <Row label="Small">
        {variants.map((v) => (
          <Button key={v} variant={v} size="small">
            {v}
          </Button>
        ))}
      </Row>
      <Row label="Narrow">
        <div style={{ width: 120, display: 'flex' }}>
          <Button iconStart={<Plus />}>A label that truncates</Button>
        </div>
        <div style={{ width: 120, display: 'flex' }}>
          <Button iconStart={<Plus />} collapseTo="icon">
            Collapses to its icon
          </Button>
        </div>
        <div style={{ width: 240 }}>
          <Button fullWidth>Full width</Button>
        </div>
      </Row>
    </div>
  ),
};

function StarToggle() {
  const [on, setOn] = useState(true);
  return <IconButton icon={<Star />} label="Favourite" pressed={on} onPressedChange={setOn} />;
}

/** Every variant and state of `IconButton`. */
export const IconButtons: Story = {
  render: () => (
    <div>
      <Row label="Variants">
        {(['ghost', 'neutral', 'accent', 'primary', 'danger'] as const).map((v) => (
          <IconButton key={v} variant={v} icon={<Settings />} label={`Settings (${v})`} />
        ))}
      </Row>
      <Row label="Circle">
        <IconButton shape="circle" variant="neutral" icon={<Plus />} label="Add" />
        <IconButton shape="circle" variant="primary" icon={<ArrowRight />} label="Next" />
      </Row>
      <Row label="States">
        <IconButton icon={<Settings />} label="Disabled" disabled />
        <IconButton icon={<Settings />} label="Loading" loading />
        <StarToggle />
        <IconButton icon={<Bell />} label="Notifications" badge={3} />
        <IconButton icon={<Bell />} label="Notifications" badge />
      </Row>
    </div>
  ),
};

/** The three shapes of `Skeleton`. */
export const Skeletons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ width: 240 }}>
        <Skeleton lines={3} />
      </div>
      <Skeleton shape="circle" />
      <Skeleton shape="block" width={240} height={120} />
      <Skeleton shape="block" width={120} height={120} animation="none" />
    </div>
  ),
};

function PressRows() {
  const [presses, setPresses] = useState(0);
  const press = () => setPresses((n) => n + 1);
  return (
    <div>
      <Row label="Press">
        <Button onPress={press}>Save</Button>
        <Button loading onPress={press}>
          Publish
        </Button>
        <Button loading loadingLabel="Sending" onPress={press}>
          Send
        </Button>
        <Button disabled onPress={press}>
          Archive
        </Button>
        <IconButton icon={<Check />} label="Approve" loading loadingLabel="Approving" onPress={press} />
      </Row>
      <Log>Presses: {presses}</Log>
    </div>
  );
}

/** Enter and Space press a button. A loading button stays focusable but ignores presses; a disabled one is skipped. */
export const Press: Story = { render: () => <PressRows /> };

/**
 * `collapseTo="icon"`: the label hides when the button does not fit (the container is a share of the
 * window) and comes back when it does.
 */
export const CollapseToIcon: Story = {
  render: () => (
    <div style={{ width: '12vw', display: 'flex' }}>
      <Button variant="primary" iconEnd={<ArrowRight />} collapseTo="icon">
        Continue
      </Button>
    </div>
  ),
};

/** `Button` parts: a function changes a piece, `null` hides it, a node replaces it. */
export const ButtonParts: Story = {
  render: () => (
    <Row label="Parts">
      <Button
        iconStart={<Plus />}
        parts={{
          label: (p) => (
            <span data-part="label" style={{ textDecoration: 'underline' }}>
              {p.children}
            </span>
          ),
        }}
      >
        Label from a function
      </Button>
      <Button iconStart={<Plus />} iconEnd={<ArrowRight />} parts={{ iconStart: null }}>
        Start icon hidden
      </Button>
      <Button iconEnd={<ArrowRight />} parts={{ iconEnd: <b data-part="iconEnd">&raquo;</b> }}>
        End icon from a node
      </Button>
      <Button loading parts={{ spinner: <span data-part="spinner">...</span> }}>
        Spinner from a node
      </Button>
    </Row>
  ),
};

/** `IconButton` tooltips and parts. */
export const IconButtonOptions: Story = {
  render: () => (
    <div>
      <Row label="Tooltip">
        <IconButton icon={<Settings />} label="Settings" />
        <IconButton icon={<Settings />} label="No tooltip" tooltip={false} />
        <IconButton
          icon={<Settings />}
          label="Preferences"
          tooltip={
            <>
              Preferences <i>for this workspace</i>
            </>
          }
        />
      </Row>
      <Row label="Parts">
        <IconButton
          icon={<Bell />}
          label="Alerts"
          badge={120}
          parts={{
            icon: (p) => <span data-part="icon">{p.children}</span>,
            badge: () => (
              // A custom badge without text of its own: the count is already in the button's name.
              <span
                aria-hidden="true"
                data-part="badge"
                style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}
              />
            ),
            tooltip: (p) => <>{p.children} (from a part)</>,
          }}
        />
        <IconButton icon={<Bell />} label="Muted alerts" badge={3} parts={{ badge: null }} />
      </Row>
    </div>
  ),
};
