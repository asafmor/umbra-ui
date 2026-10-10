import {
  Children,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { GridList, GridListHeader, GridListItem, GridListSection } from 'react-aria-components';
import { Skeleton } from '../basics/Skeleton';
import { Checkbox, CheckboxSlotContext } from '../inputs/Checkbox';
import { dataState, type DataStateProps } from '../internal/dataState';
import { ScrollArea } from '../layout/ScrollArea';
import { cx, renderPart, type Part } from '../utils/parts';
import { GroupHeader, type GroupHeaderProps } from './GroupHeader';
import styles from './List.module.css';
import { ListItem, type ListItemProps } from './ListItem';

/** Identifies one row. */
export type ListKey = string | number;

interface ListContextValue {
  itemVariant: ListItemProps['variant'];
  itemSize: ListItemProps['size'];
  hasAction: boolean;
  stickyHeaders: boolean;
  register: (key: ListKey) => () => void;
}
const ListContext = createContext<ListContextValue | null>(null);
function useList() {
  const list = useContext(ListContext);
  if (!list) throw new Error('List.Item and List.Group must be rendered inside <List> or <List.Root>.');
  return list;
}

export interface ListRootProps extends DataStateProps {
  /** `List.Item` and `List.Group` elements. */
  children?: ReactNode;
  /** `single` and `multiple` let the user select rows. */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** Controlled selection: the keys of the selected rows. */
  selectedKeys?: ListKey[];
  defaultSelectedKeys?: ListKey[];
  onSelectionChange?: (keys: ListKey[]) => void;
  /**
   * `replace`: a click selects only that row, a double click or Enter activates it, and selection follows
   * the arrow keys. `toggle`: a click or Space toggles the row. Default: `replace` when `onAction` is set, otherwise `toggle`.
   */
  selectionBehavior?: 'toggle' | 'replace';
  /** The user cannot deselect the last selected row. Default: on with `replace` (so a double click does not deselect), otherwise off. */
  disallowEmptySelection?: boolean;
  /** Called when a row is activated: Enter or a double click (a single click when nothing can be selected). */
  onAction?: (key: ListKey) => void;
  /** A line between rows. */
  dividers?: boolean;
  /** A faint fill on every other row. */
  striped?: boolean;
  /** Shows each row's position, for a ranking. */
  numbered?: boolean;
  /** Default `variant` of every `List.Item`, and the layout of the skeleton rows. */
  itemVariant?: ListItemProps['variant'];
  /** Default `size` of every `List.Item`, and of the skeleton rows. */
  itemSize?: ListItemProps['size'];
  /** Group headers stick to the top while their group scrolls. */
  stickyHeaders?: boolean;
  /** Number of skeleton rows shown while `loading`. */
  skeletonRows?: number;
  /** Called when the list is scrolled to its end, for loading more. */
  onReachEnd?: () => void;
  /** Shows a skeleton row after the last row while more rows load. */
  loadingMore?: boolean;
  /** What assistive technology hears for the `loadingMore` row. */
  loadingMoreLabel?: string;
  /** Accessible name of the list. Required unless `aria-labelledby` is set. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Replace or hide named pieces. */
  parts?: {
    /** One skeleton row. */
    skeleton?: Part<{ index: number }>;
    /** The empty or error state. */
    state?: Part<{ children: ReactNode }>;
    loadingMore?: Part<{ label: string }>;
  };
  className?: string;
  style?: CSSProperties;
}

function Root({
  children,
  selectionMode = 'none',
  selectedKeys,
  defaultSelectedKeys,
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
  // Every row's key, so "select all" can be reported as a plain array.
  const keys = useRef(new Set<ListKey>());
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
    isEmpty: Children.toArray(children).length === 0,
    defaultEmpty: { title: 'No items' },
  });
  const content = state ? (
    renderPart(parts?.state, { children: state }, (p) => p.children)
  ) : data.loading ? (
    Array.from({ length: skeletonRows }, (_, index) => (
      <div key={index} className={styles.item}>
        {renderPart(parts?.skeleton, { index }, (p) => skeleton(p.index))}
      </div>
    ))
  ) : (
    <>
      <GridList
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        selectionMode={selectionMode}
        selectionBehavior={selectionBehavior}
        disallowEmptySelection={disallowEmptySelection ?? selectionBehavior === 'replace'}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        onSelectionChange={(selection) =>
          onSelectionChange?.(selection === 'all' ? [...keys.current] : ([...selection] as ListKey[]))
        }
        onAction={onAction}
        className={styles.grid}
      >
        {children}
      </GridList>
      {loadingMore &&
        renderPart(parts?.loadingMore, { label: loadingMoreLabel }, (p) => (
          <div role="status" aria-label={p.label} data-part="loading-more" className={styles.item}>
            {skeleton(0, false)}
          </div>
        ))}
    </>
  );
  return (
    <div
      data-umbra="list"
      data-dividers={dividers || undefined}
      data-striped={striped || undefined}
      data-numbered={numbered || undefined}
      data-loading={data.loading || undefined}
      aria-busy={data.loading || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      <ScrollArea onReachEnd={onReachEnd} label={ariaLabel} className={styles.scroll}>
        <ListContext value={list}>{content}</ListContext>
      </ScrollArea>
    </div>
  );
}

export interface ListEntryProps extends Omit<ListItemProps, 'selected' | 'interactive'> {
  /** The row's key: what selection and `onAction` report. Unique in the list. */
  id: ListKey;
  /** Plain text of the row, for type-ahead and assistive technology. Defaults to a text `title`. */
  textValue?: string;
  /** Replaces the row's content. A function receives the row's state, to pass on to `ListItem.Root`. */
  children?:
    | ReactNode
    | ((state: {
        selected: boolean;
        disabled: boolean;
        interactive: boolean;
        /** The row's checkbox in `multiple` selection, to place in a row drawn by hand. */
        selectionControl: ReactNode;
      }) => ReactNode);
}

/** One row of a `List`. Takes the props of `ListItem`; `children` replace the row's content. */
function Item({ id, textValue, href, onPress, disabled, children, ...item }: ListEntryProps) {
  const list = useList();
  const { register } = list;
  useEffect(() => register(id), [register, id]);
  return (
    <GridListItem
      id={id}
      textValue={textValue ?? (typeof item.title === 'string' ? item.title : undefined)}
      href={href}
      onAction={onPress}
      isDisabled={disabled}
      className={styles.item}
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
  children?: ReactNode;
  /** Replaces the whole header. */
  header?: ReactNode;
}

/** A group of rows under a `GroupHeader`. Collapsing it hides its rows. */
function Group({ children, header, ...props }: ListGroupProps) {
  const list = useList();
  const [uncontrolled, setUncontrolled] = useState(props.defaultCollapsed ?? false);
  const collapsed = !!props.collapsible && (props.collapsed ?? uncontrolled);
  return (
    <GridListSection className={styles.group}>
      <GridListHeader
        className={styles.groupRow}
        data-sticky={(props.sticky ?? list.stickyHeaders) || undefined}
      >
        {header ?? (
          <GroupHeader
            {...props}
            sticky={false}
            collapsed={collapsed}
            onCollapsedChange={(next) => {
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
  key: ListKey;
  items: T[];
}

export interface ListProps<T = unknown> extends ListRootProps {
  /** The rows, as data. Use with `renderItem`; or pass `List.Item` children instead. */
  items?: T[];
  /** Grouped rows, as data: each group's header props and its `items`. */
  groups?: ListGroupData<T>[];
  /** Returns the `List.Item` of one row. */
  renderItem?: (item: T, index: number) => ReactNode;
}

/**
 * A vertical list of rows that scrolls inside its slot, with optional groups, selection and row actions.
 */
// ponytail: every row is rendered; add React Aria's Virtualizer when lists pass a few thousand rows.
export function List<T>({ items, groups, renderItem, children, ...root }: ListProps<T>) {
  const rows = (list: T[]) => Children.toArray(list.map((item, index) => renderItem?.(item, index)));
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
