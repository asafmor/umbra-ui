import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { GridList, GridListHeader, GridListItem, GridListSection } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { Checkbox, CheckboxSlotContext } from '../inputs/Checkbox';
import { dataState, type DataStateProps } from '../internal/dataState';
import { heightProps } from '../internal/height';
import { ScrollArea } from '../layout/ScrollArea';
import { cx, renderPart, type Part } from '../utils/parts';
import { GroupHeader, type GroupHeaderProps } from './GroupHeader';
import styles from './List.module.css';
import { ListItem, type ListItemProps } from './ListItem';
import { defined } from '../utils/defined';
import { passThrough, type RootAttributes } from '../utils/passThrough';

/** The controls of a group header that the keyboard can reach. */
const HEADER_CONTROL = 'button:not(:disabled), a[href]';
const HEADER = '[data-part="groupHeader"]';
const ROW = '[data-part="row"]';

/**
 * Group headers are not rows of React Aria's grid, so it passes over them. A header that holds controls
 * (its caret, its actions) is made a stop of the list here: the up and down arrows land on its first
 * control, left and right move between its controls, and Tab walks the header controls and the list's
 * one row stop in the order they are shown. Everything else is left to React Aria.
 */
function headerKeys(event: KeyboardEvent<HTMLElement>) {
  const { key } = event;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement;
  const root = event.currentTarget;
  const header = target.closest<HTMLElement>(HEADER);
  const row = target.closest<HTMLElement>(ROW);
  const controls = (el: Element) => [...el.querySelectorAll<HTMLElement>(HEADER_CONTROL)];
  const take = (el?: HTMLElement) => {
    event.preventDefault();
    event.stopPropagation();
    el?.focus();
  };

  if (key === 'ArrowUp' || key === 'ArrowDown') {
    // From a control inside a row, the arrows are the row's own.
    if (!header && target !== row && target.getAttribute('role') !== 'grid') return;
    const stops = [
      ...root.querySelectorAll<HTMLElement>(`${ROW}:not([aria-disabled="true"]), ${HEADER}`),
    ].filter((el) => !el.matches(HEADER) || controls(el).length > 0);
    const at = stops.indexOf((header ?? row)!);
    const next = key === 'ArrowDown' ? stops[at + 1] : stops[at - 1];
    if (next?.matches(HEADER)) take(controls(next)[0]);
    // From a header the list moves the focus itself; from a row to a row React Aria does.
    else if (header) take(next);
  } else if (header && (key === 'ArrowLeft' || key === 'ArrowRight')) {
    const all = controls(header);
    const forward = (key === 'ArrowRight') === (getComputedStyle(header).direction !== 'rtl');
    take(all[all.indexOf(target.closest<HTMLElement>(HEADER_CONTROL)!) + (forward ? 1 : -1)]);
  } else if (key === 'Tab') {
    const stops = [
      ...root.querySelectorAll<HTMLElement>(`${HEADER} :is(${HEADER_CONTROL}), ${ROW}[tabindex="0"]`),
    ];
    const at = stops.indexOf((header ? target.closest<HTMLElement>(HEADER_CONTROL) : row)!);
    const next = stops[at + (event.shiftKey ? -1 : 1)];
    // With no stop left in that direction React Aria leaves the list.
    if (at >= 0 && next) take(next);
  }
}

/** Identifies one row. */
export type ListId = string | number;

interface ListContextValue {
  itemVariant: ListItemProps['variant'];
  itemSize: ListItemProps['size'];
  hasAction: boolean;
  stickyHeaders: boolean;
  register: (key: ListId) => () => void;
}
const ListContext = createContext<ListContextValue | null>(null);
function useList() {
  const list = useContext(ListContext);
  if (!list) throw new Error('List.Item and List.Group must be rendered inside <List> or <List.Root>.');
  return list;
}

export interface ListRootProps extends DataStateProps, RootAttributes {
  /** `List.Item` and `List.Group` elements. */
  children?: ReactNode | undefined;
  /** `single` and `multiple` let the user select rows. */
  selectionMode?: 'none' | 'single' | 'multiple' | undefined;
  /** Controlled selection: the keys of the selected rows. */
  selectedIds?: ListId[] | undefined;
  defaultSelectedIds?: ListId[] | undefined;
  onSelectionChange?: ((keys: ListId[]) => void) | undefined;
  /**
   * `replace`: a click selects only that row, a double click or Enter activates it, and selection follows
   * the arrow keys. `toggle`: a click or Space toggles the row. Default: `replace` when `onAction` is set, otherwise `toggle`.
   */
  selectionBehavior?: 'toggle' | 'replace' | undefined;
  /** The user cannot deselect the last selected row. Default: on with `replace` (so a double click does not deselect), otherwise off. */
  disallowEmptySelection?: boolean | undefined;
  /** Called when a row is activated: Enter or a double click (a single click when nothing can be selected). */
  onAction?: ((key: ListId) => void) | undefined;
  /** A line between rows. */
  dividers?: boolean | undefined;
  /** A faint fill on every other row. */
  striped?: boolean | undefined;
  /** Shows each row's position, for a ranking. */
  numbered?: boolean | undefined;
  /** Default `variant` of every `List.Item`, and the layout of the skeleton rows. */
  itemVariant?: ListItemProps['variant'] | undefined;
  /** Default `size` of every `List.Item`, and of the skeleton rows. */
  itemSize?: ListItemProps['size'] | undefined;
  /** Group headers stick to the top while their group scrolls. */
  stickyHeaders?: boolean | undefined;
  /** Number of skeleton rows shown while `loading`. */
  skeletonRows?: number | undefined;
  /**
   * `fill` (default) takes the height of the parent, and falls back to the content's height in a parent
   * that has none (flowing content, a popover, a modal body, an accordion panel). `content` is always
   * as tall as the content. A number is a height in pixels.
   */
  height?: 'fill' | 'content' | number | undefined;

  /** Called when the list is scrolled to its end, for loading more. */
  onReachEnd?: (() => void) | undefined;
  /** Shows a skeleton row after the last row while more rows load. */
  loadingMore?: boolean | undefined;
  /** What assistive technology hears for the `loadingMore` row. */
  loadingMoreLabel?: string | undefined;
  /** Accessible name of the list. Required unless `aria-labelledby` is set. */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        /** One skeleton row. */
        skeleton?: Part<{ index: number }> | undefined;
        /** The empty or error state. */
        state?: Part<{ children: ReactNode }> | undefined;
        loadingMore?: Part<{ label: string }> | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Root({
  children,
  selectionMode = 'none',
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  selectionBehavior: behavior,
  disallowEmptySelection,
  onAction,
  dividers = true,
  striped = false,
  numbered = false,
  itemVariant,
  itemSize,
  stickyHeaders = true,
  skeletonRows = 6,
  height,
  onReachEnd,
  loadingMore = false,
  loadingMoreLabel = 'Loading more',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  parts,
  className,
  style,
  ...data
}: ListRootProps) {
  const selectionBehavior = behavior ?? (onAction ? 'replace' : 'toggle');
  // The selection is always given to React Aria, so that a change can be refused (see `press`). A row
  // that leaves the list stays selected: the selection is the app's, and it does not move by itself.
  const [ownSelection, setOwnSelection] = useState<ListId[]>(defaultSelectedIds ?? []);
  // One press of the pointer changes the selection once, at most. Without this, selecting a row that
  // leaves the list (a filter on "unread") goes on by itself: focus falls back to the list, React Aria
  // selects the row it lands on because selection follows focus, that row leaves too, and the row that
  // slides under the pointer is selected again when the button is released.
  const press = useRef({ active: false, used: false });
  // Every row's key, so "select all" can be reported as a plain array.
  const keys = useRef(new Set<ListId>());
  // React Aria keeps the row a Shift range started from on the selection object it reports. The app
  // gets and gives plain arrays, so the object is kept here and handed back while the ids still match:
  // otherwise a range could grow with Shift+Arrow but never shrink again.
  const [reported, setReported] = useState<Set<ListId> | null>(null);
  const ids = selectedIds ?? ownSelection;
  const selectedKeys = reported?.size === ids.length && ids.every((id) => reported.has(id)) ? reported : ids;
  const list = useMemo<ListContextValue>(
    () => ({
      itemVariant,
      itemSize,
      hasAction: !!onAction,
      stickyHeaders,
      register: (key) => {
        keys.current.add(key);
        return () => void keys.current.delete(key);
      },
    }),
    [itemVariant, itemSize, onAction, stickyHeaders],
  );
  const skeleton = (index: number, meta = true) => (
    <ListItem
      variant={itemVariant}
      size={itemSize}
      title={<Skeleton width="55%" />}
      overline={itemVariant === 'message' ? <Skeleton width="30%" /> : undefined}
      description={itemVariant !== 'message' && itemSize !== 'compact' ? <Skeleton width="35%" /> : undefined}
      meta={meta ? <Skeleton width={36} /> : undefined}
      key={index}
    />
  );
  const state = dataState(data, {
    part: true,
    isEmpty: Children.toArray(children).length === 0,
    defaultEmpty: { title: 'No items' },
  });
  const content = state ? (
    renderPart(parts?.state, { children: state }, (p) => p.children)
  ) : data.loading ? (
    Array.from({ length: skeletonRows }, (_, index) => (
      <div key={index} data-part="skeleton" className={styles.item}>
        {renderPart(parts?.skeleton, { index }, (p) => skeleton(p.index))}
      </div>
    ))
  ) : (
    <>
      <GridList
        {...defined({ 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby })}
        selectionMode={selectionMode}
        selectionBehavior={selectionBehavior}
        disallowEmptySelection={disallowEmptySelection ?? selectionBehavior === 'replace'}
        selectedKeys={selectedKeys}
        onSelectionChange={(selection) => {
          if (press.current.active) {
            if (press.current.used) return;
            press.current.used = true;
          }
          const next = selection === 'all' ? [...keys.current] : ([...selection] as ListId[]);
          setReported(selection === 'all' ? null : (selection as Set<ListId>));
          setOwnSelection(next);
          onSelectionChange?.(next);
        }}
        {...defined({ onAction, className: styles.grid })}
      >
        {children}
      </GridList>
      {loadingMore &&
        renderPart(parts?.loadingMore, { label: loadingMoreLabel }, (p) => (
          <div role="status" aria-label={p.label} data-part="loadingMore" className={styles.item}>
            {skeleton(0, false)}
          </div>
        ))}
    </>
  );
  return (
    <div
      {...passThrough(data)}
      data-umbra="list"
      data-dividers={dividers || undefined}
      data-striped={striped || undefined}
      data-numbered={numbered || undefined}
      data-loading={data.loading || undefined}
      data-height={heightProps(height)['data-height']}
      aria-busy={data.loading || undefined}
      // The grid carries the name; while it is not shown (loading, empty, error) the list itself does.
      {...((state || data.loading) && {
        role: 'group',
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
      })}
      className={cx(styles.root, className)}
      style={{ ...heightProps(height).style, ...style }}
      onPointerDownCapture={() => {
        press.current = { active: true, used: false };
        // The release, and the click and focus changes that come with it, are handled in one task.
        const end = () => setTimeout(() => (press.current.active = false));
        document.addEventListener('pointerup', end, { once: true, capture: true });
        document.addEventListener('pointercancel', end, { once: true, capture: true });
      }}
      // A key is never part of the press: it may arrive before the timer above has run.
      onKeyDownCapture={(event) => {
        press.current.active = false;
        headerKeys(event);
      }}
    >
      <ScrollArea onReachEnd={onReachEnd} aria-label={ariaLabel} className={styles.scroll}>
        <ListContext value={list}>{content}</ListContext>
      </ScrollArea>
    </div>
  );
}

export interface ListEntryProps extends Omit<ListItemProps, 'selected' | 'interactive' | 'id'> {
  /** The row's key: what selection and `onAction` report. Unique in the list. */
  id: ListId;
  /** Plain text of the row, for type-ahead and assistive technology. Defaults to a text `title`. */
  textValue?: string | undefined;
  /** Replaces the row's content. A function receives the row's state, to pass on to `ListItem.Root`. */
  children?:
    | ReactNode
    | ((state: {
        selected: boolean;
        disabled: boolean;
        interactive: boolean;
        /** The row's checkbox in `multiple` selection, to place in a row drawn by hand. */
        selectionControl: ReactNode;
      }) => ReactNode)
    | undefined;
}

/** One row of a `List`. Takes the props of `ListItem`; `children` replace the row's content. */
function Item({ id, textValue, href, onPress, disabled, children, ...item }: ListEntryProps) {
  const list = useList();
  const { register } = list;
  useEffect(() => register(id), [register, id]);
  return (
    <GridListItem
      id={id}
      {...defined({
        textValue: textValue ?? (typeof item.title === 'string' ? item.title : undefined),
        href,
        onAction: onPress,
        isDisabled: disabled,
      })}
      data-part="row"
      {...defined({ className: styles.item })}
    >
      {({ isSelected, isDisabled, selectionMode }) => {
        const state = {
          selected: isSelected,
          disabled: isDisabled,
          interactive: selectionMode !== 'none' || list.hasAction || !!href || !!onPress,
        };
        // Several rows can be selected: each shows a checkbox, so the selection is not carried by the
        // fill alone. React Aria makes it the row's selection control and names it after the row.
        const selectionControl = selectionMode === 'multiple' && (
          <CheckboxSlotContext value="selection">
            <Checkbox size="small" disabled={isDisabled} />
          </CheckboxSlotContext>
        );
        if (typeof children === 'function') return children({ ...state, selectionControl });
        return (
          children ?? (
            <ListItem
              variant={list.itemVariant}
              size={list.itemSize}
              {...item}
              {...state}
              leading={
                selectionControl ? (
                  <>
                    {selectionControl}
                    {item.leading}
                  </>
                ) : (
                  item.leading
                )
              }
            />
          )
        );
      }}
    </GridListItem>
  );
}

export interface ListGroupProps extends Omit<GroupHeaderProps, 'className' | 'style'> {
  /** The group's rows: `List.Item` elements. */
  children?: ReactNode | undefined;
  /** Replaces the whole header. */
  header?: ReactNode | undefined;
}

/** A group of rows under a `GroupHeader`. Collapsing it hides its rows. */
function Group({ children, header, ...props }: ListGroupProps) {
  const list = useList();
  const [uncontrolled, setUncontrolled] = useState(props.defaultCollapsed ?? false);
  const collapsed = !!props.collapsible && (props.collapsed ?? uncontrolled);
  // React Aria names the group by its whole header, which reads the caret's name before the title
  // ("Collapse Today Today"). The group is named by the title alone. This component renders into React
  // Aria's collection, not into the page, so the element is only reachable through its ref.
  const titleId = useId();
  const name = (section: HTMLDivElement | null) => {
    const title = section?.querySelector(`${HEADER} [data-part="title"]`);
    if (!title) return;
    title.id ||= titleId;
    section!.setAttribute('aria-labelledby', title.id);
  };
  return (
    <GridListSection ref={name} {...defined({ className: styles.group })}>
      <GridListHeader
        data-part="groupHeader"
        {...defined({ className: styles.groupRow })}
        data-sticky={(props.sticky ?? list.stickyHeaders) || undefined}
      >
        {header ?? (
          <GroupHeader
            {...props}
            sticky={false}
            collapsed={collapsed}
            onCollapsedChange={(next) => {
              // When the focused row is hidden by the collapse, React Aria moves the focus to another
              // row. The focus stays on the control that was pressed.
              const pressed = document.activeElement as HTMLElement | null;
              const grid = pressed?.closest(HEADER)?.closest('[role="grid"]');
              if (pressed && grid) {
                const back = () => pressed.isConnected && pressed.focus({ preventScroll: true });
                grid.addEventListener('focusin', back, { once: true });
                setTimeout(() => grid.removeEventListener('focusin', back), 100);
              }
              setUncontrolled(next);
              props.onCollapsedChange?.(next);
            }}
          />
        )}
      </GridListHeader>
      {!collapsed && children}
    </GridListSection>
  );
}

/** One group of a grouped `List`, as data. */
export interface ListGroupData<T> extends Omit<ListGroupProps, 'children'> {
  key: ListId;
  items: T[];
}

export interface ListProps<T = unknown> extends ListRootProps {
  /** The rows, as data. Use with `renderItem`; or pass `List.Item` children instead. */
  items?: T[] | undefined;
  /** Grouped rows, as data: each group's header props and its `items`. */
  groups?: ListGroupData<T>[] | undefined;
  /** Returns the `List.Item` of one row. */
  renderItem?: ((item: T, index: number) => ReactNode) | undefined;
}

/**
 * A vertical list of rows that scrolls inside its slot, with optional groups, selection and row actions.
 */
// ponytail: every row is rendered; add React Aria's Virtualizer when lists pass a few thousand rows.
export function List<T>({ items, groups, renderItem, children, ...root }: ListProps<T>) {
  // Each row is keyed by its `id`, so `renderItem` does not have to set a key. (`Children.toArray`
  // would add implicit keys, which React still reports as missing.)
  const rows = (list: T[]) =>
    list.map((item, index) => {
      const row = renderItem?.(item, index);
      return isValidElement<{ id?: ListId | undefined }>(row) && row.key == null
        ? cloneElement(row, { key: row.props.id ?? index })
        : row;
    });
  return (
    <Root {...root}>
      {groups
        ? groups.map(({ key, items: list, ...group }) => (
            <Group key={key} {...group}>
              {rows(list)}
            </Group>
          ))
        : items
          ? rows(items)
          : children}
    </Root>
  );
}

List.Root = Root;
List.Item = Item;
List.Group = Group;
