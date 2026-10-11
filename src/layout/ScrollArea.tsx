import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './ScrollArea.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export interface ScrollAreaProps extends RootAttributes {
  axis?: 'vertical' | 'horizontal' | 'both' | undefined;
  /** `hover` shows the thumb only while the pointer or focus is inside the area. */
  scrollbar?: 'auto' | 'hover' | undefined;
  /** A soft fade at an edge that has more content. */
  fade?: boolean | undefined;
  /**
   * Called when the end is reached, for loading more: the bottom (`vertical`, `both`) or the far edge
   * (`horizontal`). Once each time the end is reached. It is also called when the content does not fill
   * the area, since its end is then in view: once when the area mounts, and once more each time the
   * content has grown and still fits. A first page that is too short can therefore load the next.
   */
  onReachEnd?: (() => void) | undefined;
  /** Accessible name, used when the area itself has to be focusable to be scrolled by keyboard. */
  'aria-label'?: string | undefined;
  /** Replace or hide named pieces. */
  parts?: { fade?: Part<{ edge: ScrollEdge }> | undefined } | undefined;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
  /** `data-` attributes go on the root element. */
  [data: `data-${string}`]: string | undefined;
}

/** `start` and `end` are the edges of the main axis; `axis="both"` also has the two inline edges. */
export type ScrollEdge = 'start' | 'end' | 'inline-start' | 'inline-end';

const still = { start: false, end: false, inlineStart: false, inlineEnd: false, needsFocus: false };

const edges: ScrollEdge[] = ['start', 'end', 'inline-start', 'inline-end'];

const focusable = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** A region that scrolls inside its slot. The only place scrolling happens. */
export function ScrollArea({
  axis = 'vertical',
  scrollbar = 'auto',
  fade = true,
  onReachEnd,
  'aria-label': label = 'Scrollable content',
  parts,
  ref,
  className,
  style,
  children,
  ...data
}: ScrollAreaProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [state, setState] = useState(still);
  const reachEnd = useRef(onReachEnd);
  // Kept across renders: the effect below runs again whenever `children` is a new node, which must not
  // report the same end a second time. `end` while scrolled to the end, `fits:<size>` while the content
  // does not fill the area (a new size is a new end), null otherwise.
  const atEnd = useRef<string | null>(null);
  useEffect(() => {
    reachEnd.current = onReachEnd;
  });

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const read = (inline: boolean) => {
      const position = Math.abs(inline ? el.scrollLeft : el.scrollTop);
      const max = inline ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
      // The extent of the content itself, which is less than the area's when it fits.
      const size = [...el.children].reduce(
        (sum, child) => sum + child.getBoundingClientRect()[inline ? 'width' : 'height'],
        0,
      );
      return { start: position > 1, end: position < max - 1, max, size };
    };
    const none = { start: false, end: false, max: 0, size: 0 };
    const measure = (laidOut = false) => {
      // The main axis is the one `start`, `end` and `onReachEnd` are about.
      const main = read(axis === 'horizontal');
      const cross = axis === 'both' ? read(true) : none;
      const next = {
        start: main.start,
        end: main.end,
        inlineStart: cross.start,
        inlineEnd: cross.end,
        needsFocus: (main.max > 1 || cross.max > 1) && !el.querySelector(focusable),
      };
      setState((prev) =>
        (Object.keys(next) as (keyof typeof next)[]).every((key) => prev[key] === next[key]) ? prev : next,
      );
      // "Fits" is only read once the content has been laid out (from the observer): a list that draws
      // its rows after it mounts is empty for a moment, which is not a first page that is too short.
      const fits = laidOut && main.size > 0 ? `fits:${main.size}` : atEnd.current;
      const reached = next.end ? null : main.max > 1 ? 'end' : fits;
      if (reached && reached !== atEnd.current) reachEnd.current?.();
      atEnd.current = reached;
    };
    measure();
    const onScroll = () => measure();
    el.addEventListener('scroll', onScroll, { passive: true });
    // Content and slot size both change what overflows.
    const observer = new ResizeObserver(() => measure(true));
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [axis, children]);

  return (
    <div
      {...passThrough(data)}
      ref={ref}
      data-umbra="scroll-area"
      data-axis={axis}
      data-scrollbar={scrollbar}
      data-fade-start={(fade && state.start) || undefined}
      data-fade-end={(fade && state.end) || undefined}
      data-fade-inline-start={(fade && state.inlineStart) || undefined}
      data-fade-inline-end={(fade && state.inlineEnd) || undefined}
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
        (axis === 'both' ? edges : edges.slice(0, 2)).map((edge) =>
          renderPart(parts?.fade, { edge }, () => (
            <div key={edge} aria-hidden="true" data-part="fade" data-edge={edge} className={styles.fade} />
          )),
        )}
    </div>
  );
}
