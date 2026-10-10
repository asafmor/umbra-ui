import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, Minus, RefreshCw, Save, ZoomIn } from 'lucide-react';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { Button } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { Card } from '../layout/Card';
import { TopBar } from '../shell/TopBar';
import { Log, Rows } from '../stories/placeholders';
import type { Shortcut } from './shortcuts';
import { UmbraProvider, UmbraScope, type ContextTint, type Density } from './UmbraProvider';

const panel: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 'var(--umbra-density-card-padding)',
  borderRadius: 'var(--umbra-radius-card)',
  border: '1px solid var(--umbra-color-base-border-subtle)',
  background:
    'linear-gradient(160deg, var(--umbra-context-page-background), var(--umbra-context-page-background-end))',
};

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div style={panel}>
      <div style={{ font: 'var(--umbra-font-card-title)', textTransform: 'uppercase' }}>{title}</div>
      <p style={{ margin: 'var(--umbra-density-gap) 0 0' }}>Body text at this density.</p>
      <div
        style={{
          marginTop: 'var(--umbra-density-gap)',
          height: 'var(--umbra-density-control-height)',
          background: 'var(--umbra-context-mid-accent)',
          borderRadius: 'var(--umbra-radius-control)',
        }}
      />
      {children}
    </div>
  );
}

function Bar({ brand }: { brand: string }) {
  return (
    <UmbraScope brand={brand}>
      <div
        style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'var(--umbra-color-brand)',
          color: 'var(--umbra-color-on-brand)',
          font: 'var(--umbra-font-nav)',
          textTransform: 'uppercase',
        }}
      >
        Brand {brand}
      </div>
    </UmbraScope>
  );
}

const meta = {
  title: 'Foundation/UmbraProvider',
  component: UmbraProvider,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof UmbraProvider>;
export default meta;

/** `UmbraScope` changes context, density, brand or tokens for one subtree. */
export const Scopes: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--umbra-density-gap)' }}>
      <Panel title="Inherited" />
      <UmbraScope context="teal" density="compact">
        <Panel title="Teal, compact" />
      </UmbraScope>
      <UmbraScope context="#b3541e" tokens={{ 'radius-card': '0px' }}>
        <Panel title="Custom colour, square corners" />
      </UmbraScope>
      <Panel title="Brand text contrast">
        <Bar brand="#2a2f8f" />
        <Bar brand="#e8e4f0" />
        <Bar brand="#0f766e" />
      </Panel>
    </div>
  ),
};

// A provider inside a story starts again from the defaults, so it is given the toolbar's settings.
type Globals = { density: Density; context: ContextTint };
type Story = StoryObj<typeof meta>;
const column: CSSProperties = { display: 'grid', gap: 'var(--umbra-density-gap)', maxWidth: 560 };

/** `icons` replaces built-in icons by name: here the caret, the overflow button, search and the spinner. */
export const Icons: Story = {
  render: (_, { globals }) => (
    <UmbraProvider
      {...(globals as Globals)}
      icons={{ chevronDown: <Minus />, more: <Menu />, search: <ZoomIn />, spinner: <RefreshCw /> }}
    >
      <div style={column}>
        <TopBar logo="U" onSearch={() => {}} />
        {/* Wide enough that the action fits whatever the text rendering of the machine. */}
        <div style={{ width: 360, height: 120, display: 'flex' }}>
          <Card title="Collapsible" collapsible actions={<Button size="small">Export</Button>}>
            Content
          </Card>
        </div>
        <div>
          <Button loading>Saving</Button>
        </div>
      </div>
    </UmbraProvider>
  ),
};

function ShortcutsApp(globals: Globals) {
  const [last, setLast] = useState('none');
  const shortcuts = useMemo<Shortcut[]>(
    () => [
      { id: 'app.save', keys: 'S', label: 'Save', action: () => setLast('Save') },
      { id: 'app.refresh', keys: 'Shift+R', label: 'Refresh' },
    ],
    [],
  );
  return (
    <UmbraProvider {...globals} shortcuts={shortcuts}>
      <div style={column}>
        <TopBar logo="U" onSearch={() => setLast('Search')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button shortcut="app.refresh" onPress={() => setLast('Refresh')}>
            Refresh
          </Button>
          <label>
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
        </div>
        <Log>Last shortcut: {last}</Log>
        <p style={{ margin: 0 }}>
          S saves through the shortcut&apos;s own action, Shift+R presses the button bound to it, and Ctrl+K
          (Command+K on macOS) runs the search of the top bar. A bare key typed in the text field does
          nothing.
        </p>
      </div>
    </UmbraProvider>
  );
}

/** `shortcuts` registers the app's keys. A button with `shortcut` binds one and shows the key hint. */
export const Shortcuts: Story = { render: (_, { globals }) => <ShortcutsApp {...(globals as Globals)} /> };

/** `reducedMotion="always"` stops movement whatever the system setting: the skeleton and spinner stand still. */
export const ReducedMotion: Story = {
  render: (_, { globals }) => (
    <UmbraProvider {...(globals as Globals)} reducedMotion="always">
      <div style={column}>
        <Skeleton lines={3} />
        <div>
          <Button loading>Saving</Button>
        </div>
      </div>
    </UmbraProvider>
  ),
};

function LocalePanel() {
  const { locale, direction } = useLocale();
  return (
    <Panel title={`${locale}, ${direction}`}>
      <p style={{ margin: 'var(--umbra-density-gap) 0' }}>
        {new Intl.NumberFormat(locale).format(1234567.89)}
        <br />
        {new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
          Date.UTC(2026, 9, 10),
        )}
      </p>
      <Button iconEnd={<Save />}>Save</Button>
    </Panel>
  );
}

/** `locale` sets the language, the text direction and the formats used by components. */
export const Locale: Story = {
  render: (_, { globals }) => (
    <div style={{ display: 'flex', gap: 'var(--umbra-density-gap)' }}>
      {['en-GB', 'de-DE', 'he-IL'].map((locale) => (
        <UmbraProvider key={locale} {...(globals as Globals)} locale={locale}>
          <LocalePanel />
        </UmbraProvider>
      ))}
    </div>
  ),
};

/** `tokens` on the provider overrides tokens for the whole app. */
export const Tokens: Story = {
  render: (_, { globals }) => (
    <UmbraProvider
      {...(globals as Globals)}
      tokens={{ 'radius-card': '0px', 'radius-control': '0px', 'card-header-height': '56px' }}
    >
      <div style={{ width: 360, height: 240, display: 'flex' }}>
        <Card title="Square corners, tall header" actions={<Button size="small">Export</Button>}>
          <Rows count={3} />
        </Card>
      </div>
    </UmbraProvider>
  ),
};

/** Scopes nest: each one changes only what it sets and keeps the rest from the scope around it. */
export const NestedScopes: Story = {
  render: () => (
    <UmbraScope context="teal" density="compact" brand="#0f766e">
      <Panel title="Teal, compact, teal brand">
        <Bar brand="#0f766e" />
        <div
          style={{ display: 'flex', gap: 'var(--umbra-density-gap)', marginTop: 'var(--umbra-density-gap)' }}
        >
          <UmbraScope density="spacious">
            <Panel title="Spacious, still teal" />
          </UmbraScope>
          <UmbraScope context="slate" brand="#e8e4f0">
            <Panel title="Slate, still compact">
              <Bar brand="#e8e4f0" />
            </Panel>
          </UmbraScope>
        </div>
      </Panel>
    </UmbraScope>
  ),
};
