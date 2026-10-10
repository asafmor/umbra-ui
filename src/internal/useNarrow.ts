import { useSyncExternalStore } from 'react';
import { minWindow } from '../styles/tokens.generated';

// Narrow means below the minimum window in either direction; exactly the minimum is not narrow.
const query = `(max-width: ${minWindow.width - 0.02}px), (max-height: ${minWindow.height - 0.02}px)`;
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

/**
 * True below the minimum window (plan/layout.md, rule 4). One source for everything that reacts to
 * it: `AppShell` (`data-narrow`), `Columns` (tabs), `Modal` (full window) and `Card`. It reads the
 * window itself, so it is the same with and without an `AppShell` around.
 */
export const useNarrow = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
