import { Children, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { IconButton } from '../basics/IconButton';
import { Skeleton } from '../basics/Skeleton';
import { dataState, type DataStateProps } from '../internal/dataState';
import { focusableIn, moveFocusFrom } from '../internal/focus';
import { Icon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './HorizontalScroller.module.css';
import layout from './layout.module.css';
import { ScrollArea } from './ScrollArea';
import { gapStyle, type SpaceToken } from './Stack';
import { LayoutProvider, useSlot, type SlotProps } from './useSlot';

/** What `previous` and `next` receive. */
export interface HorizontalScrollerButtonProps {
  label: string;
  onPress: () => void;
}

export interface HorizontalScrollerRootProps extends SlotProps, DataStateProps {
  /** The width of every item: pixels, or any CSS length. Without it each item keeps its own width. */
  itemWidth?: number | string | undefined;
  /** Overrides the gap between items, which otherwise follows the density level. */
  gap?: SpaceToken | undefined;
  /** `none` draws no thumb at all; `hover` and `auto` are the thin thumb of a `ScrollArea`. */
  scrollbar?: 'none' | 'hover' | 'auto' | undefined;
  /** Scrolling comes to rest at the start of an item. */
  snap?: boolean | undefined;
  /** Fades the items out at an edge that has more. It is a mask, so it is right on any background. */
  fade?: boolean | undefined;
  /** Called when the far edge is reached, for loading more. Once each time it is reached. */
  onReachEnd?: (() => void) | undefined;
  /** Number of placeholder items shown while `loading`. */
  skeletonItems?: number | undefined;
  /** Accessible names of the two buttons. */
  previousLabel?: string | undefined;
  nextLabel?: string | undefined;
  /** Accessible name of the list. */
  'aria-label'?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        previous?: Part<HorizontalScrollerButtonProps> | undefined;
        next?: Part<HorizontalScrollerButtonProps> | undefined;
        skeleton?: Part<{ index: number }> | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** `HorizontalScroller.Item` elements. */
  children?: ReactNode | undefined;
}

/** Controls that use the arrow keys themselves: the row leaves the keys to them. */
const OWN_ARROWS =
  'input, textarea, select, [contenteditable], [role="slider"], [role="spinbutton"], [role="tab"], [role="radio"], [role="menuitem"], [role="option"], [role="row"], [role="gridcell"], [role="combobox"]';

function Root({
  itemWidth,
  gap,
  scrollbar = 'none',
  snap = true,
  fade = true,
  onReachEnd,
  skeletonItems = 6,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  'aria-label': label = 'Items',
  loading = false,
  empty,
  error,
  onRetry,
  retryLabel,
  parts,
  className,
  style,
  children,
  ...slot
}: HorizontalScrollerRootProps) {
  // The row is as tall as its items unless it is given a share of the height.
  const { ref, props } = useSlot<HTMLDivElement>({ ...slot, size: slot.size ?? 'content' });
  // State, not a ref: the list comes and goes with the empty and error states, and the effect follows it.
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const [more, setMore] = useState({ start: false, end: false });
  const state = dataState(
    { loading, empty, error, onRetry, retryLabel },
    { isEmpty: Children.count(children) === 0, variant: 'inline', part: true },
  );

  useEffect(() => {
    const view = list?.parentElement;
    const root = ref.current;
    if (!list || !view || !root) return;
    const measure = () => {
      const position = Math.abs(view.scrollLeft);
      const next = { start: position > 1, end: position < view.scrollWidth - view.clientWidth - 1 };
      // A button that is about to go hands the focus on: to the other button, else into the row.
      const control = (part: string) => root.querySelector<HTMLElement>(`:scope > [data-part="${part}"]`);
      const inRow = () => focusableIn(list)[0] ?? view;
      if (!next.start)
        moveFocusFrom(control('previous'), control('next')?.querySelector('button') ?? inRow());
      if (!next.end) moveFocusFrom(control('next'), control('previous')?.querySelector('button') ?? inRow());
      setMore((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    // Arrow keys move between items, on top of the natural tab order. A native listener: it is on a list.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement;
      const items = [...list.children] as HTMLElement[];
      const current = items.findIndex((item) => item.contains(target));
      if (current < 0 || target.closest(OWN_ARROWS)) return;
      const forward = getComputedStyle(list).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const backward = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
      const order =
        event.key === forward
          ? items.slice(current + 1)
          : event.key === backward
            ? items.slice(0, current).reverse()
            : event.key === 'Home'
              ? items.slice(0, current)
              : event.key === 'End'
                ? items.slice(current + 1).reverse()
                : null;
      if (!order) return;
      event.preventDefault();
      // The browser brings the focused control into view.
      order
        .map((item) => focusableIn(item)[0])
        .find(Boolean)
        ?.focus();
    };
    measure();
    view.addEventListener('scroll', measure, { passive: true });
    list.addEventListener('keydown', onKeyDown);
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(list);
    return () => {
      view.removeEventListener('scroll', measure);
      list.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
    };
  }, [ref, list]);

  /** Scrolls by about one view, to the start of an item. */
  const scroll = (direction: 1 | -1) => {
    const view = list?.parentElement;
    if (!list || !view) return;
    const css = getComputedStyle(view);
    const rtl = css.direction === 'rtl';
    const box = view.getBoundingClientRect();
    // How far an item's leading edge is past the leading edge of the view.
    const offset = (item: Element) => {
      const rect = item.getBoundingClientRect();
      return rtl ? box.right - rect.right : rect.left - box.left;
    };
    const items = [...list.children];
    let index: number;
    if (direction > 0) {
      // The first item the far edge cuts becomes the first one shown.
      index = items.findIndex((item) => offset(item) + item.getBoundingClientRect().width > box.width + 1);
      if (index >= 0 && offset(items[index]!) <= 1) index += 1;
    } else {
      // The first item less than one view back.
      index = items.findIndex((item) => offset(item) > -box.width - 1);
      if (index > 0 && offset(items[index]!) >= -1) index -= 1;
    }
    const target = items[index];
    const distance = target ? offset(target) : direction * view.scrollWidth;
    view.scrollBy({
      left: rtl ? -distance : distance,
      // Movement is removed under reduced motion (plan/interaction.md).
      behavior: parseFloat(css.getPropertyValue('--umbra-motion-scale')) === 0 ? 'instant' : 'smooth',
    });
  };

  return (
    <div
      {...props}
      ref={ref}
      data-umbra="horizontal-scroller"
      data-scrollbar={scrollbar}
      data-snap={snap || undefined}
      aria-busy={loading || undefined}
      className={cx(layout.slot, styles.root, className)}
      style={{
        ...props.style,
        ...(itemWidth !== undefined && {
          ['--item-width' as string]: typeof itemWidth === 'number' ? `${itemWidth}px` : itemWidth,
        }),
        ...style,
      }}
    >
      {state ?? (
        <>
          <ScrollArea
            axis="horizontal"
            scrollbar={scrollbar === 'none' ? 'auto' : scrollbar}
            fade={fade}
            onReachEnd={onReachEnd}
            aria-label={label}
            parts={{ fade: null }}
          >
            {/* The items belong to the row: a `Stack` around it must not count or collapse them. */}
            <LayoutProvider value={null}>
              <div
                ref={setList}
                role="list"
                aria-label={label}
                data-part="track"
                className={styles.track}
                style={gapStyle(gap)}
              >
                {loading
                  ? Array.from({ length: skeletonItems }, (_, index) => (
                      <Item key={index}>
                        {renderPart(parts?.skeleton, { index }, () => (
                          <div data-part="skeleton" className={styles.skeleton}>
                            <Skeleton shape="block" />
                          </div>
                        ))}
                      </Item>
                    ))
                  : children}
              </div>
            </LayoutProvider>
          </ScrollArea>
          {more.start &&
            renderPart(parts?.previous, { label: previousLabel, onPress: () => scroll(-1) }, (p) => (
              <EdgeButton part="previous" {...p} />
            ))}
          {more.end &&
            renderPart(parts?.next, { label: nextLabel, onPress: () => scroll(1) }, (p) => (
              <EdgeButton part="next" {...p} />
            ))}
        </>
      )}
    </div>
  );
}

/** A round button over the edge it scrolls towards. */
const EdgeButton = ({
  part,
  label,
  onPress,
}: HorizontalScrollerButtonProps & { part: 'previous' | 'next' }) => (
  <span data-part={part} className={styles.button}>
    <IconButton
      variant="neutral"
      shape="circle"
      icon={<Icon name={part === 'next' ? 'forward' : 'back'} />}
      label={label}
      onPress={onPress}
    />
  </span>
);

export interface HorizontalScrollerItemProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** One cell of the row. Its child fills it. */
function Item({ className, style, children }: HorizontalScrollerItemProps) {
  return (
    <div role="listitem" data-part="item" className={cx(styles.item, className)} style={style}>
      {children}
    </div>
  );
}

export type HorizontalScrollerProps = HorizontalScrollerRootProps;

/** A row of cards or tiles that scrolls sideways inside itself. Each child is one item. */
export function HorizontalScroller({ children, ...root }: HorizontalScrollerProps) {
  return (
    <Root {...root}>
      {Children.map(children, (child) => child != null && child !== false && <Item>{child}</Item>)}
    </Root>
  );
}

HorizontalScroller.Root = Root;
HorizontalScroller.Item = Item;
