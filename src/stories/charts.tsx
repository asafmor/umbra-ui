// Layout helpers and sample data shared by the chart stories. Invented, domain-neutral data.
import type { ReactNode } from 'react';
import { Card } from '../layout/Card';

/** A grid of equal tiles that fills the story frame. */
export function Tiles({ columns = 3, children }: { columns?: number; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        height: '100%',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: 'minmax(0, 1fr)',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

/** One chart in a card. The chart fills the card's body. */
export function Tile({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <div data-tile={id} style={{ display: 'grid', minWidth: 0, minHeight: 0 }}>
      <Card title={title} style={{ minHeight: 0 }}>
        {children}
      </Card>
    </div>
  );
}

/** A slot of a fixed size, to show what a chart keeps at that size. */
export function Box({
  width,
  height,
  note,
  children,
}: {
  width: number;
  height: number;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 4, alignContent: 'start', justifyItems: 'start' }}>
      <div style={{ font: 'var(--umbra-font-label)', color: 'var(--umbra-color-base-text-secondary)' }}>
        {width}×{height}
        {note && ` · ${note}`}
      </div>
      <div
        data-size={`${width}x${height}`}
        style={{ width, height, outline: '1px dashed var(--umbra-color-base-border-strong)' }}
      >
        {children}
      </div>
    </div>
  );
}

/** A row of boxes that wraps. */
export function Boxes({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'flex-start',
        alignContent: 'flex-start',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
export const regions = ['Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5'];
export const plan = [40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84];
export const actual = [42, 48, 45, 53, 60, 58, 66, 71, 69, 78, 84, 90];
