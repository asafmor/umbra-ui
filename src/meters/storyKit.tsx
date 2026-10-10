// Layout helpers shared by the meter stories. Not part of the library.
import type { CSSProperties, ReactNode } from 'react';

/** A grid of panels that share the window. */
export function Board({ columns = 3, children }: { columns?: number; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 'var(--umbra-space-4)',
        alignItems: 'start',
      }}
    >
      {children}
    </div>
  );
}

const panel: CSSProperties = {
  display: 'grid',
  gap: 'var(--umbra-space-4)',
  minWidth: 0,
  padding: 'var(--umbra-density-card-padding)',
  border: 'var(--umbra-border-width) solid var(--umbra-color-base-border-subtle)',
  borderRadius: 'var(--umbra-radius-card)',
  background: 'var(--umbra-color-base-surface2)',
};

/** A card-like surface with a caption, holding a few examples. */
export function Panel({
  title,
  style,
  children,
}: {
  title: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section style={{ ...panel, ...style }}>
      <h2 style={{ margin: 0, font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-muted)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A box of a fixed width, to show how a component behaves as its container shrinks. */
export function Width({ px, children }: { px: number; children: ReactNode }) {
  return (
    <div data-width={px} style={{ width: px, maxWidth: '100%' }}>
      {children}
    </div>
  );
}
