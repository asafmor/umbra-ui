// Layout helpers shared by the stories of this folder.
import type { ReactNode } from 'react';

/** One labelled row of examples. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, minWidth: 0 }}>
      <span
        style={{
          flex: 'none',
          width: 88,
          font: 'var(--umbra-font-label)',
          color: 'var(--umbra-color-base-text-secondary)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/** A box of a fixed width, to show what a component does when it has little room. */
export function Narrow({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div
      data-narrow=""
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width,
        padding: 4,
        outline: '1px dashed var(--umbra-color-base-border-control)',
      }}
    >
      {children}
    </div>
  );
}
