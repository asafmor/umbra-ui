import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Skeleton } from '../basics/Skeleton';
import { SearchField } from '../inputs/SearchField';
import { ForceCollapseContext } from '../internal/contexts';
import { useHoverTip } from '../internal/TruncatedText';
import { isOverflowing, useShrinkLevel } from '../internal/useShrinkLevel';
import { Popover } from '../overlays/Popover';
import { Icon } from '../provider/icons';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './EntitySwitcher.module.css';

/** Identifies one entity of a switcher. */
export type EntitySwitcherId = string;

export interface EntitySwitcherItem {
  id: EntitySwitcherId;
  label: ReactNode;
  /** The label as text: what the search looks in and what names the controls. Needed when `label` is not a string. */
  textValue?: string | undefined;
  /** The entity's mark. */
  icon?: ReactNode | undefined;
  /** A second, quieter line in the picker. */
  description?: ReactNode | undefined;
  /** The heading this entity is listed under. Groups show in the order they first appear. */
  group?: string | undefined;
  /** Makes the entity's row in the picker a link. */
  href?: string | undefined;
  disabled?: boolean | undefined;
}

/** What the `row` part receives. */
export interface EntitySwitcherRowPartProps {
  item: EntitySwitcherItem;
  current: boolean;
  /** The default row: a link or a button. */
  children: ReactNode;
}

interface Parts {
  icon?: Part<{ children: ReactNode }> | undefined;
  name?: Part<{ children: ReactNode }> | undefined;
  caret?: Part | undefined;
  steppers?: Part<{ children: ReactNode }> | undefined;
  search?: Part<{ value: string; onChange: (text: string) => void; label: string }> | undefined;
  row?: Part<EntitySwitcherRowPartProps> | undefined;
}

const textOf = (item: EntitySwitcherItem) =>
  item.textValue ?? (typeof item.label === 'string' ? item.label : '');

interface SwitcherContextValue {
  /** In the order they are listed: group by group. */
  items: EntitySwitcherItem[];
  current: EntitySwitcherItem | undefined;
  previous: EntitySwitcherItem | undefined;
  next: EntitySwitcherItem | undefined;
  /** More than one entity can be chosen: the steppers show. */
  canStep: boolean;
  choose: (id: EntitySwitcherId) => void;
  /** Shrink steps taken: 1 hides the steppers, 2 leaves the icon. */
  level: number;
  open: boolean;
  props: {
    [
      K in
        | 'searchable'
        | 'loading'
        | 'skeletonRows'
        | 'renderLink'
        | 'disabled'
        | 'aria-label'
        | 'placeholder'
        | 'previousLabel'
        | 'nextLabel'
        | 'searchLabel'
        | 'emptyLabel'
        | 'noResultsLabel'
    ]-?: Exclude<EntitySwitcherRootProps[K], undefined>;
  } & Pick<EntitySwitcherRootProps, 'onSearchChange' | 'parts'>;
}
const SwitcherContext = createContext<SwitcherContextValue | null>(null);
function useSwitcher() {
  const switcher = useContext(SwitcherContext);
  if (!switcher) throw new Error('EntitySwitcher blocks must be rendered inside <EntitySwitcher.Root>.');
  return switcher;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export interface EntitySwitcherRootProps extends BlockProps {
  /** The entities to choose from. */
  items: EntitySwitcherItem[];
  /** Controlled: the id of the current entity. */
  value?: EntitySwitcherId | undefined;
  defaultValue?: EntitySwitcherId | undefined;
  /** Called with the id when another entity is chosen, by a row or a stepper. */
  onChange?: ((id: EntitySwitcherId) => void) | undefined;
  /** Called with the id for every choice, also when it is the current entity. */
  onAction?: ((id: EntitySwitcherId) => void) | undefined;
  /** Stepping past the last entity goes to the first. Otherwise the stepper at an end is disabled. */
  wrap?: boolean | undefined;
  /** `start` puts the steppers before the name, for a page title beside its mark. */
  stepperPosition?: 'start' | 'end' | undefined;
  /** Shows the search field in the picker. */
  searchable?: boolean | undefined;
  /** Called with the search text, for an app that loads the matches itself. */
  onSearchChange?: ((text: string) => void) | undefined;
  /** Shows skeleton rows in the picker. */
  loading?: boolean | undefined;
  /** Number of skeleton rows shown while `loading`. */
  skeletonRows?: number | undefined;
  /** Plugs in the app's router link for the rows of items with `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  disabled?: boolean | undefined;
  /** Controlled state of the picker. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Accessible name of the picker and of the group of steppers. */
  'aria-label'?: string | undefined;
  /** Shown in place of the name while no entity is current. */
  placeholder?: ReactNode | undefined;
  /** Built-in strings. */
  previousLabel?: string | undefined;
  nextLabel?: string | undefined;
  searchLabel?: string | undefined;
  emptyLabel?: string | undefined;
  noResultsLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?: Parts | undefined;
  /** `EntitySwitcher.Trigger`, `EntitySwitcher.Steppers` and `EntitySwitcher.Picker`. */
  children?: ReactNode | undefined;
}

function Root({
  items,
  value,
  defaultValue,
  onChange,
  onAction,
  wrap = false,
  stepperPosition = 'end',
  searchable = true,
  onSearchChange,
  loading = false,
  skeletonRows = 5,
  renderLink = (props) => <a {...props} />,
  disabled = false,
  open,
  defaultOpen = false,
  onOpenChange,
  'aria-label': label = 'Switch',
  placeholder = 'Choose',
  previousLabel = 'Previous',
  nextLabel = 'Next',
  searchLabel = 'Search',
  emptyLabel = 'Nothing to choose from',
  noResultsLabel = 'No matches',
  parts,
  className,
  style,
  children,
}: EntitySwitcherRootProps) {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const id = value ?? ownValue;
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = (open ?? ownOpen) && !disabled;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  // Listed group by group, in the order the groups first appear: what the picker shows and the steppers follow.
  const groups = [...new Set(items.map((item) => item.group))];
  const ordered = groups.flatMap((group) => items.filter((item) => item.group === group));
  const enabled = ordered.filter((item) => !item.disabled);
  const at = enabled.findIndex((item) => item.id === id);
  const canStep = enabled.length > 1 || (enabled.length === 1 && at < 0);
  const around = (step: 1 | -1) =>
    at < 0
      ? step > 0
        ? enabled[0]
        : undefined
      : (enabled[at + step] ?? (wrap && canStep ? enabled.at(step > 0 ? 0 : -1) : undefined));

  const root = useRef<HTMLDivElement>(null);
  // A container that has run out of room (a `SubNav` at its last step, a `TopBar` at its) asks for the icon only.
  const forced = useContext(ForceCollapseContext);
  // The trigger can shrink but its content keeps a floor (icon, the name's minimum, caret): content that
  // is wider than the trigger is the sign, as a button does not pass its overflow on to the root.
  const measured = useShrinkLevel(root, 2, undefined, {
    overflowing: (el) =>
      isOverflowing(el) || [...el.querySelectorAll<HTMLElement>('[data-part="trigger"]')].some(isOverflowing),
  });
  const level = forced ? 2 : measured;

  const switcher: SwitcherContextValue = {
    items: ordered,
    current: ordered.find((item) => item.id === id),
    previous: around(-1),
    next: around(1),
    canStep,
    choose: (next) => {
      onAction?.(next);
      if (next !== id) {
        setOwnValue(next);
        onChange?.(next);
      }
      if (isOpen) setOpen(false);
    },
    level,
    open: isOpen,
    props: {
      searchable,
      onSearchChange,
      loading,
      skeletonRows,
      renderLink,
      disabled,
      'aria-label': label,
      placeholder,
      previousLabel,
      nextLabel,
      searchLabel,
      emptyLabel,
      noResultsLabel,
      parts,
    },
  };
  return (
    <SwitcherContext value={switcher}>
      <div
        ref={root}
        data-umbra="entity-switcher"
        data-shrink={level}
        data-stepper-position={stepperPosition}
        data-disabled={disabled || undefined}
        className={cx(styles.root, className)}
        style={style}
      >
        <Popover.Root open={isOpen} onOpenChange={setOpen}>
          {children}
        </Popover.Root>
      </div>
    </SwitcherContext>
  );
}

/** The current entity: a button that opens the picker. */
function Trigger({ className, style }: BlockProps) {
  const { current, level, props } = useSwitcher();
  const ref = useRef<HTMLButtonElement>(null);
  const name = current?.label ?? props.placeholder;
  // With an icon, the last step shows it alone; without one the name stays and is cut.
  const iconOnly = level >= 2 && current?.icon != null;
  // The whole name, while it is cut or hidden and the picker is closed.
  const tip = useHoverTip(ref, name, (el) => {
    const shown = el.querySelector('[data-part="name"]');
    return el.getAttribute('aria-expanded') !== 'true' && (!shown || shown.scrollWidth > shown.clientWidth);
  });
  return (
    <>
      <Popover.Trigger>
        <button
          ref={ref}
          type="button"
          data-part="trigger"
          aria-haspopup="dialog"
          disabled={props.disabled}
          aria-label={iconOnly ? (current && textOf(current)) || props['aria-label'] : undefined}
          className={cx(styles.trigger, className)}
          style={style}
        >
          {current?.icon != null &&
            renderPart(props.parts?.icon, { children: current.icon }, (p) => (
              <span data-part="icon" aria-hidden="true" className={styles.icon}>
                {p.children}
              </span>
            ))}
          {!iconOnly &&
            renderPart(props.parts?.name, { children: name }, (p) => (
              <span data-part="name" className={styles.name}>
                {p.children}
              </span>
            ))}
          {renderPart(props.parts?.caret, {}, () => (
            <span data-part="caret" className={styles.caret}>
              <Icon name="chevronDown" />
            </span>
          ))}
        </button>
      </Popover.Trigger>
      {tip}
    </>
  );
}

/** The two stacked chevrons: to the previous and the next entity. They hide at the first shrink step. */
function Steppers({ className, style }: BlockProps) {
  const { previous, next, canStep, choose, level, props } = useSwitcher();
  if (level >= 1 || !canStep) return null;
  const stepper = (part: 'previous' | 'next', target: EntitySwitcherItem | undefined, text: string) => {
    const off = !target || props.disabled;
    return (
      <button
        type="button"
        data-part={part}
        // At an end the button stays in the tab order, so a step taken with the keyboard keeps the focus.
        aria-disabled={off || undefined}
        aria-label={target && textOf(target) ? `${text}: ${textOf(target)}` : text}
        className={styles.stepper}
        onClick={() => !off && choose(target.id)}
      >
        <Icon name="chevronDown" />
      </button>
    );
  };
  const children = (
    <>
      {stepper('previous', previous, props.previousLabel)}
      {stepper('next', next, props.nextLabel)}
    </>
  );
  return renderPart(props.parts?.steppers, { children }, (p) => (
    <div
      role="group"
      aria-label={props['aria-label']}
      data-part="steppers"
      className={cx(styles.steppers, className)}
      style={style}
    >
      {p.children}
    </div>
  ));
}

const matches = (item: EntitySwitcherItem, query: string) =>
  `${textOf(item)} ${typeof item.description === 'string' ? item.description : ''}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());

/** The content of the open picker: mounted with it, so the search starts empty each time. */
function PickerContent() {
  const { items, current, choose, props } = useSwitcher();
  const [query, setQuery] = useState('');
  const wrapper = useRef<HTMLDivElement>(null);
  const baseId = useId();

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const rows = () => [...el.querySelectorAll<HTMLElement>('[data-part="row"]:not(:disabled)')];
    const field = () => el.querySelector<HTMLElement>('input');
    // Focus starts in the search field, or on the current entity when there is none.
    (field() ?? el.querySelector<HTMLElement>('[data-part="row"][aria-current]') ?? rows()[0])?.focus();
    // The rows are one tab stop: the arrow keys move through them, and between them and the field.
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inField = target === field();
      const list = rows();
      const at = list.indexOf(target.closest<HTMLElement>('[data-part="row"]')!);
      if (!inField && at < 0) return;
      const next =
        event.key === 'ArrowDown'
          ? inField
            ? list[0]
            : list[at + 1]
          : inField
            ? null
            : event.key === 'ArrowUp'
              ? at === 0
                ? field()
                : list[at - 1]
              : event.key === 'Home'
                ? list[0]
                : event.key === 'End'
                  ? list.at(-1)
                  : null;
      if (next === null) return;
      event.preventDefault();
      event.stopPropagation();
      next?.focus();
    };
    el.addEventListener('keydown', onKeyDown, true);
    return () => el.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const shown = props.searchable && query.trim() ? items.filter((item) => matches(item, query)) : items;
  const groups = [...new Set(shown.map((item) => item.group))];
  // One tab stop: the current entity, or the first row.
  const stop = (
    shown.find((item) => item.id === current?.id && !item.disabled) ?? shown.find((item) => !item.disabled)
  )?.id;
  const search = (text: string) => {
    setQuery(text);
    props.onSearchChange?.(text);
  };

  const row = (item: EntitySwitcherItem) => {
    const isCurrent = item.id === current?.id;
    const shared = {
      'data-part': 'row',
      'data-id': item.id,
      'aria-current': isCurrent ? ('true' as const) : undefined,
      tabIndex: item.id === stop ? 0 : -1,
      className: styles.row,
      onClick: () => choose(item.id),
    };
    const content = (
      <>
        {item.icon != null && (
          <span aria-hidden="true" className={styles.icon}>
            {item.icon}
          </span>
        )}
        <span className={styles.rowText}>
          <span className={styles.rowLabel}>{item.label}</span>
          {item.description != null && <span className={styles.rowDescription}>{item.description}</span>}
        </span>
        {isCurrent && <Icon name="check" part="check" />}
      </>
    );
    const element =
      item.href !== undefined && !item.disabled ? (
        props.renderLink({ href: item.href, ...shared, children: content })
      ) : (
        <button type="button" {...shared} disabled={item.disabled}>
          {content}
        </button>
      );
    return (
      <li key={item.id}>
        {renderPart(props.parts?.row, { item, current: isCurrent, children: element }, (p) => p.children)}
      </li>
    );
  };

  return (
    <div ref={wrapper} className={styles.content}>
      {props.searchable &&
        renderPart(props.parts?.search, { value: query, onChange: search, label: props.searchLabel }, (p) => (
          <Popover.Toolbar>
            <SearchField
              value={p.value}
              onChange={p.onChange}
              aria-label={p.label}
              placeholder={p.label}
              className={styles.search}
            />
          </Popover.Toolbar>
        ))}
      <Popover.Body padding="none">
        <div data-part="list" aria-busy={props.loading || undefined} className={styles.list}>
          {props.loading ? (
            Array.from({ length: props.skeletonRows }, (_, i) => (
              <div key={i} data-part="skeleton" className={styles.row}>
                <Skeleton width={`${60 + ((i * 17) % 30)}%`} />
              </div>
            ))
          ) : shown.length === 0 ? (
            <div data-part="empty" role="status" className={styles.message}>
              {items.length === 0 ? props.emptyLabel : props.noResultsLabel}
            </div>
          ) : (
            groups.map((group, i) => (
              <div key={group ?? ''} className={styles.group}>
                {group !== undefined && (
                  <div id={`${baseId}-${i}`} data-part="group" className={styles.groupLabel}>
                    {group}
                  </div>
                )}
                <ul role="list" aria-labelledby={group === undefined ? undefined : `${baseId}-${i}`}>
                  {shown.filter((item) => item.group === group).map(row)}
                </ul>
              </div>
            ))
          )}
        </div>
      </Popover.Body>
    </div>
  );
}

/** The popover with the search field and the list of entities. */
function Picker({ className, style }: BlockProps) {
  const { props } = useSwitcher();
  return (
    <Popover.Content aria-label={props['aria-label']} className={cx(styles.picker, className)} style={style}>
      <PickerContent />
    </Popover.Content>
  );
}

export type EntitySwitcherProps = Omit<EntitySwitcherRootProps, 'children'>;

/** The current entity of a header, with steps to its siblings and a searchable picker. */
export function EntitySwitcher(props: EntitySwitcherProps) {
  const start = props.stepperPosition === 'start';
  return (
    <Root {...props}>
      {start && <Steppers />}
      <Trigger />
      {!start && <Steppers />}
      <Picker />
    </Root>
  );
}

/** Not a row of a menu: among actions that overflow it stays in the row (`ActionsOverflow`). */
EntitySwitcher.staysInRow = true;
EntitySwitcher.Root = Root;
EntitySwitcher.Trigger = Trigger;
EntitySwitcher.Steppers = Steppers;
EntitySwitcher.Picker = Picker;
