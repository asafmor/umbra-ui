import {
  Children,
  Fragment,
  createContext,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { IconSlot, RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './SegmentedFilter.module.css';
import { nameWithCount, useStrip } from './strip';

/** One segment, as data. */
export interface SegmentedFilterItem {
  id: string;
  label: ReactNode;
  /** A number shown after the label and read with it ("Unread, 4"). */
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

type ItemParts = {
  icon?: Part<{ children: ReactNode }>;
  count?: Part<{ children: number }>;
  /** The mark of a selected segment when several can be selected. */
  check?: Part;
};

export interface SegmentedFilterItemProps extends Omit<SegmentedFilterItem, 'label'> {
  /** Replace or hide named pieces of this segment. */
  parts?: ItemParts;
  className?: string;
  style?: CSSProperties;
  /** The label. */
  children?: ReactNode;
}

interface SingleSelection {
  /** `single`: one segment, like radio buttons. `multiple`: any number, like toggle buttons. */
  selectionMode?: 'single';
  /** The selected segment. `null` selects none, or the "All" segment when `all` is set. */
  value?: string | null;
  defaultValue?: string | null;
  /** Called with the selected id (`null` for "All"), or with the list of ids in `multiple` mode. */
  onChange?: (id: string | null) => void;
  /** The selected segments in `multiple` mode. An empty list selects the "All" segment when `all` is set. */
  values?: never;
  defaultValues?: never;
}

interface MultipleSelection {
  selectionMode: 'multiple';
  values?: string[];
  defaultValues?: string[];
  onChange?: (ids: string[]) => void;
  value?: never;
  defaultValue?: never;
}

interface RootBase {
  /** Adds a first segment that stands for "no filter". Choosing it clears the others. */
  all?: boolean;
  /** Label of the "All" segment. */
  allLabel?: string;
  /** Count of the "All" segment. */
  allCount?: number;
  /** `small` is for table cells and dense toolbars. Otherwise the height follows the density level. */
  size?: 'default' | 'small';
  /** Fills the width of its container with equal segments. */
  fullWidth?: boolean;
  disabled?: boolean;
  /** Accessible name of the group. */
  'aria-label'?: string;
  /** Id of the element that names the group. */
  'aria-labelledby'?: string;
  className?: string;
  style?: CSSProperties;
}

export type SegmentedFilterRootProps = RootBase &
  (SingleSelection | MultipleSelection) & {
    /** `SegmentedFilter.Item` elements. */
    children?: ReactNode;
  };

export type SegmentedFilterProps = RootBase &
  (SingleSelection | MultipleSelection) & {
    /** The segments. Leave out to pass `SegmentedFilter.Item` children instead. */
    items?: SegmentedFilterItem[];
    /** Replace or hide named pieces. */
    parts?: ItemParts & { item?: Part<SegmentedFilterItemProps> };
    children?: ReactNode;
  };

// The key of the "All" segment.
const ALL = '__all__';
const MultipleContext = createContext(false);

function Root(props: SegmentedFilterRootProps) {
  const { all = false, allLabel = 'All', allCount, size = 'default', fullWidth = false } = props;
  const { disabled = false, className, style, children } = props;
  const multiple = props.selectionMode === 'multiple';
  const ref = useRef<HTMLDivElement>(null);
  const strip = useStrip(ref, 2, Children.count(children));

  const [own, setOwn] = useState<string[]>(
    () => props.defaultValues ?? (props.defaultValue != null ? [props.defaultValue] : []),
  );
  const controlled = multiple ? props.values : props.value;
  const selected =
    controlled === undefined ? own : Array.isArray(controlled) ? controlled : controlled ? [controlled] : [];

  const change = (keys: Set<string | number>) => {
    const ids = [...keys].map(String);
    // Choosing "All" clears the rest; choosing anything else leaves "All".
    const next = ids.includes(ALL) && selected.length > 0 ? [] : ids.filter((id) => id !== ALL);
    // Pressing the selected segment of a single selection is not a change.
    if (next.length === selected.length && next.every((id) => selected.includes(id))) return;
    setOwn(next);
    if (props.selectionMode === 'multiple') props.onChange?.(next);
    else props.onChange?.(next[0] ?? null);
  };

  return (
    <MultipleContext value={multiple}>
      <ToggleButtonGroup
        ref={ref}
        selectionMode={multiple ? 'multiple' : 'single'}
        disallowEmptySelection={!multiple}
        selectedKeys={all && selected.length === 0 ? [ALL] : selected}
        onSelectionChange={change}
        isDisabled={disabled}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        {...strip.attributes}
        data-umbra="segmented-filter"
        data-size={size}
        data-selection={multiple ? 'multiple' : 'single'}
        data-full-width={fullWidth || undefined}
        className={cx(strip.className, styles.root, className)}
        style={style}
      >
        {all && (
          <Item id={ALL} count={allCount}>
            {allLabel}
          </Item>
        )}
        {children}
      </ToggleButtonGroup>
    </MultipleContext>
  );
}

function Item({ id, icon, count, disabled, parts, className, style, children }: SegmentedFilterItemProps) {
  const multiple = useContext(MultipleContext);
  return (
    <ToggleButton
      id={id}
      isDisabled={disabled}
      aria-label={nameWithCount(children, count)}
      data-part="item"
      className={cx(styles.item, className)}
      style={style}
      // React Aria moves focus with the arrow keys; Home and End are added here.
      onKeyDown={(event) => {
        if (event.key !== 'Home' && event.key !== 'End') return event.continuePropagation();
        event.preventDefault();
        const items = (event.currentTarget as HTMLElement).parentElement!.querySelectorAll<HTMLElement>(
          'button:not(:disabled)',
        );
        items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
      }}
    >
      {({ isSelected }) => (
        <>
          {multiple &&
            isSelected &&
            renderPart(parts?.check, {}, () => (
              <IconSlot part="check">
                <RawIcon name="check" />
              </IconSlot>
            ))}
          {renderPart(
            parts?.icon,
            { children: icon },
            (p) => p.children && <IconSlot part="icon">{p.children}</IconSlot>,
          )}
          <span data-part="label" className={styles.label}>
            {children}
          </span>
          {count !== undefined &&
            renderPart(parts?.count, { children: count }, (p) => (
              <span data-part="count" className={styles.count}>
                ({p.children})
              </span>
            ))}
        </>
      )}
    </ToggleButton>
  );
}

/** A row of joined segments that filters the content below it. One or several can be selected. */
export function SegmentedFilter({ items, parts, children, ...root }: SegmentedFilterProps) {
  const { item, ...itemParts } = parts ?? {};
  return (
    <Root {...root}>
      {items
        ? items.map(({ label, ...rest }) => (
            <Fragment key={rest.id}>
              {renderPart(item, { ...rest, parts: itemParts, children: label }, (p) => (
                <Item {...p} />
              ))}
            </Fragment>
          ))
        : children}
    </Root>
  );
}

SegmentedFilter.Root = Root;
SegmentedFilter.Item = Item;
