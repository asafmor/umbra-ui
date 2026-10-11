import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './ScrollArea.module.css';

export interface ScrollAreaProps {
  axis?: 'vertical' | 'horizontal' | 'both';
  /** `hover` shows the thumb only while the pointer or focus is inside the area. */
  scrollbar?: 'auto' | 'hover';
  /** A soft fade at an edge that has more content. */
  fade?: boolean;
  /** Called when the end is reached, for loading more. */
  onReachEnd?: () => void;
  /** Accessible name, used when the area itself has to be focusable to be scrolled by keyboard. */
  'aria-label'?: string;
  /** Replace or hide named pieces. */
  parts?: { fade?: Part<{ edge: 'start' | 'end' }> };
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** `data-` attributes go on the root element. */
  [data: `data-${string}`]: string | undefined;
}

const focusable = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** A region that scrolls inside its slot. The only place scrolling happens. */
export function ScrollArea({
  axis = 'vertical',
  scrollbar = 'auto',
  fade = true,
  onReachEnd,
  'aria-label': label = 'Scrollable content',
  parts,
  className,
  style,
  children,
  ...data
}: ScrollAreaProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ start: false, end: false, needsFocus: false });
  const reachEnd = useRef(onReachEnd);
  // Kept across renders: the effect below runs again whenever `children` is a new node, which must not
  // report the same end a second time.
  const atEnd = useRef(false);
  useEffect(() => {
    reachEnd.current = onReachEnd;
  });

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const horizontal = axis === 'horizontal';
    const measure = () => {
      const position = Math.abs(horizontal ? el.scrollLeft : el.scrollTop);
      const max = horizontal ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
      const next = {
        start: position > 1,
        end: position < max - 1,
        needsFocus: max > 1 && !el.querySelector(focusable),
      };
      setState((prev) =>
        prev.start === next.start && prev.end === next.end && prev.needsFocus === next.needsFocus
          ? prev
          : next,
      );
      const reached = max > 1 && !next.end;
      if (reached && !atEnd.current) reachEnd.current?.();
      atEnd.current = reached;
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    // Content and slot size both change what overflows.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [axis, children]);

  return (
    <div
      {...data}
      data-umbra="scroll-area"
      data-axis={axis}
      data-scrollbar={scrollbar}
      data-fade-start={(fade && state.start) || undefined}
      data-fade-end={(fade && state.end) || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      <div
        ref={viewport}
        data-part="viewport"
        className={styles.viewport}
        {...(state.needsFocus && { tabIndex: 0, role: 'group', 'aria-label': label })}
      >
        {children}
      </div>
      {fade &&
        (['start', 'end'] as const).map((edge) =>
          renderPart(parts?.fade, { edge }, () => (
            <div key={edge} aria-hidden="true" data-part="fade" data-edge={edge} className={styles.fade} />
          )),
        )}
    </div>
  );
}
