import { useEffect, useState } from 'react';

export type ChangeDirection = 'up' | 'down' | 'neutral';

/** Which way a value moved. Only numbers have a direction. */
export function changeDirection(previous: unknown, next: unknown): ChangeDirection {
  if (typeof previous !== 'number' || typeof next !== 'number') return 'neutral';
  return next > previous ? 'up' : next < previous ? 'down' : 'neutral';
}

/** How long the sign of a changed value stays, in milliseconds. */
export const CHANGE_MS = 4000;

/**
 * Live updates (plan/interaction.md): watches one value and says when it has just changed. `direction`
 * is set for `CHANGE_MS` after a change, and `stamp` rises with each one, so a flash keyed by it plays
 * once per change. The first value is not a change. Values are compared with `Object.is`: give a
 * number or text, not a node.
 */
export function useChangeHighlight(value: unknown) {
  const [state, setState] = useState<{ value: unknown; direction: ChangeDirection | null; stamp: number }>({
    value,
    direction: null,
    stamp: 0,
  });
  if (!Object.is(state.value, value)) {
    setState({ value, direction: changeDirection(state.value, value), stamp: state.stamp + 1 });
  }
  useEffect(() => {
    if (!state.direction) return;
    const timer = setTimeout(() => setState((s) => ({ ...s, direction: null })), CHANGE_MS);
    return () => clearTimeout(timer);
  }, [state.stamp, state.direction]);
  return { direction: state.direction, stamp: state.stamp };
}
