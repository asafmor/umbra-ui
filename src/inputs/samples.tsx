// Helpers shared by the stories of this folder.
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Log } from '../stories/placeholders';

export const grid = (columns: number, gap = 16): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  gap,
  alignItems: 'start',
});

export const column: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 10,
  alignContent: 'start',
  minWidth: 0,
};

export function Caption({ children }: { children: ReactNode }) {
  return (
    <div style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}>
      {children}
    </div>
  );
}

/** A dashed box of a fixed width, to show a component in a slot of that width. */
export function Width({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div data-width={width} style={{ ...column, width, flex: 'none' }}>
      <Caption>{width}px</Caption>
      <div style={{ ...column, padding: 8, border: '1px dashed var(--umbra-color-base-border-strong)' }}>
        {children}
      </div>
    </div>
  );
}

/** A form that shows the values it would send, for the reader and for the tests. */
export function DemoForm({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const [sent, setSent] = useState('nothing yet');
  return (
    <form
      style={style}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(JSON.stringify([...data.entries()]));
      }}
    >
      {children}
      <Log>Sent: {sent}</Log>
    </form>
  );
}
