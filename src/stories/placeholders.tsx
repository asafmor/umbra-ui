// Placeholder content shared by stories. Invented, domain-neutral sample data.
import type { CSSProperties, ReactNode } from 'react';
import type { NavItem } from '../shell/nav';

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '6px 8px',
  font: 'var(--umbra-font-label)',
};

export function Rows({ count = 6, prefix = 'Item' }: { count?: number; prefix?: string }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            ...rowStyle,
            background: i % 2 ? undefined : 'color-mix(in oklab, currentColor 5%, transparent)',
          }}
        >
          <span>
            {prefix} {i + 1}
          </span>
          <span style={{ color: 'var(--umbra-color-base-text-secondary)' }}>{(i * 37 + 12) % 100}</span>
        </div>
      ))}
    </div>
  );
}

export function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}>
        {label}
      </div>
      <div style={{ font: 'var(--umbra-font-title)', color: 'var(--umbra-color-interaction-text)' }}>
        {value}
      </div>
    </div>
  );
}

/** A plain bar, standing in for a page header or footer. */
export function Bar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        border: '1px dashed var(--umbra-color-base-border-control)',
        font: 'var(--umbra-font-label)',
      }}
    >
      {children}
    </div>
  );
}

/** One line that shows what a story's callbacks did, for the reader and for the interaction tests. */
export function Log({ children }: { children: ReactNode }) {
  return <p style={{ margin: 0, padding: '8px 0', font: 'var(--umbra-font-label)' }}>{children}</p>;
}

/** Top-level sections for `PrimaryNav`: links, dropdowns and one disabled item. */
export const sections: NavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview' },
  {
    id: 'orders',
    label: 'Orders',
    href: '#orders',
    items: [
      { id: 'open', label: 'Open orders', href: '#open' },
      { id: 'returns', label: 'Returns', href: '#returns' },
    ],
  },
  { id: 'planning', label: 'Planning', href: '#planning' },
  { id: 'sourcing', label: 'Sourcing', href: '#sourcing' },
  { id: 'people', label: 'People', items: [{ id: 'teams', label: 'Teams', href: '#teams' }] },
  { id: 'finance', label: 'Finance', href: '#finance', disabled: true },
];

/** The pages of one section, for `SubNav`. */
export const pages: NavItem[] = ['Summary', 'Inbox', 'Calendar', 'Reports', 'Insights'].map((label) => ({
  id: label.toLowerCase(),
  label,
  href: `#${label.toLowerCase()}`,
}));
