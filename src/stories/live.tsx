// A story of `highlightChanges`: four copies of one component whose value rises, falls, changes as
// text and stays, each time the button is pressed. Shared by the stories of every component that has it.
import { useState, type ReactNode } from 'react';
import { Button } from '../basics/Button';

export type LiveKind = 'up' | 'down' | 'text' | 'same';

const values = (step: number): Record<LiveKind, number | string> => ({
  up: 40 + step,
  down: 40 - step,
  text: step % 2 ? 'Closed' : 'Open',
  same: 40,
});

export function LiveValues({
  kinds = ['up', 'down', 'text', 'same'],
  columns = 4,
  children,
}: {
  kinds?: LiveKind[];
  columns?: number;
  /** One copy of the component. `value` is a number, or text for the `text` kind. */
  children: (value: number | string, kind: LiveKind) => ReactNode;
}) {
  const [step, setStep] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 24, justifyItems: 'start' }}>
      <Button onPress={() => setStep(step + 1)}>Update values</Button>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 220px))`,
          gap: 24,
          alignItems: 'start',
          width: '100%',
        }}
      >
        {kinds.map((kind) => (
          <div key={kind} data-live={kind} style={{ minWidth: 0 }}>
            {children(values(step)[kind], kind)}
          </div>
        ))}
      </div>
    </div>
  );
}
