import {
  columnGroupingFeature,
  columnVisibilityFeature,
  createGroupedRowModel,
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type RowData,
} from '@tanstack/react-table';
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components';
import { IconButton } from '../basics/IconButton';
import { Skeleton } from '../basics/Skeleton';
import { GroupHeader } from '../data/GroupHeader';
import { KeyValueList, type KeyValueItem } from '../data/KeyValue';
import { Checkbox } from '../inputs/Checkbox';
import { ChangeHighlight } from '../internal/ChangeHighlight';
import { dataState, type DataStateProps } from '../internal/dataState';
import { heightProps } from '../internal/height';
import { ScrollArea } from '../layout/ScrollArea';
import { Menu, type MenuEntry } from '../overlays/Menu';
import tipStyles from '../overlays/Tooltip.module.css';
import { Icon } from '../provider/icons';
import { useUmbra } from '../provider/UmbraProvider';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './DataTable.module.css';
import { GridAdapterContext, INTERACTIVE, rowHandlers, useGrid, type GridAdapter } from './grid';
import {
  defaultWidthMetrics,
  resolveWidth,
  fitColumns,
  offsetsOf,
  orderGroups,
  rangeIds,
  windowRange,
  type ColumnSize,
} from './logic';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type DataTableAlign = 'start' | 'center' | 'end';
export type DataTablePin = 'start' | 'end';
export type DataTableSortDirection = 'asc' | 'desc';

/** One entry of the sort order: a column id and a direction. */
export interface DataTableSort {
  id: string;
  direction: DataTableSortDirection;
}

/**
 * A fixed width in pixels, a flexible width (at least `min`, at most `max`, sharing spare width by
 * `flex`), or `content`: as wide as the longest text of the column and its header, counted in
 * characters of the cell font.
 *
 * Pixels are written for the default density and scale with the cell font size (13px there), so a
 * width that fits its text at one density fits it at the others: 80 is 74px at compact and 86px at spacious.
 */
export type DataTableColumnWidth = number | 'content' | { min?: number; max?: number; flex?: number };

/** What a cell renderer receives besides the row. */
export interface DataTableCellContext<Row> {
  /** The value the column's `accessor` returns. */
  value: unknown;
  /** The value as text: through `format`, or as a plain string. */
  text: string;
  row: Row;
  rowId: string;
  /** Position of the row in the current order, from 0. */
  rowIndex: number;
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
}

/** One column of a `DataTable`. */
export interface DataTableColumn<Row> {
  /** Unique in the table. What `sort`, `columnGroups` and `onHiddenColumnsChange` refer to. */
  id: string;
  /** The header's content. */
  header?: ReactNode;
  /** The header as text, for assistive technology and for the label of a hidden column, when `header` is not text. */
  headerLabel?: string;
  /** A longer explanation of the column, read by assistive technology after the header. */
  description?: string;
  /** A hint for the header, shown in a tooltip on hover and keyboard focus, and read after the header unless `description` is set. */
  tooltip?: string;
  /** Hides the header's content visually; it stays for assistive technology. */
  hideHeader?: boolean;
  /** The value of a row in this column: a key of the row, or a function. Used to sort, and to render when there is no `cell`. */
  accessor?: (keyof Row & string) | ((row: Row) => unknown);
  /** Renders the cell. Without it, the cell shows the value as text. */
  cell?: (row: Row, context: DataTableCellContext<Row>) => ReactNode;
  /** Turns the value into text: for the cell, for its tooltip when truncated, and for `context.text`. */
  format?: (value: unknown, row: Row) => string;
  /** Default: `end` for a numeric column, otherwise `start`. */
  align?: DataTableAlign;
  /** Tabular figures, and `end` alignment by default. Default: on when the first row's value is a number. */
  numeric?: boolean;
  /** Default: `{ min: 96, flex: 1 }`. */
  width?: DataTableColumnWidth;
  /** Which columns hide first as the table narrows. Higher stays longer; equal priorities hide from the end. `always` never hides. Default 0. */
  priority?: number | 'always';
  /** The header sorts the table by this column. */
  sortable?: boolean;
  /** Compares two rows in ascending order. Default: by the `accessor` value (text in natural order, numbers, dates). */
  sortFn?: (a: Row, b: Row) => number;
  /** The first click sorts descending (largest first). */
  sortDescFirst?: boolean;
  /** Lets the text wrap onto more lines. Default: one line, cut with an ellipsis. Wrapping rows are not virtualised. */
  wrap?: boolean;
  /** Keeps the column in view while the table scrolls sideways. */
  pin?: DataTablePin;
  /** The column's cell in the footer row: a node, or a function of the rows in their current order. */
  footer?: ReactNode | ((rows: Row[]) => ReactNode);
  /** The column's cell in each group header row, from that group's rows. Not for the first column, which holds the group's title. */
  aggregate?: (rows: Row[]) => ReactNode;
  /** Marks the column's cells as the header of their row. */
  rowHeader?: boolean;
}

/** A header that spans several columns, in a row above the column headers. */
export interface DataTableColumnGroup {
  id: string;
  header: ReactNode;
  /** Ids of the columns under it. They must be next to each other. */
  columns: string[];
}

/** The title of one group of rows. Listing groups also fixes their order. */
export interface DataTableGroup {
  /** The value `groupBy` returns for the rows of this group. */
  key: string;
  /** Default: the key. */
  title?: ReactNode;
  /** Trailing text in the group header row. */
  meta?: ReactNode;
}

/** A coloured edge stripe on a row, and what it means. */
export interface DataTableRowAccent {
  /** Any CSS colour. */
  color: string;
  /** What assistive technology hears, so the meaning is not colour alone. */
  label: string;
}

const srOnly = styles.srOnly;

const pinStyle = (pin: DataTablePin | undefined, offset: number | undefined, style?: CSSProperties) =>
  pin ? { [pin === 'start' ? 'insetInlineStart' : 'insetInlineEnd']: offset ?? 0, ...style } : style;

export interface DataTableRootProps extends BlockProps {
  /** Accessible name of the table. Give this, `aria-labelledby` or `caption`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Names the table. Read by assistive technology; shown above the table with `showCaption`. */
  caption?: ReactNode;
  showCaption?: boolean;
  /** Says that several rows can be selected. */
  multiselectable?: boolean;
  /** Number of rows and columns in the whole table, when not all of them are rendered. */
  rowCount?: number;
  columnCount?: number;
  /** Width of the table in pixels. Sets a fixed column layout: give the widths in a `<colgroup>`. Default: as wide as the slot, columns sized by their content. */
  width?: number;
  /** Number of header rows, so the second one and the group rows stick below the first. */
  headerRows?: number;
  /** A line under every row. */
  dividers?: boolean;
  /**
   * `fill` (default) takes the height of the parent, and falls back to the content's height in a parent
   * that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always
   * as tall as the content. A number is a height in pixels.
   */
  height?: 'fill' | 'content' | number;
  /** Marks the table busy for assistive technology. */
  loading?: boolean;
  /** Shown below the header in place of the rows: an empty or error state. */
  state?: ReactNode;
  /** Text announced politely to assistive technology, for example while more rows load. */
  announcement?: string;
  /** Called when the table is scrolled to its end. */
  onReachEnd?: () => void;
  elementRef?: RefObject<HTMLDivElement | null>;
}

/** The frame: a grid that scrolls inside its slot in both directions, with one tab stop and arrow keys. */
function Root({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  caption,
  showCaption = false,
  multiselectable,
  rowCount,
  columnCount,
  width,
  headerRows = 1,
  dividers = true,
  height,
  loading = false,
  state,
  announcement,
  onReachEnd,
  elementRef,
  className,
  style,
  children,
}: DataTableRootProps) {
  const captionId = useId();
  const own = useRef<HTMLDivElement>(null);
  const root = elementRef ?? own;
  const [table, gridHandlers] = useGrid();
  const scope = useScopeAttributes();

  // One tooltip for the whole table, in the look of `Tooltip`: the full text of a cell that is cut, or
  // the hint of a header. A cell says what to show with `data-tip`; nothing is mounted per cell.
  const [tip, setTip] = useState<{ el: HTMLElement; text: string } | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tipFor = (target: EventTarget) => {
    const el = (target as Element).closest<HTMLElement>('[data-tip]');
    if (!el || (!el.hasAttribute('data-tip-always') && el.scrollWidth <= el.clientWidth)) return null;
    return { el, text: el.dataset.tip! };
  };
  const hideTip = () => {
    clearTimeout(tipTimer.current);
    setTip(null);
  };

  // Pinned columns show an edge line only while something is scrolled under them.
  useEffect(() => {
    const el = root.current;
    const view = el?.querySelector<HTMLElement>('[data-part="viewport"]');
    if (!el || !view) return;
    const update = () => {
      const left = Math.abs(view.scrollLeft);
      el.toggleAttribute('data-scrolled-start', left > 1);
      el.toggleAttribute('data-scrolled-end', left < view.scrollWidth - view.clientWidth - 1);
    };
    update();
    view.addEventListener('scroll', update, { passive: true });
    const hide = () => setTip(null);
    view.addEventListener('scroll', hide, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(view);
    if (table.current) observer.observe(table.current);
    return () => {
      view.removeEventListener('scroll', update);
      view.removeEventListener('scroll', hide);
      observer.disconnect();
    };
  }, [root, table]);

  return (
    <div
      ref={root}
      data-umbra="data-table"
      data-dividers={dividers || undefined}
      data-loading={loading || undefined}
      data-height={heightProps(height)['data-height']}
      aria-busy={loading || undefined}
      className={cx(styles.root, className)}
      style={{ ['--head-rows' as string]: headerRows, ...heightProps(height).style, ...style }}
    >
      {caption != null && (
        <div id={captionId} data-part="caption" className={showCaption ? styles.caption : srOnly}>
          {caption}
        </div>
      )}
      <ScrollArea
        axis="both"
        fade={false}
        onReachEnd={onReachEnd}
        aria-label={ariaLabel}
        className={cx(styles.scroll, state != null && styles.hug)}
      >
        <table
          ref={table}
          role="grid"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby ?? (caption != null ? captionId : undefined)}
          aria-multiselectable={multiselectable}
          aria-rowcount={rowCount}
          aria-colcount={columnCount}
          data-fixed={width !== undefined || undefined}
          className={styles.table}
          style={{ width }}
          onKeyDown={gridHandlers.onKeyDown}
          onFocus={(event) => {
            gridHandlers.onFocus(event);
            // Keyboard focus shows the tooltip at once; a click does not.
            const next = event.target.matches(':focus-visible') ? tipFor(event.target) : null;
            if (next?.el === event.target) setTip(next);
          }}
          onBlur={(event) => {
            gridHandlers.onBlur(event);
            hideTip();
          }}
          onPointerOver={(event) => {
            const next = tipFor(event.target);
            if (next?.el === tip?.el) return;
            hideTip();
            if (next) tipTimer.current = setTimeout(() => setTip(next), 500);
          }}
          onPointerLeave={hideTip}
          onPointerDown={hideTip}
        >
          {children}
        </table>
      </ScrollArea>
      {state != null && (
        <div data-part="state" className={styles.state}>
          {state}
        </div>
      )}
      {/* 1ch wide, 1em high, with a cell's padding: what column widths are measured in. */}
      <span data-part="font-probe" aria-hidden="true" className={styles.probe} />
      <div role="status" className={srOnly}>
        {announcement}
      </div>
      {tip && tip.el.isConnected && (
        // Opened by the table, against the cell: there is no trigger element of its own.
        <TooltipTrigger isOpen>
          <AriaTooltip
            {...scope}
            triggerRef={{ current: tip.el }}
            placement="top"
            offset={6}
            data-umbra="tooltip"
            data-umbra-overlay=""
            className={tipStyles.root}
          >
            <span data-part="body" className={tipStyles.body}>
              {tip.text}
            </span>
          </AriaTooltip>
        </TooltipTrigger>
      )}
    </div>
  );
}

function Header({ className, style, children }: BlockProps) {
  return (
    <thead data-part="header" className={cx(styles.header, className)} style={style}>
      {children}
    </thead>
  );
}

function Body({ className, style, children }: BlockProps) {
  return (
    <tbody data-part="body" className={cx(styles.body, className)} style={style}>
      {children}
    </tbody>
  );
}

/** The footer rows: they stay at the bottom while the body scrolls. */
function Footer({ className, style, children }: BlockProps) {
  return (
    <tfoot data-part="footer" className={cx(styles.footer, className)} style={style}>
      {children}
    </tfoot>
  );
}

export interface DataTableSortIndicatorProps {
  /** `none`: the column can be sorted and is not. */
  direction: DataTableSortDirection | 'none';
  /** The column's place in a sort by several columns, from 1. */
  index?: number;
}

/** The arrow in a sortable header. The direction is its shape, not its colour. */
function SortIndicator({ direction, index }: DataTableSortIndicatorProps) {
  const { icons } = useUmbra();
  const arrow =
    direction === 'asc' ? icons.sortAscending : direction === 'desc' ? icons.sortDescending : icons.sortNone;
  return (
    <span
      data-part="sort-indicator"
      data-direction={direction}
      aria-hidden="true"
      className={styles.sortIndicator}
    >
      {arrow}
      {index !== undefined && <span className={styles.sortIndex}>{index}</span>}
    </span>
  );
}

interface CellLayoutProps {
  /** The column's id: what the keyboard focus remembers. */
  columnId?: string;
  align?: DataTableAlign;
  /** Sticks the cell to an edge while the table scrolls sideways. */
  pin?: DataTablePin;
  /** Distance from that edge in pixels: the widths of the pinned columns before it. */
  pinOffset?: number;
  /** The last pinned cell at the start, or the first at the end: it shows the edge line. */
  pinEdge?: boolean;
  colSpan?: number;
  /** Position of the column, from 1. */
  index?: number;
}

export interface DataTableHeaderCellProps extends BlockProps, CellLayoutProps {
  /** Makes the header sortable, and shows the current direction. */
  sort?: DataTableSortDirection | 'none';
  /** The column's place in a sort by several columns, from 1. */
  sortIndex?: number;
  /** Called when the header is pressed; `multi` when Shift was held. */
  onSort?: (multi: boolean) => void;
  /** Replaces the sort arrow. */
  sortIndicator?: ReactNode;
  /** Accessible name, when the content is not text. */
  label?: string;
  /** A longer explanation, read after the name. Assistive technology only. */
  description?: string;
  /** A hint shown in a tooltip on hover and keyboard focus. Also read after the name, unless `description` is set. */
  tooltip?: string;
  /** Hides the content visually. */
  hideLabel?: boolean;
  /** `colgroup` for a header that spans several columns. */
  scope?: 'col' | 'colgroup';
}

function HeaderCell({
  columnId,
  align = 'start',
  pin,
  pinOffset,
  pinEdge,
  colSpan,
  index,
  sort,
  sortIndex,
  onSort,
  sortIndicator,
  label,
  description: longDescription,
  tooltip,
  hideLabel,
  scope = 'col',
  className,
  style,
  children,
}: DataTableHeaderCellProps) {
  const descriptionId = useId();
  const labelId = useId();
  const description = longDescription ?? tooltip;
  const content = (
    <span id={labelId} data-part="header-label" className={hideLabel ? srOnly : styles.headerLabel}>
      {children}
    </span>
  );
  return (
    <th
      scope={scope}
      data-cell=""
      data-part="header-cell"
      data-col={columnId}
      data-align={align}
      data-pin={pin}
      data-pin-edge={pinEdge || undefined}
      data-sort={sort}
      data-tip={tooltip}
      data-tip-always={tooltip ? '' : undefined}
      aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : sort}
      aria-label={label}
      // The description sits inside the cell, so the name is taken from the label alone.
      aria-labelledby={description && !label ? labelId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-colindex={index}
      colSpan={colSpan}
      tabIndex={-1}
      className={cx(styles.headerCell, className)}
      style={pinStyle(pin, pinOffset, style)}
    >
      {sort ? (
        <button
          type="button"
          tabIndex={-1}
          className={styles.sortButton}
          onClick={(e) => onSort?.(e.shiftKey)}
        >
          {content}
          {sortIndicator === undefined ? <SortIndicator direction={sort} index={sortIndex} /> : sortIndicator}
        </button>
      ) : (
        content
      )}
      {description && (
        <span id={descriptionId} className={srOnly}>
          {description}
        </span>
      )}
    </th>
  );
}

export interface DataTableRowProps extends BlockProps {
  /** Identifies the row for the keyboard focus. Unique in the table. Default: generated. */
  rowKey?: string;
  /** Position of the row in the whole table, from 1, header rows included. */
  index?: number;
  /** Set (true or false) when rows can be selected. */
  selected?: boolean;
  /** A stronger fill and an edge marker: "my row" in a ranking. */
  highlighted?: boolean;
  /** The stripe fill of a striped table. */
  striped?: boolean;
  /** Dimmed; `onAction` and `onSelect` are not called. */
  disabled?: boolean;
  /** Colour of an edge stripe that carries a category. Say what it means in a cell, so it is not colour alone. */
  accent?: string;
  /** Called on Enter, on a double click, and on a click when there is no `onSelect`. */
  onAction?: () => void;
  /** Called on Space and on a click; `range` with Shift. */
  onSelect?: (options: { range: boolean }) => void;
  /** `data-` attributes go on the row element. */
  [data: `data-${string}`]: string | undefined;
}

function Row({
  rowKey,
  index,
  selected,
  highlighted,
  striped,
  disabled,
  accent,
  onAction,
  onSelect,
  className,
  style,
  children,
  ...data
}: DataTableRowProps) {
  const generated = useId();
  const ref = useRef<HTMLTableRowElement>(null);
  const action = disabled ? undefined : onAction;
  const select = disabled ? undefined : onSelect;
  useLayoutEffect(() => {
    if (ref.current) rowHandlers.set(ref.current, { onAction: action, onSelect: select });
  });
  // A click on a control inside the row, or one that ends a text selection, is not the row's.
  const own = (event: React.MouseEvent) =>
    !(event.target as Element).closest(INTERACTIVE) && !window.getSelection()?.toString();
  return (
    <tr
      ref={ref}
      data-kind="row"
      {...data}
      data-row-key={rowKey ?? generated}
      data-selected={selected || undefined}
      data-highlighted={highlighted || undefined}
      data-striped={striped || undefined}
      data-disabled={disabled || undefined}
      data-accent={accent ? '' : undefined}
      data-interactive={action || select ? '' : undefined}
      aria-rowindex={index}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={cx(styles.row, className)}
      style={accent ? { ['--accent' as string]: accent, ...style } : style}
      onClick={(event) => {
        if (!own(event)) return;
        if (select) select({ range: event.shiftKey });
        else action?.();
      }}
      onMouseDown={(event) => {
        // Shift+click selects a range of rows, not the text between two clicks.
        if (!select || !event.shiftKey || !own(event)) return;
        event.preventDefault();
        (event.target as Element).closest<HTMLElement>('[data-cell]')?.focus();
      }}
      onDoubleClick={(event) => {
        if (select && own(event)) action?.();
      }}
    >
      {children}
    </tr>
  );
}

export interface DataTableCellProps extends BlockProps, CellLayoutProps {
  /** The cell is the header of its row. */
  rowHeader?: boolean;
  /** Tabular figures. */
  numeric?: boolean;
  /** Lets the text wrap. Default: one line, cut with an ellipsis. */
  wrap?: boolean;
  /** The cell's full text: shown in a tooltip while the cell cuts it. */
  title?: string;
  /** `false` keeps the cell out of the keyboard grid: a placeholder or a skeleton. */
  focusable?: boolean;
}

function Cell({
  columnId,
  align = 'start',
  pin,
  pinOffset,
  pinEdge,
  colSpan,
  index,
  rowHeader,
  numeric,
  wrap,
  title,
  focusable = true,
  className,
  style,
  children,
}: DataTableCellProps) {
  const Element = rowHeader ? 'th' : 'td';
  return (
    <Element
      scope={rowHeader ? 'row' : undefined}
      data-cell={focusable ? '' : undefined}
      data-part="cell"
      data-col={columnId}
      data-align={align}
      data-pin={pin}
      data-pin-edge={pinEdge || undefined}
      data-numeric={numeric || undefined}
      data-wrap={wrap || undefined}
      aria-colindex={index}
      colSpan={colSpan}
      data-tip={title}
      tabIndex={focusable ? -1 : undefined}
      className={cx(styles.cell, className)}
      style={pinStyle(pin, pinOffset, style)}
    >
      {children}
    </Element>
  );
}

export interface DataTableGroupRowProps extends BlockProps {
  /** Identifies the row for the keyboard focus. */
  rowKey?: string;
  /** Position of the row in the whole table, from 1. */
  index?: number;
  /** The group's name. */
  title?: ReactNode;
  /** Number of rows in the group, shown after the title. */
  count?: number;
  /** Trailing text. */
  meta?: ReactNode;
  /** Adds a caret that collapses the group. The table (or the app) hides its rows. */
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible names of the caret. A text `title` is added: "Collapse Open". */
  collapseLabel?: string;
  expandLabel?: string;
  /** Sticks below the header while its rows scroll. */
  sticky?: boolean;
  /** Number of columns the title cell spans. The `children` fill the rest. */
  colSpan?: number;
  /** Cells after the title cell: one per remaining column, for the group's aggregates. */
  children?: ReactNode;
}

/** The header row of one group of rows, in the look of `GroupHeader`. */
function GroupRow({
  rowKey,
  index,
  title,
  count,
  meta,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
  collapseLabel = 'Collapse',
  expandLabel = 'Expand',
  sticky = false,
  colSpan,
  className,
  style,
  children,
}: DataTableGroupRowProps) {
  const generated = useId();
  const name = typeof title === 'string' ? ` ${title}` : '';
  return (
    <tr
      data-kind="group"
      data-part="group-header"
      data-row-key={rowKey ?? generated}
      data-sticky={sticky || undefined}
      data-collapsed={(collapsible && collapsed) || undefined}
      aria-rowindex={index}
      className={cx(styles.groupRow, className)}
      style={style}
    >
      <td data-cell="" colSpan={colSpan} tabIndex={-1} className={styles.groupCell}>
        <span className={styles.groupContent}>
          {collapsible && (
            <GroupHeader.Toggle
              collapsed={collapsed}
              label={(collapsed ? expandLabel : collapseLabel) + name}
              onPress={() => onCollapsedChange?.(!collapsed)}
            />
          )}
          <span data-part="title" className={styles.groupTitle}>
            {title}
          </span>
          {count !== undefined && <GroupHeader.Count>{count}</GroupHeader.Count>}
          {meta != null && (
            <span data-part="meta" className={styles.groupMeta}>
              {meta}
            </span>
          )}
        </span>
      </td>
      {children}
    </tr>
  );
}

/** A copy of an object without some of its keys: what a block receives from the props of its part. */
function without<T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...value };
  for (const key of keys) delete copy[key];
  return copy;
}

/**
 * Selection by click, Space and Shift range. The anchor of a range and the selection it extends are
 * refs: two range steps can follow each other in one key press (Shift+Arrow), before the next render.
 */
function useSelect(
  mode: 'none' | 'single' | 'multiple',
  selectedIds: string[],
  commit: (ids: string[]) => void,
) {
  const anchor = useRef<string | null>(null);
  const base = useRef<string[]>([]);
  return (id: string, rangeTo: boolean, order: () => string[]) => {
    const isSelected = selectedIds.includes(id);
    if (mode === 'single') {
      anchor.current = id;
      return commit(isSelected && !rangeTo ? [] : [id]);
    }
    if (rangeTo) {
      if (anchor.current === null) [anchor.current, base.current] = [id, selectedIds];
      return commit([...new Set([...base.current, ...rangeIds(order(), anchor.current, id)])]);
    }
    const next = isSelected ? selectedIds.filter((other) => other !== id) : [...selectedIds, id];
    [anchor.current, base.current] = [id, next];
    commit(next);
  };
}

/** A row's checkbox. A click with Shift held asks for a range; the change event alone does not say so. */
function RowCheckbox({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (range: boolean) => void;
}) {
  const shift = useRef(false);
  return (
    <span
      className={styles.widget}
      onClickCapture={(event) => {
        if (!(event.target instanceof HTMLInputElement)) shift.current = event.shiftKey;
      }}
    >
      <Checkbox
        size="small"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={() => {
          onToggle(shift.current);
          shift.current = false;
        }}
      />
    </span>
  );
}

function useControlled<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState(initial);
  const set = (next: T) => {
    setInner(next);
    onChange?.(next);
  };
  return [value ?? inner, set] as const;
}

// TanStack Table does the row logic: sorting, grouping, selection state and column visibility.
// Nothing of it leaves this file.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
  columnVisibilityFeature,
  rowSelectionFeature,
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
});

const SELECT = '__select';
const EXPAND = '__expand';
const GROUP = '__group';
const UTILITY_WIDTH = 40;
/** Rows rendered beyond the visible ones, on the side the table is not scrolling towards. */
const OVERSCAN = 8;
/** The rendered rows are renewed when the window has moved by this many rows. */
const OVERSCAN_STEP = 4;
/** `virtualize="auto"` starts above this many rows. */
const VIRTUAL_FROM = 200;

const valueOf = <Row,>(column: DataTableColumn<Row>, row: Row): unknown =>
  typeof column.accessor === 'function'
    ? column.accessor(row)
    : column.accessor !== undefined
      ? row[column.accessor]
      : undefined;

const textOf = <Row,>(column: DataTableColumn<Row>, row: Row): string => {
  const value = valueOf(column, row);
  return column.format ? column.format(value, row) : value == null ? '' : String(value);
};

/** A laid-out column: one of the app's, or the checkbox or disclosure column the table adds. */
interface Col<Row> {
  id: string;
  def?: DataTableColumn<Row>;
  pin?: DataTablePin;
  pinOffset?: number;
  pinEdge?: boolean;
  align: DataTableAlign;
  numeric: boolean;
  width: number;
}

export interface DataTableProps<Row> extends DataStateProps {
  /** The rows. Keep the array stable between renders (state or a memo): a new array is sorted again. */
  data: Row[];
  /** A stable, unique id for a row. Selection, highlight, focus and change highlighting are kept by it. */
  getRowId: (row: Row) => string;
  /** The columns, in order. Pinned columns move to their edge. Keep the array stable between renders. */
  columns: DataTableColumn<Row>[];
  /** Headers that span several columns, in a row above the column headers. */
  columnGroups?: DataTableColumnGroup[];

  /** Controlled sort order: the first entry sorts first. */
  sort?: DataTableSort[];
  defaultSort?: DataTableSort[];
  onSortChange?: (sort: DataTableSort[]) => void;
  /** Shift+click or Shift+Enter on a header adds it to the sort instead of replacing it. */
  multiSort?: boolean;
  /** The rows arrive sorted (by a server): headers still show and report the sort, the table does not reorder. */
  manualSorting?: boolean;

  /** `single` and `multiple` add a checkbox column and let the user select rows. */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** Controlled selection: the ids of the selected rows. */
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Accessible name of a row's checkbox. */
  selectRowLabel?: (row: Row) => string;
  /** Accessible name of the header checkbox, or of the checkbox column in `single`. */
  selectAllLabel?: string;

  /** Ids of rows shown with a stronger fill and an edge marker: "my row" in a ranking. */
  highlightedRowIds?: string[];
  /** The same, as a function. */
  rowHighlight?: (row: Row) => boolean;
  /** What assistive technology hears for a highlighted row. */
  highlightLabel?: string;
  /** A coloured edge stripe that carries a category or status, with the label that says what it means. */
  rowAccent?: (row: Row) => DataTableRowAccent | undefined;
  /** A faint fill on every other row. */
  striped?: boolean;
  /** A line under every row. */
  dividers?: boolean;
  /** Called when a row is activated: Enter, a double click, or a single click when rows cannot be selected. */
  onRowAction?: (row: Row) => void;
  /** Makes the row a link: its row header cell (or first cell) holds the link, and activating the row follows it. */
  rowHref?: (row: Row) => string | undefined;
  /** Disabled rows are dimmed and can be neither selected nor activated. */
  isRowDisabled?: (row: Row) => boolean;

  /** Groups the rows under header rows: a key of the row, or a function that returns the group's key. */
  groupBy?: (keyof Row & string) | ((row: Row) => string);
  /** Titles and order of the groups. Groups not listed follow, titled by their key, as they first appear. */
  groups?: DataTableGroup[];
  /** Adds a caret to every group header row. */
  collapsibleGroups?: boolean;
  /** Controlled: the keys of the collapsed groups. */
  collapsedGroups?: string[];
  defaultCollapsedGroups?: string[];
  onCollapsedGroupsChange?: (keys: string[]) => void;
  /** Group header rows stick below the header while their rows scroll. */
  stickyGroups?: boolean;
  /** Accessible names of a group's caret; the group's title is added. */
  collapseGroupLabel?: string;
  expandGroupLabel?: string;

  /** Called with the ids of the columns hidden for lack of width, whenever they change. */
  onHiddenColumnsChange?: (ids: string[]) => void;
  /** While columns are hidden, each row gets a control that shows their labels and values under the row. */
  expandableHidden?: boolean;
  /** Accessible names of that control. */
  showDetailsLabel?: string;
  hideDetailsLabel?: string;

  /** Number of skeleton rows shown while `loading`. */
  skeletonRows?: number;
  /**
   * `fill` (default) takes the height of the parent, and falls back to the content's height in a parent
   * that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always
   * as tall as the content, and shows every row (no virtualisation). A number is a height in pixels.
   */
  height?: 'fill' | 'content' | number;

  /** Shows a skeleton row after the last row while more rows load. */
  loadingMore?: boolean;
  /** What assistive technology hears while more rows load. */
  loadingMoreLabel?: string;
  /** Called when the table is scrolled to its end, for loading more. */
  onReachEnd?: () => void;

  /** Renders only the rows in view. `auto`: above 200 rows, unless a column wraps. Rows must then all have the same height. */
  virtualize?: boolean | 'auto';
  /** A changed value flashes once: green up, red down (with a sign), neutral otherwise. `true` for every column with an `accessor`, or the ids of some. */
  highlightChanges?: boolean | string[];
  /** What assistive technology hears with the sign of a changed value. */
  increasedLabel?: string;
  decreasedLabel?: string;

  /** Names the table. Read by assistive technology; shown above the table with `showCaption`. */
  caption?: ReactNode;
  showCaption?: boolean;
  /** Accessible name of the table. Give this, `aria-labelledby` or `caption`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;

  /** Replace or hide named pieces. */
  parts?: {
    header?: Part<BlockProps>;
    headerCell?: Part<DataTableHeaderCellProps & { column: DataTableColumn<Row> }>;
    sortIndicator?: Part<DataTableSortIndicatorProps>;
    row?: Part<DataTableRowProps & { row: Row }>;
    cell?: Part<DataTableCellProps & { row: Row; column: DataTableColumn<Row> }>;
    groupHeader?: Part<DataTableGroupRowProps>;
    /** The labels and values of the hidden columns, under an expanded row. */
    detail?: Part<{ row: Row; items: KeyValueItem[] }>;
    footer?: Part<BlockProps>;
    /** The placeholder in one cell of a skeleton row. */
    skeleton?: Part<{ rowIndex: number; columnId: string }>;
    empty?: Part<{ children: ReactNode }>;
    error?: Part<{ children: ReactNode }>;
  };
  className?: string;
  style?: CSSProperties;
}

/**
 * A table of rows and columns that fills its slot and scrolls inside it: sorting, selection, groups,
 * pinned columns, and columns that hide by priority as it narrows.
 */
export function DataTable<Row>({
  data,
  getRowId,
  columns,
  columnGroups,
  sort: sortProp,
  defaultSort,
  onSortChange,
  multiSort = false,
  manualSorting = false,
  selectionMode = 'none',
  selectedIds: selectedProp,
  defaultSelectedIds,
  onSelectionChange,
  selectRowLabel = () => 'Select row',
  selectAllLabel = selectionMode === 'multiple' ? 'Select all rows' : 'Selection',
  highlightedRowIds,
  rowHighlight,
  highlightLabel = 'Highlighted',
  rowAccent,
  striped = false,
  dividers = true,
  onRowAction,
  rowHref,
  isRowDisabled,
  groupBy,
  groups,
  collapsibleGroups = false,
  collapsedGroups,
  defaultCollapsedGroups,
  onCollapsedGroupsChange,
  stickyGroups = true,
  collapseGroupLabel,
  expandGroupLabel,
  onHiddenColumnsChange,
  expandableHidden = false,
  showDetailsLabel = 'Show hidden columns',
  hideDetailsLabel = 'Hide hidden columns',
  skeletonRows = 8,
  loadingMore = false,
  loadingMoreLabel = 'Loading more',
  onReachEnd,
  virtualize = 'auto',
  height,
  highlightChanges = false,
  increasedLabel = 'increased',
  decreasedLabel = 'decreased',
  caption,
  showCaption,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  parts,
  className,
  style,
  ...states
}: DataTableProps<Row>) {
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const viewport = () => root.current?.querySelector<HTMLElement>('[data-part="viewport"]') ?? null;
  const selectable = selectionMode !== 'none';
  const loading = !!states.loading;

  const [sort, setSort] = useControlled(sortProp, defaultSort ?? [], onSortChange);
  const [selectedIds, setSelectedIds] = useControlled(
    selectedProp,
    defaultSelectedIds ?? [],
    onSelectionChange,
  );
  const [collapsed, setCollapsed] = useControlled(
    collapsedGroups,
    defaultCollapsedGroups ?? [],
    onCollapsedGroupsChange,
  );
  const [expanded, setExpanded] = useState<string[]>([]);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [widthMetrics, setWidthMetrics] = useState(defaultWidthMetrics);
  // Where the window of rendered rows was last taken, and which way the table was scrolling then.
  const [scroll, setScroll] = useState({ top: 0, direction: 0 });
  const [metrics, setMetrics] = useState({
    row: 26,
    group: 30,
    head: 30,
    details: {} as Record<string, number>,
  });
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // The space the table has. Measured before paint, so the first frame already shows the columns that fit.
  useLayoutEffect(() => {
    const el = viewport();
    if (!el) return;
    // Whole pixels, rounded down: a table fitted to a rounded-up width would overflow by a fraction.
    const measure = () => {
      const width = Math.floor(el.getBoundingClientRect().width) - (el.offsetWidth - el.clientWidth);
      const height = el.clientHeight;
      setSize((previous) =>
        previous?.width === width && previous.height === height ? previous : { width, height },
      );
    };
    // What widths are measured in: the cell font and padding. The probe is 1ch by 1em, so the observer
    // also reports a change of density or of the font tokens.
    const probe = root.current?.querySelector<HTMLElement>('[data-part="font-probe"]');
    const measureFont = () => {
      if (!probe) return;
      const box = probe.getBoundingClientRect();
      const css = getComputedStyle(probe);
      const padding = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight) || 0;
      const next = {
        fontSize: box.height || defaultWidthMetrics.fontSize,
        ch: box.width - padding || defaultWidthMetrics.ch,
        padding: padding || defaultWidthMetrics.padding,
      };
      setWidthMetrics((previous) =>
        previous.fontSize === next.fontSize && previous.ch === next.ch && previous.padding === next.padding
          ? previous
          : next,
      );
    };
    const all = () => {
      measureFont();
      measure();
    };
    all();
    const observer = new ResizeObserver(() => flushSync(all));
    observer.observe(el);
    if (probe) observer.observe(probe);
    return () => observer.disconnect();
  }, []);

  // The longest text of every `content` column, in characters: its header, its rows and its footer text.
  const contentChars = useMemo(() => {
    const chars: Record<string, number> = {};
    for (const column of columns) {
      if (column.width !== 'content') continue;
      const header = typeof column.header === 'string' ? column.header : (column.headerLabel ?? '');
      let longest = Math.max(header.length, typeof column.footer === 'string' ? column.footer.length : 0);
      for (const row of data) longest = Math.max(longest, textOf(column, row).length);
      chars[column.id] = longest;
    }
    return chars;
  }, [columns, data]);

  // --- Columns: which fit, how wide, and where the pinned ones stick -------------------------------
  const fit = useMemo(() => {
    const sizes: ColumnSize[] = columns.map((column) => ({
      id: column.id,
      priority: column.priority ?? 0,
      // A sortable header keeps room for its arrow: one line of the font.
      ...resolveWidth(
        column.width,
        widthMetrics,
        contentChars[column.id],
        column.sortable ? widthMetrics.fontSize + 4 : 0,
      ),
    }));
    if (selectable) {
      sizes.unshift({
        id: SELECT,
        min: UTILITY_WIDTH,
        max: UTILITY_WIDTH,
        flex: 0,
        priority: 'always',
        utility: true,
      });
    }
    return fitColumns(sizes, size?.width ?? null, expandableHidden ? UTILITY_WIDTH : 0);
  }, [columns, selectable, expandableHidden, size?.width, widthMetrics, contentChars]);
  const hiddenKey = fit.hidden.join('\n');
  const showExpander = expandableHidden && fit.hidden.length > 0;

  // --- Rows: sorting, grouping and selection state come from the engine --------------------------
  const groupKey = useMemo(
    () =>
      groupBy === undefined
        ? null
        : (row: Row) => String(typeof groupBy === 'function' ? groupBy(row) : row[groupBy]),
    [groupBy],
  );
  const defs = useMemo(
    () => [
      ...columns.map((column) => ({
        id: column.id,
        accessorFn: (row: Row) => valueOf(column, row),
        enableSorting: !!column.sortable,
        sortDescFirst: !!column.sortDescFirst,
        sortUndefined: 'last' as const,
        ...(column.sortFn && {
          sortFn: (a: { original: Row }, b: { original: Row }) => column.sortFn!(a.original, b.original),
        }),
      })),
      ...(groupKey ? [{ id: GROUP, accessorFn: groupKey, enableSorting: false }] : []),
    ],
    [columns, groupKey],
  );
  // The engine's state keeps its identity while nothing in it changes: the engine sorts and groups
  // again whenever it is handed a new array, and the table renders on every scroll step.
  const sorting = useMemo(
    () => sort.map(({ id, direction }) => ({ id, desc: direction === 'desc' })),
    [sort],
  );
  const columnVisibility = useMemo(
    () => Object.fromEntries([...(hiddenKey ? hiddenKey.split('\n') : []), GROUP].map((id) => [id, false])),
    [hiddenKey],
  );
  const rowSelection = useMemo(
    () => Object.fromEntries(selectedIds.map((id) => [id, true as const])),
    [selectedIds],
  );
  const grouping = useMemo(() => (groupKey ? [GROUP] : []), [groupKey]);
  const engineState = useMemo(
    () => ({ sorting, columnVisibility, rowSelection, grouping }),
    [sorting, columnVisibility, rowSelection, grouping],
  );
  // The engine wants rows that are objects; the cast only narrows the type it sees.
  const table = useTable<typeof features, Row & RowData>({
    features,
    data: data as (Row & RowData)[],
    columns: defs,
    getRowId,
    state: engineState,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSort(next.map(({ id, desc }) => ({ id, direction: desc ? 'desc' : 'asc' })));
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setSelectedIds(Object.keys(next).filter((id) => next[id]));
    },
    manualSorting,
    enableMultiSort: multiSort,
    isMultiSortEvent: () => true,
    enableRowSelection: (row) => !isRowDisabled?.(row.original),
    enableMultiRowSelection: selectionMode === 'multiple',
    groupedColumnMode: false,
  });

  const cols = useMemo(() => {
    const visible = columns.filter((column) => !fit.hidden.includes(column.id));
    const numeric = (column: DataTableColumn<Row>) =>
      column.numeric ?? (data[0] !== undefined && typeof valueOf(column, data[0]) === 'number');
    const list: Col<Row>[] = [...(selectable ? [SELECT] : []), ...(showExpander ? [EXPAND] : [])].map(
      (id) => ({ id, pin: 'start', align: 'center', numeric: false, width: fit.widths[id] ?? UTILITY_WIDTH }),
    );
    for (const pin of ['start', undefined, 'end'] as const) {
      for (const def of visible.filter((column) => column.pin === pin)) {
        const isNumeric = numeric(def);
        list.push({
          id: def.id,
          def,
          pin,
          align: def.align ?? (isNumeric ? 'end' : 'start'),
          numeric: isNumeric,
          width: fit.widths[def.id]!,
        });
      }
    }
    // Pinned columns stick at the summed width of the pinned columns between them and their edge.
    let offset = 0;
    const starts = list.filter((c) => c.pin === 'start');
    for (const c of starts) {
      c.pinOffset = offset;
      offset += c.width;
    }
    if (starts.length) starts[starts.length - 1]!.pinEdge = true;
    offset = 0;
    const ends = list.filter((c) => c.pin === 'end').reverse();
    for (const c of ends) {
      c.pinOffset = offset;
      offset += c.width;
    }
    if (ends.length) ends[ends.length - 1]!.pinEdge = true;
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `data[0]` only decides the default alignment
  }, [columns, fit, selectable, showExpander, data[0]]);
  const totalWidth = size ? cols.reduce((sum, c) => sum + c.width, 0) : undefined;
  const hiddenColumns = useMemo(
    () => columns.filter((column) => fit.hidden.includes(column.id)),
    [columns, fit],
  );

  useEffect(() => {
    if (size) onHiddenColumnsChange?.(hiddenKey ? hiddenKey.split('\n') : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reports a change of the hidden set only
  }, [hiddenKey, !size]);

  // --- The display list: group rows, rows and detail rows, in order ------------------------------
  const model = table.getRowModel().rows;
  const groupedModel = groupKey ? table.getGroupedRowModel().rows : null;
  type EngineRow = (typeof model)[number];
  type Item =
    | { kind: 'group'; key: string; group: string; title: ReactNode; meta?: ReactNode; rows: EngineRow[] }
    | { kind: 'row'; key: string; row: EngineRow; position: number; striped: boolean }
    | { kind: 'detail'; key: string; row: EngineRow; position: number };
  const { items, leaves } = useMemo(() => {
    const items: Item[] = [];
    const leaves: EngineRow[] = [];
    const add = (rows: EngineRow[], show: boolean) => {
      rows.forEach((row, i) => {
        const position = leaves.push(row) - 1;
        if (!show) return;
        items.push({ kind: 'row', key: `r:${row.id}`, row, position, striped: striped && i % 2 === 0 });
        if (showExpander && expanded.includes(row.id)) {
          items.push({ kind: 'detail', key: `d:${row.id}`, row, position });
        }
      });
    };
    if (!groupedModel) add(model, true);
    else {
      const byKey = new Map(model.map((row) => [String(row.groupingValue), row]));
      const found = groupedModel.map((row) => String(row.groupingValue));
      for (const group of orderGroups(groups?.map((g) => g.key) ?? [], found)) {
        const rows = byKey.get(group)?.subRows ?? [];
        const listed = groups?.find((g) => g.key === group);
        items.push({
          kind: 'group',
          key: `g:${group}`,
          group,
          title: listed?.title ?? group,
          meta: listed?.meta,
          rows,
        });
        add(rows, !(collapsibleGroups && collapsed.includes(group)));
      }
    }
    return { items, leaves };
  }, [model, groupedModel, groups, collapsibleGroups, collapsed, showExpander, expanded, striped]);

  // --- Virtualisation: only the rows in view are rendered ------------------------------------------
  // A table as tall as its content shows every row: there is no window to cut them to.
  const virtual =
    !loading &&
    height !== 'content' &&
    (virtualize === true ||
      (virtualize === 'auto' && data.length > VIRTUAL_FROM && !columns.some((column) => column.wrap)));
  const offsets = useMemo(
    () =>
      offsetsOf(
        items.map((item) =>
          item.kind === 'row'
            ? metrics.row
            : item.kind === 'group'
              ? metrics.group
              : (metrics.details[item.key] ?? metrics.row * 3),
        ),
      ),
    [items, metrics],
  );
  const indexByKey = useMemo(() => new Map(items.map((item, index) => [item.key, index])), [items]);
  const viewHeight = size?.height ?? 600;
  // One more screen of rows is rendered in the direction of travel, so a fast scroll does not outrun them.
  const ahead = Math.max(OVERSCAN, Math.ceil(viewHeight / metrics.row));
  const windowAt = (top: number, direction: number) =>
    windowRange(
      offsets,
      top - metrics.head,
      viewHeight,
      direction < 0 ? ahead : OVERSCAN,
      direction > 0 ? ahead : OVERSCAN,
    );
  const range = !virtual ? { start: 0, end: items.length } : windowAt(scroll.top, scroll.direction);

  useEffect(() => {
    const el = viewport();
    if (!el || !virtual) return;
    let last = el.scrollTop;
    const update = (sync: boolean) => {
      const direction = Math.sign(el.scrollTop - last) || scroll.direction;
      last = el.scrollTop;
      // The same height the render used. With the viewport's own height, a table measured while its
      // tab panel was still hidden would never agree with the render, and update without end.
      const next = windowAt(el.scrollTop, direction);
      // A few rows at a time: a render per row is wasted work, and a screen of rows at once is a long frame.
      const count = offsets.length - 1;
      const moved = (a: number, b: number, edge: number) =>
        Math.abs(a - b) >= OVERSCAN_STEP || (a !== b && a === edge);
      if (!moved(next.start, range.start, 0) && !moved(next.end, range.end, count)) return;
      // In a scroll event the rows are rendered before the frame is painted, so no gap is ever shown.
      if (sync) flushSync(() => setScroll({ top: el.scrollTop, direction }));
      else setScroll({ top: el.scrollTop, direction });
    };
    const onScroll = () => update(true);
    update(false);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `windowAt` is made from the values listed
  }, [virtual, offsets, metrics.head, viewHeight, ahead, range.start, range.end, scroll.direction]);

  // Row heights are read from the rows themselves, so density, tokens and tall cell content are all
  // taken into account. Every row is assumed to be as tall as the first; detail rows are measured one by one.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every render on purpose; an equal value does not render again
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !virtual) return;
    const height = (selector: string) => el.querySelector(selector)?.getBoundingClientRect().height;
    const details: Record<string, number> = {};
    for (const row of el.querySelectorAll<HTMLElement>('tr[data-kind="detail"]')) {
      details[row.dataset.rowKey!] = row.getBoundingClientRect().height;
    }
    const next = {
      row: height('tbody > tr[data-kind="row"]') ?? metrics.row,
      group: height('tbody > tr[data-kind="group"]') ?? metrics.group,
      head: height('thead') ?? metrics.head,
      details: { ...metrics.details, ...details },
    };
    const same =
      Math.abs(next.row - metrics.row) < 0.5 &&
      Math.abs(next.group - metrics.group) < 0.5 &&
      Math.abs(next.head - metrics.head) < 0.5 &&
      Object.keys(details).every((key) => Math.abs(details[key]! - (metrics.details[key] ?? -1)) < 0.5);
    if (!same) setMetrics(next);
  });

  const headKeys = [...(columnGroups?.length ? ['head-groups'] : []), 'head'];
  const hasFooter = cols.some((c) => c.def?.footer !== undefined);
  // The key of every row, for the keyboard: built once per display list, not per scroll step.
  const allKeys = useMemo(
    () => [
      ...(columnGroups?.length ? ['head-groups'] : []),
      'head',
      ...items.map((item) => item.key),
      ...(hasFooter ? ['foot'] : []),
    ],
    [items, hasFooter, columnGroups?.length],
  );
  const adapter = useMemo<GridAdapter | null>(
    () =>
      virtual
        ? {
            keys: allKeys,
            ensure: (key) => {
              const el = viewport();
              const index = indexByKey.get(key);
              if (!el || index === undefined || (index >= range.start && index < range.end)) return;
              const top =
                index < range.start ? offsets[index]! : offsets[index + 1]! + metrics.head - el.clientHeight;
              const direction = Math.sign(top - el.scrollTop);
              el.scrollTop = top;
              flushSync(() => setScroll({ top: el.scrollTop, direction }));
            },
            onActiveRow: setActiveKey,
          }
        : null,
    [virtual, allKeys, indexByKey, range.start, range.end, offsets, metrics.head],
  );

  // --- Selection -------------------------------------------------------------------------------------
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const select = useSelect(selectionMode, selectedIds, (ids) =>
    table.setRowSelection(Object.fromEntries(ids.map((id) => [id, true as const]))),
  );
  // What a Shift range runs over: the rows on screen that can be selected, in order.
  const selectRow = (id: string, rangeTo: boolean) =>
    select(id, rangeTo, () =>
      items.flatMap((item) => (item.kind === 'row' && item.row.getCanSelect() ? [item.row.id] : [])),
    );

  const highlightedIds = useMemo(() => new Set(highlightedRowIds), [highlightedRowIds]);
  const flashes = (column: DataTableColumn<Row>) =>
    column.accessor !== undefined &&
    (highlightChanges === true || (Array.isArray(highlightChanges) && highlightChanges.includes(column.id)));
  const linkColumn = (cols.find((c) => c.def?.rowHeader) ?? cols.find((c) => c.def))?.id;
  const firstDataColumn = cols.find((c) => c.def)?.id;

  // What is rendered for a row, the header or the footer is kept until something it is made from
  // changes. A scroll step, or a move of the keyboard focus, changes none of it: the rows that stay in
  // the window are then the very same elements, which React does not render again.
  const rendered = useMemo(
    () => new Map<string, ReactNode>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- every value the row, header and footer renderers below read
    [
      items,
      cols,
      hiddenColumns,
      size?.width,
      selectedIds,
      highlightedIds,
      expanded,
      collapsed,
      sort,
      loading,
      parts,
      columnGroups,
      multiSort,
      selectionMode,
      rowHighlight,
      rowAccent,
      rowHref,
      isRowDisabled,
      onRowAction,
      selectRowLabel,
      selectAllLabel,
      highlightLabel,
      collapsibleGroups,
      stickyGroups,
      collapseGroupLabel,
      expandGroupLabel,
      showDetailsLabel,
      hideDetailsLabel,
      highlightChanges,
      increasedLabel,
      decreasedLabel,
      onCollapsedGroupsChange,
    ],
  );
  const once = (key: string, render: () => ReactNode) => {
    // eslint-disable-next-line react-hooks/immutability -- a cache: filling it does not change what is rendered
    if (!rendered.has(key)) rendered.set(key, render());
    return rendered.get(key);
  };

  const layout = (c: Col<Row>, index: number) => ({
    columnId: c.id,
    align: c.align,
    pin: c.pin,
    pinOffset: c.pinOffset,
    pinEdge: c.pinEdge,
    index: index + 1,
  });

  // --- Header ------------------------------------------------------------------------------------------
  const sortedCount = sort.length;
  const headerCell = (c: Col<Row>, index: number) => {
    if (c.id === SELECT) {
      return (
        <HeaderCell key={c.id} {...layout(c, index)} label={selectAllLabel}>
          {selectionMode === 'multiple' && !loading && (
            <Checkbox
              size="small"
              aria-label={selectAllLabel}
              checked={table.getIsAllRowsSelected()}
              indeterminate={!table.getIsAllRowsSelected() && table.getIsSomeRowsSelected()}
              onChange={(checked) => table.toggleAllRowsSelected(checked)}
            />
          )}
        </HeaderCell>
      );
    }
    if (!c.def) return <HeaderCell key={c.id} {...layout(c, index)} label={showDetailsLabel} />;
    const column = table.getColumn(c.id);
    const direction = column?.getIsSorted() || 'none';
    const sortIndex = sortedCount > 1 && direction !== 'none' ? (column?.getSortIndex() ?? 0) + 1 : undefined;
    const props: DataTableHeaderCellProps & { column: DataTableColumn<Row> } = {
      ...layout(c, index),
      column: c.def,
      sort: c.def.sortable ? direction : undefined,
      sortIndex,
      onSort: (multi) => column?.toggleSorting(undefined, multiSort && multi),
      sortIndicator:
        c.def.sortable && parts?.sortIndicator !== undefined
          ? renderPart(parts.sortIndicator, { direction, index: sortIndex }, (p) => <SortIndicator {...p} />)
          : undefined,
      label: c.def.headerLabel,
      description: c.def.description,
      tooltip: c.def.tooltip,
      hideLabel: c.def.hideHeader,
      children: c.def.header,
    };
    return (
      <Fragment key={c.id}>
        {renderPart(parts?.headerCell, props, (p) => (
          <HeaderCell {...without(p, 'column')} />
        ))}
      </Fragment>
    );
  };

  // The row of spanning headers: neighbours in the same group merge into one cell.
  const spans: { group?: DataTableColumnGroup; first: Col<Row>; index: number; span: number }[] = [];
  if (columnGroups?.length) {
    cols.forEach((c, index) => {
      const group = columnGroups.find((g) => g.columns.includes(c.id));
      const last = spans[spans.length - 1];
      if (last && last.group === group && last.first.pin === c.pin) last.span++;
      else spans.push({ group, first: c, index, span: 1 });
    });
  }

  const header = once('header', () =>
    renderPart(
      parts?.header,
      {
        children: (
          <>
            {spans.length > 0 && (
              <Row rowKey="head-groups" index={1} data-kind="header">
                {spans.map(({ group, first, index, span }) =>
                  group ? (
                    <HeaderCell
                      key={`${group.id}:${first.id}`}
                      {...layout(first, index)}
                      columnId={`group:${group.id}`}
                      align="center"
                      pinEdge={false}
                      colSpan={span}
                      scope="colgroup"
                      className={styles.columnGroup}
                    >
                      {group.header}
                    </HeaderCell>
                  ) : (
                    <td
                      key={first.id}
                      colSpan={span}
                      data-pin={first.pin}
                      className={styles.headerFiller}
                      style={pinStyle(first.pin, first.pinOffset)}
                    />
                  ),
                )}
              </Row>
            )}
            <Row rowKey="head" index={headKeys.length} data-kind="header">
              {cols.map(headerCell)}
            </Row>
          </>
        ),
      },
      (p) => <Header {...p} />,
    ),
  );

  // --- Body ----------------------------------------------------------------------------------------------
  const cellContent = (c: Col<Row>, row: EngineRow, position: number) => {
    const column = c.def!;
    const original = row.original;
    const value = valueOf(column, original);
    const text = textOf(column, original);
    const content = column.cell
      ? column.cell(original, {
          value,
          text,
          row: original,
          rowId: row.id,
          rowIndex: position,
          selected: selected.has(row.id),
          highlighted: highlightedIds.has(row.id) || !!rowHighlight?.(original),
          disabled: !!isRowDisabled?.(original),
        })
      : text;
    return { value, text, content };
  };

  const toggleExpanded = (id: string) =>
    setExpanded((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));

  const renderItem = (index: number, parked = false) =>
    once(`${parked ? 'parked' : 'item'}:${items[index]!.key}`, () => renderItemNow(index, parked));
  const renderItemNow = (index: number, parked: boolean) => {
    const item = items[index]!;
    const rowIndex = headKeys.length + index + 1;
    if (item.kind === 'group') {
      const firstAggregate = cols.findIndex((c, i) => i > 0 && c.def?.aggregate);
      const colSpan = firstAggregate < 0 ? cols.length : firstAggregate;
      const originals = item.rows.map((row) => row.original);
      const isCollapsed = collapsed.includes(item.group);
      return (
        <Fragment key={item.key}>
          {renderPart(
            parts?.groupHeader,
            {
              rowKey: item.key,
              index: rowIndex,
              title: item.title,
              count: item.rows.length,
              meta: item.meta,
              collapsible: collapsibleGroups,
              collapsed: isCollapsed,
              onCollapsedChange: (next) =>
                setCollapsed(
                  next ? [...collapsed, item.group] : collapsed.filter((key) => key !== item.group),
                ),
              collapseLabel: collapseGroupLabel,
              expandLabel: expandGroupLabel,
              sticky: stickyGroups,
              colSpan,
              children: cols.slice(colSpan).map((c, i) => (
                <Cell key={c.id} {...layout(c, colSpan + i)} numeric={c.numeric}>
                  {c.def?.aggregate?.(originals)}
                </Cell>
              )),
            },
            (p) => (
              <GroupRow {...p} />
            ),
          )}
        </Fragment>
      );
    }
    const { row, position } = item;
    const original = row.original;
    if (item.kind === 'detail') {
      const detailItems: KeyValueItem[] = hiddenColumns.map((column) => ({
        key: column.id,
        label: column.headerLabel ?? column.header,
        value: cellContent(
          { id: column.id, def: column, align: 'start', numeric: false, width: 0 },
          row,
          position,
        ).content,
      }));
      return (
        <Row
          key={item.key}
          rowKey={item.key}
          index={rowIndex}
          data-kind="detail"
          data-parked={parked ? '' : undefined}
        >
          <Cell colSpan={cols.length} className={styles.detailCell}>
            <div data-part="detail" className={styles.detail} style={{ width: size?.width }}>
              {renderPart(parts?.detail, { row: original, items: detailItems }, (p) => (
                <KeyValueList layout="grid" columns={3} items={p.items} />
              ))}
            </div>
          </Cell>
        </Row>
      );
    }
    const id = row.id;
    const disabled = !!isRowDisabled?.(original);
    const isSelected = selected.has(id);
    const highlighted = highlightedIds.has(id) || !!rowHighlight?.(original);
    const accent = rowAccent?.(original);
    const href = rowHref?.(original);
    const linkId = `${uid}-link-${id}`;
    const isExpanded = expanded.includes(id);
    const rowProps: DataTableRowProps & { row: Row } = {
      row: original,
      rowKey: item.key,
      index: rowIndex,
      selected: selectable ? isSelected : undefined,
      highlighted,
      striped: item.striped,
      disabled,
      accent: accent?.color,
      onAction: href
        ? () => document.getElementById(linkId)?.click()
        : onRowAction && (() => onRowAction(original)),
      onSelect: selectable ? ({ range: rangeTo }) => selectRow(id, rangeTo) : undefined,
      'data-parked': parked ? '' : undefined,
      children: cols.map((c, i) => {
        if (c.id === SELECT) {
          return (
            <Cell key={c.id} {...layout(c, i)}>
              <RowCheckbox
                label={selectRowLabel(original)}
                checked={isSelected}
                disabled={disabled}
                onToggle={(rangeTo) => selectRow(id, rangeTo)}
              />
            </Cell>
          );
        }
        if (c.id === EXPAND) {
          return (
            <Cell key={c.id} {...layout(c, i)}>
              <GroupHeader.Toggle
                collapsed={!isExpanded}
                label={isExpanded ? hideDetailsLabel : showDetailsLabel}
                onPress={() => toggleExpanded(id)}
              />
            </Cell>
          );
        }
        const column = c.def!;
        const { value, text, content } = cellContent(c, row, position);
        const cellProps: DataTableCellProps & { row: Row; column: DataTableColumn<Row> } = {
          ...layout(c, i),
          row: original,
          column,
          rowHeader: column.rowHeader,
          numeric: c.numeric,
          wrap: column.wrap,
          title: !column.cell && !c.numeric && !column.wrap && text ? text : undefined,
          children: (
            <>
              {flashes(column) && (
                <ChangeHighlight
                  highlightChanges
                  changeValue={value ?? null}
                  increasedLabel={increasedLabel}
                  decreasedLabel={decreasedLabel}
                />
              )}
              {c.id === firstDataColumn && accent && <span className={srOnly}>{accent.label} </span>}
              {c.id === firstDataColumn && highlighted && <span className={srOnly}>{highlightLabel} </span>}
              {href && c.id === linkColumn ? (
                <a id={linkId} href={href} tabIndex={-1} data-part="row-link" className={styles.rowLink}>
                  {content}
                </a>
              ) : (
                content
              )}
            </>
          ),
        };
        return (
          <Fragment key={c.id}>
            {renderPart(parts?.cell, cellProps, (p) => (
              <Cell {...without(p, 'row', 'column')} />
            ))}
          </Fragment>
        );
      }),
    };
    return (
      <Fragment key={item.key}>
        {renderPart(parts?.row, rowProps, (p) => (
          <Row {...without(p, 'row')} />
        ))}
      </Fragment>
    );
  };

  const spacer = (key: string, height: number) =>
    height > 0 && (
      <tr key={key} aria-hidden="true" data-kind="spacer" className={styles.spacer}>
        <td colSpan={cols.length} style={{ height }} />
      </tr>
    );

  const body = () => {
    if (!virtual) return items.map((_, index) => renderItem(index));
    // Two rows are kept outside the window: the header of the group at the top, so it can stick, and
    // the row that holds the tab stop, so focus is never on a removed element.
    const before: number[] = [];
    const after: number[] = [];
    if (stickyGroups && groupedModel) {
      for (let i = Math.min(range.start, items.length) - 1; i >= 0; i--) {
        if (items[i]!.kind === 'group') {
          before.push(i);
          break;
        }
      }
    }
    const active = activeKey === null ? undefined : indexByKey.get(activeKey);
    if (active !== undefined && !before.includes(active)) {
      if (active < range.start) before.push(active);
      else if (active >= range.end) after.push(active);
    }
    before.sort((a, b) => a - b);
    const heightOf = (index: number) => offsets[index + 1]! - offsets[index]!;
    const sum = (list: number[]) => list.reduce((total, index) => total + heightOf(index), 0);
    const rows: ReactNode[] = [];
    for (const index of before) rows.push(renderItem(index, true));
    rows.push(spacer('spacer-top', offsets[range.start]! - sum(before)));
    for (let index = range.start; index < range.end; index++) rows.push(renderItem(index));
    rows.push(spacer('spacer-bottom', offsets[items.length]! - offsets[range.end]! - sum(after)));
    for (const index of after) rows.push(renderItem(index, true));
    return rows;
  };

  const skeletonRow = (rowIndex: number) => (
    <tr key={`skeleton-${rowIndex}`} aria-hidden="true" data-kind="skeleton" className={styles.row}>
      {cols.map((c, i) => (
        <Cell key={c.id} {...layout(c, i)} index={undefined} focusable={false}>
          {renderPart(parts?.skeleton, { rowIndex, columnId: c.id }, () =>
            c.def ? (
              <Skeleton width={`${40 + ((rowIndex * 7 + i * 13) % 5) * 12}%`} className={styles.skeleton} />
            ) : (
              <Skeleton shape="block" width={14} height={14} className={styles.skeleton} />
            ),
          )}
        </Cell>
      ))}
    </tr>
  );

  const stateContent = dataState(states, { isEmpty: data.length === 0, defaultEmpty: { title: 'No rows' } });
  const state =
    stateContent &&
    renderPart(states.error ? parts?.error : parts?.empty, { children: stateContent }, (p) => p.children);

  const footer =
    hasFooter &&
    !loading &&
    !state &&
    once('footer', () => {
      const leafRows = leaves.map((row) => row.original);
      return renderPart(
        parts?.footer,
        {
          children: (
            <Row rowKey="foot" index={headKeys.length + items.length + 1} data-kind="footer">
              {cols.map((c, i) => {
                const content = c.def?.footer;
                return (
                  <Cell key={c.id} {...layout(c, i)} numeric={c.numeric} rowHeader={c.def?.rowHeader}>
                    {typeof content === 'function' ? content(leafRows) : content}
                  </Cell>
                );
              })}
            </Row>
          ),
        },
        (p) => <Footer {...p} />,
      );
    });

  return (
    <GridAdapterContext value={adapter}>
      <Root
        elementRef={root}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        caption={caption}
        showCaption={showCaption}
        multiselectable={selectionMode === 'multiple' || undefined}
        rowCount={headKeys.length + items.length + (hasFooter ? 1 : 0)}
        columnCount={cols.length}
        width={totalWidth}
        headerRows={headKeys.length}
        dividers={dividers}
        height={height}
        loading={loading}
        state={state || undefined}
        announcement={loadingMore ? loadingMoreLabel : undefined}
        onReachEnd={onReachEnd}
        className={className}
        style={style}
      >
        <colgroup>
          {cols.map((c) => (
            <col key={c.id} style={{ width: c.width }} />
          ))}
        </colgroup>
        {header}
        {!state && (
          <Body>
            {loading ? Array.from({ length: skeletonRows }, (_, i) => skeletonRow(i)) : body()}
            {loadingMore && !loading && skeletonRow(-1)}
          </Body>
        )}
        {footer}
      </Root>
    </GridAdapterContext>
  );
}

/**
 * A column of numbers: aligned to the end, tabular figures, largest first when sorted, and as wide as
 * its longest value (`width: 'content'`). With a `cell` of its own, whose width the text does not
 * tell, it is 80 pixels: give such a column its `width`.
 */
export function numberColumn<Row>(column: DataTableColumn<Row>): DataTableColumn<Row> {
  return {
    align: 'end',
    numeric: true,
    width: column.cell ? 80 : 'content',
    sortDescFirst: true,
    ...column,
  };
}

/**
 * A column of row actions: pinned to the end, never hidden, with a header only assistive technology
 * reads. `cell` returns buttons; `menu` adds a "more" button that opens a `Menu` of the row's actions.
 */
export function actionsColumn<Row>({
  cell,
  menu,
  onMenuAction,
  menuLabel = () => 'More actions',
  ...column
}: Omit<DataTableColumn<Row>, 'id' | 'cell'> & {
  id?: string;
  cell?: DataTableColumn<Row>['cell'];
  /** The rows of the menu for one row of the table. */
  menu?: (row: Row) => MenuEntry[];
  /** Called with the id of the menu row the user chose. */
  onMenuAction?: (id: string, row: Row) => void;
  /** Accessible name of the "more" button. */
  menuLabel?: (row: Row) => string;
}): DataTableColumn<Row> {
  return {
    id: 'actions',
    header: 'Actions',
    hideHeader: true,
    align: 'end',
    pin: 'end',
    priority: 'always',
    width: cell ? 96 : 56,
    ...column,
    cell: (row, context) => (
      <>
        {cell?.(row, context)}
        {menu && (
          <Menu
            trigger={<IconButton icon={<Icon name="more" />} label={menuLabel(row)} tooltip={false} />}
            items={menu(row)}
            onAction={(id) => onMenuAction?.(id, row)}
            placement="bottom end"
          />
        )}
      </>
    ),
  };
}

DataTable.Root = Root;
DataTable.Header = Header;
DataTable.HeaderCell = HeaderCell;
DataTable.SortIndicator = SortIndicator;
DataTable.Body = Body;
DataTable.Row = Row;
DataTable.Cell = Cell;
DataTable.GroupRow = GroupRow;
DataTable.Footer = Footer;
