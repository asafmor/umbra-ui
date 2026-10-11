import {
  createContext,
  Fragment,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ToggleButton, Toolbar } from 'react-aria-components';
import { ButtonBase } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { dataState, type DataStateProps } from '../internal/dataState';
import { TruncatedText } from '../internal/TruncatedText';
import { Popover } from '../overlays/Popover';
import {
  SeriesMarker,
  seriesColour,
  seriesMarker,
  type SeriesMarkerKind,
  type SeriesMarkerProps,
} from '../internal/SeriesMarker';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Legend.module.css';
import { defined } from '../utils/defined';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export type LegendMarker = SeriesMarkerKind;
export type LegendMarkerProps = SeriesMarkerProps;

export interface LegendItem {
  id: string;
  label: ReactNode;
  /** Any CSS colour. Without it the item takes the series palette, by its position in `items`. */
  color?: string | undefined;
  /** Shown after the label; a right-aligned column in the vertical orientation. */
  value?: ReactNode | undefined;
  /** Overrides the legend's `marker` for this item. */
  marker?: LegendMarker | undefined;
  /** Dimmed, and not toggled or highlighted. */
  disabled?: boolean | undefined;
}

interface LegendContextValue {
  interactive: boolean;
  hidden: readonly string[];
  toggle: (id: string) => void;
  onHighlight?: ((id: string | null) => void) | undefined;
}
const LegendContext = createContext<LegendContextValue | null>(null);
function useLegend() {
  const legend = useContext(LegendContext);
  if (!legend) throw new Error('Legend blocks must be rendered inside <Legend.Root>.');
  return legend;
}

interface HiddenProps {
  /** Ids of the items that are switched off (controlled). */
  hiddenIds?: readonly string[] | undefined;
  defaultHiddenIds?: readonly string[] | undefined;
  onHiddenChange?: ((hiddenIds: string[]) => void) | undefined;
}

function useHidden({ hiddenIds, defaultHiddenIds = [], onHiddenChange }: HiddenProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultHiddenIds);
  const hidden = hiddenIds ?? uncontrolled;
  const change = (next: string[]) => {
    setUncontrolled(next);
    onHiddenChange?.(next);
  };
  return { hidden, change };
}

export interface LegendRootProps extends HiddenProps, RootAttributes {
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** Where the items sit along the legend. A vertical legend with values always fills its width. */
  align?: 'start' | 'center' | 'end' | undefined;
  /** Makes each item a toggle button that switches its series on and off. */
  interactive?: boolean | undefined;
  /** Called with an item's id while it is hovered or focused, and with `null` when it no longer is. */
  onHighlight?: ((id: string | null) => void) | undefined;
  /** The most rows a horizontal legend wraps to. */
  maxRows?: number | undefined;
  /** Marks the legend busy for assistive technology. */
  loading?: boolean | undefined;
  /** Accessible name of the legend. */
  'aria-label'?: string | undefined;
  /** The element, for measuring. */
  ref?: React.Ref<HTMLElement> | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Root({
  orientation = 'horizontal',
  align = 'start',
  interactive = false,
  onHighlight,
  maxRows = 2,
  loading = false,
  'aria-label': label = 'Legend',
  ref,
  className,
  style,
  children,
  ...hiddenProps
}: LegendRootProps) {
  const { hidden, change } = useHidden(hiddenProps);
  const toggle = (id: string) =>
    change(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);
  const shared = {
    'data-umbra': 'legend',
    'data-orientation': orientation,
    'data-align': align,
    'data-interactive': interactive || undefined,
    'aria-label': label,
    'aria-busy': loading || undefined,
    className: cx(styles.root, className),
    style: { ['--rows' as string]: maxRows, ...style },
  };
  const content = (
    <LegendContext value={{ interactive, hidden, toggle, onHighlight }}>{children}</LegendContext>
  );
  // Toggle buttons form a toolbar: one tab stop, arrow keys between the items.
  return interactive ? (
    <Toolbar
      {...defined(shared)}
      ref={ref as React.Ref<HTMLDivElement>}
      orientation={orientation}
      // React Aria's toolbar drops `aria-busy`; it is put back on its element.
      render={(props) => (
        <div {...passThrough(hiddenProps)} {...defined(props)} aria-busy={loading || undefined} />
      )}
    >
      {content}
    </Toolbar>
  ) : (
    <ul {...passThrough(hiddenProps)} {...shared} role="list" ref={ref as React.Ref<HTMLUListElement>}>
      {content}
    </ul>
  );
}

export interface LegendItemProps {
  id: string;
  /** The label. */
  children?: ReactNode | undefined;
  /** Any CSS colour. */
  color?: string | undefined;
  marker?: LegendMarker | undefined;
  value?: ReactNode | undefined;
  disabled?: boolean | undefined;
  /** Replace or hide named pieces of the item. */
  parts?:
    | {
        marker?: Part<LegendMarkerProps> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Item({
  id,
  children,
  color,
  marker = 'dot',
  value,
  disabled = false,
  parts,
  className,
  style,
}: LegendItemProps) {
  const legend = useLegend();
  const off = legend.hidden.includes(id);
  const highlight = (on: boolean) => !disabled && legend.onHighlight?.(on ? id : null);
  const content = (
    <>
      {renderPart(parts?.marker, { kind: marker, color }, (p) => (
        <SeriesMarker {...p} />
      ))}
      {renderPart(parts?.label, { children }, (p) => (
        // A label cut short shows its whole text in a tooltip: on hover, and on focus of its toggle button.
        <TruncatedText part="label" className={styles.label}>
          {p.children}
        </TruncatedText>
      ))}
      {value != null &&
        renderPart(parts?.value, { children: value }, (p) => (
          <span data-part="value" className={styles.value}>
            {p.children}
          </span>
        ))}
    </>
  );
  const shared = {
    'data-part': 'item',
    'data-off': off || undefined,
    className: cx(styles.item, className),
    style,
  };
  if (!legend.interactive) {
    return (
      <li
        {...shared}
        data-disabled={disabled || undefined}
        onPointerEnter={() => highlight(true)}
        onPointerLeave={() => highlight(false)}
      >
        {content}
      </li>
    );
  }
  // Pressed means the series is shown.
  return (
    <ToggleButton
      {...defined(shared)}
      isSelected={!off}
      isDisabled={disabled}
      onChange={() => legend.toggle(id)}
      onHoverChange={highlight}
      onFocusChange={highlight}
    >
      {content}
    </ToggleButton>
  );
}

export interface LegendMoreProps {
  /** The button's text, for example "+3 more". */
  children?: ReactNode | undefined;
  /** Accessible name of the popover. */
  label?: string | undefined;
  /** The popover's content: the full list. */
  content?: ReactNode | undefined;
}

/** The button that stands for the items that did not fit, and opens the full list. */
function More({ children, label = 'All items', content }: LegendMoreProps) {
  const { interactive } = useLegend();
  const trigger = (
    <Popover.Root>
      <Popover.Trigger>
        <ButtonBase umbra="button" variant="ghost" size="small" className={styles.more}>
          {children}
        </ButtonBase>
      </Popover.Trigger>
      <Popover.Content aria-label={label} className={styles.all}>
        {content}
      </Popover.Content>
    </Popover.Root>
  );
  return interactive ? (
    <span data-part="more" className={styles.moreItem}>
      {trigger}
    </span>
  ) : (
    <li data-part="more" className={styles.moreItem}>
      {trigger}
    </li>
  );
}

export interface LegendProps extends Omit<LegendRootProps, 'children' | 'ref' | 'loading'>, DataStateProps {
  items: LegendItem[];
  /** The marker of every item that does not set its own. Patterns (`stripes`, `dots`) do not depend on colour. */
  marker?: LegendMarker | undefined;
  /** Number of placeholder items while `loading`. */
  skeletonRows?: number | undefined;
  /** Text of the button that stands for the items that did not fit. */
  moreLabel?: ((count: number) => string) | undefined;
  /** Accessible name of the popover with the full list. */
  allLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        item?: Part<LegendItemProps> | undefined;
        marker?: Part<LegendMarkerProps> | undefined;
        label?: Part<{ children: ReactNode }> | undefined;
        value?: Part<{ children: ReactNode }> | undefined;
        more?: Part<LegendMoreProps> | undefined;
        skeleton?: Part | undefined;
        /** The empty or error state. */
        state?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** The key for a chart or any colour-coded data: one marker and label per series. */
export function Legend({
  items,
  marker,
  skeletonRows = 3,
  moreLabel = (count) => `+${count} more`,
  allLabel = 'All items',
  parts,
  hiddenIds,
  defaultHiddenIds,
  onHiddenChange,
  empty,
  error,
  onRetry,
  retryLabel,
  ...root
}: LegendProps) {
  const ref = useRef<HTMLElement>(null);
  // The state lives here, so the list in the popover shows and changes the same one.
  const { hidden, change } = useHidden({ hiddenIds, defaultHiddenIds, onHiddenChange });
  const state = { hiddenIds: hidden, onHiddenChange: change };
  // A horizontal legend hides one more item from the end for each level, while it is taller than its rows.
  const horizontal = (root.orientation ?? 'horizontal') === 'horizontal';
  const level = useShrinkLevel(
    ref,
    horizontal && !root.loading ? items.length : 0,
    `${items.length}:${root.maxRows}`,
    { overflowing: (element) => element.scrollHeight > element.clientHeight + 1 },
  );

  // The placeholders and the states sit in the element the items will sit in (a list or a toolbar), so
  // the legend is one element through loading, error and data, and a focus inside it is not lost.
  const Slot = root.interactive ? 'span' : 'li';
  const stateNode = dataState(
    { loading: root.loading, empty, error, onRetry, retryLabel },
    { part: true, isEmpty: items.length === 0, defaultEmpty: { title: 'No items' }, variant: 'inline' },
  );
  if (stateNode) {
    return (
      <Root {...root} loading={false} ref={ref}>
        <Slot className={styles.state}>
          {renderPart(parts?.state, { children: stateNode }, (p) => p.children)}
        </Slot>
      </Root>
    );
  }
  if (root.loading) {
    return (
      <Root {...root} ref={ref}>
        {renderPart(parts?.skeleton, {}, () =>
          Array.from({ length: skeletonRows }, (_, i) => (
            // Hidden from assistive technology: the legend is announced as busy, not as empty items.
            <Slot key={i} aria-hidden="true" data-part="skeleton" className={styles.item}>
              <Skeleton shape="circle" className={styles.skeletonMarker} />
              <Skeleton width={56 + (i % 3) * 16} />
            </Slot>
          )),
        )}
      </Root>
    );
  }

  const render = (item: LegendItem, index: number) => (
    <Fragment key={item.id}>
      {renderPart(
        parts?.item,
        {
          id: item.id,
          children: item.label,
          color: item.color ?? seriesColour(index),
          marker: item.marker ?? seriesMarker(index, marker),
          value: item.value,
          disabled: item.disabled,
          parts: { marker: parts?.marker, label: parts?.label, value: parts?.value },
        },
        (p) => (
          <Item {...p} />
        ),
      )}
    </Fragment>
  );
  return (
    <Root {...root} {...state} ref={ref}>
      {items.slice(0, items.length - level).map(render)}
      {level > 0 &&
        renderPart(
          parts?.more,
          {
            children: moreLabel(level),
            label: allLabel,
            content: (
              <Root
                {...state}
                interactive={root.interactive}
                onHighlight={root.onHighlight}
                orientation="vertical"
                aria-label={allLabel}
              >
                {items.map(render)}
              </Root>
            ),
          },
          (p) => <More {...p} />,
        )}
    </Root>
  );
}

Legend.Root = Root;
Legend.Item = Item;
Legend.Marker = SeriesMarker;
Legend.More = More;
