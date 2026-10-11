import {
  Children,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { dataState, type DataStateProps } from '../internal/dataState';
import { heightProps, type FillHeight } from '../internal/height';
import { cx, renderPart, type Part } from '../utils/parts';
import { Card, type CardProps } from './Card';
import layout from './layout.module.css';
import { ScrollArea } from './ScrollArea';
import { packBoard } from './packBoard';
import { LayoutProvider, useSlot, type SlotProps } from './useSlot';
import styles from './WidgetBoard.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

/** Identifies one widget of a board. */
export type WidgetBoardId = string;

interface BoardContextValue {
  /** The widgets that can collapse, in the order they registered. */
  ids: readonly WidgetBoardId[];
  collapsed: ReadonlySet<WidgetBoardId>;
  setCollapsed: (ids: WidgetBoardId[]) => void;
  register: (id: WidgetBoardId) => () => void;
}
const BoardContext = createContext<BoardContextValue | null>(null);
function useBoard() {
  const board = useContext(BoardContext);
  if (!board) throw new Error('WidgetBoard blocks must be rendered inside <WidgetBoard.Root>.');
  return board;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface WidgetBoardRootProps extends BlockProps, SlotProps, RootAttributes {
  /** Controlled: the ids of the collapsed widgets. */
  collapsedIds?: WidgetBoardId[] | undefined;
  defaultCollapsedIds?: WidgetBoardId[] | undefined;
  onCollapsedChange?: ((ids: WidgetBoardId[]) => void) | undefined;
  /** `fill` (default) takes the slot and scrolls inside; `content` is as tall as the widgets; or pixels. */
  height?: FillHeight | undefined;
  /** Marks the board busy for assistive technology. */
  loading?: boolean | undefined;
}

function Root({
  collapsedIds,
  defaultCollapsedIds,
  onCollapsedChange,
  height,
  loading = false,
  className,
  style,
  children,
  ...slot
}: WidgetBoardRootProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slot);
  const [own, setOwn] = useState(defaultCollapsedIds ?? []);
  const [ids, setIds] = useState<readonly WidgetBoardId[]>([]);
  const list = collapsedIds ?? own;
  const changed = useRef(onCollapsedChange);
  useLayoutEffect(() => {
    changed.current = onCollapsedChange;
  });
  const setCollapsed = useCallback((next: WidgetBoardId[]) => {
    setOwn(next);
    changed.current?.(next);
  }, []);
  const register = useCallback((id: WidgetBoardId) => {
    setIds((prev) => [...prev, id]);
    return () => setIds((prev) => prev.filter((other) => other !== id));
  }, []);
  const board = useMemo(
    () => ({ ids, collapsed: new Set(list), setCollapsed, register }),
    [ids, list, setCollapsed, register],
  );
  const sized = heightProps(height);
  return (
    <BoardContext value={board}>
      <div
        {...passThrough(slot)}
        {...props}
        ref={ref}
        data-umbra="widget-board"
        data-height={sized['data-height']}
        aria-busy={loading || undefined}
        className={cx(layout.slot, styles.root, className)}
        style={{ ...props.style, ...sized.style, ...style }}
      >
        {children}
      </div>
    </BoardContext>
  );
}

/** A row above the grid, for the board's own controls. */
function Toolbar({ className, style, children }: BlockProps) {
  return (
    <div data-part="toolbar" className={cx(styles.toolbar, className)} style={style}>
      {children}
    </div>
  );
}

/** What the `collapseAll` part receives. */
export interface WidgetBoardCollapseAllPartProps {
  /** Every widget that can collapse is collapsed: the button expands them. */
  allCollapsed: boolean;
  onPress: () => void;
  /** The label for the current state. */
  children: ReactNode;
}

function useCollapseAll(collapseAllLabel: string, expandAllLabel: string): WidgetBoardCollapseAllPartProps {
  const { ids, collapsed, setCollapsed } = useBoard();
  const allCollapsed = ids.length > 0 && ids.every((id) => collapsed.has(id));
  return {
    allCollapsed,
    // Ids the board does not know (a widget that is not mounted now) keep their state.
    onPress: () =>
      setCollapsed(
        allCollapsed
          ? [...collapsed].filter((id) => !ids.includes(id))
          : [...new Set([...collapsed, ...ids])],
      ),
    children: allCollapsed ? expandAllLabel : collapseAllLabel,
  };
}

const CollapseAllButton = ({ allCollapsed, onPress, children }: WidgetBoardCollapseAllPartProps) => (
  <span data-part="collapseAll" data-all-collapsed={allCollapsed || undefined}>
    <Button variant="ghost" size="small" onPress={onPress}>
      {children}
    </Button>
  </span>
);

export interface WidgetBoardCollapseAllProps {
  collapseAllLabel?: string | undefined;
  expandAllLabel?: string | undefined;
}

/** One button that collapses every widget, or expands them when all are collapsed. Nothing while no widget can collapse. */
function CollapseAll({
  collapseAllLabel = 'Collapse all',
  expandAllLabel = 'Expand all',
}: WidgetBoardCollapseAllProps) {
  const props = useCollapseAll(collapseAllLabel, expandAllLabel);
  return useBoard().ids.length ? <CollapseAllButton {...props} /> : null;
}

export interface WidgetBoardGridProps extends BlockProps {
  /** The board has as many columns as fit at this width or more, in pixels. */
  minColumnWidth?: number | undefined;
  /** A fixed number of columns. Wins over `minColumnWidth`. */
  columns?: number | undefined;
  /** Accessible name of the list of widgets. */
  'aria-label'?: string | undefined;
}

/**
 * The packed grid, in a `ScrollArea`. The CSS grid gives the columns and their widths; the script reads
 * each item's height and gives it a column and a top (`packBoard`). The items are positioned inside
 * their grid columns, so they stay in source order in the page and a board of any height works: there
 * is no row per pixel to run out of (a browser stops at a few thousand grid rows).
 */
function Grid({
  minColumnWidth,
  columns,
  'aria-label': label = 'Widgets',
  className,
  style,
  children,
}: WidgetBoardGridProps) {
  const grid = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el || !ruler.current) return;
    // What was last written on each item: only a place that has changed is written again. Plain
    // properties, not custom ones: those are inherited, and a new value would have every element inside
    // the card styled again.
    const written = new WeakMap<HTMLElement, { column: number; span: number; top: number; asked: string }>();
    // One pass: the spans are written, every height is read in one layout, the places are written.
    const place = () => {
      const css = getComputedStyle(el);
      const gap = parseFloat(css.columnGap) || 0;
      const count = css.gridTemplateColumns.split(' ').length;
      const items = [...el.children] as HTMLElement[];
      el.dataset.packed = '';
      // Widths first: a span changes the width of an item, and with it the height that is read next.
      const spans = items.map((item) => Math.min(Math.max(1, Number(item.dataset.span) || 1), count));
      items.forEach((item, i) => {
        const was = written.get(item);
        if (was?.span === spans[i] && was?.asked === item.dataset.span) return;
        item.style.gridColumn = `${was?.column ?? 1} / span ${spans[i]}`;
        written.delete(item);
      });
      // While a card moves (its caret was pressed) every card keeps its column and only follows; the
      // packing its end height asks for comes once, when it has come to rest.
      const moving = !!el.querySelector(':scope > * > [data-resizing]');
      const heights = items.map((item) => item.getBoundingClientRect().height);
      const { placed, end } = packBoard(
        items.map((item, i) => ({
          span: spans[i]!,
          // A whole number of pixels, so cards are drawn on the pixel grid.
          advance: Math.ceil(heights[i]! + gap),
          column: moving ? written.get(item)?.column : undefined,
        })),
        count,
      );
      items.forEach((item, i) => {
        const { column, span, top } = placed[i]!;
        const was = written.get(item);
        if (was?.column !== column || was.span !== span)
          item.style.gridColumn = `${column + 1} / span ${span}`;
        if (was?.top !== top) item.style.top = `${top}px`;
        written.set(item, { column, span, top, asked: item.dataset.span ?? '' });
      });
      const height = `${Math.max(0, end - gap)}px`;
      if (el.style.height !== height) el.style.height = height;
    };
    // A card that collapses with its caret changes height frame by frame, and the cards under it follow.
    // The width is watched on the ruler, not on the grid: the grid's height is set here.
    const sizes = new ResizeObserver(place);
    sizes.observe(ruler.current);
    const watched = new Set<Element>();
    const watch = () => {
      for (const item of el.children) {
        if (watched.has(item)) continue;
        watched.add(item);
        sizes.observe(item);
      }
      for (const item of watched) {
        if (item.parentElement === el) continue;
        watched.delete(item);
        sizes.unobserve(item);
      }
    };
    const itemsChanged = new MutationObserver(() => {
      watch();
      place();
    });
    itemsChanged.observe(el, { childList: true });
    // A card that has come to rest, or a new `span`.
    const stateChanged = new MutationObserver(place);
    stateChanged.observe(el, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-resizing', 'data-span'],
    });
    watch();
    place();
    return () => {
      sizes.disconnect();
      itemsChanged.disconnect();
      stateChanged.disconnect();
    };
  }, []);
  return (
    <ScrollArea aria-label={label} fade={false}>
      {/* The cards belong to the board: a `Stack` around the board must not count or collapse them. */}
      <LayoutProvider value={null}>
        <div>
          <div ref={ruler} aria-hidden="true" className={styles.ruler} />
          <div
            ref={grid}
            role="list"
            aria-label={label}
            data-part="grid"
            data-columns={columns}
            className={cx(styles.grid, className)}
            style={{
              ...(minColumnWidth !== undefined && {
                ['--min-column-width' as string]: `${minColumnWidth}px`,
              }),
              ...(columns !== undefined && { ['--columns' as string]: Math.max(1, Math.floor(columns)) }),
              ...style,
            }}
          >
            {children}
          </div>
        </div>
      </LayoutProvider>
    </ScrollArea>
  );
}

/** What an item with an `id` hands to its function child: spread it on a collapsible `Card`. */
export interface WidgetBoardItemState {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export interface WidgetBoardItemProps extends Omit<BlockProps, 'children'> {
  /** Makes the item one of the widgets the board collapses and expands. */
  id?: WidgetBoardId | undefined;
  /** How many columns the item takes. Cut to the number of columns the board has. */
  span?: number | undefined;
  /** The card: one element, as tall as its content (`size="content"` on a `Card`). A function receives the collapse state. */
  children?: ReactNode | ((state: WidgetBoardItemState) => ReactNode) | undefined;
}

/** One cell of the board. */
function Item({ id, span = 1, className, style, children }: WidgetBoardItemProps) {
  const { collapsed, setCollapsed, register } = useBoard();
  useLayoutEffect(() => (id === undefined ? undefined : register(id)), [register, id]);
  const state: WidgetBoardItemState = {
    collapsed: id !== undefined && collapsed.has(id),
    onCollapsedChange: (next) => {
      if (id === undefined) return;
      const rest = [...collapsed].filter((other) => other !== id);
      setCollapsed(next ? [...rest, id] : rest);
    },
  };
  return (
    <div
      role="listitem"
      data-part="item"
      data-id={id}
      data-span={span}
      className={cx(styles.item, className)}
      style={style}
    >
      {typeof children === 'function' ? children(state) : children}
    </div>
  );
}

export interface WidgetBoardWidgetProps extends Omit<
  CardProps,
  'collapsed' | 'defaultCollapsed' | 'size' | 'priority' | 'minWidth' | 'minHeight' | 'label'
> {
  /** Identifies the widget in `collapsedIds`. Unique in the board. */
  id: WidgetBoardId;
  /** How many columns the widget takes. */
  span?: number | undefined;
}

/** A `Card` on the board: as tall as its content, and collapsible unless `collapsible` is `false`. */
function Widget({ id, span, collapsible = true, onCollapsedChange, ...card }: WidgetBoardWidgetProps) {
  return (
    <Item id={collapsible ? id : undefined} span={span}>
      {(state) => (
        <Card
          {...card}
          size="content"
          collapsible={collapsible}
          collapsed={state.collapsed}
          onCollapsedChange={(next) => {
            state.onCollapsedChange(next);
            onCollapsedChange?.(next);
          }}
        />
      )}
    </Item>
  );
}

// Placeholder cards of different heights, so the loading board looks like a board.
const SKELETON_HEIGHTS = [160, 240, 120, 200, 140, 180];

type BoardParts = {
  toolbar?: Part<{ children: ReactNode }> | undefined;
  collapseAll?: Part<WidgetBoardCollapseAllPartProps> | undefined;
  skeleton?: Part<{ index: number }> | undefined;
};

function BoardToolbar({
  parts,
  collapseAllLabel,
  expandAllLabel,
}: {
  collapseAllLabel: string;
  expandAllLabel: string;
  parts: BoardParts | undefined;
}) {
  const props = useCollapseAll(collapseAllLabel, expandAllLabel);
  if (!useBoard().ids.length) return null;
  const button = renderPart(parts?.collapseAll, props, (p) => <CollapseAllButton {...p} />);
  return renderPart(
    parts?.toolbar,
    { children: button },
    (p) => p.children && <Toolbar>{p.children}</Toolbar>,
  );
}

export interface WidgetBoardProps
  extends
    Omit<WidgetBoardRootProps, 'loading'>,
    Pick<WidgetBoardGridProps, 'minColumnWidth' | 'columns' | 'aria-label'>,
    WidgetBoardCollapseAllProps,
    DataStateProps {
  /** Number of placeholder cards shown while `loading`. */
  skeletonItems?: number | undefined;
  /** Replace or hide named pieces. */
  parts?: BoardParts | undefined;
  /** `WidgetBoard.Widget` and `WidgetBoard.Item` elements. */
  children?: ReactNode | undefined;
}

/** A packed board of collapsible cards of different heights. It scrolls inside itself. */
export function WidgetBoard({
  minColumnWidth,
  columns,
  'aria-label': label,
  collapseAllLabel = 'Collapse all',
  expandAllLabel = 'Expand all',
  loading = false,
  empty,
  error,
  onRetry,
  retryLabel,
  skeletonItems = 6,
  parts,
  children,
  ...root
}: WidgetBoardProps) {
  const state = dataState(
    { loading, empty, error, onRetry, retryLabel },
    { isEmpty: Children.count(children) === 0, defaultEmpty: { title: 'No widgets' }, part: true },
  );
  return (
    <Root {...root} loading={loading}>
      <BoardToolbar parts={parts} collapseAllLabel={collapseAllLabel} expandAllLabel={expandAllLabel} />
      {state ?? (
        <Grid minColumnWidth={minColumnWidth} columns={columns} aria-label={label}>
          {loading
            ? Array.from({ length: skeletonItems }, (_, index) => (
                <Item key={index}>
                  {renderPart(parts?.skeleton, { index }, () => (
                    <div data-part="skeleton" className={styles.skeleton}>
                      <Skeleton shape="block" height={SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length]} />
                    </div>
                  ))}
                </Item>
              ))
            : children}
        </Grid>
      )}
    </Root>
  );
}

WidgetBoard.Root = Root;
WidgetBoard.Toolbar = Toolbar;
WidgetBoard.CollapseAll = CollapseAll;
WidgetBoard.Grid = Grid;
WidgetBoard.Item = Item;
WidgetBoard.Widget = Widget;
