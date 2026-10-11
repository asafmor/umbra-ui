// Placeholders for the stories of this folder. Tag, Badge and Avatar are separate components; these
// plain stand-ins only show where such a node goes.
import type { CSSProperties, ReactNode } from 'react';

/** A coloured circle, standing in for an avatar. */
export function Dot({
  color = 'var(--umbra-context-mid-accent)',
  size = 28,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'block', width: size, height: size, borderRadius: '50%', background: color }}
    />
  );
}

/** A small bordered label, standing in for a tag. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        padding: '1px 6px',
        border: '1px solid var(--umbra-context-mid-accent)',
        borderRadius: 'var(--umbra-radius-control)',
        font: 'var(--umbra-font-label)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** A dashed box of a fixed size, to show a component in a slot of that size. */
export function Box({
  width,
  height,
  label,
  children,
}: {
  width?: number | string | undefined;
  height?: number | string | undefined;
  label?: string | undefined;
  children: ReactNode;
}) {
  const caption: CSSProperties = {
    font: 'var(--umbra-font-label)',
    color: 'var(--umbra-color-base-text-secondary)',
    marginBottom: 4,
  };
  return (
    <div style={{ minWidth: 0 }}>
      {label && <div style={caption}>{label}</div>}
      <div
        data-box={label}
        style={{
          width,
          height,
          maxWidth: '100%',
          border: '1px dashed var(--umbra-color-base-border-strong)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export interface Message {
  id: string;
  from: string;
  title: string;
  tag: string;
  time: string;
  unread: boolean;
}

const message = (id: number, from: string, title: string, tag: string, time: string, unread = false) => ({
  id: `m${id}`,
  from,
  title,
  tag,
  time,
  unread,
});

/** An inbox, grouped by day. */
export const days: { key: string; title: string; items: Message[] }[] = [
  {
    key: 'fri',
    title: 'Fri 9 Oct',
    items: [
      message(1, 'Person A', 'Quarterly review', 'Review', '20:49', true),
      message(2, 'Person A', 'Planning advice', 'Advice', '19:49', true),
      message(3, 'Person B', 'Schedule clash on Tuesday', 'Scheduling', '08:43'),
      message(4, 'Person A', 'Supplier advice: Site 20', 'Planning', '07:50'),
    ],
  },
  {
    key: 'thu',
    title: 'Thu 8 Oct',
    items: [
      message(5, 'Person C', 'Audit finds a labelling gap', 'Review', '21:34', true),
      message(6, 'Person D', 'Site 20 report', 'Research', '10:50'),
      message(7, 'Person E', 'Rota advice', 'Advice', '08:55'),
      message(8, 'Person F', 'Vendor research report', 'Research', '08:48'),
    ],
  },
  {
    key: 'wed',
    title: 'Wed 7 Oct',
    items: [
      message(9, 'Person A', 'Review preparation: Site 20', 'Planning', '21:57'),
      message(10, 'Person G', 'Client praises on-time delivery', 'Feedback', '21:31'),
    ],
  },
];

/** A ranking: a name and a value. */
export const ranking = Array.from({ length: 12 }, (_, i) => ({
  id: `r${i + 1}`,
  name: `Region ${i + 1}`,
  owner: `Person ${String.fromCharCode(65 + (i % 8))}`,
  value: 96 - i * 7,
}));
