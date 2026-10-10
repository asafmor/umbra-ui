// Placeholder content shared by stories. Invented, domain-neutral sample data.
import type { CSSProperties } from 'react';

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
      <div style={{ font: 'var(--umbra-font-title)', color: 'var(--umbra-color-fixed-accent-text)' }}>
        {value}
      </div>
    </div>
  );
}
