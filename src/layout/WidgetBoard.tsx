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
    onPress: () => setCollapsed(allCollapsed ? [...collapsed].filter((id) => !ids.includes(id)) : [...ids]),
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
 * The packed grid, in a `ScrollArea`. Rows are one pixel high and each item spans its measured height,
 * so the grid's dense placement puts every item in the first free place from the top: the items stay
 * in source order in the page, and nothing is positioned by script.
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
  // After every render: items come and go, and one observer watches them all.
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return;
    const place = () => {
      const css = getComputedStyle(el);
      const gap = parseFloat(css.columnGap) || 0;
      const items = [...el.children] as HTMLElement[];
      // The columns the board has are counted with no span set: a span wider than the board would add
      // a column of its own, and then be counted.
      for (const item of items) item.style.gridColumnEnd = '';
      const count = css.gridTemplateColumns.split(' ').length;
      // Widths first: a span changes the width of an item, and with it the height that is read next.
      for (const item of items) {
        item.style.gridColumnEnd = `span ${Math.min(Math.max(1, Number(item.dataset.span) || 1), count)}`;
      }
      const heights = items.map((item) => item.firstElementChild?.getBoundingClientRect().height ?? 0);
      items.forEach((item, i) => {
        item.style.gridRowEnd = `span ${Math.ceil(heights[i]! + gap)}`;
      });
    };
    place();
    // A card that collapses with its caret changes height frame by frame, and the cards under it follow.
    const observer = new ResizeObserver(place);
    observer.observe(el);
    for (const item of el.children) if (item.firstElementChild) observer.observe(item.firstElementChild);
    return () => observer.disconnect();
  });
  return (
    <ScrollArea aria-label={label} fade={false}>
      {/* The cards belong to the board: a `Stack` around the board must not count or collapse them. */}
      <LayoutProvider value={null}>
        <div className={styles.clip}>
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
