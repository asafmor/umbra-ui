import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { UmbraProvider, UmbraScope } from './UmbraProvider';

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
