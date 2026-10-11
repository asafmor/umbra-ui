import {
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button, ButtonBase, type ButtonVariant } from '../basics/Button';
import { focusableIn, focusLost } from '../internal/focus';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { Icon, IconSlot, RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './ActionBar.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export type ActionBarTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ActionBarGroupKind = 'primary' | 'secondary' | 'tertiary';

// One shape per tone, so the tone can be read without colour.
const toneIcons: Record<ActionBarTone, ReactNode> = {
  neutral: <RawIcon name="message" />,
  info: <RawIcon name="info" />,
  success: <RawIcon name="success" />,
  warning: <RawIcon name="warning" />,
  danger: <RawIcon name="danger" />,
};
const groupVariants: Record<ActionBarGroupKind, ButtonVariant> = {
  primary: 'primary',
  secondary: 'neutral',
  tertiary: 'ghost',
};

interface BarContextValue {
  tone: ActionBarTone;
  /** True when the bar is too narrow for every label: secondary and tertiary actions show their icon only. */
  compact: boolean;
}
const BarContext = createContext<BarContextValue | null>(null);
const GroupContext = createContext<ActionBarGroupKind>('secondary');
function useBar() {
  const bar = useContext(BarContext);
  if (!bar) throw new Error('ActionBar blocks must be rendered inside <ActionBar.Root>.');
  return bar;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface ActionBarRootProps extends BlockProps, RootAttributes {
  /** `inline`: in the flow, at the bottom of a page, card or modal. `floating`: over the bottom of its container. */
  variant?: 'inline' | 'floating' | undefined;
  /** Shows a `floating` bar. Its container needs `position: relative`. */
  open?: boolean | undefined;
  /** Where the actions sit. The status is always at the start. */
  align?: 'start' | 'center' | 'end' | undefined;
  /** What the status means: the colour and icon of the status, and the colour of a `strong` bar. */
  tone?: ActionBarTone | undefined;
  /** `strong` fills the bar with the tone, for a status the user has to act on. */
  emphasis?: 'default' | 'strong' | undefined;
  /** Accessible name of the group. */
  'aria-label'?: string | undefined;
}

function Root({
  variant = 'inline',
  open = true,
  align = 'end',
  tone = 'neutral',
  emphasis = 'default',
  'aria-label': ariaLabel = 'Actions',
  className,
  style,
  children,
  ...rest
}: ActionBarRootProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Step 1: secondary and tertiary actions keep only their icon. Step 2: the actions take a second line.
  const level = useShrinkLevel(ref, 2);
  const compact = level >= 1;
  const shown = variant === 'inline' || open;
  // A floating bar that closes while the focus is in it ("Clear selection" empties the selection) gives
  // the focus back to where it came from, or to the first control beside the bar.
  const cameFrom = useRef<HTMLElement | null>(null);
  const inside = useRef(false);
  useLayoutEffect(() => {
    const bar = ref.current;
    if (shown || !inside.current || !bar) return;
    inside.current = false;
    if (!focusLost() && !bar.contains(document.activeElement)) return;
    const target = cameFrom.current?.isConnected
      ? cameFrom.current
      : focusableIn(bar.parentElement ?? document).find((el) => el.tabIndex >= 0 && !bar.contains(el));
    target?.focus({ preventScroll: true });
  }, [shown]);
  return (
    <div
      {...passThrough(rest)}
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      // A closed floating bar stays in the page for its exit transition; nothing in it can be reached.
      inert={!shown}
      onFocus={(event) => {
        const from = event.relatedTarget;
        inside.current = true;
        if (from instanceof HTMLElement && !event.currentTarget.contains(from)) cameFrom.current = from;
      }}
      onBlur={(event) => {
        // Focus that goes to another control has left; focus that goes nowhere is what closing does.
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) inside.current = false;
      }}
      data-umbra="action-bar"
      data-variant={variant}
      data-open={shown || undefined}
      data-align={align}
      data-tone={tone}
      data-emphasis={emphasis}
      data-compact={compact || undefined}
      data-wrap={level === 2 || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      <BarContext value={{ tone, compact }}>{children}</BarContext>
    </div>
  );
}

export interface ActionBarStatusProps extends BlockProps {
  /** Replaces the icon of the bar's tone. `null` hides it. */
  icon?: ReactNode | undefined;
}

/** The message at the start of the bar. Changes to it are announced (`role="status"`). */
function Status({ icon, className, style, children }: ActionBarStatusProps) {
  const { tone } = useBar();
  return (
    <div role="status" data-part="status" className={cx(styles.status, className)} style={style}>
      {icon !== null && (
        <span className={styles.statusIcon}>
          <IconSlot part="status-icon">{icon ?? toneIcons[tone]}</IconSlot>
        </span>
      )}
      <span data-part="status-text" className={styles.statusText}>
        {children}
      </span>
    </div>
  );
}

export interface ActionBarGroupProps extends BlockProps {
  /**
   * `primary` actions never hide their label. `secondary` and `tertiary` actions keep only their icon in a
   * narrow bar. `tertiary` sits at the start, after the status.
   */
  kind?: ActionBarGroupKind | undefined;
}

function Group({ kind = 'secondary', className, style, children }: ActionBarGroupProps) {
  return (
    <div data-part={kind} className={cx(styles.group, className)} style={style}>
      <GroupContext value={kind}>{children}</GroupContext>
    </div>
  );
}

/** Holds the groups at the end of the bar. */
function Actions({ className, style, children }: BlockProps) {
  return (
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      {children}
    </div>
  );
}

/** One action of the structured form. */
export interface ActionBarAction {
  label: string;
  icon?: ReactNode | undefined;
  /** Defaults to the group's: `primary`, `neutral` for secondary, `ghost` for tertiary. */
  variant?: ButtonVariant | undefined;
  onPress?: (() => void) | undefined;
  href?: string | undefined;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
}

export interface ActionBarActionProps extends ActionBarAction {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** A button that knows its group: outside the primary group it keeps only its icon when the bar is narrow. */
function Action({ label, icon, variant, ...rest }: ActionBarActionProps) {
  const { compact } = useBar();
  const kind = useContext(GroupContext);
  const look = variant ?? groupVariants[kind];
  if (compact && icon && kind !== 'primary') {
    return (
      <ButtonBase {...rest} umbra="icon-button" variant={look} iconOnly label={label} tooltip={label}>
        <IconSlot>{icon}</IconSlot>
      </ButtonBase>
    );
  }
  return (
    <Button {...rest} variant={look} iconStart={icon}>
      {label}
    </Button>
  );
}

export interface ActionBarClearProps {
  /** Accessible name of the button. */
  label?: string | undefined;
  onClear?: (() => void) | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** The button that clears the selection a floating bar acts on. */
function Clear({ label = 'Clear selection', onClear, className, style }: ActionBarClearProps) {
  return (
    <span data-part="clear" className={cx(styles.clear, className)} style={style}>
      <ButtonBase
        umbra="icon-button"
        variant="ghost"
        iconOnly
        label={label}
        tooltip={label}
        onPress={onClear}
      >
        <Icon name="close" />
      </ButtonBase>
    </span>
  );
}

type ActionList = ReactNode | ActionBarAction | ActionBarAction[];
const isAction = (value: unknown): value is ActionBarAction =>
  typeof value === 'object' && value !== null && !isValidElement(value) && 'label' in value;
const group = (kind: ActionBarGroupKind, actions: ActionList) => {
  if (actions == null) return null;
  const list = Array.isArray(actions) ? actions : [actions];
  return (
    <Group kind={kind}>
      {list.every(isAction)
        ? list.map((action, i) => <Action key={i} {...action} />)
        : (actions as ReactNode)}
    </Group>
  );
};

export interface ActionBarProps extends Omit<ActionBarRootProps, 'children' | 'tone'> {
  /** The message at the start: a node, or a tone and a text. The tone adds its icon, so it is not colour alone. */
  status?: ReactNode | { tone?: ActionBarTone | undefined; text: ReactNode } | undefined;
  /** The actions, as nodes. Or use `primary`, `secondary` and `tertiary`. */
  actions?: ReactNode | undefined;
  /** The main action or actions, at the end. Their labels never hide. */
  primary?: ReactNode | ActionBarAction | ActionBarAction[] | undefined;
  /** Before the primary actions. With an icon, they keep only the icon when the bar is narrow. */
  secondary?: ReactNode | ActionBarAction | ActionBarAction[] | undefined;
  /** At the start, after the status. They collapse like the secondary ones. */
  tertiary?: ReactNode | ActionBarAction | ActionBarAction[] | undefined;
  /** Floating bar: how many things are selected. The bar is open while it is above 0, unless `open` is set. */
  selectionCount?: number | undefined;
  /** The status text for a selection. */
  selectionLabel?: ((count: number) => string) | undefined;
  /** Shows a button that clears the selection. */
  onClearSelection?: (() => void) | undefined;
  /** Accessible name of the clear button. */
  clearLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        status?: Part<ActionBarStatusProps> | undefined;
        clear?: Part<ActionBarClearProps> | undefined;
        tertiary?: Part<{ children: ReactNode }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

const isToned = (
  status: ActionBarProps['status'],
): status is { tone?: ActionBarTone | undefined; text: ReactNode } =>
  typeof status === 'object' && status !== null && !isValidElement(status) && 'text' in status;

/** The bar at the bottom of a page, card or modal: a status at the start and the actions at the end. */
export function ActionBar({
  status,
  actions,
  primary,
  secondary,
  tertiary,
  selectionCount,
  selectionLabel = (count) => `${count} selected`,
  onClearSelection,
  clearLabel,
  open,
  parts,
  ...root
}: ActionBarProps) {
  const shown = open ?? (selectionCount === undefined || selectionCount > 0);
  // While the bar leaves, it keeps the last count it showed instead of counting down to 0.
  const [count, setCount] = useState(selectionCount);
  if (shown && count !== selectionCount) setCount(selectionCount);

  const toned = isToned(status);
  const text = toned ? status.text : (status ?? (count === undefined ? undefined : selectionLabel(count)));
  const end = (
    <>
      {actions}
      {group('secondary', secondary)}
      {group('primary', primary)}
    </>
  );
  return (
    <Root {...root} open={shown} tone={toned ? status.tone : undefined}>
      {text != null &&
        renderPart(parts?.status, { icon: toned ? undefined : null, children: text }, (p) => (
          <Status {...p} />
        ))}
      {onClearSelection &&
        renderPart(parts?.clear, { label: clearLabel, onClear: onClearSelection }, (p) => <Clear {...p} />)}
      {tertiary != null &&
        renderPart(parts?.tertiary, { children: group('tertiary', tertiary) }, (p) => p.children)}
      {(actions != null || primary != null || secondary != null) &&
        renderPart(parts?.actions, { children: end }, (p) => <Actions>{p.children}</Actions>)}
    </Root>
  );
}

ActionBar.Root = Root;
ActionBar.Status = Status;
ActionBar.Actions = Actions;
ActionBar.Group = Group;
ActionBar.Action = Action;
ActionBar.Clear = Clear;
