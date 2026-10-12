import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';

// Shows the generated CSS variables, so a change in plan/tokens.json is visible in the visual tests.
const colours = [
  ['fixed', ['primary', 'primary-end', 'selected', 'accent-text', 'focus-ring']],
  ['base', ['surface1', 'surface2', 'surface3', 'border-subtle', 'border-strong', 'border-control']],
  ['base', ['text-primary', 'text-secondary', 'text-muted']],
  ['semantic', ['success', 'warning', 'danger', 'info']],
  ['value-ramp', ['1', '2', '3', '4', '5']],
] as const;
const derived = ['color-brand', 'context', 'context-page-background', 'context-page-background-end'];
const more = ['context-card-tint', 'context-mid-accent'];
const roles = ['card-title', 'nav', 'display', 'title', 'body', 'label', 'table-cell'];
const density = ['control-height', 'table-row', 'list-row', 'gap', 'page-margin', 'card-padding'];

const row: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const label: CSSProperties = {
  font: 'var(--umbra-font-label)',
  color: 'var(--umbra-color-base-text-secondary)',
};

function Swatch({ name }: { name: string }) {
  return (
    <div style={{ width: 132 }}>
      <div
        style={{
          height: 28,
          borderRadius: 'var(--umbra-radius-control)',
          border: '1px solid var(--umbra-color-base-border-strong)',
          background: `var(--umbra-${name})`,
        }}
      />
      <div style={label}>{name}</div>
    </div>
  );
}

function Tokens() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
      <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
        {colours.map(([group, names], i) => (
          <div key={i} style={row}>
            {names.map((n) => (
              <Swatch key={n} name={`color-${group}-${n}`} />
            ))}
          </div>
        ))}
        <div style={row}>
          {derived.map((n) => (
            <Swatch key={n} name={n} />
          ))}
        </div>
        <div style={row}>
          {more.map((n) => (
            <Swatch key={n} name={n} />
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
        {roles.map((r) => (
          <div
            key={r}
            style={{
              font: `var(--umbra-font-${r})`,
              textTransform: `var(--umbra-font-${r}-transform, none)` as CSSProperties['textTransform'],
            }}
          >
            {r} — quarterly review 0123456789
          </div>
        ))}
        {density.map((d) => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: `var(--umbra-density-${d})`,
                height: 8,
                background: 'var(--umbra-color-interaction)',
              }}
            />
            <span style={label}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundation/Tokens',
  component: Tokens,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Tokens>;
export default meta;

export const All: StoryObj<typeof meta> = {};
