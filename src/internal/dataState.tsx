import { isValidElement, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { EmptyState, type EmptyStateRootProps } from '../data/EmptyState';

/** The pieces of an empty or error state, when a whole node is more than is needed. */
export interface DataStateContent {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

/** The loading, empty and error props shared by every data component. */
export interface DataStateProps {
  /** Shows skeletons in the final layout and marks the component busy. */
  loading?: boolean;
  /** Shown when there is no data: text, a node, or `{ title, description, icon, action }`. Defaults to a short English text. */
  empty?: ReactNode | DataStateContent;
  /** Shown in place of the data when set: text, a node, `{ title, description, icon, action }`, or `true` for a default text. */
  error?: ReactNode | DataStateContent;
  /** Adds a retry button to the error state. */
  onRetry?: () => void;
  /** Label of the retry button. */
  retryLabel?: string;
}

export const isContent = (value: unknown): value is DataStateContent =>
  typeof value === 'object' &&
  value !== null &&
  !isValidElement(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const TAB_STOPS =
  '[tabindex="0"], a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled)';

/**
 * Keeps the focus when the state it sits in goes away while holding it (after Retry, or when data
 * arrives): the focus moves to the first tab stop of the component around the state, or to the
 * component itself, instead of falling to the page.
 */
function FocusKeeper() {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    // A layout cleanup runs while the state is still in the page, so the focus can be read.
    return () => {
      const state = el?.closest('[data-umbra="empty-state"]');
      if (!state?.contains(document.activeElement)) return;
      const host = state.parentElement?.closest<HTMLElement>('[data-umbra]') ?? state.parentElement;
      requestAnimationFrame(() => {
        if (!host?.isConnected || (document.activeElement && document.activeElement !== document.body))
          return;
        const next = host.querySelector<HTMLElement>(TAB_STOPS) ?? host;
        if (next === host && !host.hasAttribute('tabindex')) host.tabIndex = -1;
        next.focus();
      });
    };
  }, []);
  return <span ref={ref} hidden />;
}

function state(
  value: ReactNode | DataStateContent,
  fallback: DataStateContent,
  root: EmptyStateRootProps,
  extra?: ReactNode,
) {
  // Text is a title; any other node replaces the content and keeps the root (and the retry button).
  const content = isContent(value)
    ? value
    : typeof value === 'string' || typeof value === 'number'
      ? { title: value }
      : value === undefined || value === null || typeof value === 'boolean'
        ? fallback
        : null;
  if (!content) {
    return (
      <EmptyState.Root {...root}>
        {value as ReactNode}
        {extra && <EmptyState.Action>{extra}</EmptyState.Action>}
        <FocusKeeper />
      </EmptyState.Root>
    );
  }
  const action = (content.action || extra) && (
    <>
      {content.action}
      {extra}
      <FocusKeeper />
    </>
  );
  return <EmptyState {...root} {...content} action={action} />;
}

/**
 * What a data component shows in place of its data: the error state, the empty state, or `null` when
 * it should render its data (or, while `loading`, its own skeleton).
 *
 *     const content = dataState(props, { isEmpty: rows.length === 0 });
 *     return <div aria-busy={props.loading || undefined}>{content ?? (props.loading ? skeleton : rows)}</div>;
 */
export function dataState(
  { loading, empty, error, onRetry, retryLabel = 'Try again' }: DataStateProps,
  options: {
    isEmpty: boolean;
    /** The component's own default empty text. */
    defaultEmpty?: DataStateContent;
    variant?: 'block' | 'inline';
  },
): ReactNode | null {
  const { isEmpty, defaultEmpty = { title: 'Nothing to show' }, variant } = options;
  if (error) {
    const retry = onRetry && (
      <Button size={variant === 'inline' ? 'small' : 'default'} onPress={onRetry}>
        {retryLabel}
      </Button>
    );
    return state(error, { title: 'Something went wrong' }, { variant, tone: 'error', role: 'alert' }, retry);
  }
  if (loading || !isEmpty) return null;
  return state(empty, defaultEmpty, { variant });
}
