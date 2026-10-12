// Story helpers for the Data value components: a labelled section, and plain stand-ins for components
// that other nodes are passed as (a trend arrow, a progress bar, a status dot).
import type { CSSProperties, ReactNode } from 'react';

const caption: CSSProperties = {
  font: 'var(--umbra-font-label)',
  color: 'var(--umbra-color-base-text-secondary)',
  marginBottom: 6,
};

/** A group of examples under a small caption. */
export function Section({
  label,
  width,
  children,
}: {
  label: string;
  width?: number | string;
  children: ReactNode;
}) {
  return (
    <section style={{ width, minWidth: 0 }}>
      <div style={caption}>{label}</div>
      {children}
    </section>
  );
}

/** Lays sections out in wrapping columns. */
export function Sheet({ children, gap = 24 }: { children: ReactNode; gap?: number }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap }}>{children}</div>;
}

export const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' };

/** Stands in for a `TrendArrow`: the direction as a glyph and the change as text. */
export function TrendStandIn({ down, children }: { down?: boolean; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, whiteSpace: 'nowrap' }}>
      <span aria-hidden="true">{down ? '▼' : '▲'}</span>
      <span>
        <span style={{ position: 'absolute', clipPath: 'inset(50%)' }}>{down ? 'Down' : 'Up'} </span>
        {children}
      </span>
    </span>
  );
}

/** Stands in for a `ProgressBar`. */
export function MeterStandIn({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      style={{
        height: 6,
        borderRadius: 3,
        background: 'var(--umbra-color-base-surface3)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: '100%',
          background: 'var(--umbra-color-interaction-text)',
        }}
      />
    </div>
  );
}

/** Stands in for a `StatusIndicator` dot. */
export function DotStandIn({ label }: { label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: 'var(--umbra-color-semantic-success)',
        border: '2px solid var(--umbra-color-base-surface1)',
      }}
    />
  );
}

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`)}`;

/** A drawn portrait (not a photo), for image avatars. */
export const portrait = svg(
  '<rect width="64" height="64" fill="#2f6f8f"/><circle cx="32" cy="26" r="12" fill="#f2c9a0"/>' +
    '<path d="M8 64c2-16 12-24 24-24s22 8 24 24z" fill="#f2b23a"/>',
);

/** A drawn emblem, for image marks. */
export const emblem = svg(
  '<path d="M32 4l24 8v20c0 14-10 24-24 28C18 56 8 46 8 32V12z" fill="#16b877"/>' +
    '<path d="M20 34l8 8 16-18" fill="none" stroke="#fff" stroke-width="6"/>',
);

/** A drawn two-colour flag, for image marks. */
export const flag = svg(
  '<rect y="12" width="64" height="20" fill="#3d9be8"/><rect y="32" width="64" height="20" fill="#f2c53a"/>',
);

/** An address that never loads, to show the fallbacks. */
export const brokenImage = 'data:image/png;base64,AAAA';
